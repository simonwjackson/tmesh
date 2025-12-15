#!/usr/bin/env bun
/**
 * Opens fzf to select an app, then opens/switches to that app window in tmesh-apps
 */

import {
  attachToSession,
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
  const fzfProcess = Bun.spawn(
    ["fzf", "--bind", "esc:abort,alt-a:abort,alt-s:abort"],
    {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "inherit",
    }
  );

  fzfProcess.stdin.write(APPS.map((a) => a.name).join("\n"));
  fzfProcess.stdin.end();

  const exitCode = await fzfProcess.exited;
  if (exitCode !== 0) return null;

  const selection = (await new Response(fzfProcess.stdout).text()).trim();
  return APPS.find((a) => a.name === selection) ?? null;
}

async function main(): Promise<never> {
  const app = await selectApp();
  if (!app) {
    process.exit(0);
  }

  if (!hasSession()) {
    // Create new session with selected app as first window
    run(["tmux", "-L", SOCKET, "new-session", "-d", "-s", SESSION, "-n", app.name, app.cmd]);
    setupSession();
  } else if (!hasWindow(app.name)) {
    // Create new window for this app
    run(["tmux", "-L", SOCKET, "new-window", "-t", SESSION, "-n", app.name, app.cmd]);
  }

  // Select the app window
  run(["tmux", "-L", SOCKET, "select-window", "-t", `${SESSION}:${app.name}`]);

  // Attach to session (this exits the process)
  attachToSession();
}

main();
