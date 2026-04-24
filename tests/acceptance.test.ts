import { isBinaryDecisionCandidate, computeStructuralFlags, computeConfidenceBand } from '../src/engine';
import { evaluateBrief } from '../src/evaluator';
import { DecisionObject } from '../src/types';

describe('Athena Acceptance Tests (v1.3.1)', () => {
  
  // AT-6: Fast-path unsupported
  test('AT-6: Should reject non-binary queries early', () => {
    expect(isBinaryDecisionCandidate('What is the weather in Dubai?')).toBe(false);
    expect(isBinaryDecisionCandidate('Draft an email to the team.')).toBe(false);
  });

  test('AT-6: Should accept binary strategic queries', () => {
    expect(isBinaryDecisionCandidate('Should we build a CRM or buy one?')).toBe(true);
    expect(isBinaryDecisionCandidate('Pivot vs Stay for the startup?')).toBe(true);
  });

  // AT-4/AT-5: Evaluator Guardrails
  test('AT-4/AT-5: Evaluator should strip recommendations and frameworks', () => {
    const mockDecision: any = {
      structural_flags: { missing_error_asymmetry: false },
      criteria: [],
      assumptions: [],
      options: [{id: 'A', label: 'A'}, {id: 'B', label: 'B'}]
    };
    const brief = "I recommend Option A. This is a SWOT analysis. You should do it.";
    const result = evaluateBrief(brief, mockDecision);
    
    expect(result.brief).not.toContain("I recommend");
    expect(result.brief).not.toContain("SWOT");
    expect(result.brief).not.toContain("you should");
    expect(result.flags).toContain('recommendation_language_rewritten');
    expect(result.flags).toContain('framework_name_stripped');
  });

  // AT-9: Confidence logic
  test('AT-9: Confidence should be Low if weak high-impact assumption exists', () => {
    const flags = {
      missing_priority_1_dominance: false,
      no_reversal_condition_identified: false,
      low_confidence_high_impact_assumption: true,
      missing_error_asymmetry: false
    };
    expect(computeConfidenceBand(flags)).toBe('Low');
  });

  // AT-10: Audit metadata completeness (Unit check for makeAuditEvent logic)
  test('AT-10: Structural flags should be deterministic', () => {
    const obj: any = {
      criteria: [{ priority: 1, dominant_option: null }], // Gap here
      assumptions: [],
      reversal_condition: null,
      error_asymmetry: { worse_mistake: null }
    };
    const flags = computeStructuralFlags(obj);
    expect(flags.missing_priority_1_dominance).toBe(true);
    expect(flags.no_reversal_condition_identified).toBe(true);
    expect(flags.missing_error_asymmetry).toBe(true);
  });
});
