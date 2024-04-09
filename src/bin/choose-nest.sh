#!/usr/bin/env bash

server_selection=$(
  echo -e "$TMUX_ALL_SERVERS" |
    fzf \
      --delimiter='\n' \
      --bind 'ctrl-c:abort'
)

[ -z "$server_selection" ] && {
  echo "Server list empty"
  exit 1
}

SERVER="${server_selection}" tmesh
