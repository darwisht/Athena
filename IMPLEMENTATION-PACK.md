# Athena v1.3.1 - Implementation Pack

## 1. Fast-Path Pre-Filter
Deterministic filter to minimize LLM latency and cost.
- **Pattern**: `/(should|decide|choose).*(or|vs)/i`
- **Exclusions**: Weather, news, drafts, translations.

## 2. Extraction Prompt
Located in `prompts/extract_v1.3.1.txt`.
- **Constraint**: Must use the provided JSON schema for output.
- **Rules**: Exactly two options. Priority-based criteria.

## 3. Schemas
- **Pre-enrichment**: `schemas/extract_v1.3.1.schema.json`
- **Post-enrichment**: `schemas/decision_v1.3.1.schema.json`
- **Audit**: `schemas/audit_v1.3.1.schema.json`

## 4. Integration via Internal Bridge
Athena expects an internal bridge for:
- **LLM Completions**: Calling the configured model.
- **Audit Logging**: Sending async events to the platform's trace system.

## 5. Decision Brief Synthesis
- **Confidence Banding**: Derived from structural flags.
- **Summary**: Logic-driven concatenation of dominance and fragility.
