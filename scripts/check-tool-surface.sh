#!/usr/bin/env bash
# check-tool-surface.sh — verify SKILL.md files only reference tools declared in tools.json
# Run from the repo root: ./scripts/check-tool-surface.sh
# Exit 0 if all references are valid, exit 1 with details if any are missing.

set -euo pipefail

TOOLS_JSON="$(dirname "$0")/../tools.json"
SKILLS_DIR="$(dirname "$0")/../skills"

if [ ! -f "$TOOLS_JSON" ]; then
  echo "ERROR: tools.json not found at $TOOLS_JSON"
  exit 1
fi

# Extract all declared tool names from tools.json
declared=$(jq -r '.tools | to_entries[] | .value[]' "$TOOLS_JSON" | sort -u)

# Extract all aethis_* tool references from SKILL.md files
referenced=$(grep -roh 'aethis_[a-z_]*' "$SKILLS_DIR" | sort -u)

missing=()
for tool in $referenced; do
  if ! echo "$declared" | grep -qx "$tool"; then
    missing+=("$tool")
  fi
done

if [ ${#missing[@]} -eq 0 ]; then
  echo "OK: all tool references in SKILL.md files are declared in tools.json"
  exit 0
else
  echo "ERROR: SKILL.md files reference tools not declared in tools.json:"
  for tool in "${missing[@]}"; do
    echo "  - $tool"
    grep -rn "$tool" "$SKILLS_DIR" | sed 's/^/    /'
  done
  exit 1
fi
