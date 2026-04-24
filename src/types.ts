export type ResponseStatus = "complete" | "needs_clarification" | "needs_binary_framing" | "unsupported";

export interface Option {
  id: "A" | "B";
  label: string;
}

export interface Criterion {
  name: string;
  priority: number;
  dominant_option: "A" | "B" | "tie" | null;
}

export interface Assumption {
  statement: string;
  confidence: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  invalidates_if_false: "A" | "B" | "both" | "entire_decision" | null;
}

export interface ErrorAsymmetry {
  worse_mistake: "A_wrong" | "B_wrong" | "symmetric" | null;
  rationale: string | null;
}

export interface StructuralFlags {
  missing_priority_1_dominance: boolean;
  no_reversal_condition_identified: boolean;
  low_confidence_high_impact_assumption: boolean;
  missing_error_asymmetry: boolean;
}

export interface DecisionObject {
  decision_id: string;
  goal: {
    statement: string;
    success_definition: string | null;
  };
  options: [Option, Option];
  criteria: Criterion[];
  assumptions: Assumption[];
  reversal_condition: string | null;
  error_asymmetry: ErrorAsymmetry;
  structural_flags: StructuralFlags;
  unresolved_questions: string[];
}

export interface AthenaSkillResponse {
  status: ResponseStatus;
  decision_id?: string;
  clarification_questions?: string[];
  unsupported_reason?: string;
  internal_state?: Record<string, unknown>;
  structural_flags?: StructuralFlags;
  decision_brief?: string;
  evaluator_flags?: string[];
}
