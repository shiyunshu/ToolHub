use std::process::Command;

#[derive(Debug, thiserror::Error)]
pub enum LaunchError {
    #[error("Failed to execute: {0}")]
    Io(#[from] std::io::Error),
}

pub fn launch_tool(path: &str) -> Result<(), LaunchError> {
    Command::new(path).spawn()?;
    Ok(())
}
