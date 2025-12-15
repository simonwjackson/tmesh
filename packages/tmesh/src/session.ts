import { cwd } from "node:process";

import {
  getClientSocket,
  getServerSocket,
  TMESH_CLIENT_CONFIG,
  TMESH_SERVER_CONFIG,
} from "./config";
import type { SessionContext, ShellResult, TmeshConfig } from "./types";
import {
  createTempFile,
  exec,
  execInteractive,
  findMainDirectory,
  getParentDirName,
  isLocalhost,
  logDebug,
  logError,
  removeTempFile,
  sanitizeSessionName,
  shellEscape,
} from "./utils";

/**
 * Build the session context from the current directory
 */
export async function buildSessionContext(): Promise<SessionContext> {
  const currentDir = cwd();
  const sessionName = sanitizeSessionName(getParentDirName(currentDir));
  const { workDir, windowName } = await findMainDirectory(currentDir);

  return {
    sessionName,
    workDir,
    windowName,
  };
}

/**
 * Start the tmesh server session on the remote (or local) host
 */
export async function tryStartTmeshServerSession(
  config: TmeshConfig,
  context: SessionContext
): Promise<boolean> {
  const escapedCmd = shellEscape(config.cmd);
  const serverSocket = getServerSocket(config);

  // Build the remote command that will be executed
  const remoteCommand = `
    tmpfile=$(mktemp)
    cat > "$tmpfile" << 'EOF'
${TMESH_SERVER_CONFIG}
EOF
    "${config.nixBin}" run nixpkgs#tmux -- -f "$tmpfile" -L ${serverSocket} new-session -s '${context.sessionName}' -c '${context.workDir}' -n '${context.windowName}' -d ${escapedCmd}
    rm "$tmpfile"
  `;

  logDebug(`Starting server session on ${config.server}`, config.debug);

  let result: ShellResult;
  if (isLocalhost(config.server)) {
    // Use SSH for localhost connections
    result = await exec(["ssh", config.server, "--", "bash", "-c", remoteCommand], {
      debug: config.debug,
    });
  } else {
    // Use mosh for remote connections
    result = await exec(["mosh", config.server, "--", "bash", "-c", remoteCommand], {
      debug: config.debug,
    });
  }

  if (!result.success) {
    const connectionType = isLocalhost(config.server) ? "localhost" : "remote host";
    logError(`Error: Failed to start tmesh server session on ${connectionType} (${config.server})`);
    if (config.debug && result.stderr) {
      logError(result.stderr);
    }
    return false;
  }

  return true;
}

/**
 * Start the tmesh client session locally
 */
export async function tryStartTmeshClientSession(
  config: TmeshConfig,
  context: SessionContext
): Promise<boolean> {
  const clientSocket = getClientSocket(config);
  const serverSocket = getServerSocket(config);

  // Create temp config file for client
  const tmpfile = await createTempFile(TMESH_CLIENT_CONFIG);

  logDebug(`Starting client session for ${config.server}`, config.debug);

  try {
    let result: ShellResult;
    if (isLocalhost(config.server)) {
      // Use SSH for localhost connections
      const attachCommand = `"${config.nixBin}" run nixpkgs#tmux -- -L ${serverSocket} attach-session -t '${context.sessionName}'`;
      result = await exec(
        [
          config.nixBin,
          "run",
          "nixpkgs#tmux",
          "--",
          "-f",
          tmpfile,
          "-L",
          clientSocket,
          "new-session",
          "-s",
          config.server,
          "-d",
          "ssh",
          config.server,
          "-t",
          attachCommand,
        ],
        { debug: config.debug }
      );
    } else {
      // Use mosh for remote connections
      const attachCommand = `"${config.nixBin}" run nixpkgs#tmux -- -L ${serverSocket} attach-session -t '${context.sessionName}'`;
      result = await exec(
        [
          config.nixBin,
          "run",
          "nixpkgs#tmux",
          "--",
          "-f",
          tmpfile,
          "-L",
          clientSocket,
          "new-session",
          "-s",
          config.server,
          "-d",
          "mosh",
          config.server,
          "--",
          attachCommand,
        ],
        { debug: config.debug }
      );
    }

    if (!result.success) {
      const connectionType = isLocalhost(config.server) ? "localhost" : "remote host";
      logError(`Error: Failed to start tmesh client session for ${connectionType} (${config.server})`);
      if (config.debug && result.stderr) {
        logError(result.stderr);
      }
      return false;
    }

    return true;
  } finally {
    await removeTempFile(tmpfile);
  }
}

/**
 * Check if a tmux session exists
 */
export async function hasSession(
  config: TmeshConfig,
  socket: string,
  sessionName: string
): Promise<boolean> {
  const result = await exec(
    [config.nixBin, "run", "nixpkgs#tmux", "--", "-L", socket, "has-session", "-t", sessionName],
    { debug: false }
  );
  return result.success;
}

/**
 * Try to start tmesh (both server and client sessions)
 */
export async function tryStartTmesh(config: TmeshConfig): Promise<boolean> {
  const context = await buildSessionContext();
  const clientSocket = getClientSocket(config);

  logDebug(`Session context: ${JSON.stringify(context)}`, config.debug);

  // Check if we already have a client session for this server
  if (await hasSession(config, clientSocket, config.server)) {
    logDebug(`Client session for ${config.server} already exists`, config.debug);
    return true;
  }

  // Start server session first
  if (!(await tryStartTmeshServerSession(config, context))) {
    logError("Error: Failed to start tmesh server session");
    return false;
  }

  // Then start client session
  if (!(await tryStartTmeshClientSession(config, context))) {
    logError("Error: Failed to start tmesh client session");
    return false;
  }

  return true;
}

/**
 * Connect to the tmux session
 */
export async function tryConnectTmux(config: TmeshConfig): Promise<boolean> {
  const clientSocket = getClientSocket(config);

  logDebug(`Connecting to tmux session for ${config.server}`, config.debug);

  let result: ShellResult;
  if (config.tmux === "") {
    // Not in tmux - attach to session (needs interactive terminal)
    result = await execInteractive([
      config.nixBin,
      "run",
      "nixpkgs#tmux",
      "--",
      "-L",
      clientSocket,
      "attach-session",
      "-t",
      config.server,
    ]);
  } else {
    // Already in tmux - switch client
    result = await execInteractive([
      config.nixBin,
      "run",
      "nixpkgs#tmux",
      "--",
      "-L",
      clientSocket,
      "switch-client",
      "-t",
      config.server,
    ]);
  }

  if (!result.success) {
    logError(`Error: Failed to ${config.tmux === "" ? "attach to" : "switch to"} tmux session for server (${config.server})`);
    if (config.debug && result.stderr) {
      logError(result.stderr);
    }
    return false;
  }

  return true;
}
