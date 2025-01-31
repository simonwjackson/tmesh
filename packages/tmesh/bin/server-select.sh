#!/usr/bin/env bash

TMESH_ALL_SERVERS=$(
  cut -d' ' -f1 /etc/ssh/ssh_known_hosts | cut -d',' -f1 | sort -u
)

server_selection=$(
  echo -e "$TMESH_ALL_SERVERS" |
    fzf \
      --delimiter='\n' \
      --bind 'ctrl-c:abort'
)

[ "$server_selection" = "" ] && {
  echo "Server list empty"
  exit 1
}

SERVER="$server_selection" tmesh
