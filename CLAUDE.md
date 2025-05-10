# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

tmesh is a tool that allows users to effortlessly manage tmux sessions across multiple hosts. The project is built using Nix flakes and provides a specialized tmux environment for managing remote sessions.

### Key Features

- Multi-host support: Manage sessions across multiple servers
- Seamless switching between sessions on all hosts
- Network persistence: Maintains remote sessions between network disruptions
- Customizable: Define lists of potential sessions and apps for each host

## Project Structure

- `packages/tmesh/` - Core implementation of the tmesh tool
  - `bin/tmesh` - Main script that handles session management
  - `bin/server-select.sh` - Script for selecting servers
- `modules/nixos/` - NixOS module for system-wide installation
- `flake.nix` - Nix flake definition using the Snowfall library

## Development

### Testing and Running

To run the tool locally:

```bash
nix run
```

For development with experimental features:

```bash
nix --experimental-features 'nix-command flakes' run
```

To ignore cached versions:

```bash
nix run --refresh
```

## Architecture

tmesh operates by:

1. Creating a tmux server session on the remote host
2. Establishing a client session locally that connects to the remote session
3. Using mosh for persistent connections between client and server
4. Providing configuration for both client and server tmux instances

The tool relies on SSH known hosts for server discovery and uses custom tmux configurations to create a seamless experience.

## Documentation

- Tmux: `nix shell nixpkgs#tmux nixpkgs#man nixpkgs#pandoc --command bash -c "man tmux | pandoc -f man -t markdown"`
- Mosh: `nix shell nixpkgs#man nixpkgs#pandoc --command bash -c "man mosh | pandoc -f man -t markdown"`
- Nix Flakes: `nix shell nixpkgs#nixos-help --command nixos-help --docbook flakes`
- Snowfall Library: Visit https://github.com/snowfallorg/lib
- FZF: `nix shell nixpkgs#fzf nixpkgs#man nixpkgs#pandoc --command bash -c "man fzf | pandoc -f man -t markdown"`
- Terminal and Colors: `nix shell nixpkgs#ncurses nixpkgs#man nixpkgs#pandoc --command bash -c "man terminfo | pandoc -f man -t markdown"`
- SSH Configuration: `nix shell nixpkgs#man nixpkgs#pandoc --command bash -c "man ssh_config | pandoc -f man -t markdown"`
- NixOS Modules: `nix shell nixpkgs#nixos-help --command nixos-help --docbook configuration`
