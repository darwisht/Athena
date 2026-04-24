# Athena v1.3.1 - Architecture

Athena is a stateless OpenClaw skill for **binary strategic decisions**. OpenClaw owns dialogue, memory, and routing; Athena owns extraction, structural diagnosis, and deterministic synthesis.

## Companion Documents
- `DOCTRINE.md` — Core identity and reasoning standards.
- `PRD.md` — Product requirements and success criteria.
- `SKILL.md` — Operational runtime contract.
- `HARDENING-ADDENDUM.md` — Safety and doctrine enforcement.
- `IMPLEMENTATION-PACK.md` — Setup and integration guide.

## 1. Execution Pipeline

Athena follows a fixed 9-step internal pipeline:

1.  **Normalize Request**: Clean inputs and supporting context.
2.  **Fast-Path Pre-Filter**: (Deterministic) Reject obvious non-binary queries cheaply.
3.  **Extraction**: (LLM) Populate a raw Decision Object from context.
4.  **Enrichment**: (Deterministic) Inject `decision_id`, UUIDs, and timestamps.
5.  **Structural Diagnosis**: (Deterministic) Compute `structural_flags` (e.g., missing reversal condition, weak high-impact assumptions).
6.  **Response Mode Selection**: Determine if `status` is `complete`, `needs_clarification`, or `needs_binary_framing`.
7.  **Deterministic Synthesis**: Generate the `decision_brief` markdown and mapping to structural confidence bands (High, Moderate, Low).
8.  **Doctrine Evaluator**: (Deterministic) Post-process output to strip recommendation language or framework names.
9.  **Return & Audit**: Return final response and emit asynchronous audit log.

## 2. System Boundary

- **OpenClaw (Host)**: Memory retrieval, conversation continuity, response rendering.
- **Athena (Skill)**: Extraction logic, structural honest signaling, doctrine enforcement.

## 3. Internal Module Layout

- `src/engine.ts`: Deterministic logic (Flags, Gaps, Confidence, Synthesis).
- `src/pipeline.ts`: Orchestration of the 9-step flow.
- `src/types.ts`: Shared interfaces and schema definitions.
- `prompts/`: Versioned extraction prompts.
- `schemas/`: JSON Schemas for validation.

## 4. Key Logic (Deterministic)

### Confidence Band Mapping
- **Low**: `low_confidence_high_impact_assumption === true`
- **Moderate**: `missing_priority_1_dominance === true` OR `no_reversal_condition_identified === true`
- **High**: Otherwise

### Clarification Triggers
- Athena asks at most **two questions per turn**.
- Priority:
    1. Unclear binary frame (`needs_binary_framing`).
    2. Missing reversal condition (`P0`).
    3. Missing error asymmetry (`P0`).
    4. Missing top-criterion dominance (`P0`).
    5. Weak high-impact assumption (`P1`).
