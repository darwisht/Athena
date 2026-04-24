# Athena Hardening Addendum - Doctrine Enforcement

## 1. Runtime Guardrails
Athena is a "doctrine-constrained" skill. The following guardrails are enforced deterministically via the Evaluator layer.

## 2. Evaluator Rules
The Evaluator post-processes the generated brief to ensure it remains a clarity artifact, not a recommendation.

### E-1 Recommendation Language Strip
- **Detect**: "you should", "better choice", "I recommend".
- **Action**: Rewrite to conditional phrasing (e.g., "the analysis suggests").
- **Flag**: `recommendation_language_rewritten`.

### E-2 Framework Name Strip
- **Detect**: Internal framework names (e.g., "SWOT", "Inversion").
- **Action**: Replace with "structured analysis".
- **Flag**: `framework_name_stripped`.

### E-3 Confidence Consistency
- **Detect**: Mismatch between flags (e.g., weak high-impact assumption) and written confidence labels.
- **Action**: Correct label to match deterministic band (High/Moderate/Low).
- **Flag**: `confidence_corrected`.

### E-4 Asymmetry Visibility
- **Detect**: Unsupported decisions (all v1.3.1 are high-stakes) missing error asymmetry clarification.
- **Action**: Append canonical asymmetry question to Unresolved Questions.
- **Flag**: `missing_error_asymmetry_high_stakes`.

### E-5 Absolute Conclusion Softening
- **Detect**: "clearly better", "obvious choice", "right call".
- **Action**: Rewrite to conditional alignment language.
- **Flag**: `absolute_claim_softened`.

## 3. Schema Integrity
- All final response objects are validated against `decision_v1.3.1.schema.json`.
- If validation fails, return `unsupported` with `output_schema_violation`.
