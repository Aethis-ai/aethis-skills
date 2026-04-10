---
name: train-validate-publish
description: Train a rules bundle with iterative guidance, validate outcomes, and publish only when tests are green.
---

# Train Validate Publish

## When to use

Use this skill after bundle creation when the user wants executable rules and a published active version.

## Steps

1. Run `aethis_generate_and_test` with the exact `project_id`.
   - If this takes longer than expected, use `aethis_project_status` to check generation progress.
2. Call `aethis_list_tests` to review all test cases and their current state.
3. Inspect failing tests and refine with `aethis_refine` using policy-specific guidance.
   - If a test expectation is wrong (policy text proves it), fix it with `aethis_update_test` rather than adding misleading guidance.
4. Repeat refine cycles until all required tests pass.
5. Call `aethis_publish` only after tests are fully passing.
6. Run a smoke decision with `aethis_decide` using one known passing test case.
7. Report publish result and the bundle/version identifiers used.

## Guardrails

- Retry transient service/network failures once with the same IDs.
- Keep guidance narrow and tied to failing test names or clauses.
- Avoid overfitting; stop refinement when required tests pass.
- Never publish when tests are failing.
- Prefer fixing test expectations (via `aethis_update_test`) over adding guidance when the source text contradicts the expectation.

## Failure handling

- `test_failures`: propose one minimal guidance update and rerun.
- `publish_blocked`: return failing tests and resume refine loop.
- `auth_error`: stop and request login or key remediation.
