#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_ROOT="$(cd "$PACKAGE_DIR/../.." && pwd)"

DUMMY="sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
HASH_FILE="$PACKAGE_DIR/nix/hashes.json"

if [ ! -f "$HASH_FILE" ]; then
  mkdir -p "$(dirname "$HASH_FILE")"
  echo '{"npmDeps": "'"$DUMMY"'"}' > "$HASH_FILE"
fi

cleanup() {
  rm -f "${BUILD_LOG:-}"
}
trap cleanup EXIT

echo "Setting dummy npmDeps hash..."
jq --arg v "$DUMMY" '.npmDeps = $v' "$HASH_FILE" > "$HASH_FILE.tmp" && mv "$HASH_FILE.tmp" "$HASH_FILE"

BUILD_LOG=$(mktemp)

echo "Building to discover correct hash..."
cd "$REPO_ROOT"
nix build .#tmesh 2>&1 | tee "$BUILD_LOG" || true

CORRECT_HASH=$(grep -oE 'got:\s+sha256-[A-Za-z0-9+/=]+' "$BUILD_LOG" | awk '{print $2}' | head -n1 || true)

if [ -z "$CORRECT_HASH" ]; then
  echo "Failed to determine correct npmDeps hash."
  echo "Build log:"
  cat "$BUILD_LOG"
  exit 1
fi

jq --arg v "$CORRECT_HASH" '.npmDeps = $v' "$HASH_FILE" > "$HASH_FILE.tmp" && mv "$HASH_FILE.tmp" "$HASH_FILE"

echo "npmDeps hash updated: $CORRECT_HASH"
