/**
 * FZF configuration loading
 * Config location: $XDG_CONFIG_HOME/tmesh/fzf.conf
 * 
 * This file uses standard FZF options format (same as $FZF_DEFAULT_OPTS)
 * No comments supported - must be valid fzf options
 */

import { existsSync, readFileSync } from "node:fs";

import { getFzfConfigPath } from "./user-config";

/**
 * Default FZF options for tmesh app selector
 */
const DEFAULT_FZF_OPTS: readonly string[] = [
  "--layout=reverse",
  "--no-info",
  "--no-scrollbar",
  "--no-separator",
  "--pointer=▶",
  "--prompt=",
  "--margin=1,2",
  "--select-1",
  "--exit-0",
];

/**
 * Keybindings that are always applied (for tmesh integration)
 * These cannot be overridden by user config
 */
const REQUIRED_BINDINGS: readonly string[] = [
  "--bind", "esc:abort,alt-a:abort,alt-s:abort",
];

/**
 * Parse FZF config file into array of arguments
 * Each line is treated as a separate option
 */
function parseFzfConfig(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Load FZF options from config file
 * Returns default options if file doesn't exist
 */
export function loadFzfOpts(): string[] {
  const configPath = getFzfConfigPath();
  
  if (!existsSync(configPath)) {
    return [...DEFAULT_FZF_OPTS, ...REQUIRED_BINDINGS];
  }
  
  try {
    const content = readFileSync(configPath, "utf-8");
    const userOpts = parseFzfConfig(content);
    
    // User opts take precedence, then add required bindings
    return [...userOpts, ...REQUIRED_BINDINGS];
  } catch (error) {
    console.error(`Warning: Failed to read fzf config at ${configPath}:`, error);
    return [...DEFAULT_FZF_OPTS, ...REQUIRED_BINDINGS];
  }
}

/**
 * Get the full fzf command array including 'fzf' binary
 */
export function getFzfCommand(): string[] {
  return ["fzf", ...loadFzfOpts()];
}
