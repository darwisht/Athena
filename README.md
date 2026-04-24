# Athena v1.3.1 - Cognitive Clarity Engine

Athena is a doctrine-constrained reasoning skill for **binary strategic decisions under uncertainty**. 

It is designed to help humans think more clearly by structuring decisions, surfacing assumptions, exposing fragility, and making reasoning auditable—without making recommendations.

## Core Specifications
- **[DOCTRINE.md](./DOCTRINE.md)** - Epistemic standards and "honest signal" rules.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and deterministic synthesis logic.
- **[PRD.md](./PRD.md)** - Product requirements and success criteria.
- **[HARDENING-ADDENDUM.md](./HARDENING-ADDENDUM.md)** - Doctrine enforcement & Evaluator rules.
- **[DOMAIN.md](./DOMAIN.md)** - Stakeholder docs and product boundaries.
- **[IMPLEMENTATION-PACK.md](./IMPLEMENTATION-PACK.md)** - Integration guide.

## Operational Assets
- **[SKILL.md](./SKILL.md)** - Operational runtime contract for OpenClaw.
- `prompts/`: Versioned high-fidelity extraction prompts.
- `schemas/`: JSON schemas for structural validation and audit events.

## Project Structure
- `src/engine.ts`: Deterministic logic (Flags, Gaps, Confidence).
- `src/evaluator.ts`: Post-processing doctrine enforcement.
- `src/pipeline.ts`: Orchestration of the reasoning pipeline.
- `tests/`: Unit and acceptance testing suite.

## Development
```bash
npm install
npm test
```

## License
MIT
