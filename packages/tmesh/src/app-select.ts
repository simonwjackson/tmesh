#!/usr/bin/env bun
import { logError } from "./utils";

type App = {
  readonly name: string;
  readonly cmd: string;
};

// Predefined apps list
const APPS: readonly App[] = [
  { name: "htop", cmd: "htop" },
  { name: "btop", cmd: "btop" },
  { name: "lazygit", cmd: "lazygit" },
  { name: "shell", cmd: "$SHELL" },
];

const TMESH_APPS_SOCKET = "tmesh-apps";

/**
 * Display fzf selection UI and return the selected app
 */
async function selectApp(apps: readonly App[]): Promise<App | null> {
  if (apps.length === 0) {
    logError("No apps configured");
    return null;
  }

  const fzfProcess = Bun.spawn(["fzf", "--delimiter=\\n", "--bind", "ctrl-c:abort"], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "inherit",
  });

  const stdin = fzfProcess.stdin;
  stdin.write(apps.map((a) => a.name).join("\n"));
  stdin.end();

  const exitCode = await fzfProcess.exited;

  if (exitCode !== 0) {
    return null;
  }

  const selection = (await new Response(fzfProcess.stdout).text()).trim();
  return apps.find((a) => a.name === selection) ?? null;
}

/**
 * Check if a tmux session exists on the tmesh-apps socket
 */
function hasSession(sessionName: string): boolean {
  const result = Bun.spawnSync([
    "tmux",
    "-L",
    TMESH_APPS_SOCKET,
    "has-session",
    "-t",
    sessionName,
  ]);
  return result.exitCode === 0;
}

/**
 * Open or switch to an app session in tmesh-apps
 */
function openApp(app: App): void {
  const sessionExists = hasSession(app.name);

  if (sessionExists) {
    // Switch to existing session
    const result = Bun.spawnSync([
      "tmux",
      "-L",
      TMESH_APPS_SOCKET,
      "switch-client",
      "-t",
      app.name,
    ]);
    if (result.exitCode !== 0) {
      logError(`Failed to switch to session: ${app.name}`);
      process.exit(1);
    }
  } else {
    // Create new session with the app
    const result = Bun.spawnSync([
      "tmux",
      "-L",
      TMESH_APPS_SOCKET,
      "new-session",
      "-d",
      "-s",
      app.name,
      "sh",
      "-c",
      app.cmd,
    ]);
    if (result.exitCode !== 0) {
      logError(`Failed to create session: ${app.name}`);
      process.exit(1);
    }
    // Switch to the new session
    Bun.spawnSync([
      "tmux",
      "-L",
      TMESH_APPS_SOCKET,
      "switch-client",
      "-t",
      app.name,
    ]);
  }
}

async function main(): Promise<void> {
  const selectedApp = await selectApp(APPS);

  if (selectedApp === null) {
    process.exit(0);
  }

  openApp(selectedApp);
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    logError(`Fatal error: ${error.message}`);
  } else {
    logError("Fatal error: Unknown error occurred");
  }
  process.exit(1);
});
