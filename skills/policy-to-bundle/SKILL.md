---
name: policy-to-bundle
description: Create or reuse an Aethis project, define test-first scenarios, and create a rules bundle from policy text.
---

# Policy To Bundle

## When to use

Use this skill when the user wants to start rule authoring from legislation, policy, or contract text.

## Steps

1. Call `aethis_list_projects` and try to reuse an existing project that matches policy scope.
2. If reusing is unsafe or impossible, create a new bundle with `aethis_create_bundle` using:
   - `name`
   - `section_id`
   - `source_text`
   - `test_cases` (at least 2-3, including one edge case)
3. Persist identifiers from tool output and report them explicitly:
   - `project_id`
   - `bundle_id`
4. Confirm the next action is `aethis_generate_and_test` for this exact `project_id`.

## Guardrails

- Be deterministic: once IDs exist, never switch targets by name matching.
- Be idempotent: retries should not create duplicate bundles.
- Do not change test expectations without policy-text evidence.
- If assumptions were made when selecting a project, state them with the IDs used.

## Failure handling

- `auth_error`: stop and ask the user to restore Aethis authentication.
- `validation_error`: request only missing or invalid fields.
- `not_found`: rerun project discovery before creating new artifacts.
