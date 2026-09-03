# aethis-skills

Skills that implement the Aethis authoring TDD loop and decision lookup for your coding agent.

> **Authoring is in private beta.** The `decide-with-trace` skill is public (no key required). The authoring skills (`policy-to-ruleset`, `train-validate-publish`, `regression-compare`) require an invited developer key. Request access at [aethis.ai/developer-access](https://aethis.ai/developer-access).

> Onboarding end-to-end? See [docs.aethis.ai/agents/onboarding](https://docs.aethis.ai/agents/onboarding) — install + verify + auth + workflow patterns in one page.

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

- `policy-to-ruleset`: turns source policy text into a test-first ruleset with field discovery.
- `train-validate-publish`: runs generation/refinement loops and publish safety checks.
- `decide-with-trace`: executes deterministic decisions with trace/explanation output.
- `regression-compare`: compares versions with a stable decision corpus.

## Required tools

These skills assume the runtime has Aethis MCP tools available (via `aethis-mcp`).

The canonical tool manifest is maintained in [`tools.json`](tools.json), organised by workflow group:

| Group | Tools | Auth | LLM key |
|-------|-------|------|---------|
| **decide** | `aethis_decide`, `aethis_schema`, `aethis_next_question`, `aethis_explain` | none | no |
| **discover** | `aethis_list_projects`, `aethis_list_rulesets` | required | no |
| **author** | `aethis_create_ruleset`, `aethis_discover_fields`, `aethis_refine_fields`, `aethis_add_guidance`, `aethis_generate_and_test`, `aethis_generation_status`, `aethis_cancel_generation`, `aethis_refine`, `aethis_publish` | required | some |
| **manage** | `aethis_archive_project`, `aethis_archive_ruleset` | required | no |

Tools marked `llm_key: true` in `tools.json` require an `anthropic_key` parameter for LLM generation.

`aethis_generation_status` is read-only and does not need a model-provider key.
Use it to inspect a generation timeout, lack of progress, or an error before
retrying. Treat `generation_contract_version`, `telemetry_availability`,
server-authoritative `worker_lifecycle`, and `retry_readiness` as the contract;
retry only when readiness is `ready`, since an old heartbeat alone does not
prove worker death. `aethis_cancel_generation` is an explicit, destructive caller choice:
show the status `job_id`, get fresh confirmation, and pass it as both `job_id`
and `confirm_job_id`. It releases only that job's ownership but does not guarantee that an already-live worker or
provider request stops immediately. Neither status nor cancellation stores or
replays a bring-your-own provider key. Cancellation returns `cancelled` or the
idempotent `already_cancelled` outcome.

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
