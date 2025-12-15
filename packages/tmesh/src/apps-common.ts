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
