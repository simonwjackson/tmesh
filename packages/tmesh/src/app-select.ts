#!/usr/bin/env bun
/**
 * Opens fzf to select an app, then opens/switches to that app window in tmesh-apps
 */

import {
  attachToSession,
  getBinDir,
  hasSession,
  hasWindow,
  run,
  SESSION,
  setupSession,
  SOCKET,
} from "./apps-common";

type App = {
  readonly name: string;
  readonly cmd: string;
};

// Predefined apps list - shell first since it's most common
const APPS: readonly App[] = [
  { name: "shell", cmd: process.env["SHELL"] ?? "/bin/sh" },
  { name: "htop", cmd: "htop" },
  { name: "btop", cmd: "btop" },
  { name: "lazygit", cmd: "lazygit" },
];

async function selectApp(): Promise<App | null> {
  const fzfArgs = [
    "fzf",
    "--layout=reverse",
    "--no-info",
    "--no-scrollbar",
    "--no-separator",
    "--pointer=▶",
    "--prompt=",
    "--margin=1,2",
    "--select-1",
    "--exit-0",
    "--bind", "esc:abort,alt-a:abort,alt-s:abort",
  ];

  const fzfProcess = Bun.spawn(fzfArgs, {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "inherit",
  });

  fzfProcess.stdin.write(APPS.map((a) => a.name).join("\n"));
  fzfProcess.stdin.end();

  const exitCode = await fzfProcess.exited;
  if (exitCode !== 0) return null;

  const selection = (await new Response(fzfProcess.stdout).text()).trim();
  return APPS.find((a) => a.name === selection) ?? null;
}

/**
 * Check if we're already inside the tmesh-apps session
 * We check both TMUX env and TMUX_PANE to detect nested popups
 */
function isInsideAppsSession(): boolean {
  const tmuxEnv = process.env["TMUX"] ?? "";
  // Check if TMUX points to our socket
  if (tmuxEnv.includes(SOCKET)) {
    return true;
  }
  // Also check if there's an active client attached to our session
  // This handles the case of nested popups
  const result = Bun.spawnSync([
    "tmux", "-L", SOCKET, "list-clients", "-F", "#{client_name}"
  ]);
  if (result.exitCode === 0) {
    const clients = new TextDecoder().decode(result.stdout).trim();
    if (clients.length > 0) {
      return true;
    }
  }
  return false;
}

async function main(): Promise<void> {
  const app = await selectApp();
  if (!app) {
    process.exit(0);
  }

  if (!hasSession()) {
    // Create new session with selected app as first window
    run(["tmux", "-L", SOCKET, "new-session", "-d", "-s", SESSION, "-n", app.name, app.cmd]);
    setupSession(getBinDir());
  } else if (!hasWindow(app.name)) {
    // Create new window for this app
    run(["tmux", "-L", SOCKET, "new-window", "-t", SESSION, "-n", app.name, app.cmd]);
  }

  // Select the app window
  run(["tmux", "-L", SOCKET, "select-window", "-t", `${SESSION}:${app.name}`]);

  // If inside apps session (nested fzf), just exit - window is already selected
  if (isInsideAppsSession()) {
    process.exit(0);
  }

  // From outer tmux: trigger a new large popup via run-shell, then exit
  const binDir = getBinDir();
  run([
    "tmux", "-L", "tmesh-client", "run-shell", "-b",
    `sleep 0.1 && tmux -L tmesh-client display-popup -w 80% -h 80% -b rounded -T ' Terminal ' -E ${binDir}/popup-shell`
  ]);

  process.exit(0);
}

main();
