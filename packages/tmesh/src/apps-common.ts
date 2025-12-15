/**
 * Common utilities for tmesh-apps popup functionality
 */

export const SOCKET = "tmesh-apps";
export const SESSION = "apps";

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

export function setupSession(): void {
  // Disable prefix keys and bind M-s/M-a to detach
  run(["tmux", "-L", SOCKET, "set", "-g", "prefix", "None"]);
  run(["tmux", "-L", SOCKET, "set", "-g", "prefix2", "None"]);
  run(["tmux", "-L", SOCKET, "bind", "-n", "M-s", "detach-client"]);
  run(["tmux", "-L", SOCKET, "bind", "-n", "M-a", "detach-client"]);
}

export function attachToSession(): never {
  const attach = Bun.spawnSync(["tmux", "-L", SOCKET, "attach", "-t", SESSION], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  process.exit(attach.exitCode ?? 0);
}
