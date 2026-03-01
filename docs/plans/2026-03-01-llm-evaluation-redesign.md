# LLM Evaluation Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the fixed 5-category rubric system with employer-defined custom questions and AI-generated, editable evaluation criteria scored 1-5.

**Architecture:** AI generates both questions and criteria from role description. Employers edit on single screen. Candidates answer questions + submit URL. AI scores each criterion 1-5 with calibrated prompts. URL validated with pass/fail relevance check.

**Tech Stack:** Next.js, TypeScript, Supabase (Postgres), Claude API, Tailwind CSS, shadcn/ui components

---

## Task 1: Update TypeScript Types

**Files:**
- Modify: `lib/types.ts`

**Step 1: Write the new type definitions**

Replace the entire contents of `lib/types.ts`:

```typescript
// Question criterion for evaluation
export interface Criterion {
  id: string;
  text: string;
  order: number;
}

// Question with its evaluation criteria
export interface Question {
  id: string;
  text: string;
  order: number;
  word_limit: number;
  criteria: Criterion[];
}

// Challenge with questions instead of rubric
export interface Challenge {
  id: string;
  role_description: string;
  challenge_requirements: string | null;
  intro_text: string;
  questions_json: Question[];
  created_at: string;
}

// Candidate answer to a question
export interface Answer {
  question_id: string;
  text: string;
}

// Submission with answers instead of written_explanation
export interface Submission {
  id: string;
  challenge_id: string;
  candidate_name: string;
  demo_url: string;
  answers_json: Answer[];
  video_path: string | null;
  created_at: string;
}

// Score for a single criterion
export interface CriterionScore {
  criterion_id: string;
  question_id: string;
  score: number; // 1-5
  reasoning: string;
}

// Evaluation with criterion scores instead of rubric scores
export interface Evaluation {
  id: string;
  submission_id: string;
  criterion_scores_json: CriterionScore[];
  url_passed: boolean;
  url_notes: string;
  summary_bullets: string[];
  worth_human_attention: boolean;
  flag_reason: string | null;
  rejection_draft: string | null;
  created_at: string;
}

export interface SubmissionWithEvaluation extends Submission {
  evaluation: Evaluation | null;
  challenge: Challenge | null;
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors (or only unrelated errors from components not yet updated)

**Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "refactor: update types for question-based evaluation system"
```

---

## Task 2: Create Database Migration

**Files:**
- Create: `supabase/migrations/001_question_based_evaluation.sql`

**Step 1: Write the migration SQL**

```sql
-- Migration: Convert from rubric-based to question-based evaluation
-- This is a breaking change - existing data will need manual cleanup

-- Step 1: Add new columns to challenges
ALTER TABLE challenges
ADD COLUMN challenge_requirements TEXT,
ADD COLUMN intro_text TEXT,
ADD COLUMN questions_json JSONB;

-- Step 2: Add new columns to submissions
ALTER TABLE submissions
ADD COLUMN answers_json JSONB;

-- Step 3: Add new columns to evaluations
ALTER TABLE evaluations
ADD COLUMN criterion_scores_json JSONB,
ADD COLUMN url_passed BOOLEAN,
ADD COLUMN url_notes TEXT;

-- Note: After verifying the migration works, run these to clean up:
-- ALTER TABLE challenges DROP COLUMN challenge_text, DROP COLUMN rubric_json;
-- ALTER TABLE submissions DROP COLUMN written_explanation;
-- ALTER TABLE evaluations DROP COLUMN rubric_scores_json;
```

**Step 2: Apply migration locally**

Run: `npx supabase db push` (or apply via Supabase dashboard SQL editor)
Expected: Migration applies successfully

**Step 3: Commit**

```bash
git add supabase/migrations/001_question_based_evaluation.sql
git commit -m "db: add migration for question-based evaluation schema"
```

---

## Task 3: Update Challenge Generation API

**Files:**
- Modify: `app/api/challenges/generate/route.ts`

**Step 1: Update the system prompt and response parsing**

Replace entire file contents:

```typescript
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
```

