#!/usr/bin/env bash
# check-tool-surface.sh — verify SKILL.md files only reference tools declared in tools.json
# Also detects drift between tools.json and the MCP server's tool registrations.
# Run from the repo root: ./scripts/check-tool-surface.sh
# Exit 0 if all checks pass, exit 1 with details on failure.

set -euo pipefail

TOOLS_JSON="$(dirname "$0")/../tools.json"
SKILLS_DIR="$(dirname "$0")/../skills"

if [ ! -f "$TOOLS_JSON" ]; then
  echo "ERROR: tools.json not found at $TOOLS_JSON"
  exit 1
fi

errors=0

# ---------------------------------------------------------------------------
# 1. Extract all declared tool names from tools.json (nested object format)
# ---------------------------------------------------------------------------
declared=$(jq -r '.tools | to_entries[] | .value | keys[]' "$TOOLS_JSON" | sort -u)
declared_count=$(echo "$declared" | wc -l | tr -d ' ')

echo "tools.json declares $declared_count tools across $(jq -r '.tools | keys | length' "$TOOLS_JSON") groups"

# ---------------------------------------------------------------------------
# 2. Check SKILL.md references against declared tools
# ---------------------------------------------------------------------------
referenced=$(grep -roh 'aethis_[a-z_]*' "$SKILLS_DIR" 2>/dev/null | sort -u)

missing=()
for tool in $referenced; do
  if ! echo "$declared" | grep -qx "$tool"; then
    missing+=("$tool")
  fi
done

if [ ${#missing[@]} -eq 0 ]; then
  echo "OK: all tool references in SKILL.md files are declared in tools.json"
else
  echo "ERROR: SKILL.md files reference tools not declared in tools.json:"
  for tool in "${missing[@]}"; do
    echo "  - $tool"
    grep -rn "$tool" "$SKILLS_DIR" | sed 's/^/    /'
  done
  errors=1
fi

# ---------------------------------------------------------------------------
# 3. Drift detection: compare tools.json against MCP server registrations
# ---------------------------------------------------------------------------
# Look for aethis-mcp as a sibling directory (workspace layout) or via env var
MCP_SRC="${AETHIS_MCP_SRC:-$(dirname "$0")/../../aethis-mcp/src/index.ts}"

if [ -f "$MCP_SRC" ]; then
  # Extract tool names from server.tool("aethis_*", ...) registrations
  mcp_tools=$(grep -o '"aethis_[a-z_]*"' "$MCP_SRC" | tr -d '"' | sort -u)
  mcp_count=$(echo "$mcp_tools" | wc -l | tr -d ' ')

  # Tools in MCP but not in tools.json
  mcp_only=()
  for tool in $mcp_tools; do
    if ! echo "$declared" | grep -qx "$tool"; then
      mcp_only+=("$tool")
    fi
  done

  # Tools in tools.json but not in MCP
  json_only=()
  for tool in $declared; do
    if ! echo "$mcp_tools" | grep -qx "$tool"; then
      json_only+=("$tool")
    fi
  done

  if [ ${#mcp_only[@]} -eq 0 ] && [ ${#json_only[@]} -eq 0 ]; then
    echo "OK: tools.json ($declared_count) matches aethis-mcp registrations ($mcp_count)"
  else
    if [ ${#mcp_only[@]} -gt 0 ]; then
      echo "WARN: tools registered in aethis-mcp but missing from tools.json:"
      for tool in "${mcp_only[@]}"; do
        echo "  + $tool"
      done
    fi
    if [ ${#json_only[@]} -gt 0 ]; then
      echo "ERROR: tools declared in tools.json but not registered in aethis-mcp:"
      for tool in "${json_only[@]}"; do
        echo "  - $tool"
      done
      errors=1
    fi
  fi
else
  echo "SKIP: aethis-mcp source not found at $MCP_SRC (drift detection skipped)"
fi

# ---------------------------------------------------------------------------
# 4. Validate auth metadata
# ---------------------------------------------------------------------------
missing_auth=$(jq -r '
  .tools | to_entries[] | .value | to_entries[] |
  select(.value.auth == null) | .key
' "$TOOLS_JSON")

if [ -n "$missing_auth" ]; then
  echo "ERROR: tools missing 'auth' metadata in tools.json:"
  echo "$missing_auth" | sed 's/^/  - /'
  errors=1
else
  echo "OK: all tools have auth metadata"
fi

exit $errors
