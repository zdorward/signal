import { anthropic } from '@/lib/anthropic';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { role_description } = await request.json();

  if (!role_description) {
    return new Response(JSON.stringify({ error: 'Missing role_description' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = `You are an expert at creating technical hiring challenges that require candidates to build working demos.

CRITICAL REQUIREMENTS:
- The challenge MUST require a working demo link submission — NOT a written essay or explanation
- The challenge must be specific to the role described
- Time-boxed to approximately 2 hours of work
- Present a concrete, realistic scenario with real constraints (e.g., specific data format, API to integrate, edge cases to handle)
- The scenario should feel like actual work the candidate would do in the role

Generate:
1. challenge_text: A specific work-sample scenario that requires building something functional. Include:
   - A realistic business context/scenario
   - Clear technical requirements
   - Specific constraints or edge cases to handle
   - What the working demo should demonstrate
   - The ~2 hour time expectation

2. rubric_json: Exactly 5 weighted criteria for evaluation. Weights must sum to exactly 100.

IMPORTANT: Respond with RAW JSON only. Do NOT wrap in markdown code blocks. Do NOT include \`\`\`json or \`\`\`. Just output the raw JSON object starting with { and ending with }.

Example format:
{"challenge_text": "## The Scenario\\n\\n[content]", "rubric_json": [{"criterion": "Name", "weight": 20, "description": "Description"}]}`;

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Create a hiring challenge for this role:\n\n${role_description}`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
