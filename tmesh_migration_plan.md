# tmesh Migration Plan

## Project Overview

tmesh is a bash-based tool for managing tmux sessions across multiple hosts. It provides functionality to:
- Create and manage tmux sessions on remote servers
- Connect to these sessions using mosh for network persistence
- Seamlessly switch between different hosts
- Use custom tmux configurations for both client and server

## Stateless Nature of tmesh

tmesh is fundamentally stateless because:

1. **No Persistent Configuration Storage:**
   - The application doesn't store state between runs
   - Configuration is derived from environment variables (TMUX, TERM, TMESH_SOCKET, SERVER)
   - No databases, config files, or local caches are maintained

2. **Session-Based Architecture:**
   - Each execution checks for existing tmux sessions and creates them if needed
   - All state is maintained within the tmux sessions themselves
   - The tool acts as a connector rather than a state manager

3. **On-demand Resource Creation:**
   - Server sessions are created only when needed (see `tryStartTmesh()`)
   - Client connections are established dynamically
   - SSH known hosts are queried directly from the system

4. **Environment Variable Configuration:**
   - All customization happens through environment variables
   - Server selection is non-persistent, handled through the `$SERVER` variable

This stateless design makes tmesh resilient and simple to maintain, as it doesn't need to handle state persistence, synchronization, or migration between versions.

## Python Implementation Plan

### Phase 1: Setup and Structure

1. **Project Setup**
   - Create Python project structure using Nix best practices
   - Define entry points for main command and server selection
   - Set up packaging for Nix integration

2. **Core Configuration**
   - Translate tmux configuration strings into Python
   - Create configuration management system
   - Implement environment variable handling

### Phase 2: Core Functionality

1. **Server Session Management**
   - Implement server session creation logic
   - Add server discovery using SSH known hosts
   - Create mosh connection handling

2. **Client Session Management**
   - Implement client session management
   - Create session switching mechanism
   - Set up tmux client configuration

### Phase 3: Testing and Refinement

1. **Testing Framework**
   - Create test suite for core functionality
   - Test remote connection handling
   - Add configuration tests

2. **Packaging and Distribution**
   - Create Nix package definitions
   - Update documentation
   - Ensure backward compatibility with previous configurations

## Detailed Implementation: Python with Nix-Available Packages

### Project Structure
```
tmesh/
├── default.nix
├── README.md
├── tmesh/
│   ├── __init__.py
│   ├── __main__.py
│   ├── config.py
│   ├── server.py
│   ├── client.py
│   └── utils.py
└── tests/
    ├── test_config.py
    ├── test_server.py
    └── test_client.py
```

### Core Components

1. **config.py**
   - Store and manage tmux configurations
   - Handle environment variables with os.environ
   - Provide configuration templates as Python string constants

2. **server.py**
   - Manage remote tmux server sessions using subprocess
   - Handle mosh connections with proper command formatting
   - Start and attach to remote sessions

3. **client.py**
   - Manage local tmux client sessions
   - Handle session switching
   - Implement server selection UI

4. **utils.py**
   - Helper functions for shell commands using subprocess
   - SSH known hosts parsing
   - Error handling utilities

### Nix-Available Python Packages

The implementation will focus exclusively on Python packages available in the Nixpkgs repository:

1. **Core Dependencies**
   - Python 3.13 from nixpkgs
   - Standard library modules (subprocess, os, sys)

2. **Required Dependencies**
   - python313Packages.libtmux - For direct tmux session management
   - python313Packages.typer - For command-line interface

3. **Optional Dependencies**
   - python313Packages.pexpect - For interactive processes (if needed)
   - python313Packages.rich - For enhanced terminal output

### Integration with Nix

1. Update `packages/tmesh/default.nix`:
```nix
{ pkgs, ... }:

pkgs.python313Packages.buildPythonApplication {
  pname = "tmesh";
  version = "0.1.0";
  src = ./.;

  propagatedBuildInputs = with pkgs; [
    bash
    coreutils
    fd
    findutils
    fzf
    gawk
    gnused
    jq
    mosh
    nettools
    tmux
    yq-go
  ] ++ (with pkgs.python313Packages; [
    typer
    libtmux
    rich
  ]);

  meta = with pkgs.lib; {
    description = "Effortlessly manage tmux sessions across multiple hosts.";
    homepage = "https://github.com/simonwjackson/tmesh";
    license = licenses.gpl2Only;
    platforms = platforms.linux;
    mainProgram = "tmesh";
  };
}
```

2. Ensure compatibility with the existing module system

## Implementation Examples

### Main Entry Point (__main__.py)
```python
#!/usr/bin/env python3
import os
import sys
import typer
from tmesh.client import connect_tmux
from tmesh.server import ensure_sessions

app = typer.Typer()

@app.command()
def main(server: str = None):
    """
    Effortlessly manage tmux sessions across multiple hosts.
    """
    # Get SERVER from environment or argument
    server_name = server or os.environ.get("SERVER", os.uname().nodename)
    os.environ["SERVER"] = server_name
    
    # Ensure sessions exist
    ensure_sessions()
    
    # Connect to tmux
    connect_tmux()

if __name__ == "__main__":
    app()
```

### Server Session Management (server.py)
```python
import os
import subprocess
import libtmux
from tmesh.config import TMESH_SERVER_CONFIG, TMESH_SOCKET, CMD

def start_server_session():
    """Start a tmux session on the remote server."""
    server = os.environ.get("SERVER")
    socket_name = f"{TMESH_SOCKET}-server"
    
    cmd = [
        "mosh", server, "--", "sh", "-c",
        f"nix run nixpkgs#tmux -- -f <(echo -n '{TMESH_SERVER_CONFIG}') "
        f"-L {socket_name} new-session -s default -d \"{CMD}\""
    ]
    
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def ensure_sessions():
    """Ensure tmux sessions exist both locally and on the server."""
    server = os.environ.get("SERVER")
    socket_name = f"{TMESH_SOCKET}-client"
    
    # Use libtmux to check if client session exists
    try:
        # Initialize a tmux server object with the specific socket
        tmux_server = libtmux.Server(socket_path=socket_name)
        
        # Check if session exists
        if not tmux_server.has_session(server):
            start_server_session()
            start_client_session()
    except libtmux.exc.LibTmuxException:
        # Server likely doesn't exist yet
        start_server_session()
        start_client_session()

def start_client_session():
    """Start a client tmux session connected to the server."""
    server = os.environ.get("SERVER")
    socket_name = f"{TMESH_SOCKET}-client"
    tmesh_config = os.environ.get("TMESH_CLIENT_CONFIG")
    
    # Create a new server instance for the client
    tmux_server = libtmux.Server(socket_path=socket_name, config_file=tmesh_config)
    
    # Create a new session and run mosh command
    mosh_cmd = f"mosh {server} -- sh -c \"nix run nixpkgs#tmux -- -L {TMESH_SOCKET}-server attach-session -t default\""
    session = tmux_server.new_session(session_name=server, attach=False, window_command=mosh_cmd)
```

## Migration Strategy

1. Implement the Python version as a replacement for the bash script
2. Test functionality with all the same Nix infrastructure
3. Update documentation to reflect the Python implementation
4. Ensure all environment variables and CLI options remain compatible

## Benefits of Python Migration

1. More maintainable and readable code structure
2. Better error handling and testing capabilities
3. Easy integration with the Nix ecosystem
4. Maintains the stateless nature of the original application
5. Improved extensibility for future feature additions