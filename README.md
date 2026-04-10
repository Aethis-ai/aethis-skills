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

- `policy-to-bundle`: turns source policy text into a test-first rule bundle.
- `train-validate-publish`: runs generation/refinement loops and publish safety checks.
- `decide-with-trace`: executes deterministic decisions with trace/explanation output.
- `regression-compare`: compares versions with a stable decision corpus.

## Required tools

These skills assume the runtime has Aethis MCP tools available.
The canonical list is maintained in [`tools.json`](tools.json).

**Author tools**: `aethis_list_projects`, `aethis_create_bundle`, `aethis_generate_and_test`, `aethis_refine`, `aethis_add_guidance`, `aethis_generate`, `aethis_publish`

**Decide tools**: `aethis_list_bundles`, `aethis_decide`, `aethis_schema`, `aethis_next_question`, `aethis_explain`

## Keeping tools in sync

`tools.json` is the single source of truth for which MCP tools the skills depend on. Run the check locally or in CI:

```bash
npm run check
```

This verifies every `aethis_*` reference in `SKILL.md` files is declared in `tools.json`. When `aethis-mcp` adds or renames a tool, update `tools.json` first — the check will catch any SKILL.md files that reference undeclared tools.

## Design principles

- Deterministic execution: always carry forward explicit IDs.
- Idempotent retries: do not create duplicate artifacts on retry.
- Safe defaults: no hidden assumptions, no production-affecting shortcuts.
- Recoverable failures: return concise error class plus next remediation step.
