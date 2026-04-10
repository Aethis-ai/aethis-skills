---
name: policy-to-bundle
description: Create or reuse an Aethis project, discover fields, define test-first scenarios, and create a rules bundle from policy text.
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
3. Call `aethis_discover_fields` to extract input fields from source text. Review the completeness score and missing pathways.
   - If fields are missing or misnamed, call `aethis_refine_fields` with targeted feedback.
   - Repeat until recommendation is `stop` or completeness is satisfactory.
4. Write test cases using the EXACT field names from discovery. Include them in the `aethis_create_bundle` call or add them by recreating the bundle.
5. Persist identifiers from tool output and report them explicitly:
   - `project_id`
   - `bundle_id`
6. Confirm the next action is `aethis_generate_and_test` for this exact `project_id`.

## Guardrails

- Be deterministic: once IDs exist, never switch targets by name matching.
- Be idempotent: retries should not create duplicate bundles.
- Do not change test expectations without policy-text evidence.
- If assumptions were made when selecting a project, state them with the IDs used.

## Failure handling

- `auth_error`: stop and ask the user to restore Aethis authentication.
- `validation_error`: request only missing or invalid fields.
- `not_found`: rerun project discovery before creating new artifacts.
