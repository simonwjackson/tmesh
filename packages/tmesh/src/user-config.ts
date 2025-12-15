/**
 * User configuration loading from YAML files
 * Config location: $XDG_CONFIG_HOME/tmesh/config.yaml (or ~/.config/tmesh/config.yaml)
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { parse as parseYaml } from "yaml";

/**
 * App definition for the app selector
 */
export type AppConfig = {
  readonly name: string;
  readonly cmd: string;
  readonly icon?: string;
};

/**
 * Popup configuration
 */
export type PopupConfig = {
  readonly titles: {
    readonly terminal: string;
    readonly apps: string;
  };
};

/**
 * User configuration from YAML
 */
export type UserConfig = {
  readonly apps: readonly AppConfig[];
  readonly popup: PopupConfig;
  readonly socket: string;
  readonly session: string;
};

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: UserConfig = {
  apps: [
    { name: "shell", cmd: "$SHELL", icon: "" },
    { name: "htop", cmd: "htop", icon: "" },
    { name: "btop", cmd: "btop", icon: "" },
    { name: "lazygit", cmd: "lazygit", icon: "" },
  ],
  popup: {
    titles: {
      terminal: " Terminal ",
      apps: " Apps ",
    },
  },
  socket: "tmesh-apps",
  session: "apps",
};

/**
 * Get the XDG config home directory
 */
function getConfigDir(): string {
  const xdgConfigHome = process.env["XDG_CONFIG_HOME"];
  if (xdgConfigHome) {
    return join(xdgConfigHome, "tmesh");
  }
  return join(homedir(), ".config", "tmesh");
}

/**
 * Get the path to the YAML config file
 */
export function getConfigPath(): string {
  return join(getConfigDir(), "config.yaml");
}

/**
 * Get the path to the user's tmux.conf override
 */
export function getUserTmuxConfigPath(): string {
  return join(getConfigDir(), "tmux.conf");
}

/**
 * Get the path to the fzf.conf file
 */
export function getFzfConfigPath(): string {
  return join(getConfigDir(), "fzf.conf");
}

/**
 * Expand environment variables in a string
 * Supports $VAR and ${VAR} syntax
 */
function expandEnvVars(str: string): string {
  return str.replace(/\$\{?(\w+)\}?/g, (_, varName) => {
    return process.env[varName] ?? "";
  });
}

/**
 * Deep merge two objects, with source taking precedence
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Load and parse the user configuration
 * Returns default config if file doesn't exist
 */
export function loadUserConfig(): UserConfig {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const parsed = parseYaml(content) as Partial<UserConfig> | null;

    if (!parsed) {
      return DEFAULT_CONFIG;
    }

    // Merge with defaults
    const merged = deepMerge(DEFAULT_CONFIG as Record<string, unknown>, parsed as Record<string, unknown>) as UserConfig;

    // Expand environment variables in app commands
    const apps = merged.apps.map((app) => ({
      ...app,
      cmd: expandEnvVars(app.cmd),
    }));

    return {
      ...merged,
      apps,
    };
  } catch (error) {
    console.error(`Warning: Failed to parse config at ${configPath}:`, error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Get apps formatted for display (with icons if present)
 */
export function getAppsForDisplay(config: UserConfig): ReadonlyArray<{ display: string; app: AppConfig }> {
  return config.apps.map((app) => ({
    display: app.icon ? `${app.icon} ${app.name}` : app.name,
    app,
  }));
}

/**
 * Check if user tmux config exists
 */
export function hasUserTmuxConfig(): boolean {
  return existsSync(getUserTmuxConfigPath());
}

/**
 * Read user tmux config content
 */
export function readUserTmuxConfig(): string | null {
  const path = getUserTmuxConfigPath();
  if (!existsSync(path)) {
    return null;
  }
  return readFileSync(path, "utf-8");
}
