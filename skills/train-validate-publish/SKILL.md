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
2. Inspect the test results returned by `aethis_generate_and_test` (shows PASS/FAIL per test with expected vs actual).
3. If tests fail, refine with `aethis_refine` using policy-specific guidance.
4. Repeat refine cycles until all required tests pass.
5. Call `aethis_publish` only after tests are fully passing.
6. Run a smoke decision with `aethis_decide` using one known passing test case.
7. Report publish result and the bundle/version identifiers used.

## Guardrails

- Retry transient service/network failures once with the same IDs.
- Keep guidance narrow and tied to failing test names or clauses.
- Avoid overfitting; stop refinement when required tests pass.
- Never publish when tests are failing.

## Failure handling

- `test_failures`: propose one minimal guidance update and rerun.
- `publish_blocked`: return failing tests and resume refine loop.
- `auth_error`: stop and request login or key remediation.
