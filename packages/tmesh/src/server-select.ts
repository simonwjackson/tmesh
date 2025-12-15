#!/usr/bin/env bun
import { exec, logError } from "./utils";

const SSH_KNOWN_HOSTS_PATH = "/etc/ssh/ssh_known_hosts";

/**
 * Read and parse server list from SSH known hosts file
 */
async function getServerList(): Promise<string[]> {
  try {
    const file = Bun.file(SSH_KNOWN_HOSTS_PATH);
    const content = await file.text();

    const servers = new Set<string>();
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) {
        continue;
      }

      // Extract the first field (host) and handle comma-separated hostnames
      const firstField = trimmed.split(/\s+/)[0];
      if (firstField) {
        // Take the first hostname if comma-separated
        const hostname = firstField.split(",")[0];
        if (hostname) {
          servers.add(hostname);
        }
      }
    }

    return Array.from(servers).sort();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      logError(`Error: SSH known hosts file not found at ${SSH_KNOWN_HOSTS_PATH}`);
    } else {
      logError(`Error reading SSH known hosts: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    return [];
  }
}

/**
 * Display fzf selection UI and return the selected server
 */
async function selectServer(servers: readonly string[]): Promise<string | null> {
  if (servers.length === 0) {
    logError("Server list empty");
    return null;
  }

  // Use Bun.spawn to pipe data to fzf
  const fzfProcess = Bun.spawn(["fzf", "--delimiter=\\n", "--bind", "ctrl-c:abort"], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "inherit",
  });

  // Write servers to stdin using FileSink API
  const stdin = fzfProcess.stdin;
  stdin.write(servers.join("\n"));
  stdin.end();

  // Wait for fzf to complete and get the selection
  const exitCode = await fzfProcess.exited;

  if (exitCode !== 0) {
    // User cancelled or fzf failed
    return null;
  }

  const selection = await new Response(fzfProcess.stdout).text();
  return selection.trim() || null;
}

/**
 * Run tmesh with the selected server
 */
async function runTmesh(server: string): Promise<void> {
  const result = await exec(["tmesh"], {
    env: { SERVER: server },
    debug: true,
  });

  if (!result.success) {
    process.exit(result.exitCode);
  }
}

async function main(): Promise<void> {
  const servers = await getServerList();

  if (servers.length === 0) {
    logError("Server list empty");
    process.exit(1);
  }

  const selectedServer = await selectServer(servers);

  if (selectedServer === null) {
    logError("No server selected");
    process.exit(1);
  }

  await runTmesh(selectedServer);
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    logError(`Fatal error: ${error.message}`);
  } else {
    logError("Fatal error: Unknown error occurred");
  }
  process.exit(1);
});
