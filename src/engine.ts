import { DecisionObject, StructuralFlags, Option, Criterion, Assumption } from './types';

/**
 * Computes deterministic structural flags based on the extracted decision object.
 */
export function computeStructuralFlags(decision: Partial<DecisionObject>): StructuralFlags {
  const p1 = decision.criteria?.find(c => c.priority === 1);
  const missing_priority_1_dominance = !p1 || p1.dominant_option == null;
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
  if (flags.missing_priority_1_dominance || flags.no_reversal_condition_identified || flags.missing_error_asymmetry) return 'Moderate';
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
      questions.push(`On '${p1.name}', which option has the edge: Option A or Option B?`);
    } else {
      questions.push("What matters most in this decision, and which option currently looks stronger on that top priority?");
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
  brief += `- **Option A**: ${decision.options[0].label}\n`;
  brief += `- **Option B**: ${decision.options[1].label}\n\n`;

  if (decision.criteria.length > 0) {
    brief += `### Key Criteria\n`;
    decision.criteria.sort((a, b) => a.priority - b.priority).slice(0, 3).forEach(c => {
      const dom = c.dominant_option ? ` (favors ${c.dominant_option})` : "";
      brief += `- **${c.name}**${dom}\n`;
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
    brief += `- ${decision.reversal_condition}\n\n`;
  }

  if (decision.error_asymmetry.worse_mistake) {
    brief += `### Error Asymmetry\n`;
    if (decision.error_asymmetry.worse_mistake === "symmetric") {
      brief += `- The costs of being wrong are roughly symmetric.\n`;
    } else {
      brief += `- Worse mistake: ${decision.error_asymmetry.worse_mistake}\n`;
      if (decision.error_asymmetry.rationale) {
        brief += `- Rationale: ${decision.error_asymmetry.rationale}\n`;
      }
    }
    brief += `\n`;
  }

  if (decision.unresolved_questions.length > 0) {
    brief += `### Unresolved Questions\n`;
    decision.unresolved_questions.forEach(q => brief += `- ${q}\n`);
    brief += `\n`;
  }

  return brief.trim();
}

/**
 * Fast-path pre-filter using spec-aligned regex.
 */
export function isBinaryDecisionCandidate(query: string): boolean {
  const q = query.toLowerCase();
  
  // 1. Exclusion filter
  if (/\b(weather|news|recipe|poem|joke|email|translate)\b/i.test(q)) return false;
  
  // 2. Binary signals
  const hasBinarySignal = /\b(or|vs\.?|versus)\b/i.test(q) || 
                          /\bbetween\b.*?\band\b/i.test(q) || 
                          /\bshould\s+(i|we)\b/i.test(q);
                          
  return hasBinarySignal;
}
