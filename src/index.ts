import { runAthenaPipeline, PipelineInputs } from './pipeline';
import { AthenaSkillResponse } from './types';

/**
 * Entry point for the Athena OpenClaw skill.
 * This can be used as a CLI tool or imported as a module.
 */
export async function athena(inputs: PipelineInputs): Promise<AthenaSkillResponse> {
  return await runAthenaPipeline(inputs);
}

// Example CLI usage (if running directly)
if (require.main === module) {
  const query = process.argv[2];
  if (!query) {
    console.error("Usage: node dist/index.js 'Your strategic decision query'");
    process.exit(1);
  }

  athena({ user_query: query }).then(response => {
    console.log(JSON.stringify(response, null, 2));
  });
}
