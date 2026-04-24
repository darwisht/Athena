import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { 
  AthenaSkillResponse, 
  DecisionObject, 
  ResponseStatus, 
  AthenaSkillRequest,
  AuditEvent
} from './types';
import { 
  computeStructuralFlags, 
  detectGaps, 
  buildDecisionBrief, 
  isBinaryDecisionCandidate 
} from './engine';
import { evaluateBrief } from './evaluator';

/**
 * Loads the extraction prompt from the file system.
 */
function loadPromptTemplate(version: string = 'v1.3.1'): string {
  try {
    const promptPath = path.join(__dirname, '..', 'prompts', `extract_${version}.txt`);
    return fs.readFileSync(promptPath, 'utf8');
  } catch (error) {
    console.error("Failed to load prompt template:", error);
    return ""; // Fallback to empty context
  }
}

/**
 * Async audit logging (fire-and-forget).
 */
function logAudit(event: AuditEvent): void {
  // TODO: Send to OpenClaw diagnostic gateway
  // For now, write to a local log file for verification
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logPath = path.join(logDir, 'audit.log');
  fs.appendFileSync(logPath, JSON.stringify(event) + '\n');
}

/**
 * Placeholder model bridge.
 */
async function callInternalBridge(prompt: string): Promise<string> {
  // In a real OpenClaw skill, this uses the host's model provisions.
  throw new Error("Internal Bridge not connected.");
}

/**
 * The 9-step Athena execution pipeline.
 */
export async function runAthenaPipeline(request: AthenaSkillRequest): Promise<AthenaSkillResponse> {
  const started = Date.now();
  const sessionId = uuidv4();

  try {
    // 1. Normalize
    const { user_query } = request;

    // 2. Fast-Path Pre-Filter
    if (!isBinaryDecisionCandidate(user_query)) {
      const response: AthenaSkillResponse = { 
        status: 'unsupported', 
        evaluator_flags: ['fast_path_reject']
      };
      logAudit(makeAuditEvent(response, request, started, sessionId, 0));
      return response;
    }

    // 3. Extraction (LLM Call)
    const promptTemplate = loadPromptTemplate();
    const prompt = promptTemplate
      .replace('{{user_query}}', user_query)
      .replace('{{conversation_history}}', request.conversation_history || 'None')
      .replace('{{conversation_summary}}', request.conversation_summary || 'None')
      .replace('{{agent_knowledge}}', request.agent_knowledge || 'None');

    let rawExtraction: any;
    let retries = 0;
    try {
      const response = await callInternalBridge(prompt);
      rawExtraction = JSON.parse(response);
    } catch (llmError) {
      const response: AthenaSkillResponse = { 
        status: 'unsupported', 
        unsupported_reason: 'extraction_failed' 
      };
      logAudit(makeAuditEvent(response, request, started, sessionId, retries));
      return response;
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
    const { brief, flags: evaluatorFlags } = evaluateBrief(briefRaw, decision);

    // 9. Return & Audit
    const finalResponse: AthenaSkillResponse = {
      status,
      decision_id: decision.decision_id,
      clarification_questions: status === 'needs_clarification' ? questions : undefined,
      structural_flags: decision.structural_flags,
      decision_brief: status === 'complete' ? brief : undefined,
      evaluator_flags: evaluatorFlags
    };

    logAudit(makeAuditEvent(finalResponse, request, started, sessionId, retries));
    return finalResponse;

  } catch (error) {
    console.error("Athena Pipeline Error:", error);
    return { status: 'unsupported' };
  }
}

function makeAuditEvent(
  response: AthenaSkillResponse, 
  request: AthenaSkillRequest, 
  started: number, 
  sessionId: string,
  retries: number
): AuditEvent {
  return {
    event_id: uuidv4(),
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    prompt_version: 'v1.3.1',
    schema_version: '1.3.1',
    model_identifier: 'google-gemini-cli/gemini-3.1-pro-preview',
    input_summary: request.user_query.substring(0, 500),
    invocation_status: response.status,
    decision_id: response.decision_id,
    structural_flags: response.structural_flags,
    evaluator_flags: response.evaluator_flags || [],
    retries,
    output_summary: response.decision_brief ? response.decision_brief.substring(0, 500) : response.status,
    processing_duration_ms: Date.now() - started
  };
}
