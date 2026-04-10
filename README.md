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

These skills assume the runtime has Aethis MCP tools available, including:

- `aethis_list_projects`
- `aethis_list_bundles`
- `aethis_create_bundle`
- `aethis_generate_and_test`
- `aethis_refine`
- `aethis_publish`
- `aethis_schema`
- `aethis_decide`
- `aethis_explain`
- `aethis_next_question`

## Design principles

- Deterministic execution: always carry forward explicit IDs.
- Idempotent retries: do not create duplicate artifacts on retry.
- Safe defaults: no hidden assumptions, no production-affecting shortcuts.
- Recoverable failures: return concise error class plus next remediation step.
