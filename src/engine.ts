import { DecisionObject, StructuralFlags, Option, Criterion, Assumption } from './types';

/**
 * Computes deterministic structural flags based on the extracted decision object.
 */
export function computeStructuralFlags(decision: Partial<DecisionObject>): StructuralFlags {
  const missing_priority_1_dominance = !(decision.criteria?.some(c => c.priority === 1 && c.dominant_option !== null));
  const no_reversal_condition_identified = !decision.reversal_condition;
  const low_confidence_high_impact_assumption = !!decision.assumptions?.some(
    a => a.confidence === 'low' && a.impact === 'high'
  );
  const missing_error_asymmetry = !decision.error_asymmetry?.worse_mistake;

  return {
    missing_priority_1_dominance,
    no_reversal_condition_identified,
    low_confidence_high_impact_assumption,
    missing_error_asymmetry
  };
}

/**
 * Maps structural flags to a confidence band.
 */
export function computeConfidenceBand(flags: StructuralFlags): 'High' | 'Moderate' | 'Low' {
  if (flags.low_confidence_high_impact_assumption) return 'Low';
  if (flags.missing_priority_1_dominance || flags.no_reversal_condition_identified) return 'Moderate';
  return 'High';
}

/**
 * Detects gaps and returns clarification questions (max 2).
 */
export function detectGaps(decision: Partial<DecisionObject>, flags: StructuralFlags): string[] {
  const questions: string[] = [];

  if (flags.no_reversal_condition_identified) {
    questions.push("What specific new fact, threshold, or outcome would make you change your current preference?");
  }
  
  if (flags.missing_error_asymmetry && questions.length < 2) {
    questions.push("This decision has two ways to go wrong. Which mistake is worse: choosing Option A when B was right, or choosing B when A was right?");
  }

  if (flags.missing_priority_1_dominance && questions.length < 2) {
    const p1 = decision.criteria?.find(c => c.priority === 1);
    if (p1) {
      questions.push(`On '${p1.name}', which option currently has the edge: Option A or Option B?`);
    } else {
      questions.push("What matters most in this decision, and which option currently looks stronger on that top priority?");
    }
  }

  if (flags.low_confidence_high_impact_assumption && questions.length < 2) {
    const weak = decision.assumptions?.find(a => a.confidence === 'low' && a.impact === 'high');
    if (weak) {
      questions.push(`Regarding your assumption about "${weak.statement}", what evidence would increase your confidence?`);
    }
  }

  return questions;
}

/**
 * Builds the render-ready markdown decision brief.
 */
export function buildDecisionBrief(decision: DecisionObject): string {
  const confidence = computeConfidenceBand(decision.structural_flags);
  const date = new Date().toISOString().split('T')[0];

  let brief = `## Decision Brief: ${decision.goal.statement}\n\n`;
  brief += `**Confidence:** ${confidence}\n`;
  brief += `**Date:** ${date}\n\n`;

  brief += `### Options\n`;
  decision.options.forEach(o => brief += `- **${o.id}**: ${o.label}\n`);
  brief += `\n`;

  if (decision.criteria.length > 0) {
    brief += `### Key Criteria\n`;
    decision.criteria.sort((a, b) => a.priority - b.priority).slice(0, 3).forEach(c => {
      brief += `- ${c.name} (Priority ${c.priority}): Dominant: ${c.dominant_option || 'Unclear'}\n`;
    });
    brief += `\n`;
  }

  if (decision.assumptions.length > 0) {
    brief += `### Critical Assumptions\n`;
    decision.assumptions.filter(a => a.impact === 'high').forEach(a => {
      brief += `- ${a.statement} (${a.confidence} confidence)\n`;
    });
    brief += `\n`;
  }

  if (decision.reversal_condition) {
    brief += `### Reversal Condition\n`;
    brief += `${decision.reversal_condition}\n\n`;
  }

  if (decision.error_asymmetry.worse_mistake) {
    brief += `### Error Asymmetry\n`;
    brief += `**Worse Mistake**: ${decision.error_asymmetry.worse_mistake}\n`;
    if (decision.error_asymmetry.rationale) {
      brief += `*Rationale*: ${decision.error_asymmetry.rationale}\n`;
    }
    brief += `\n`;
  }

  if (decision.unresolved_questions.length > 0) {
    brief += `### Unresolved Questions\n`;
    decision.unresolved_questions.forEach(q => brief += `- ${q}\n`);
    brief += `\n`;
  }

  return brief;
}

/**
 * Runs deterministic evaluator checks to ensure doctrine compliance.
 */
export function runDoctrineEvaluator(brief: string): { brief: string, flags: string[] } {
  let processed = brief;
  const flags: string[] = [];

  // 1. Recommendation language compliance
  const recPhrases = [/you should/i, /I recommend/i, /better choice/i, /optimal path/i];
  let changedRec = false;
  recPhrases.forEach(re => {
    if (re.test(processed)) {
      processed = processed.replace(re, 'conditional reasoning suggests');
      changedRec = true;
    }
  });
  if (changedRec) flags.push('recommendation_language_rewritten');

  // 2. Framework name stripping
  const frameworkNames = [/Athena v1.3.1/i, /Cognitive Clarity Engine/i];
  let changedFrame = false;
  frameworkNames.forEach(re => {
    if (re.test(processed)) {
      processed = processed.replace(re, 'Analysis');
      changedFrame = true;
    }
  });
  if (changedFrame) flags.push('framework_name_stripped');

  return { brief: processed, flags };
}

/**
 * Fast-path pre-filter to catch obvious non-binary or non-strategic queries.
 */
export function isBinaryDecisionCandidate(query: string): boolean {
  const lowQuery = query.toLowerCase();
  const markers = ['should we', ' vs ', ' or ', 'choice', 'decide', 'pivot', 'hire', 'buy', 'build'];
  return markers.some(m => lowQuery.includes(m));
}
