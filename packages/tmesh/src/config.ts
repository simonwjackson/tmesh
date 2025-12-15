import { hostname } from "node:os";

import type { CliOptions, TmeshConfig } from "./types";

/**
 * Base tmux configuration shared between client and server
 */
export const TMESH_BASE_CONFIG = `
# INFO: https://github.com/tmux/tmux/wiki/Clipboard#terminal-support---tmux-inside-tmux
set -s set-clipboard on

# allow passthrough of escape sequences
set -g allow-passthrough on
set -g status off

# Switch to another session if last window closed
set-option -g detach-on-destroy off

# Disable right click menu
unbind-key -T root MouseDown3Pane

# Respond to focus events
set-option -g focus-events on

# address vim mode switching delay (http://superuser.com/a/252717/65504)
set-option -s escape-time 0

# silent
set-option -g visual-activity off
set-option -g visual-bell off
set-option -g visual-silence off
set-option -g bell-action none

# Ignore window notifications
set-window-option -g monitor-activity off
# Auto resize to the latest window
set-option -g window-size latest

# Server options
set -g default-terminal "tmux-256color"
set -sa terminal-features ',xterm-256color:RGB'

# Enable 24-bit true color support
set -ga terminal-overrides ",*256col*:Tc"
set -g history-limit 50000

# Window options  
setw -g aggressive-resize on
setw -g mode-keys vi

# Disable all the status bar stuff
set -g status off
`;

/**
 * Find the directory where tmesh binaries are located
 */
function getBinDir(): string {
  // process.execPath gives us the path to the current executable
  // e.g., /nix/store/.../bin/tmesh -> /nix/store/.../bin
  const execPath = process.execPath;
  const lastSlash = execPath.lastIndexOf("/");
  return lastSlash > 0 ? execPath.slice(0, lastSlash) : "/usr/bin";
}

/**
 * Client-specific tmux configuration
 */
export function getTmeshClientConfig(): string {
  const binDir = getBinDir();
  return `
${TMESH_BASE_CONFIG}

# Toggle shell popup - M-s toggles popup with shell window
bind -n M-s display-popup -d '#{pane_current_path}' -w 80% -h 80% -E ${binDir}/popup-shell

# Toggle app selector popup - M-a toggles popup with fzf selector  
bind -n M-a display-popup -d '#{pane_current_path}' -w 20% -h 20% -E ${binDir}/app-select
`;
}

// Keep for backwards compatibility
export const TMESH_CLIENT_CONFIG = getTmeshClientConfig();

/**
 * Server-specific tmux configuration
 */
export const TMESH_SERVER_CONFIG = `
${TMESH_BASE_CONFIG}

set -g prefix C-a
unbind-key C-b
bind-key C-a send-prefix
`;

/**
 * Find the nix binary path
 */
async function findNixBin(): Promise<string> {
  // Check NIX_BIN environment variable first
  const nixBinEnv = process.env["NIX_BIN"];
  if (nixBinEnv) {
    return nixBinEnv;
  }

  // Try to find nix in PATH using 'which'
  try {
    const result = Bun.spawnSync(["which", "nix"]);
    if (result.exitCode === 0) {
      const path = new TextDecoder().decode(result.stdout).trim();
      if (path) {
        return path;
      }
    }
  } catch {
    // Fall through to default
  }

  // Default path on NixOS systems
  return "/run/current-system/sw/bin/nix";
}

/**
 * Load configuration from environment variables and CLI options
 */
export async function loadConfig(cliOptions: CliOptions = {}): Promise<TmeshConfig> {
  const nixBin = await findNixBin();

  return {
    tmux: process.env["TMUX"] ?? "",
    term: process.env["TERM"] ?? "",
    socket: cliOptions.socket ?? process.env["TMESH_SOCKET"] ?? "tmesh",
    server: cliOptions.server ?? process.env["TMESH_SERVER"] ?? hostname(),
    cmd: cliOptions.cmd ?? process.env["TMESH_CMD"] ?? process.env["SHELL"] ?? "/bin/sh",
    debug: cliOptions.debug ?? (process.env["TMESH_DEBUG"] !== undefined && process.env["TMESH_DEBUG"] !== ""),
    nixBin,
  };
}

/**
 * Get the socket name for the server
 */
export function getServerSocket(config: TmeshConfig): string {
  return `${config.socket}-server`;
}

/**
 * Get the socket name for the client
 */
export function getClientSocket(config: TmeshConfig): string {
  return `${config.socket}-client`;
}