**Step 2: Verify API compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/challenges/generate/route.ts
git commit -m "feat: update challenge generation to produce questions with criteria"
```

---

## Task 4: Update Challenges API (CRUD)

**Files:**
- Modify: `app/api/challenges/route.ts`

**Step 1: Read current file**

Read the file to understand current implementation.

**Step 2: Update to use new schema**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { role_description, challenge_requirements, intro_text, questions_json } = body;

  if (!role_description || !intro_text || !questions_json) {
    return NextResponse.json(
      { error: 'Missing required fields: role_description, intro_text, questions_json' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('challenges')
    .insert({
      role_description,
      challenge_requirements: challenge_requirements || null,
      intro_text,
      questions_json,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

**Step 3: Commit**

```bash
git add app/api/challenges/route.ts
git commit -m "feat: update challenges API for question-based schema"
```

---

## Task 5: Update Submissions API

**Files:**
- Modify: `app/api/submissions/route.ts`

**Step 1: Read current file**

Read to understand current implementation.

**Step 2: Update to use answers_json**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get('challenge_id');

  let query = supabaseAdmin
    .from('submissions')
    .select('*, evaluation:evaluations(*), challenge:challenges(*)')
    .order('created_at', { ascending: false });

  if (challengeId) {
    query = query.eq('challenge_id', challengeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten evaluation array to single object
  const formatted = data.map((s) => ({
    ...s,
    evaluation: Array.isArray(s.evaluation) ? s.evaluation[0] || null : s.evaluation,
    challenge: Array.isArray(s.challenge) ? s.challenge[0] || null : s.challenge,
  }));

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { challenge_id, candidate_name, demo_url, answers_json, video_path } = body;

  if (!challenge_id || !candidate_name || !demo_url || !answers_json) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('submissions')
    .insert({
      challenge_id,
      candidate_name,
      demo_url,
      answers_json,
      video_path: video_path || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget: trigger evaluation
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: data.id }),
  }).catch(console.error);

  return NextResponse.json(data, { status: 201 });
}
```

**Step 3: Commit**

```bash
git add app/api/submissions/route.ts
git commit -m "feat: update submissions API for answers_json schema"
```

---

## Task 6: Update Evaluation API (Core Logic)

**Files:**
- Modify: `app/api/evaluate/route.ts`

