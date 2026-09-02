---
name: train-validate-publish
description: Train a rules ruleset with iterative guidance, validate outcomes, and publish only when tests are green.
---

# Train Validate Publish

## When to use

Use this skill after ruleset creation when the user wants executable rules and a published active version.

## Steps

1. Run `aethis_generate_and_test` with the exact `project_id`. It usually takes 60-120 seconds.
2. Inspect the test results returned by `aethis_generate_and_test` (shows PASS/FAIL per test with expected vs actual).
3. On a timeout, apparent lack of progress, or generation error, call
   `aethis_generation_status` with that same `project_id` before retrying. Read
   the job status, progress timestamps, and `error_detail.reason_code`; do not
   start a second job while status reports the existing one as active.
4. If tests fail, call `aethis_refine` with policy-specific guidance. Refine seeds from the section's active ruleset and makes the minimal edit to fix the failing tests while keeping passing tests green — not a from-scratch rebuild.
5. Repeat refine cycles until all required tests pass.
6. Call `aethis_publish` only after tests are fully passing.
7. Run a smoke decision with `aethis_decide` using one known passing test case.
8. Report publish result and the ruleset/version identifiers used.

## Guardrails

- Retry only after status says the previous job is terminal or no longer active;
  use the same IDs and never create duplicate artifacts merely to bypass a run.
- Keep guidance narrow and tied to failing test names or clauses.
- Avoid overfitting; stop refinement when required tests pass.
- Never publish when tests are failing.
- Never call `aethis_cancel_generation` as a timeout or retry mechanism. Call it
  only after showing the exact status `job_id` and receiving fresh caller
  confirmation to abandon that job. Pass that value as both `job_id` and
  `confirm_job_id`; mismatch or missing confirmation makes no request. It releases
  project ownership but does not guarantee that an already-live worker or
  provider request has stopped immediately.
- Provider keys are BYOK and per-call only. Do not store, echo, or infer a key
  from a status/cancellation response; reuse the caller's secure per-call key
  reference only for a requested retry.

## Failure handling

- `test_failures`: propose one minimal guidance update and rerun.
- `publish_blocked`: return failing tests and resume refine loop.
- `auth_error`: stop and request login or key remediation.
- `provider_capacity_exhausted`: tell the caller that the provider key lacks
  credit or capacity; they must fix billing/capacity before retrying.
- `provider_authentication_failed`: ask the caller for a corrected per-call
  provider key reference, then retry the same project.
- `provider_rate_limited`: wait until the provider limit resets before retrying
  the same project.
- `provider_unavailable`: wait briefly, inspect `aethis_generation_status`, and
  retry the same project only after the job is terminal.
- `generation_worker_lost`, `generation_not_started`, or `generation_timeout`:
  inspect status for the terminal failure and
  released project ownership, then retry the same project. Do not cancel a job
  that is already terminal.
