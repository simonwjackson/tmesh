#!/usr/bin/env bun
import { parseArgs } from "node:util";

import { loadConfig } from "./config";
import { tryConnectTmux, tryStartTmesh } from "./session";
import type { CliOptions } from "./types";
import { logError } from "./utils";

// Version is set at build time via --define '__VERSION__="x.y.z"'
// Defaults to "dev" for local/unbundled runs
declare const __VERSION__: string | undefined;
const VERSION = typeof __VERSION__ === "string" ? __VERSION__ : "dev";

const HELP_TEXT = `
tmesh - Effortlessly manage tmux sessions across multiple hosts

USAGE:
    tmesh [OPTIONS]

OPTIONS:
    -s, --server <HOST>     Target server hostname (default: current hostname)
    -S, --socket <NAME>     Socket name for tmesh tmux instances (default: tmesh)
    -c, --cmd <COMMAND>     Command to run in new sessions (default: $SHELL)
    -d, --debug             Enable debug output
    -h, --help              Show this help message
    -v, --version           Show version information

ENVIRONMENT VARIABLES:
    TMESH_SERVER    Default server hostname
    TMESH_SOCKET    Default socket name
    TMESH_CMD       Default command for new sessions
    TMESH_DEBUG     Enable debug output (set to any value)
    NIX_BIN         Path to nix binary

EXAMPLES:
    tmesh                           # Connect to session on current host
    tmesh -s myserver               # Connect to session on myserver
    tmesh -s myserver -c /bin/zsh   # Use zsh as the shell
    tmesh --debug                   # Enable debug output

For more information, visit: https://github.com/simonwjackson/tmesh
`;

function parseCliArgs(): CliOptions {
  try {
    const { values } = parseArgs({
      args: Bun.argv.slice(2),
      options: {
        server: {
          type: "string",
          short: "s",
        },
        socket: {
          type: "string",
          short: "S",
        },
        cmd: {
          type: "string",
          short: "c",
        },
        debug: {
          type: "boolean",
          short: "d",
        },
        help: {
          type: "boolean",
          short: "h",
        },
        version: {
          type: "boolean",
          short: "v",
        },
      },
      strict: true,
    });

    return {
      server: values.server,
      socket: values.socket,
      cmd: values.cmd,
      debug: values.debug,
      help: values.help,
      version: values.version,
    };
  } catch (error) {
    if (error instanceof Error) {
      logError(`Error: ${error.message}`);
    }
    logError("Use --help for usage information.");
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const cliOptions = parseCliArgs();

  if (cliOptions.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (cliOptions.version) {
    console.log(`tmesh ${VERSION}`);
    process.exit(0);
  }

  const config = await loadConfig(cliOptions);

  if (!(await tryStartTmesh(config))) {
    logError("Error: Failed to initialize tmesh");
    process.exit(1);
  }

  if (!(await tryConnectTmux(config))) {
    logError("Error: Failed to connect to tmux session");
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    logError(`Fatal error: ${error.message}`);
  } else {
    logError("Fatal error: Unknown error occurred");
  }
  process.exit(1);
});
