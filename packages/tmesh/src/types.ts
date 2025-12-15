/**
 * Configuration for tmesh, loaded from environment variables and CLI arguments
 */
export type TmeshConfig = {
  /** Current tmux session (from TMUX env var) */
  readonly tmux: string;
  /** Terminal type */
  readonly term: string;
  /** Socket name for tmesh tmux instances */
  readonly socket: string;
  /** Target server hostname */
  readonly server: string;
  /** Command to run in new sessions */
  readonly cmd: string;
  /** Enable debug output */
  readonly debug: boolean;
  /** Path to nix binary */
  readonly nixBin: string;
};

/**
 * Result of a shell command execution
 */
export type ShellResult = {
  readonly success: boolean;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

/**
 * Session context for tmux operations
 */
export type SessionContext = {
  /** Session name derived from parent directory */
  readonly sessionName: string;
  /** Working directory for the session */
  readonly workDir: string;
  /** Window name */
  readonly windowName: string;
};

/**
 * CLI options parsed from command line arguments
 */
export type CliOptions = {
  readonly server?: string;
  readonly socket?: string;
  readonly cmd?: string;
  readonly debug?: boolean;
  readonly help?: boolean;
  readonly version?: boolean;
};