**Step 1: Rewrite evaluation logic with calibrated scoring**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Challenge, Submission, Question, Answer } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: Request) {
  console.log('[evaluate] Starting evaluation...');

  try {
    const { submission_id } = await request.json();

    if (!submission_id) {
      return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
    }

    // Step 1: Fetch submission with challenge
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*, challenge:challenges(*)')
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const challenge = Array.isArray(submission.challenge)
      ? submission.challenge[0]
      : submission.challenge;

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const typedSubmission = submission as unknown as Submission;
    const typedChallenge = challenge as Challenge;
    const questions = typedChallenge.questions_json as Question[];
    const answers = typedSubmission.answers_json as Answer[];

    // Step 2: Check URL and fetch content for relevance check
    let urlPassed = false;
    let urlNotes = '';
    let pageContent = '';

    try {
      const urlResponse = await fetch(typedSubmission.demo_url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Signal-Evaluation-Bot/1.0' },
      });

      if (urlResponse.ok) {
        const contentType = urlResponse.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const html = await urlResponse.text();
          // Extract text content (simple extraction)
          pageContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 2000);
        }
        urlPassed = true;
        urlNotes = `URL resolves (HTTP ${urlResponse.status})`;
      } else {
        urlNotes = `URL returned HTTP ${urlResponse.status}`;
      }
    } catch (urlError) {
      urlNotes = `URL check failed: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`;
    }

    // Step 3: Build evaluation prompt
    const systemPrompt = `You are an expert evaluator assessing candidate responses.

SCORING SCALE (use the full range):
5 - Exceeds expectations: Thoughtful, specific, demonstrates real understanding. Does NOT require perfection.
4 - Meets expectations: Solid answer that addresses the question well.
3 - Adequate: Answers the question but lacks depth or specificity.
2 - Weak: Partially addresses the question, missing key elements.
1 - Poor: Doesn't answer the question, generic, or off-topic.

CALIBRATION RULES:
- If an answer directly addresses the criterion with specific, relevant detail, score it 4 or 5.
- A 5 doesn't mean perfect - it means thoughtful and specific.
- Only score 1-2 for answers that genuinely miss the mark.
- Evaluate against the criterion ONLY. Don't impose unstated requirements.

OUTPUT FORMAT (raw JSON only, no markdown):
{
  "criterion_scores": [
    {"criterion_id": "...", "question_id": "...", "score": 4, "reasoning": "Brief explanation"}
  ],
  "url_relevant": true,
  "url_relevance_note": "Brief note about whether URL content matches challenge requirements",
  "summary_bullets": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
  "worth_human_attention": true,
  "flag_reason": null,
  "rejection_draft": "Dear [name],\\n\\nThank you for..."
}`;

    // Build question/answer pairs with criteria
    let questionsSection = '';
    for (const question of questions) {
      const answer = answers.find((a) => a.question_id === question.id);
      questionsSection += `\n## Question: ${question.text}\n`;
      questionsSection += `Candidate's Answer: ${answer?.text || '(No answer provided)'}\n`;
      questionsSection += `\nEvaluate against these criteria:\n`;
      for (const criterion of question.criteria) {
        questionsSection += `- [${criterion.id}] ${criterion.text}\n`;
      }
    }

    const userPrompt = `## Challenge Context
Role: ${typedChallenge.role_description}
${typedChallenge.challenge_requirements ? `Requirements: ${typedChallenge.challenge_requirements}` : ''}

## Candidate
Name: ${typedSubmission.candidate_name}
Demo URL: ${typedSubmission.demo_url}
URL Status: ${urlNotes}
${pageContent ? `Page Content Preview: ${pageContent.substring(0, 500)}...` : ''}

## Questions and Answers
${questionsSection}

Evaluate each criterion and provide scores.`;

    // Step 4: Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    // Step 5: Parse response
    let evaluation;
    try {
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      evaluation = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[evaluate] Parse error:', parseError, content.text);
      return NextResponse.json({ error: 'Failed to parse evaluation' }, { status: 500 });
    }

    // Update URL status based on AI relevance check
    if (urlPassed && evaluation.url_relevant === false) {
      urlPassed = false;
      urlNotes = evaluation.url_relevance_note || 'URL content does not match challenge requirements';
    } else if (urlPassed && evaluation.url_relevance_note) {
      urlNotes = evaluation.url_relevance_note;
    }

    // Step 6: Save evaluation
    const { data: evalData, error: evalError } = await supabaseAdmin
      .from('evaluations')
      .insert({
        submission_id,
        criterion_scores_json: evaluation.criterion_scores,
        url_passed: urlPassed,
        url_notes: urlNotes,
        summary_bullets: evaluation.summary_bullets,
        worth_human_attention: evaluation.worth_human_attention,
        flag_reason: evaluation.flag_reason || null,
        rejection_draft: evaluation.rejection_draft || null,
      })
      .select()
      .single();

    if (evalError) {
      return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
    }

    return NextResponse.json(evalData, { status: 201 });
  } catch (error) {
    console.error('[evaluate] Unhandled error:', error);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/evaluate/route.ts
git commit -m "feat: rewrite evaluation with calibrated 1-5 scoring and URL relevance check"
```

---

## Task 7: Update Challenge Creation UI

**Files:**
- Modify: `app/(employer)/create/page.tsx`

**Step 1: Rewrite with editable questions and criteria**

This is a larger file. Key changes:
- Add `challengeRequirements` state
- Replace `rubric` state with `questions` state
- Parse `---QUESTIONS---` delimiter instead of `---RUBRIC---`
- Add UI for editing questions and criteria (add/remove/edit)
- Save with new schema

```typescript
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { Question, Criterion } from '@/lib/types';

function generateId(): string {
  return crypto.randomUUID();
}

export default function CreateChallengePage() {
  const [roleDescription, setRoleDescription] = useState('');
  const [challengeRequirements, setChallengeRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [introText, setIntroText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedChallengeId, setSavedChallengeId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStreamedContent('');
    setIntroText('');
    setQuestions([]);
    setSavedChallengeId(null);
    setError('');

    try {
      const response = await fetch('/api/challenges/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_description: roleDescription,
          challenge_requirements: challengeRequirements || undefined,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;

        const delimiterIndex = fullText.indexOf('---QUESTIONS---');
        if (delimiterIndex !== -1) {
          setStreamedContent(fullText.substring(0, delimiterIndex).trim());
        } else {
          setStreamedContent(fullText);
        }
      }

      const delimiter = '---QUESTIONS---';
      const delimiterIndex = fullText.indexOf(delimiter);

      if (delimiterIndex === -1) {
        throw new Error('Invalid response format - missing questions delimiter');
      }

      const introPart = fullText.substring(0, delimiterIndex).trim();
      let questionsPart = fullText.substring(delimiterIndex + delimiter.length).trim();

      if (questionsPart.startsWith('```')) {
        questionsPart = questionsPart.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsedQuestions = JSON.parse(questionsPart);
      setIntroText(introPart);
      setQuestions(parsedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_description: roleDescription,
          challenge_requirements: challengeRequirements || null,
          intro_text: introText,
          questions_json: questions,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      setSavedChallengeId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
    );
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      text: '',
      order: questions.length + 1,
      word_limit: 500,
      criteria: [{ id: generateId(), text: '', order: 1 }],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const updateCriterion = (
    questionId: string,
    criterionId: string,
    updates: Partial<Criterion>
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              criteria: q.criteria.map((c) =>
                c.id === criterionId ? { ...c, ...updates } : c
              ),
            }
          : q
      )
    );
  };

  const addCriterion = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              criteria: [
                ...q.criteria,
                { id: generateId(), text: '', order: q.criteria.length + 1 },
              ],
            }
          : q
      )
    );
  };

  const removeCriterion = (questionId: string, criterionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, criteria: q.criteria.filter((c) => c.id !== criterionId) }
          : q
      )
    );
  };

  const shareableLink = savedChallengeId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${savedChallengeId}`
    : null;

  const copyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
    }
  };

  const hasGenerated = introText && questions.length > 0;

  if (savedChallengeId && shareableLink) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="text-6xl">✓</div>
          <h1 className="text-3xl font-bold text-green-600">Challenge Created!</h1>
          <p className="text-gray-600 text-lg">Share this link with candidates:</p>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg text-sm font-mono break-all">
                  {shareableLink}
                </code>
                <Button onClick={copyLink} variant="outline">
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSavedChallengeId(null);
                setIntroText('');
                setQuestions([]);
                setRoleDescription('');
                setChallengeRequirements('');
                setStreamedContent('');
              }}
            >
              Create Another
            </Button>
            <Button onClick={() => (window.location.href = '/dashboard')}>
              View Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Challenge</h1>
        <p className="text-gray-600">
          Describe the role and let AI generate evaluation questions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Description</CardTitle>
          <CardDescription>
            Describe the role, required skills, and what you&apos;re looking for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            placeholder="e.g., AI Builder role at Wealthsimple. Should be able to integrate LLMs into production applications..."
            rows={4}
            disabled={isGenerating}
          />
          <div>
            <label className="block text-sm font-medium mb-2">
              Challenge Requirements (optional)
            </label>
            <Textarea
              value={challengeRequirements}
              onChange={(e) => setChallengeRequirements(e.target.value)}
              placeholder="e.g., Should include a demo link and video walkthrough. Focus on AI product thinking."
              rows={2}
              disabled={isGenerating}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!roleDescription.trim() || isGenerating}
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate Questions'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {isGenerating && !hasGenerated && (
          <motion.div
            key="streaming"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Generating Questions...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded overflow-auto max-h-96">
                  {streamedContent || 'Starting generation...'}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {hasGenerated && (
          <motion.div
            key="generated"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
                <CardDescription>
                  This text appears at the top of the application form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Questions & Evaluation Criteria</CardTitle>
                <CardDescription>
                  Edit questions and their scoring criteria. Each criterion is scored 1-5.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((question, qIndex) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: qIndex * 0.1 }}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-lg font-bold text-gray-400">
                        Q{qIndex + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={question.text}
                          onChange={(e) =>
                            updateQuestion(question.id, { text: e.target.value })
                          }
                          placeholder="Question text"
                          rows={2}
                        />
                        <div className="flex items-center gap-4">
                          <label className="text-sm text-gray-500">
                            Word limit:
                            <Input
                              type="number"
                              value={question.word_limit}
                              onChange={(e) =>
                                updateQuestion(question.id, {
                                  word_limit: parseInt(e.target.value) || 500,
                                })
                              }
                              className="w-20 ml-2 inline-block"
                            />
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => removeQuestion(question.id)}
                          >
                            Remove Question
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="ml-8 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Evaluation Criteria:
                      </p>
                      {question.criteria.map((criterion, cIndex) => (
                        <div key={criterion.id} className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 w-6">
                            {cIndex + 1}.
                          </span>
                          <Input
                            value={criterion.text}
                            onChange={(e) =>
                              updateCriterion(question.id, criterion.id, {
                                text: e.target.value,
                              })
                            }
                            placeholder="What to evaluate in the answer"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => removeCriterion(question.id, criterion.id)}
                            disabled={question.criteria.length <= 1}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCriterion(question.id)}
                      >
                        + Add Criterion
                      </Button>
                    </div>
                  </motion.div>
                ))}

                <Button variant="outline" onClick={addQuestion}>
                  + Add Question
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving} size="lg">
                {isSaving ? 'Saving...' : 'Save Challenge'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(employer\)/create/page.tsx
git commit -m "feat: rewrite challenge creation UI with editable questions and criteria"
```

