---
name: form-an-prep
description: Generate draft test cases and guidance hints for a Form A-N section from legislation and the shared field vocabulary. Writes directly to the section's CLI project files for Lisa to review.
---

# Form A-N Prep

## When to use

Use this skill when starting work on a new Form A-N section. It generates draft `tests/scenarios.yaml` and `guidance/hints.yaml` for the specified section, using the shared field vocabulary and source materials.

## Prerequisites

- The `form-an/` repo must be cloned into the workspace
- The section directory must exist (e.g., `form-an/referees_identity/`)
- The shared field vocabulary must exist at `form-an/shared/field_vocabulary.yaml`
- Source materials must be in `form-an/shared/form_an_september_2025.md`

## Steps

### 1. Identify the section and read inputs

Read these files:
- `form-an/shared/field_vocabulary.yaml` — get the section's canonical field names and types
- `form-an/shared/form_an_september_2025.md` — find the relevant legislation excerpt for this section
- `form-an/<section>/sources/` — any section-specific source excerpts

### 2. Analyse eligibility pathways

From the source text, identify:
- **Deterministic rules**: if X then eligible/not_eligible (hard pass/fail)
- **Discretionary rules**: if X then review_required (flag for solicitor)
- **Routes**: s.6(1) vs s.6(2) differences for this section
- **Exemptions**: age, medical, Crown service, etc.
- **Edge cases**: boundary values, special nationalities, conflicting conditions

### 3. Generate draft test cases

Write test cases to `form-an/<section>/tests/scenarios.yaml` in this format:

```yaml
tests:
  - name: "Short description — what this tests (source reference)"
    inputs:
      field.key: value
      field.key2: value2
    expect:
      outcome: eligible | not_eligible | undetermined
```

**Test case guidelines:**
- Use ONLY field names from the shared vocabulary (`form-an/shared/field_vocabulary.yaml`)
- Include at least:
  - 2-3 **golden path** cases (clearly eligible under each route)
  - 2-3 **clear refusal** cases (clearly not eligible)
  - 2-3 **edge cases** (boundary values, special exemptions)
  - 1-2 **discretionary** cases (where review_required should apply)
- Keep test inputs minimal — only include fields that affect the outcome
- Name format: "Description — what's being tested (legal reference)"
- For sections with s.6(1)/s.6(2) differences, test both routes

**Reference patterns** (use these as examples of good test structure):
- `aethis-cli/examples/spacecraft-crew-rules/tests/scenarios.yaml` — simple ENUM/BOOL tests
- English language fixture: 24 tests with 6 routes, boundary conditions, special cases
- Life in UK fixture: 56 tests with combinatorial coverage

### 4. Generate draft guidance hints

Write guidance to `form-an/<section>/guidance/hints.yaml` in this format:

```yaml
hints:
  - >
    Use these EXACT field keys from the Form A-N vocabulary:
    field.key (Sort.TYPE), field.key2 (Sort.TYPE: val1, val2), ...

  - >
    Section reference and rule description in natural language.
    "Para 1(1)(a) requires X. If Y then Z, except when W."
```

**Guidance hint guidelines:**
- First hint MUST be the data contract: every field with its exact key, Sort type, and enum values
- One hint per concept — keep them independent
- Reference specific source clauses (e.g., "Para 1(1)(a) states...")
- Focus on exceptions, alternative routes, and conditional logic
- Describe domain rules in plain English — not implementation instructions
- For discretionary criteria, explicitly state: "This criterion should use review_required: true"

### 5. Report what was generated

After writing the files, summarise:
- How many test cases were generated
- How many guidance hints were generated
- Which eligibility pathways are covered
- What Lisa should review and potentially correct

## Guardrails

- ONLY use field names from `form-an/shared/field_vocabulary.yaml`
- If the vocabulary is missing fields needed by the section, flag this for Lisa rather than inventing field names
- Do not include trade secrets, internal implementation details, or DSL syntax in guidance
- Guidance must be in natural language — no operator names, no sort types in the hint text (except the data contract hint)
- Tests must have clear, deterministic expected outcomes — no ambiguous cases
- Mark discretionary cases as `outcome: undetermined` (the system flags them for solicitor review)

## Section-specific notes

### referees_identity
- Pure validation rules — no routes, no discretion
- Two referees with different requirements (referee 1: any nationality + professional; referee 2: British citizen + professional or over 25)
- Both: known ≥ 3 years, not related, not representing solicitor, not Home Office
- "Not usually accepted" with conviction in last 10 years — this is discretionary, use review_required

### personal_info
- Determines s.6(1) vs s.6(2) route — this is the critical output
- Simple AND of identity checks
- Sound mind has discretionary exemption

### immigration_status
- Different requirements for s.6(1) (12-month freedom) vs s.6(2) (app date only)
- Irish nationals automatically free from restrictions
- Multiple status types map to "free from restrictions"

### intention_to_reside
- Only applies to s.6(1) route
- Presumed satisfied if absence requirements met
- Multiple evidence types (family, home, estate in UK)
- Discretionary override for VSO, studies, maritime

### residence
- Most complex: absence thresholds differ by route
- s.6(1): ≤ 450 days total, ≤ 90 days last 12m
- s.6(2): ≤ 270 days total, ≤ 90 days last 12m
- Discretionary tiers for excess absences
- Pre-computed fields: total_absence_days, absence_days_last_12m

### good_character
- Tier 1 (hard rules): terrorism, war crimes, illegal entry, pending charges → auto-refusal
- Tier 2 (discretionary): criminal history, financial, deception → review_required
- Illegal entry exception: outside control (child, trafficked, modern slavery)
