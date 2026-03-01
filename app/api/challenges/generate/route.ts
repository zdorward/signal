import { anthropic } from '@/lib/anthropic';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { role_description, challenge_requirements } = await request.json();

  if (!role_description) {
    return new Response(JSON.stringify({ error: 'Missing role_description' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = `You are an expert at creating hiring assessments that evaluate candidates through targeted questions.

TASK: Generate a set of custom questions for evaluating candidates, along with evaluation criteria for each question.

OUTPUT FORMAT:
First, write a brief intro (2-3 sentences) that sets context for the candidate about what they'll be asked.

Then output: ---QUESTIONS---

Then output a JSON array of questions. Each question has:
- id: a unique UUID
- text: the question to ask the candidate
- order: position (1, 2, 3...)
- word_limit: suggested word limit (default 500)
- criteria: array of 1-3 evaluation criteria, each with:
  - id: unique UUID
  - text: what to evaluate in the answer
  - order: position (1, 2, 3)

Generate 3-5 questions total. Questions should:
- Be specific to the role and requirements
- Include at least one question about motivation/fit (e.g., "Why [company]?")
- Include at least one question about technical decision-making
- Be answerable in the word limit

Example output:

We're looking for someone who can think critically about AI systems and make thoughtful tradeoffs. Please answer each question below.

---QUESTIONS---
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "Why do you want to work at Wealthsimple?",
    "order": 1,
    "word_limit": 300,
    "criteria": [
      {"id": "550e8400-e29b-41d4-a716-446655440001", "text": "Demonstrates specific knowledge of Wealthsimple's mission, products, or culture", "order": 1},
      {"id": "550e8400-e29b-41d4-a716-446655440002", "text": "Shows genuine connection between candidate's values and company", "order": 2}
    ]
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "text": "What is the one critical decision in your system that must remain human?",
    "order": 2,
    "word_limit": 500,
    "criteria": [
      {"id": "550e8400-e29b-41d4-a716-446655440004", "text": "Identifies a genuinely critical decision point", "order": 1},
      {"id": "550e8400-e29b-41d4-a716-446655440005", "text": "Articulates clear reasoning for why human judgment is essential", "order": 2},
      {"id": "550e8400-e29b-41d4-a716-446655440006", "text": "Demonstrates understanding of AI limitations", "order": 3}
    ]
  }
]`;

  const userMessage = challenge_requirements
    ? `Create questions for this role:\n\n${role_description}\n\nAdditional requirements:\n${challenge_requirements}`
    : `Create questions for this role:\n\n${role_description}`;

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
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