---

## Task 8: Update Candidate Application Page

**Files:**
- Modify: `app/apply/[challengeId]/page.tsx`

**Step 1: Rewrite to show questions dynamically**

Key changes:
- Display intro text
- Render each question with its word limit
- Collect answers_json instead of written_explanation
- Keep URL and video upload fields

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useUploadThing } from '@/lib/uploadthing';
import type { Challenge, Question, Answer } from '@/lib/types';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function ApplyPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { startUpload } = useUploadThing('videoUploader');

  const fetchChallenge = useCallback(async () => {
    try {
      const response = await fetch('/api/challenges');
      if (!response.ok) throw new Error('Failed to fetch');
      const challenges = await response.json();
      const found = challenges.find((c: Challenge) => c.id === challengeId);
      if (found) {
        setChallenge(found);
        // Initialize answers state
        const initialAnswers: Record<string, string> = {};
        (found.questions_json || []).forEach((q: Question) => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } else {
        setNotFound(true);
      }
    } catch {
      setError('Failed to load challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload an MP4, WebM, or MOV file.');
        return;
      }
      setVideoFile(file);
      setVideoFileName(file.name);
      setError('');
    }
  };

  const questions = (challenge?.questions_json || []) as Question[];

  const getWordCount = (questionId: string) => countWords(answers[questionId] || '');
  const getWordLimit = (question: Question) => question.word_limit || 500;
  const isOverLimit = (question: Question) =>
    getWordCount(question.id) > getWordLimit(question);

  const anyOverLimit = questions.some((q) => isOverLimit(q));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (anyOverLimit) {
      setError('One or more answers exceed the word limit. Please shorten them.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let videoPath: string | null = null;

      if (videoFile) {
        setIsUploading(true);
        const uploadResult = await startUpload([videoFile]);
        if (uploadResult && uploadResult[0]) {
          videoPath = uploadResult[0].url;
        }
        setIsUploading(false);
      }

      const answersJson: Answer[] = questions.map((q) => ({
        question_id: q.id,
        text: answers[q.id] || '',
      }));

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          candidate_name: fullName,
          demo_url: demoUrl,
          answers_json: answersJson,
          video_path: videoPath,
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Submission failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading challenge...</div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Challenge Not Found
          </h1>
          <p className="text-gray-600">
            This challenge link is invalid or has expired.
          </p>
        </motion.div>
      </main>
    );
  }

  if (error && !challenge) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Your submission is in.
              </h1>
              <p className="text-lg text-gray-600">We&apos;ll be in touch.</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {challenge?.role_description}
                </h1>
              </div>

              {challenge?.intro_text && (
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed">
                      {challenge.intro_text}
                    </p>
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="h-12"
                  />
                </div>

                {questions.map((question, index) => (
                  <div key={question.id}>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {question.text} <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={answers[question.id] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                      placeholder={`Question ${index + 1}`}
                      rows={6}
                      required
                      className={
                        isOverLimit(question)
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                    <div
                      className={`text-sm mt-2 flex justify-end ${
                        isOverLimit(question)
                          ? 'text-red-500 font-medium'
                          : 'text-gray-500'
                      }`}
                    >
                      {getWordCount(question.id)} / {getWordLimit(question)} words
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Link to your submission <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Link to your working demo, portfolio, or project
                  </p>
                  <Input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://"
                    required
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Video Walkthrough{' '}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    MP4, WebM, or MOV. Max 512MB.
                  </p>
                  <Input
                    type="file"
                    accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoChange}
                    className="h-12"
                  />
                  {videoFileName && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {videoFileName}
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-700 p-4 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isSubmitting || anyOverLimit}
                >
                  {isUploading
                    ? 'Uploading video...'
                    : isSubmitting
                    ? 'Submitting...'
                    : 'Submit'}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add app/apply/\[challengeId\]/page.tsx
git commit -m "feat: update apply page to render dynamic questions"
```

---

## Task 9: Update Dashboard Page

**Files:**
- Modify: `app/(employer)/dashboard/page.tsx`

**Step 1: Update to show 1-5 scores, URL status, and answers**

Key changes:
- Show average score (1-5) in submissions table
- Show URL pass/fail status
- Display criterion scores (1-5) instead of 0-100 rubric scores
- Show candidate answers per question

This is a larger update. The full replacement file shows:
- Average score calculated from criterion_scores_json
- URL status with checkmark/X
- Expanded view shows questions with answers and per-criterion scores

```typescript
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  Challenge,
  SubmissionWithEvaluation,
  CriterionScore,
  Question,
  Answer,
} from '@/lib/types';

function calculateAverageScore(scores: CriterionScore[]): number {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

export default function DashboardPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingRejection, setGeneratingRejection] = useState<string | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges');
      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchChallenges(), fetchSubmissions()]);
      setLoading(false);
    };
    loadData();
    const interval = setInterval(fetchSubmissions, 10000);
    return () => clearInterval(interval);
  }, []);

  const copyApplyLink = (challengeId: string) => {
    const link = `${window.location.origin}/apply/${challengeId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(challengeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateRejection = async (submissionId: string) => {
    setGeneratingRejection(submissionId);
    try {
      const response = await fetch('/api/reject-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId }),
      });
      const data = await response.json();

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId && s.evaluation
            ? {
                ...s,
                evaluation: { ...s.evaluation, rejection_draft: data.rejection_draft },
              }
            : s
        )
      );
    } catch (error) {
      console.error('Failed to generate rejection:', error);
    } finally {
      setGeneratingRejection(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Challenges Section */}
      <div>
        <h1 className="text-2xl font-bold">Your Challenges</h1>
        <p className="text-gray-600 mb-4">Share these links with candidates.</p>

        {challenges.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No challenges yet.{' '}
              <a href="/create" className="text-blue-600 hover:underline">
                Create your first challenge
              </a>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-2">
                    {challenge.role_description}
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(challenge.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => copyApplyLink(challenge.id)}
                  >
                    {copiedId === challenge.id ? 'Copied!' : 'Copy Apply Link'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submissions Section */}
      <div>
        <h2 className="text-xl font-bold">Submissions</h2>
        <p className="text-gray-600 mb-4">
          Review candidate submissions and AI evaluations.
        </p>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No submissions yet. Share challenge links with candidates to get
              started.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Challenge</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const avgScore = submission.evaluation
                    ? calculateAverageScore(
                        submission.evaluation.criterion_scores_json as CriterionScore[]
                      )
                    : null;

                  return (
                    <TableRow
                      key={submission.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        setExpandedId(
                          expandedId === submission.id ? null : submission.id
                        )
                      }
                    >
                      <TableCell className="font-medium">
                        {submission.candidate_name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {submission.challenge?.role_description || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {avgScore !== null ? (
                          <Badge
                            variant={
                              avgScore >= 4
                                ? 'default'
                                : avgScore >= 3
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {avgScore}/5
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.evaluation ? (
                          submission.evaluation.url_passed ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.evaluation ? (
                          submission.evaluation.worth_human_attention ? (
                            <Badge variant="default">Review</Badge>
                          ) : (
                            <Badge variant="secondary">Evaluated</Badge>
                          )
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          {expandedId === submission.id ? '▲' : '▼'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        <AnimatePresence>
          {expandedId && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              {(() => {
                const submission = submissions.find((s) => s.id === expandedId);
                if (!submission) return null;

                const questions = (submission.challenge?.questions_json ||
                  []) as Question[];
                const answers = (submission.answers_json || []) as Answer[];
                const criterionScores = (submission.evaluation
                  ?.criterion_scores_json || []) as CriterionScore[];

                return (
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      {/* URL and Video */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-semibold mb-2">Demo URL</h4>
                          <a
                            href={submission.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {submission.demo_url}
                          </a>
                          {submission.evaluation && (
                            <p className="text-sm text-gray-500 mt-1">
                              {submission.evaluation.url_notes}
                            </p>
                          )}
                        </div>
                        {submission.video_path && (
                          <div>
                            <h4 className="font-semibold mb-2">Video</h4>
                            <a
                              href={submission.video_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Video
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Questions and Answers with Scores */}
                      <div className="space-y-6">
                        <h4 className="font-semibold">Questions & Answers</h4>
                        {questions.map((question) => {
                          const answer = answers.find(
                            (a) => a.question_id === question.id
                          );
                          const questionScores = criterionScores.filter(
                            (s) => s.question_id === question.id
                          );

                          return (
                            <div
                              key={question.id}
                              className="border rounded-lg p-4 space-y-3"
                            >
                              <p className="font-medium text-gray-900">
                                {question.text}
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {answer?.text || '(No answer)'}
                              </p>

                              {questionScores.length > 0 && (
                                <div className="pt-2 border-t space-y-2">
                                  <p className="text-xs font-medium text-gray-500 uppercase">
                                    Evaluation
                                  </p>
                                  {questionScores.map((score) => {
                                    const criterion = question.criteria.find(
                                      (c) => c.id === score.criterion_id
                                    );
                                    return (
                                      <div
                                        key={score.criterion_id}
                                        className="flex items-start gap-3"
                                      >
                                        <Badge
                                          variant={
                                            score.score >= 4
                                              ? 'default'
                                              : score.score >= 3
                                              ? 'secondary'
                                              : 'destructive'
                                          }
                                          className="shrink-0"
                                        >
                                          {score.score}/5
                                        </Badge>
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            {criterion?.text || 'Criterion'}:
                                          </span>{' '}
                                          <span className="text-gray-600">
                                            {score.reasoning}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {submission.evaluation && (
                        <>
                          {/* Summary */}
                          <div>
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <ul className="list-disc list-inside text-sm text-gray-700">
                              {submission.evaluation.summary_bullets.map(
                                (bullet, i) => (
                                  <li key={i}>{bullet}</li>
                                )
                              )}
                            </ul>
                          </div>

                          {/* Flag Reason */}
                          {submission.evaluation.flag_reason && (
                            <div className="bg-yellow-50 p-3 rounded">
                              <h4 className="font-semibold text-yellow-800">
                                Flag Reason
                              </h4>
                              <p className="text-sm text-yellow-700">
                                {submission.evaluation.flag_reason}
                              </p>
                            </div>
                          )}

                          {/* Rejection Draft */}
                          <div>
                            <div className="flex items-center gap-4 mb-2">
                              <h4 className="font-semibold">Rejection Draft</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateRejection(submission.id);
                                }}
                                disabled={generatingRejection === submission.id}
                              >
                                {generatingRejection === submission.id
                                  ? 'Generating...'
                                  : 'Regenerate'}
                              </Button>
                            </div>
                            {submission.evaluation.rejection_draft && (
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded border">
                                {submission.evaluation.rejection_draft}
                              </pre>
                            )}
                          </div>
                        </>
                      )}

                      {!submission.evaluation && (
                        <div className="text-center py-4 text-gray-500">
                          Evaluation in progress...
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(employer\)/dashboard/page.tsx
git commit -m "feat: update dashboard to show 1-5 scores, URL status, and question answers"
```

---

## Task 10: Update Rejection Draft API

**Files:**
- Modify: `app/api/reject-draft/route.ts`

**Step 1: Read current file and update for new schema**

The rejection draft API needs to work with the new evaluation schema.

**Step 2: Update implementation**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Evaluation } from '@/lib/types';

export async function POST(request: Request) {
  const { submission_id } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
  }

  const { data: submission, error } = await supabaseAdmin
    .from('submissions')
    .select('*, evaluation:evaluations(*), challenge:challenges(*)')
    .eq('id', submission_id)
    .single();

  if (error || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const evaluation = Array.isArray(submission.evaluation)
    ? submission.evaluation[0]
    : submission.evaluation;

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  const typedEvaluation = evaluation as Evaluation;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `You write polite, professional rejection emails. Be brief, kind, and constructive.`,
    messages: [
      {
        role: 'user',
        content: `Write a rejection email for ${submission.candidate_name}.

Summary of their submission:
${typedEvaluation.summary_bullets.join('\n')}

${typedEvaluation.flag_reason ? `Additional context: ${typedEvaluation.flag_reason}` : ''}

Keep it under 150 words. Be encouraging but honest.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 });
  }

  // Update the evaluation with new rejection draft
  await supabaseAdmin
    .from('evaluations')
    .update({ rejection_draft: content.text })
    .eq('id', typedEvaluation.id);

  return NextResponse.json({ rejection_draft: content.text });
}
```

**Step 3: Commit**

```bash
git add app/api/reject-draft/route.ts
git commit -m "feat: update rejection draft API for new evaluation schema"
```

---

## Task 11: Integration Testing

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test challenge creation flow**

1. Navigate to `/create`
2. Enter role description and optional requirements
3. Click "Generate Questions"
4. Verify questions and criteria appear
5. Edit a question and criterion
6. Add a new question
7. Remove a criterion
8. Save challenge
9. Verify shareable link works

**Step 3: Test candidate submission flow**

1. Open the shareable link
2. Verify intro text and questions display
3. Fill out all fields
4. Submit
5. Verify success message

**Step 4: Test evaluation and dashboard**

1. Navigate to `/dashboard`
2. Wait for evaluation to complete (10 second polling)
3. Verify average score displays
4. Verify URL status (checkmark/X)
5. Expand submission
6. Verify questions, answers, and criterion scores display
7. Verify summary bullets
8. Test rejection draft regeneration

**Step 5: Commit test results**

If all tests pass, create final commit:

```bash
git add .
git commit -m "test: verify question-based evaluation system works end-to-end"
```

---

## Summary

This plan implements the LLM evaluation redesign with:

1. **New data model** — Questions with criteria replace fixed rubric
2. **Editable criteria** — Employers can add/remove/edit questions and criteria
3. **Calibrated 1-5 scoring** — Clear scale with prompts to avoid "never gives 5"
4. **URL pass/fail** — Fetches content and AI checks relevance
5. **Updated UI** — Challenge creation, candidate application, and dashboard all updated

Total: 11 tasks covering types, database, APIs, and UI components.
