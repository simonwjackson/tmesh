#!/usr/bin/env bun
/**
 * Opens fzf to select an app, then opens/switches to that app window in tmesh-apps
 */

import {
  getBinDir,
  hasSession,
  hasWindow,
  run,
  setupSession,
} from "./apps-common";
import { getFzfCommand } from "./fzf-config";
import {
  type AppConfig,
  getAppsForDisplay,
  loadUserConfig,
} from "./user-config";

/**
 * Check if we're already inside the tmesh-apps session
 * We check both TMUX env and TMUX_PANE to detect nested popups
 */
function isInsideAppsSession(socket: string): boolean {
  const tmuxEnv = process.env["TMUX"] ?? "";
  // Check if TMUX points to our socket
  if (tmuxEnv.includes(socket)) {
    return true;
  }
  // Also check if there's an active client attached to our session
  // This handles the case of nested popups
  const result = Bun.spawnSync([
    "tmux", "-L", socket, "list-clients", "-F", "#{client_name}"
  ]);
  if (result.exitCode === 0) {
    const clients = new TextDecoder().decode(result.stdout).trim();
    if (clients.length > 0) {
      return true;
    }
  }
  return false;
}

async function selectApp(apps: ReadonlyArray<{ display: string; app: AppConfig }>): Promise<AppConfig | null> {
  const fzfArgs = getFzfCommand();

  const fzfProcess = Bun.spawn(fzfArgs, {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "inherit",
  });

  fzfProcess.stdin.write(apps.map((a) => a.display).join("\n"));
  fzfProcess.stdin.end();

  const exitCode = await fzfProcess.exited;
  if (exitCode !== 0) return null;

  const selection = (await new Response(fzfProcess.stdout).text()).trim();
  const found = apps.find((a) => a.display === selection);
  return found?.app ?? null;
}

async function main(): Promise<void> {
  const config = loadUserConfig();
  const apps = getAppsForDisplay(config);
  const { socket, session } = config;
  
  const app = await selectApp(apps);
  if (!app) {
    process.exit(0);
  }

  if (!hasSession(socket, session)) {
    // Create new session with selected app as first window
    run(["tmux", "-L", socket, "new-session", "-d", "-s", session, "-n", app.name, app.cmd]);
    setupSession(getBinDir(), config);
  } else if (!hasWindow(socket, session, app.name)) {
    // Create new window for this app
    run(["tmux", "-L", socket, "new-window", "-t", session, "-n", app.name, app.cmd]);
  }

  // Select the app window
  run(["tmux", "-L", socket, "select-window", "-t", `${session}:${app.name}`]);

  // If inside apps session (nested fzf), just exit - window is already selected
  if (isInsideAppsSession(socket)) {
    process.exit(0);
  }

  // From outer tmux: trigger a new large popup via run-shell, then exit
  const binDir = getBinDir();
  run([
    "tmux", "-L", "tmesh-client", "run-shell", "-b",
    `sleep 0.1 && tmux -L tmesh-client display-popup -w 80% -h 80% -b rounded -T '${config.popup.titles.terminal}' -E ${binDir}/popup-shell`
  ]);

  process.exit(0);
}

main();
