# aethis-skills

Agent skills for the Aethis policy-to-decision lifecycle.

## Install

```bash
npx skills add Aethis-ai/aethis-skills
```

Install to specific agents:

```bash
npx skills add Aethis-ai/aethis-skills -a claude-code -a codex -a opencode
```

List available skills:

```bash
npx skills add Aethis-ai/aethis-skills --list
```

## Included skills

- `policy-to-bundle`: turns source policy text into a test-first rule bundle with field discovery.
- `train-validate-publish`: runs generation/refinement loops, manages test cases, and publish safety checks.
- `decide-with-trace`: executes deterministic decisions with trace/explanation output.
- `regression-compare`: compares versions with a stable decision corpus.

## Required tools

These skills assume the runtime has Aethis MCP tools available (via `aethis-mcp`).

The canonical tool manifest is maintained in [`tools.json`](tools.json), organised by workflow group:

| Group | Tools | Auth | LLM key |
|-------|-------|------|---------|
| **decide** | `aethis_decide`, `aethis_schema`, `aethis_next_question`, `aethis_explain` | none | no |
| **discover** | `aethis_list_projects`, `aethis_list_bundles`, `aethis_project_status` | required | no |
| **author** | `aethis_create_bundle`, `aethis_discover_fields`, `aethis_refine_fields`, `aethis_add_guidance`, `aethis_generate`, `aethis_generate_and_test`, `aethis_refine`, `aethis_publish` | required | some |
| **tests** | `aethis_list_tests`, `aethis_get_test`, `aethis_update_test`, `aethis_delete_test` | required | no |
| **manage** | `aethis_archive_project`, `aethis_archive_bundle` | required | no |

Tools marked `llm_key: true` in `tools.json` require an `anthropic_key` parameter for LLM generation.

### Quick setup

Add the MCP server to your workspace:

```bash
claude mcp add aethis -- npx -y aethis-mcp
```

Or add a `.mcp.json` to your project root:

```json
{
  "mcpServers": {
    "aethis": {
      "command": "npx",
      "args": ["-y", "aethis-mcp"]
    }
  }
}
```

## Keeping tools in sync

`tools.json` is the single source of truth for which MCP tools the skills depend on. Run the check locally or in CI:

```bash
npm run check
```

This verifies:
1. Every `aethis_*` reference in `SKILL.md` files is declared in `tools.json`
2. Tool count matches between `tools.json` and `aethis-mcp` registrations (drift detection)
3. All tools have `auth` metadata

When `aethis-mcp` adds or renames a tool, update `tools.json` first — the check will catch any drift or missing references.

## Design principles

- Deterministic execution: always carry forward explicit IDs.
- Idempotent retries: do not create duplicate artifacts on retry.
- Safe defaults: no hidden assumptions, no production-affecting shortcuts.
- Recoverable failures: return concise error class plus next remediation step.
