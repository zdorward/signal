import { anthropic } from "@/lib/anthropic";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { role_description, challenge_requirements } = await request.json();

  if (!role_description) {
    return new Response(JSON.stringify({ error: "Missing role_description" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `You are an expert at creating work-sample hiring challenges.

TASK: Generate a project challenge that candidates must build, plus 2 supplementary questions.

OUTPUT FORMAT:
1. First, write a brief intro (2-3 sentences) setting context.

2. Then output: ---CHALLENGE---

3. Then write the project challenge in markdown. This should:
   - Present a realistic scenario with business context
   - Specify what to build (a working demo)
   - Include clear technical requirements
   - Be completable in ~2 hours
   - End with "Submit a link to your working demo."

4. Then output: ---QUESTIONS---

5. Then output a JSON array with 2 supplementary questions. Each question has:
   - id: a unique UUID
   - text: the question
   - order: position (1, 2, 3)
   - word_limit: suggested word limit (300-500)
   - criteria: array of 1-2 evaluation criteria, each with id, text, order

Questions should focus on:
- Motivation/fit (e.g., "Why [company]?")
- Technical decision-making (e.g., "What decision must remain human?")

Example output:

We're looking for builders who can ship AI-powered products. Complete the challenge below and answer the questions.

---CHALLENGE---

## Build a Smart Expense Categorizer

You're joining our fintech team. We need a tool that automatically categorizes transaction descriptions.

### Requirements
- Accept a transaction description as input
- Return a category (e.g., "Food & Dining", "Transportation", "Entertainment")
- Use AI to handle ambiguous cases
- Show your reasoning for edge cases

### Deliverable
Submit a link to your working demo. Time expectation: ~2 hours.

---QUESTIONS---
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "Why do you want to work at Wealthsimple?",
    "order": 1,
    "word_limit": 300,
    "criteria": [
      {"id": "550e8400-e29b-41d4-a716-446655440001", "text": "Demonstrates specific knowledge of the company", "order": 1},
      {"id": "550e8400-e29b-41d4-a716-446655440002", "text": "Shows genuine alignment with company values", "order": 2}
    ]
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "text": "What is the one critical decision in your system that must remain human?",
    "order": 2,
    "word_limit": 500,
    "criteria": [
      {"id": "550e8400-e29b-41d4-a716-446655440004", "text": "Identifies a genuinely critical decision point", "order": 1},
      {"id": "550e8400-e29b-41d4-a716-446655440005", "text": "Articulates clear reasoning for human judgment", "order": 2}
    ]
  }
]`;

  const userMessage = challenge_requirements
    ? `Create questions for this role:\n\n${role_description}\n\nAdditional requirements:\n${challenge_requirements}`
    : `Create questions for this role:\n\n${role_description}`;

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
