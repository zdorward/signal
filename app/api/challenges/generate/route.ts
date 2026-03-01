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

  const systemPrompt = `You are an expert at creating technical hiring challenges. Given a role description, generate:
1. A clear, engaging challenge_text that describes what the candidate should build
2. A rubric_json array with 4-6 weighted criteria for evaluation

The rubric weights must sum to exactly 100. Each criterion should have: criterion (name), weight (number), description (what to look for).

Respond with valid JSON in this exact format:
{
  "challenge_text": "Your challenge description here...",
  "rubric_json": [
    {"criterion": "Code Quality", "weight": 25, "description": "Clean, readable, well-organized code"},
    ...
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
