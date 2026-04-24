import { v4 as uuidv4 } from 'uuid';
import { 
  AthenaSkillResponse, 
  DecisionObject, 
  ResponseStatus 
} from './types';
import { 
  computeStructuralFlags, 
  detectGaps, 
  buildDecisionBrief, 
  runDoctrineEvaluator,
  isBinaryDecisionCandidate 
} from './engine';

/**
 * Interface for the internal bridge LLM call.
 */
interface InternalBridgeRequest {
  prompt: string;
  model?: string;
  response_format?: 'json' | 'text';
}

/**
 * Placeholder for the OpenClaw internal bridge implementation.
 * In a real OpenClaw skill, this would call the host's LLM provision system.
 */
async function callInternalBridge(request: InternalBridgeRequest): Promise<string> {
  // TODO: Implement actual bridge call (e.g., fetch to localhost:18789/completion)
  // For now, this is a placeholder that would be fulfilled by the OpenClaw runtime.
  console.log("Calling OpenClaw Internal Bridge with prompt length:", request.prompt.length);
  throw new Error("Internal Bridge not connected. Please implement the actual bridge call.");
}

export interface PipelineInputs {
  user_query: string;
  conversation_history?: string;
  conversation_summary?: string;
  agent_knowledge?: string;
}

/**
 * The 9-step Athena execution pipeline.
 */
export async function runAthenaPipeline(inputs: PipelineInputs): Promise<AthenaSkillResponse> {
  try {
    // 1. Normalize (Simple pass-through for now)
    const { user_query, conversation_history, conversation_summary, agent_knowledge } = inputs;

    // 2. Fast-Path Pre-Filter
    if (!isBinaryDecisionCandidate(user_query)) {
      return { 
        status: 'unsupported', 
        unsupported_reason: 'Query does not appear to be a binary strategic decision.',
        evaluator_flags: ['fast_path_reject']
      };
    }

    // 3. Extraction (LLM Call)
    // In a real implementation, we would load the prompt from prompts/extract_v1.3.1.txt
    const promptTemplate = `(Extraction Prompt Content from extract_v1.3.1.txt)`; 
    const prompt = promptTemplate
      .replace('{{user_query}}', user_query)
      .replace('{{conversation_history}}', conversation_history || 'None')
      .replace('{{conversation_summary}}', conversation_summary || 'None')
      .replace('{{agent_knowledge}}', agent_knowledge || 'None');

    let rawExtraction: any;
    try {
      const response = await callInternalBridge({ 
        prompt, 
        response_format: 'json' 
      });
      rawExtraction = JSON.parse(response);
    } catch (llmError) {
      return { 
        status: 'unsupported', 
        unsupported_reason: 'Failed to extract decision structure from input.' 
      };
    }

    // 4. Enrichment
    const decision: DecisionObject = {
      ...rawExtraction,
      decision_id: uuidv4(),
      unresolved_questions: rawExtraction.unresolved_questions || []
    };

    // 5. Structural Diagnosis
    decision.structural_flags = computeStructuralFlags(decision);

    // 6. Response Mode Selection
    let status: ResponseStatus = 'complete';
    const questions = detectGaps(decision, decision.structural_flags);

    if (questions.length > 0) {
      status = 'needs_clarification';
    }

    // 7. Deterministic Synthesis
    const briefRaw = buildDecisionBrief(decision);

    // 8. Doctrine Evaluator
    const { brief, flags: evaluatorFlags } = runDoctrineEvaluator(briefRaw);

    // 9. Return & Audit
    // (Audit logging would be an async fire-and-forget call here)
    
    return {
      status,
      decision_id: decision.decision_id,
      clarification_questions: status === 'needs_clarification' ? questions : undefined,
      structural_flags: decision.structural_flags,
      decision_brief: status === 'complete' ? brief : undefined,
      evaluator_flags: evaluatorFlags
    };

  } catch (error) {
    console.error("Athena Pipeline Error:", error);
    return { 
      status: 'unsupported', 
      unsupported_reason: 'An internal error occurred during processing.' 
    };
  }
}
