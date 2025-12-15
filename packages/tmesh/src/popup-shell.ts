#!/usr/bin/env bun
/**
 * Toggles the tmesh-apps popup session.
 * If no session exists, creates one with a shell window.
 * Does NOT change the current window - just shows/hides the popup.
 */

import {
  attachToSession,
  getBinDir,
  hasSession,
  run,
  setupSession,
} from "./apps-common";
import { loadUserConfig } from "./user-config";

const DEFAULT_WINDOW = "shell";

function main(): never {
  const config = loadUserConfig();
  const { socket, session } = config;
  
  if (!hasSession(socket, session)) {
    // Create new session with shell window as default
    run(["tmux", "-L", socket, "new-session", "-d", "-s", session, "-n", DEFAULT_WINDOW]);
    setupSession(getBinDir(), config);
  }

  // Just attach to session - don't change the window
  attachToSession(socket, session);
}

main();
