import { computeStructuralFlags, computeConfidenceBand, detectGaps } from '../src/engine';
import { DecisionObject } from '../src/types';

describe('Athena Engine', () => {
  const mockDecision: Partial<DecisionObject> = {
    criteria: [
      { name: 'Speed', priority: 1, dominant_option: 'A' }
    ],
    assumptions: [
      { statement: 'Market is ready', confidence: 'medium', impact: 'high', invalidates_if_false: 'entire_decision' }
    ],
    reversal_condition: 'If costs double',
    error_asymmetry: { worse_mistake: 'A_wrong', rationale: 'B is safer' }
  };

  test('computeStructuralFlags should detect no gaps in a complete object', () => {
    const flags = computeStructuralFlags(mockDecision);
    expect(flags.missing_priority_1_dominance).toBe(false);
    expect(flags.no_reversal_condition_identified).toBe(false);
    expect(flags.low_confidence_high_impact_assumption).toBe(false);
    expect(flags.missing_error_asymmetry).toBe(false);
  });

  test('computeStructuralFlags should detect missing reversal condition', () => {
    const incomplete = { ...mockDecision, reversal_condition: null };
    const flags = computeStructuralFlags(incomplete);
    expect(flags.no_reversal_condition_identified).toBe(true);
  });

  test('computeConfidenceBand should return Moderate for missing reversal', () => {
    const flags = {
      missing_priority_1_dominance: false,
      no_reversal_condition_identified: true,
      low_confidence_high_impact_assumption: false,
      missing_error_asymmetry: false
    };
    expect(computeConfidenceBand(flags)).toBe('Moderate');
  });

  test('detectGaps should return correct question for missing reversal', () => {
    const flags = {
      missing_priority_1_dominance: false,
      no_reversal_condition_identified: true,
      low_confidence_high_impact_assumption: false,
      missing_error_asymmetry: false
    };
    const questions = detectGaps(mockDecision, flags);
    expect(questions[0]).toContain("What specific new fact");
  });
});
