---
name: decide-with-trace
description: Run deterministic eligibility decisions with schema checks, trace output, and explanation for auditability.
---

# Decide With Trace

## When to use

Use this skill when evaluating case data against a published ruleset.

## Steps

1. Resolve target ruleset via `aethis_list_projects` and `aethis_list_rulesets` unless a trusted `ruleset_id` is already provided.
2. Call `aethis_schema` and validate provided field values before decision.
3. Call `aethis_decide` with `include_trace: true` and `include_explanation: true`.
4. Return outcome, `ruleset_id`, trace highlights, and explanation summary.
5. If result is `undetermined`, call `aethis_next_question` and return the minimal next required input.

## Guardrails

- Always include the exact `ruleset_id` used in results.
- Never fabricate missing field values.
- In interactive loops, do not ask for the same already-resolved field twice.

## Failure handling

- `validation_error`: return field-level mismatches against schema.
- `not_found`: rerun ruleset discovery and confirm active ruleset.
