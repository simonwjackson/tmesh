# [T05] Implement Server Selection UI

## Epic Goal
Migrate the tmesh bash-based application to Python while maintaining its stateless architecture and improving maintainability. The Python implementation will leverage Nix-available packages and preserve all existing functionality.

## Background
The current tmesh implementation includes a server-select.sh script that allows users to interactively select from available servers. This script parses SSH known hosts and uses the fzf utility for fuzzy finding. When a server is selected, it sets the SERVER environment variable and executes the main tmesh script.

For the Python implementation, we need to create equivalent functionality that maintains the same user experience while leveraging Python's capabilities for file parsing and process execution.

## Acceptance Criteria
- [ ] Create a utility to parse SSH known hosts file and extract server names
- [ ] Implement a server selection interface using fzf (via subprocess)
- [ ] Create a standalone entry point for server selection
- [ ] Ensure the server selection can be invoked both as a standalone script and from within tmux
- [ ] Integrate the server selection with the main tmesh command
- [ ] Add proper error handling for file access and command execution
- [ ] Add docstrings and type hints for all functions
- [ ] Create unit tests for the server selection functionality
- [ ] Ensure the implementation maintains compatibility with the bash version

## Technical Suggestions
- Use regular expressions or string parsing for known_hosts file processing
- Implement proper subprocess handling for fzf interaction
- Consider using typer for command-line interface components
- Add caching mechanism for known hosts to improve performance on repeated usage
- Include appropriate error messages for common failure scenarios
- Consider adding support for custom server lists beyond SSH known hosts
- Ensure proper handling of unusual hostnames or formats in known_hosts files
- Follow existing keyboard shortcut conventions from the bash implementation