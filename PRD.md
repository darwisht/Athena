# Athena v1.3.1 PRD - Strategic Decision Co-Pilot

## 1. Product Goal
Athena is a **stateless reasoning skill** for binary strategic decisions. It extracts a minimal, elegant decision model from context, applies deterministic synthesis, and exposes fragility and structural clarity.

## 2. Non-Goals
- Multi-option decisions (>2 paths)
- Persistent memory across sessions (OpenClaw handles memory)
- External data enrichment
- Quantitative simulation
- Recommendation generation

## 3. Decision Scope
### 3.1 Allowed Type
**Binary Strategic Choice**: Exactly two discrete options (e.g., "Build vs Buy", "Pivot vs Stay").

## 4. Response Modes
- `complete`: Clarity exists to return a brief.
- `needs_clarification`: Binary frame is OK, but info is missing.
- `needs_binary_framing`: Two options are not explicit yet.
- `unsupported`: Outside scope.

## 5. Decision Object Schema (Summary)
- **Goal**: Statement and success definition.
- **Options**: Exactly two.
- **Criteria**: Ordered by priority, with dominant option.
- **Assumptions**: Confidence (high/medium/low) and invalidation consequence.
- **Reversal Condition**: Explicit natural-language trigger.
- **Structural Flags**: Deterministic indicators of fragility.

## 6. Functional Requirements
- **FR-1**: Fast-path pre-filter to reject non-binary queries.
- **FR-2**: Extraction of structural components without analysis.
- **FR-3**: Deterministic computation of flags and confidence bands.
- **FR-4**: Synthesis of a render-ready markdown brief.
- **FR-5**: Asynchronous audit logging of every invocation.
