#!/usr/bin/env bun
/**
 * Toggles the tmesh-apps popup session.
 * If no session exists, creates one with a shell window.
 * Does NOT change the current window - just shows/hides the popup.
 */

import {
  attachToSession,
  hasSession,
  run,
  SESSION,
  setupSession,
  SOCKET,
} from "./apps-common";

const DEFAULT_WINDOW = "shell";

function main(): never {
  if (!hasSession()) {
    // Create new session with shell window as default
    run(["tmux", "-L", SOCKET, "new-session", "-d", "-s", SESSION, "-n", DEFAULT_WINDOW]);
    setupSession();
  }

  // Just attach to session - don't change the window
  attachToSession();
}

main();
