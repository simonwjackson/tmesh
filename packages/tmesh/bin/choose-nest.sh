#!/usr/bin/env bash

TMESH_ALL_SERVERS="$(yq -e -oy '.hosts | .[]' "${TMESH_CONFIG}" 2>/dev/null)"

server_selection=$(
  echo -e "$TMESH_ALL_SERVERS" |
    fzf \
      --delimiter='\n' \
      --bind 'ctrl-c:abort'
)

[ -z "$server_selection" ] && {
  echo "Server list empty"
  exit 1
}

SERVER="${server_selection}" tmesh
