#!/usr/bin/env bash

function replace_delimiter_with_spaces() {
  local delimiter="$1"
  local num_spaces="$2"
  local spaces=$(printf '\u2007%.0s' $(seq 1 "$num_spaces"))

  sed -u "s/${delimiter}/${spaces}/g"
}

export -f replace_delimiter_with_spaces

function replace_spaces_with_delimiter() {
  local delimiter="$1"
  local num_spaces="$2"
  local spaces=$(printf '\u2007%.0s' $(seq 1 "$num_spaces"))

  sed -u "s/${spaces}/${delimiter}/g"
}

export -f replace_spaces_with_delimiter

display_icon() {
  icon_inactive=""
  icon_active=""

  if [ "$1" ]; then
    echo "$icon_active"
  else
    echo "$icon_inactive"
  fi
}

export -f display_icon

fzf_format_entry() {
  local project_path="$1"
  local project_name session_name json_obj tmux_status=""

  project_root_dir=$(dirname "$project_path")
  project_name=$(basename "$project_root_dir")
  json_obj='{"path":"'"${project_root_dir}"'","type":"code","session":"'"${project_name}"'"}'

  if tmux has-session -t "$session_name" >/dev/null 2>&1; then
    tmux_status=""
  else
    tmux_status=""
  fi

  printf "%s;%s;%s\n" "${json_obj}" "${tmux_status}" "${project_name}" |
    replace_delimiter_with_spaces ';' 2
}

get_code_projects() {
  local code_path="$1"
  local git_dir_regex='.bare$|^.git$'

  fd \
    --type directory \
    --hidden "${git_dir_regex}" \
    --search-path "${code_path}"
}

# fzf_format_entry() {
#   json_obj="$1"
#   session_name=$(jq -r '.session' <<<"$json_obj")
#   tmux_status=$(
#     tmux has-session -t "$session_name" >/dev/null 2>&1 &&
#       echo "" ||
#       echo ""
#   )
#
#   printf "%s;%s;%s\n" "$json_obj" "$tmux_status" "$session_name" |
#     replace_delimiter_with_spaces ';' 2
# }
#
# get_code_projects() {
#   local code_path="${1}"
#   fd \
#     --type directory \
#     --hidden '^.bare$|^.git$' \
#     --search-path "${code_path}" |
#     while read -r project_path; do
#       parent_dir=$(basename "$(dirname "$project_path")")
#       project_name=$(basename "$project_path")
#       session_name="${parent_dir}/${project_name}"
#       json_obj=$(printf '{ "path": "%s", "type": "code", "session": "%s" }' "$project_path" "$session_name")
#       fzf_format_entry "$json_obj"
#     done
# }

#   {
#     get_code_projects "/glacier/snowscape/code"
#   } |
#     fzf \
#       --header Projects \
#       --preview 'tmux capture-pane -e -pt $(jq -r ".session" <<< "{}" 2> /dev/null)' \
#       --bind 'ctrl-c:abort' \
#       --delimiter=$'\u2007' \
#       --with-nth=2.. |
#     replace_spaces_with_delimiter ';' 2 |
#     awk -F';' '{print $1}'
# )

selection=$(
  {
    get_code_projects "/glacier/snowscape/code" |
      while IFS= read -r project_path; do
        fzf_format_entry "$project_path"
      done
  } |
    fzf \
      --header Projects \
      --preview 'tmux capture-pane -e -pt $(jq -r ".session" <<< "{}" 2> /dev/null)' \
      --bind 'ctrl-c:abort' \
      --delimiter=$'\u2007' \
      --with-nth=2.. |
    replace_spaces_with_delimiter ';' 2 |
    awk -F';' '{print $1}'
)

[ -z "$selection" ] && exit 1

# path=$(cut -d';' -f1 <<<"$selection")
type=$(echo "$selection" | jq -r '.type')
path=$(echo "$selection" | jq -r '.path')
session=$(echo "$selection" | jq -r '.session' | sed 's/\./_/')

# if [ "$type" = "code" ]; then
#   # command="tmux split-window -h -p 20 && tmux split-window -v -t 0 && tmux send-keys -t 1 \"nvim; exec ${SHELL:-/bin/sh}\" Enter"
#   command="nvim"
# elif [ "$type" = "journal" ]; then
#   command="nvim"
# fi

# if ! tmux has-session -t "$name" 2>/dev/null; then
#   creating_session=true
# fi

tmux new-session -d -c "$path" -s "$session" "$EDITOR" >/dev/null 2>&1

# if [ "$creating_session" = true ]; then
#   # msg="$(Creating session: $name | boxes -d unicornthink)"
#   msg="$(Creating session: "$name")"
#
#   printf "\033[0;0H\033[2J"
#   cols=$(tput cols)
#   lines=$(tput lines)
#   printf "\033[$((lines / 2));$(((cols - ${#msg}) / 2))H%s" "$msg"
# fi

if [[ -z "$TMUX" ]]; then
  tmux attach-session -t "$session"
else
  tmux switch-client -t "$session"
fi

# TODO: Use this to kill sessions and refresh the UI

# while true; do
#     SESSION=$(tmux list-sessions -F '#{session_name}' |\
#         sed '/^$/d' |\
#         fzf --reverse --header jump-to-session --preview 'tmux capture-pane -pt {}' --bind 'ctrl-x:execute-silent(tmux kill-session -t {})+abort')
#     EXIT_STATUS=$?
#     if [[ $EXIT_STATUS -eq 0 ]]; then
#         tmux switch-client -t $SESSION
#     elif [[ $EXIT_STATUS -eq 130 ]]; then
#         continue
#     else
#         break
#     fi
# done
