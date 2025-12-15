/**
 * Common utilities for tmesh-apps popup functionality
 */

export const SOCKET = "tmesh-apps";
export const SESSION = "apps";

/**
 * Get the directory where tmesh binaries are located
 */
export function getBinDir(): string {
  const execPath = process.execPath;
  const lastSlash = execPath.lastIndexOf("/");
  return lastSlash > 0 ? execPath.slice(0, lastSlash) : "/usr/bin";
}

export function run(args: string[]): boolean {
  const result = Bun.spawnSync(args);
  return result.exitCode === 0;
}

export function hasSession(): boolean {
  return run(["tmux", "-L", SOCKET, "has-session", "-t", SESSION]);
}

export function hasWindow(name: string): boolean {
  const result = Bun.spawnSync([
    "tmux", "-L", SOCKET, "list-windows", "-t", SESSION, "-F", "#{window_name}"
  ]);
  if (result.exitCode !== 0) return false;
  const windows = new TextDecoder().decode(result.stdout).trim().split("\n");
  return windows.includes(name);
}

export function setupSession(binDir: string): void {
  // Disable prefix keys
  run(["tmux", "-L", SOCKET, "set", "-g", "prefix", "None"]);
  run(["tmux", "-L", SOCKET, "set", "-g", "prefix2", "None"]);
  
  // Status bar configuration
  run(["tmux", "-L", SOCKET, "set", "-g", "status", "2"]);  // 2-line status bar for spacing
  run(["tmux", "-L", SOCKET, "set", "-g", "status-position", "top"]);
  run(["tmux", "-L", SOCKET, "set", "-g", "status-style", "bg=#1a1b26,fg=#c0caf5"]);
  run(["tmux", "-L", SOCKET, "set", "-g", "status-format[1]", ""]);  // Empty second line for spacing
  run(["tmux", "-L", SOCKET, "set", "-g", "status-justify", "centre"]);
  
  // Left side: hostname with icon
  run(["tmux", "-L", SOCKET, "set", "-g", "status-left", "  #H "]);
  run(["tmux", "-L", SOCKET, "set", "-g", "status-left-style", "fg=#7aa2f7,bold"]);
  run(["tmux", "-L", SOCKET, "set", "-g", "status-left-length", "30"]);
  
  // Right side: empty for now
  run(["tmux", "-L", SOCKET, "set", "-g", "status-right", ""]);
  
  // Window status (centered)
  run(["tmux", "-L", SOCKET, "set", "-g", "window-status-format", " #W "]);
  run(["tmux", "-L", SOCKET, "set", "-g", "window-status-current-format", " #W "]);
  run(["tmux", "-L", SOCKET, "set", "-g", "window-status-style", "fg=#565f89"]);
  run(["tmux", "-L", SOCKET, "set", "-g", "window-status-current-style", "fg=#7aa2f7,bold"]);
  run(["tmux", "-L", SOCKET, "set", "-g", "window-status-separator", "  "]);
  
  // M-s closes the popup
  run(["tmux", "-L", SOCKET, "bind", "-n", "M-s", "detach-client"]);
  // M-a opens the app selector within the popup (styled)
  run([
    "tmux", "-L", SOCKET, "bind", "-n", "M-a",
    "display-popup", "-w", "25%", "-h", "30%", "-x", "C", "-y", "5",
    "-b", "rounded", "-S", "fg=#7aa2f7", "-s", "bg=#1a1b26", "-T", " Apps ",
    "-E", `${binDir}/app-select`
  ]);
}

export function attachToSession(): never {
  const attach = Bun.spawnSync(["tmux", "-L", SOCKET, "attach", "-t", SESSION], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  process.exit(attach.exitCode ?? 0);
}
