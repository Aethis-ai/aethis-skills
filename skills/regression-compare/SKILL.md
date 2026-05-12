---
name: regression-compare
description: Compare decision behavior between rule versions using a stable corpus and highlight regressions.
---

# Regression Compare

## When to use

Use this skill when validating a new rule version against a baseline before or after publish.

## Steps

1. Define baseline and candidate ruleset/version IDs explicitly.
2. Collect a stable corpus of representative field-value payloads.
3. Execute `aethis_decide` for each payload against both versions.
4. Compare outcomes and classify each case:
   - unchanged
   - improved
   - regressed
5. Return a concise diff report with payload IDs and outcome deltas.

## Guardrails

- Use identical payloads for both versions.
- Keep corpus immutable during comparison.
- Do not mask regressions with expectation edits unless policy text justifies the change.

## Failure handling

- `not_found`: re-resolve version identifiers before rerun.
- `validation_error`: remove or fix invalid payload rows and continue with valid set.
