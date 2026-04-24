# Athena v1.3.1 - Cognitive Clarity Engine

Athena is a doctrine-constrained reasoning skill for **binary strategic decisions under uncertainty**. 

It is designed to help humans think more clearly by structuring decisions, surfacing assumptions, exposing fragility, and making reasoning auditable—without making recommendations.

## Documentation
- [SKILL.md](./SKILL.md) - Operational skill definition for OpenClaw.
- [DOCTRINE.md](./DOCTRINE.md) - Core epistemic principles and standards.
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and deterministic synthesis logic.

## Project Structure
- `src/engine.ts`: Deterministic logic (Flags, Gaps, Confidence).
- `src/pipeline.ts`: Orchestration of the reasoning pipeline.
- `prompts/`: High-fidelity extraction prompts.
- `schemas/`: JSON schemas for structural validation.

## Development
```bash
npm install
npm test
```

## License
MIT
