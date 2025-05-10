# [T01] Initial Python Project Setup for tmesh Migration

## Epic Goal
Migrate the tmesh bash-based application to Python while maintaining its stateless architecture and improving maintainability. The Python implementation will leverage Nix-available packages and preserve all existing functionality.

## Background
tmesh is a bash-based tool for managing tmux sessions across multiple hosts. It creates and manages tmux sessions on remote servers, connects to them using mosh for network persistence, and allows users to seamlessly switch between different hosts. Currently, the implementation consists of bash scripts that handle tmux configuration, server discovery, and session management.

The current implementation has served well but would benefit from a more structured approach using Python. This migration will improve code organization, error handling, and testing capabilities while maintaining the existing stateless design.

This ticket focuses on setting up the foundation for the Python migration by creating the project structure, establishing the development environment, and configuring the basic build system.

## Acceptance Criteria
- [ ] Create a Python project structure following Nix best practices
- [ ] Configure a pyproject.toml file with basic project metadata and dependencies
- [ ] Set up proper directory structure for the Python application (tmesh module, tests)
- [ ] Create skeleton files for core modules (__init__.py, __main__.py, config.py, server.py, client.py, utils.py)
- [ ] Establish an initial default.nix file for Nix packaging
- [ ] Ensure the project can be built and packaged successfully with Nix
- [ ] Document the project structure and setup process in the README.md

## Technical Suggestions
- Use Python 3.13 as the base Python version
- Configure buildPythonApplication in Nix to build the project
- Include dependencies: typer (CLI), libtmux (tmux interaction)
- Set up proper entry points for both the main command and server selection
- Consider using a modern Python project structure with src/tmesh rather than tmesh directly at the root
- Create a simple smoke test to verify that the basic structure can be built and run