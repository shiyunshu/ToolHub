use std::io::Cursor;

use base64::Engine;
use windows::core::PCWSTR;
use windows::Win32::Foundation::{BOOL, HWND, TRUE};
use windows::Win32::Graphics::Gdi::{
    CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits,
    GetObjectW, SelectObject, BITMAP, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
    GetDC, ReleaseDC, HBITMAP, HDC,
};
use windows::Win32::UI::Shell::{SHGetFileInfoW, SHGFI_ICON, SHGFI_LARGEICON, SHFILEINFOW};
use windows::Win32::UI::WindowsAndMessaging::{
    DestroyIcon, DrawIconEx, GetIconInfo, ICONINFO, DI_NORMAL,
};

pub fn extract_icon_base64(exe_path: &str) -> Option<String> {
    // Convert path to wide string for Windows API
    let wide: Vec<u16> = exe_path.encode_utf16().chain(std::iter::once(0)).collect();

    let mut info: SHFILEINFOW = unsafe { std::mem::zeroed() };
    let result = unsafe {
        SHGetFileInfoW(
            PCWSTR(wide.as_ptr()),
            0,
            &mut info,
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_LARGEICON,
        )
    };

    if result == 0 {
        return None;
    }

    let hicon = info.hIcon;
    if hicon.0 == 0 {
        return None;
    }

    // Convert HICON to PNG bytes
    let png_bytes = icon_to_png_bytes(hicon)?;

    // Clean up icon
    unsafe {
        DestroyIcon(hicon);
    }

    // Base64 encode for frontend consumption
    Some(base64::engine::general_purpose::STANDARD.encode(&png_bytes))
}

fn icon_to_png_bytes(hicon: windows::Win32::UI::WindowsAndMessaging::HICON) -> Option<Vec<u8>> {
    unsafe {
        // Get desktop DC
        let screen_dc = GetDC(HWND(std::ptr::null_mut()));
        if screen_dc.0 == 0 {
            return None;
        }

        let mem_dc = CreateCompatibleDC(Some(screen_dc));
        if mem_dc.0 == 0 {
            let _ = ReleaseDC(HWND(std::ptr::null_mut()), screen_dc);
            return None;
        }

        let mut icon_info: ICONINFO = std::mem::zeroed();
        if GetIconInfo(hicon, &mut icon_info) == FALSE {
            DeleteDC(mem_dc);
            let _ = ReleaseDC(HWND(std::ptr::null_mut()), screen_dc);
            return None;
        }

        // Get bitmap dimensions from the color bitmap
        let mut bitmap: BITMAP = std::mem::zeroed();
        let bmp = HBITMAP(icon_info.hbmColor.0);
        if GetObjectW(bmp, std::mem::size_of::<BITMAP>() as i32, Some(&mut bitmap as *mut _ as *mut std::ffi::c_void)) == 0
        {
            DeleteObject(icon_info.hbmColor);
            DeleteObject(icon_info.hbmMask);
            DeleteDC(mem_dc);
            let _ = ReleaseDC(HWND(std::ptr::null_mut()), screen_dc);
            return None;
        }

        let width = bitmap.bmWidth;
        let height = bitmap.bmHeight;

        // Create a compatible bitmap to render the icon onto
        let hbmp = CreateCompatibleBitmap(screen_dc, width, height);
        if hbmp.0 == 0 {
            DeleteObject(icon_info.hbmColor);
            DeleteObject(icon_info.hbmMask);
            DeleteDC(mem_dc);
            let _ = ReleaseDC(HWND(std::ptr::null_mut()), screen_dc);
            return None;
        }

        SelectObject(mem_dc, hbmp);

        // Draw the icon onto the bitmap
        DrawIconEx(
            mem_dc,
            0,
            0,
            hicon,
            width,
            height,
            0,
            None,
            DI_NORMAL,
        );

        // Prepare bitmap info header for 32-bit top-down bitmap
        let mut bmp_info: BITMAPINFO = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: width,
                biHeight: -height, // top-down
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                biSizeImage: 0,
                biXPelsPerMeter: 0,
                biYPelsPerMeter: 0,
                biClrUsed: 0,
                biClrImportant: 0,
            },
            bmiColors: [windows::Win32::Graphics::Gdi::RGBQUAD {
                rgbBlue: 0,
                rgbGreen: 0,
                rgbRed: 0,
                rgbReserved: 0,
            }],
        };

        // Calculate row size (aligned to 4 bytes)
        let row_size = ((width * 32 + 31) / 32) * 4;
        let pixel_data_size = (row_size * height) as usize;
        let mut pixel_data: Vec<u8> = vec![0u8; pixel_data_size];

        // Get the bitmap pixel data
        let dib_result = GetDIBits(
            mem_dc,
            hbmp,
            0,
            height as u32,
            Some(pixel_data.as_mut_ptr() as *mut std::ffi::c_void),
            &mut bmp_info,
            DIB_RGB_COLORS,
        );

        // Cleanup GDI objects
        DeleteObject(hbmp);
        DeleteObject(icon_info.hbmColor);
        DeleteObject(icon_info.hbmMask);
        DeleteDC(mem_dc);
        let _ = ReleaseDC(HWND(std::ptr::null_mut()), screen_dc);

        // GetDIBits returns the number of scan lines; 0 means failure
        if dib_result == 0 {
            return None;
        }

        // Convert BGRA pixel data to RGBA
        let mut rgba_pixels: Vec<u8> = Vec::with_capacity((width * height * 4) as usize);
        for y in 0..height {
            for x in 0..width {
                let offset = (y * row_size + x * 4) as usize;
                let b = pixel_data[offset];
                let g = pixel_data[offset + 1];
                let r = pixel_data[offset + 2];
                let a = pixel_data[offset + 3];
                rgba_pixels.push(r);
                rgba_pixels.push(g);
                rgba_pixels.push(b);
                rgba_pixels.push(a);
            }
        }

        // Encode as PNG using the image crate
        use image::{ImageBuffer, Rgba};
        let img = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(
            width as u32,
            height as u32,
            rgba_pixels,
        )?;

        let mut png_bytes: Vec<u8> = Vec::new();
        img.write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png)
            .ok()?;

        Some(png_bytes)
    }
}
