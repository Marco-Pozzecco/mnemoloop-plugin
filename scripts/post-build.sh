#!/bin/sh
set -eu

# Expected layout:
# root/
#   scripts/
#     post-build.sh   <-- this script
#   main.css

# Resolve the path to this script, handling relative invocation and symlinks.
SCRIPT="$0"
case "$SCRIPT" in
  /*) ;;
  *) SCRIPT="$(pwd)/$SCRIPT" ;;
esac

# Follow symlinks (portable: use readlink if available, fallback to break).
while [ -h "$SCRIPT" ]; do
  LINK_TARGET=$(readlink "$SCRIPT" 2>/dev/null || true)
  if [ -n "$LINK_TARGET" ]; then
    case "$LINK_TARGET" in
      /*) SCRIPT="$LINK_TARGET" ;;
      *) SCRIPT="$(dirname "$SCRIPT")/$LINK_TARGET" ;;
    esac
  else
    break
  fi
done

SCRIPT_DIR=$(cd "$(dirname "$SCRIPT")" && pwd)

# Project root is the parent directory of the scripts directory
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

MAIN_CSS="$PROJECT_ROOT/main.css"
STYLES_CSS="$PROJECT_ROOT/styles.css"

if [ -e "$MAIN_CSS" ]; then
  # If destination exists, remove it so mv will effectively replace it.
  if [ -e "$STYLES_CSS" ]; then
    rm -f -- "$STYLES_CSS"
  fi

  if mv -- "$MAIN_CSS" "$STYLES_CSS"; then
    printf '%s\n' "Renamed: '$PROJECT_ROOT/main.css' -> '$PROJECT_ROOT/styles.css'"
    exit 0
  else
    printf '%s\n' "Failed to rename '$PROJECT_ROOT/main.css' to '$PROJECT_ROOT/styles.css'" >&2
    exit 2
  fi
else
  printf '%s\n' "No 'main.css' found in project root: $PROJECT_ROOT"
  exit 0
fi
