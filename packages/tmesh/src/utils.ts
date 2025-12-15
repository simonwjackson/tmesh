import { hostname } from "node:os";
import type { ShellResult } from "./types";

/**
 * Check if the given server is the local machine
 */
export function isLocalhost(server: string): boolean {
  const currentHostname = hostname();
  return (
    server === "localhost" ||
    server === "127.0.0.1" ||
    server === currentHostname
  );
}

/**
 * Execute a shell command, optionally suppressing output based on debug mode
 */
export async function exec(
  args: readonly string[],
  options: {
    readonly debug?: boolean;
    readonly cwd?: string;
    readonly env?: Record<string, string>;
  } = {}
): Promise<ShellResult> {
  const { debug = false, cwd, env } = options;

  try {
    const result = Bun.spawn([...args], {
      cwd,
      env: { ...process.env, ...env },
      stdout: debug ? "inherit" : "pipe",
      stderr: debug ? "inherit" : "pipe",
    });

    const exitCode = await result.exited;
    const stdout = debug ? "" : await new Response(result.stdout).text();
    const stderr = debug ? "" : await new Response(result.stderr).text();

    return {
      success: exitCode === 0,
      exitCode,
      stdout,
      stderr,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      exitCode: 1,
      stdout: "",
      stderr: errorMessage,
    };
  }
}

/**
 * Execute an interactive command that needs terminal access (stdin/stdout/stderr inherited)
 */
export async function execInteractive(
  args: readonly string[],
  options: {
    readonly cwd?: string;
    readonly env?: Record<string, string>;
  } = {}
): Promise<ShellResult> {
  const { cwd, env } = options;

  try {
    const result = Bun.spawn([...args], {
      cwd,
      env: { ...process.env, ...env },
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await result.exited;

    return {
      success: exitCode === 0,
      exitCode,
      stdout: "",
      stderr: "",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      exitCode: 1,
      stdout: "",
      stderr: errorMessage,
    };
  }
}

/**
 * Execute a shell command string via bash
 */
export async function execShell(
  command: string,
  options: {
    readonly debug?: boolean;
    readonly cwd?: string;
    readonly env?: Record<string, string>;
  } = {}
): Promise<ShellResult> {
  return exec(["bash", "-c", command], options);
}

/**
 * Get the current hostname
 */
export function getHostname(): string {
  return hostname();
}

/**
 * Escape a string for shell usage
 */
export function shellEscape(str: string): string {
  // Using printf %q equivalent logic
  if (/^[a-zA-Z0-9_\-./=:@]+$/.test(str)) {
    return str;
  }
  return `'${str.replace(/'/g, "'\\''")}'`;
}

/**
 * Sanitize a string for use as a tmux session name
 */
export function sanitizeSessionName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/**
 * Get the parent directory name from a path
 */
export function getParentDirName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] ?? "default" : "default";
}

/**
 * Find a main or master directory within the given path
 */
export async function findMainDirectory(basePath: string): Promise<{
  readonly workDir: string;
  readonly windowName: string;
}> {
  const { readdir } = await import("node:fs/promises");

  try {
    const entries = await readdir(basePath, { withFileTypes: true });
    const mainDir = entries.find(
      (entry) =>
        entry.isDirectory() && (entry.name === "main" || entry.name === "master")
    );

    if (mainDir) {
      return {
        workDir: `./${mainDir.name}`,
        windowName: mainDir.name,
      };
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return {
    workDir: ".",
    windowName: "default",
  };
}

/**
 * Create a temporary file with the given content
 */
export async function createTempFile(content: string): Promise<string> {
  const { mkdtemp, writeFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const tempDir = await mkdtemp(join(tmpdir(), "tmesh-"));
  const tempFile = join(tempDir, "config");
  await writeFile(tempFile, content, "utf-8");

  return tempFile;
}

/**
 * Remove a temporary file
 */
export async function removeTempFile(filePath: string): Promise<void> {
  const { unlink, rmdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");

  try {
    await unlink(filePath);
    await rmdir(dirname(filePath));
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Log a message to stderr (for errors and debug info)
 */
export function logError(message: string): void {
  console.error(message);
}

/**
 * Log a debug message (only if debug is enabled)
 */
export function logDebug(message: string, debug: boolean): void {
  if (debug) {
    console.error(`[DEBUG] ${message}`);
  }
}
