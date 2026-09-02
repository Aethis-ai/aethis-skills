---
name: policy-to-ruleset
description: Create or reuse an Aethis project, discover fields, define test-first scenarios, and create a rules ruleset from policy text.
---

# Policy To Ruleset

## When to use

Use this skill when the user wants to start rule authoring from legislation, policy, or contract text.

## Steps

1. Call `aethis_list_projects` and try to reuse an existing project that matches policy scope.
2. If reusing is unsafe or impossible, create a new ruleset with `aethis_create_ruleset` using:
   - `name`
   - `section_id`
   - `source_text`
   - `test_cases` (at least 2-3, including one edge case)
3. Call `aethis_discover_fields` to extract input fields from source text. Review the completeness score and missing pathways.
   - If fields are missing or misnamed, call `aethis_refine_fields` with targeted feedback.
   - Repeat until recommendation is `stop` or completeness is satisfactory.
4. Write test cases using the EXACT field names from discovery. Include them in the `aethis_create_ruleset` call or add them by recreating the ruleset.
5. Persist identifiers from tool output and report them explicitly:
   - `project_id`
   - `ruleset_id`
6. Confirm the next action is `aethis_generate_and_test` for this exact `project_id`.

## Generation monitoring and recovery

- Keep the exact `project_id` while generation is in progress. If a generation
  call times out, appears stalled, or returns a failure, call
  `aethis_generation_status` before starting another generation. Require
  `generation_contract_version: 1`, then use `telemetry_availability`, the
  server-authoritative `worker_lifecycle`, and `retry_readiness` to determine
  the next step. Retry only when readiness is `ready`; an old heartbeat alone
  does not prove worker death.
- Never call `aethis_cancel_generation` automatically. It is only appropriate
  after showing the exact `job_id` from status and receiving fresh caller
  confirmation to abandon that run. Pass the same value as `job_id` and
  `confirm_job_id`; a mismatch must make no cancellation request. Cancellation
  releases the project's job ownership; it does not guarantee that a live worker
  or provider request has stopped immediately. Treat both `cancelled` and the
  idempotent `already_cancelled` outcome as successful resolution of that exact
  cancellation request.
- Provider keys are bring-your-own and per-call only. Do not persist, repeat, or
  surface a supplied key in status, cancellation, or reports. Use the caller's
  normal secure per-call key reference again only when retrying generation.

## Guardrails

- Be deterministic: once IDs exist, never switch targets by name matching.
- Be idempotent: retries should not create duplicate rulesets.
- Do not change test expectations without policy-text evidence.
- If assumptions were made when selecting a project, state them with the IDs used.

## Failure handling

- `auth_error`: stop and ask the user to restore Aethis authentication.
- `validation_error`: request only missing or invalid fields.
- `not_found`: rerun project discovery before creating new artifacts.
- `provider_capacity_exhausted`: ask the caller to restore provider credit or
  capacity before retrying; do not spin retries.
- `provider_authentication_failed`: ask the caller to correct or replace the
  per-call provider key, then retry with the same `project_id`.
- `provider_rate_limited`: wait for the provider limit to reset, then retry with
  the same `project_id`.
- `provider_unavailable`: wait briefly, inspect status again, then retry with the
  same `project_id` if the job is terminal.
- `generation_worker_lost`, `generation_not_started`, or `generation_timeout`:
  the job is no longer healthy. Once status is
  terminal and project ownership is released, retry with the same `project_id`;
  do not cancel a terminal job.
