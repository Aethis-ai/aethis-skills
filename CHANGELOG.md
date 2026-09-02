# Changelog

## 0.4.0 (2026-09-02)

- feat: add `aethis_generation_status` and explicit-only
  `aethis_cancel_generation` guidance to the public authoring skills. Generation
  recovery now diagnoses progress and safe provider/lifecycle failure codes
  before retrying, preserves per-call BYOK ephemerality, and never treats
  cancellation as a guaranteed live-worker stop. Cancellation now requires the
  exact observed job id repeated after fresh operator confirmation, so a delayed
  request cannot target a successor run. Recovery guidance consumes the v1
  telemetry-availability, server-authoritative worker-lifecycle, and
  retry-readiness fields; retry requires `ready`, while cancellation accepts
  both `cancelled` and idempotent `already_cancelled` outcomes.
- fix: make MCP source availability mandatory in CI and check the skills
  manifest against a checked-out `aethis-mcp` source tree, while retaining a
  warning-only standalone developer check when that sibling is absent.

## 0.3.0 (2026-05-29)
- docs: `aethis_refine` now describes incremental seed-from-existing semantics — it makes the minimal edit to fix failing tests (seeded from the section's active ruleset), not a from-scratch rebuild. Updated the `aethis_refine` tool description in `tools.json` and the refine step in the `train-validate-publish` skill to match aethis-mcp v0.9.0 / aethis-core.

## 0.2.5 (2026-05-12)
- fix: remove internal-only skills from the public package and add an explicit npm files allowlist

## 0.2.4 (2026-05-07)
- docs: link to docs.aethis.ai/agents/onboarding from intro

## 0.2.3 (2026-05-06)
- docs: trim positioning intro to one factual line — reference surface (per aethis.os/positioning/surface-types.md)

## 0.2.2 (2026-05-06)
- docs: add private-beta callout for authoring skills (decide-with-trace remains public)

## 0.2.1 (2026-05-06)

- docs: align README with positioning bible — add developer one-liner and TDD beat intro
- docs: add aethis-bible: markers to derived copy blocks
- fix: replace deprecated "rule bundle" terminology with "ruleset" (none found — already clean from v0.2.0)
