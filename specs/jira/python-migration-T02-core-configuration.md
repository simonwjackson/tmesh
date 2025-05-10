# [T02] Implement Core Configuration Module

## Epic Goal
Migrate the tmesh bash-based application to Python while maintaining its stateless architecture and improving maintainability. The Python implementation will leverage Nix-available packages and preserve all existing functionality.

## Background
The current tmesh implementation relies on bash variables and heredocs to define its tmux configurations. These configurations control the behavior of both client and server tmux sessions, including key bindings, options, and visual settings. The configuration is currently distributed across several bash variables (TMESH_BASE_CONFIG, TMESH_CLIENT_CONFIG, TMESH_SERVER_CONFIG).

In the Python implementation, we need to create a dedicated configuration module that maintains the same configuration capabilities but in a more structured and maintainable format. This module will be responsible for handling environment variables and providing the tmux configuration templates as Python string constants.

## Acceptance Criteria
- [ ] Create a config.py module that defines all necessary configuration constants
- [ ] Implement environment variable handling (TMUX, TERM, TMESH_SOCKET, SERVER) using os.environ with appropriate defaults
- [ ] Translate all tmux configuration strings from bash to Python string constants
- [ ] Ensure proper inheritance between base, client, and server configurations
- [ ] Implement a mechanism to generate tmux configuration files on demand
- [ ] Add docstrings and type hints for all functions and variables
- [ ] Create unit tests for the configuration module
- [ ] Ensure the configuration maintains backward compatibility with the bash implementation

## Technical Suggestions
- Use Python's multiline strings (triple quotes) for tmux configuration templates
- Create helper functions for retrieving environment variables with defaults
- Consider using a class-based approach for organizing different configuration scopes
- Use Python's f-strings for variable interpolation in configuration templates
- Implement proper type hints using Python's typing module
- Consider using pathlib for path handling if file paths are involved
- Ensure all imported modules are available in the Nix environment