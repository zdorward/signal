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

Respond with valid JSON in this exact format:
{
  "challenge_text": "## The Scenario\\n\\n[Realistic business context]\\n\\n## Requirements\\n\\n[What to build]\\n\\n## Constraints\\n\\n[Specific limitations/edge cases]\\n\\n## Deliverable\\n\\nSubmit a working demo link. Time expectation: ~2 hours.",
  "rubric_json": [
    {"criterion": "Functionality", "weight": 30, "description": "Does the demo work and meet the core requirements?"},
    {"criterion": "Code Quality", "weight": 20, "description": "Clean, readable, well-organized code"},
    {"criterion": "Technical Decisions", "weight": 20, "description": "Appropriate architecture and technology choices"},
    {"criterion": "Edge Case Handling", "weight": 15, "description": "Handles the specified constraints and edge cases"},
    {"criterion": "Polish", "weight": 15, "description": "Attention to detail, UX considerations, error handling"}
  ]
}`;

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
