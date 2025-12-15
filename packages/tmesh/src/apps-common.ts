/**
 * Common utilities for tmesh-apps popup functionality
 */

import type { UserConfig } from "./user-config";

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

export function hasSession(socket: string, session: string): boolean {
  return run(["tmux", "-L", socket, "has-session", "-t", session]);
}

export function hasWindow(socket: string, session: string, name: string): boolean {
  const result = Bun.spawnSync([
    "tmux", "-L", socket, "list-windows", "-t", session, "-F", "#{window_name}"
  ]);
  if (result.exitCode !== 0) return false;
  const windows = new TextDecoder().decode(result.stdout).trim().split("\n");
  return windows.includes(name);
}

/**
 * Helper to run tmux set command
 */
function tmuxSet(socket: string, option: string, value: string): void {
  run(["tmux", "-L", socket, "set", "-g", option, value]);
}

export function setupSession(binDir: string, config: UserConfig): void {
  const { socket, popup } = config;
  
  // Disable prefix keys for popup session
  tmuxSet(socket, "prefix", "None");
  tmuxSet(socket, "prefix2", "None");
  
  // Status bar configuration
  tmuxSet(socket, "status", "2");
  tmuxSet(socket, "status-position", "top");
  tmuxSet(socket, "status-style", "bg=default,fg=default");
  tmuxSet(socket, "status-format[1]", "");
  tmuxSet(socket, "status-justify", "centre");
  
  // Left side: hostname with icon
  tmuxSet(socket, "status-left", "  #H ");
  tmuxSet(socket, "status-left-style", "bold");
  tmuxSet(socket, "status-left-length", "30");
  
  // Right side: empty
  tmuxSet(socket, "status-right", "");
  
  // Window status (centered) with separators
  tmuxSet(socket, "window-status-format", " #W ");
  tmuxSet(socket, "window-status-current-format", " #W ");
  tmuxSet(socket, "window-status-style", "dim");
  tmuxSet(socket, "window-status-current-style", "bold");
  tmuxSet(socket, "window-status-separator", " • ");
  
  // M-s closes the popup
  run(["tmux", "-L", socket, "bind", "-n", "M-s", "detach-client"]);
  
  // M-a opens the app selector within the popup (styled)
  run([
    "tmux", "-L", socket, "bind", "-n", "M-a",
    "display-popup", "-w", "20%", "-h", "20%", "-x", "C", "-y", "5",
    "-b", "rounded", "-T", popup.titles.apps,
    "-E", `${binDir}/app-select`
  ]);
}

export function attachToSession(socket: string, session: string): never {
  const attach = Bun.spawnSync(["tmux", "-L", socket, "attach", "-t", session], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  process.exit(attach.exitCode ?? 0);
}
