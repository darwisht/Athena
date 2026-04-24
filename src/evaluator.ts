import { DecisionObject } from './types';
import { computeConfidenceBand } from './engine';

export interface EvaluatorResult {
  brief: string;
  flags: string[];
}

/**
 * Runs a suite of doctrine enforcement checks on the generated brief.
 */
export function evaluateBrief(brief: string, obj: DecisionObject): EvaluatorResult {
  let updated = brief;
  const flags: string[] = [];

  // 1. Recommendation language compliance (E-1)
  const recPhrases = [
    /\byou should\b/gi, 
    /\bI recommend\b/gi, 
    /\bbetter choice\b/gi, 
    /\brecommend that\b/gi
  ];
  let changedRec = false;
  recPhrases.forEach(re => {
    if (re.test(updated)) {
      updated = updated.replace(re, 'the analysis suggests');
      changedRec = true;
    }
  });
  if (changedRec) flags.push('recommendation_language_rewritten');

  // 2. Framework name stripping (E-2)
  const frameworkTerms = [
    /\bSWOT\b/gi, /\bInversion\b/gi, /\bFirst Principles\b/gi,
    /\bEisenhower Matrix\b/gi, /\bDecision Matrix\b/gi,
    /\bFive Whys\b/gi, /\bPre-mortem\b/gi, /\bIssue Tree\b/gi
  ];
  let changedFrame = false;
  frameworkTerms.forEach(re => {
    if (re.test(updated)) {
      updated = updated.replace(re, 'structured analysis');
      changedFrame = true;
    }
  });
  if (changedFrame) flags.push('framework_name_stripped');

  // 3. Confidence consistency (E-3)
  const band = computeConfidenceBand(obj.structural_flags);
  const lowConfPattern = /\blow confidence\b/gi;
  const highConfPattern = /\bhigh confidence\b/gi;

  if (band === 'Low' && highConfPattern.test(updated)) {
    updated = updated.replace(highConfPattern, 'Low confidence');
    flags.push('confidence_corrected');
  } else if (band === 'High' && lowConfPattern.test(updated)) {
    updated = updated.replace(lowConfPattern, 'High confidence');
    flags.push('confidence_corrected');
  }

  // 4. Asymmetry visibility for high-stakes (E-4)
  if (obj.structural_flags.missing_error_asymmetry) {
    if (!updated.includes("Which mistake is worse")) {
      updated += "\n\n### Unresolved Question\n- This decision has two ways to go wrong. Which mistake is worse: choosing Option A when B was right, or choosing B when A was right?";
      flags.push('missing_error_asymmetry_high_stakes');
    }
  }

  // 5. Absolute conclusion detection (E-5)
  const absolutePhrases = [
    /\bclearly better\b/gi, 
    /\bobvious choice\b/gi, 
    /\bright call\b/gi,
    /\bthen you must\b/gi
  ];
  let changedAbsolute = false;
  absolutePhrases.forEach(re => {
    if (re.test(updated)) {
      updated = updated.replace(re, 'the analysis points toward');
      changedAbsolute = true;
    }
  });
  if (changedAbsolute) flags.push('absolute_claim_softened');

  return { brief: updated, flags };
}
