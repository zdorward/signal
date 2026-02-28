# Signal App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI-powered hiring challenge platform where employers create challenges, candidates submit demos, and AI evaluates submissions.

**Architecture:** Next.js 14 App Router with route handlers for API, Supabase for persistence, Claude for AI generation/evaluation, Uploadthing for video uploads. No auth for MVP.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion, Supabase JS, Anthropic SDK, Uploadthing

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `.env.local`

**Step 1: Create Next.js app with TypeScript and Tailwind**

```bash
cd /Users/zackdorward/dev/signal
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Expected: Project scaffolded with Next.js 14, TypeScript, Tailwind, App Router

**Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @anthropic-ai/sdk framer-motion uploadthing @uploadthing/react
```

Expected: Dependencies added to package.json

**Step 3: Create .env.local with placeholder keys**

Create file `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-placeholder
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_KEY=placeholder-service-key
UPLOADTHING_SECRET=sk-placeholder
UPLOADTHING_APP_ID=placeholder-app-id
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with dependencies"
```

---

## Task 2: Set Up shadcn/ui

**Files:**
- Create: `components.json`
- Modify: `tailwind.config.ts`
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/table.tsx`
- Create: `lib/utils.ts`

**Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Select: New York style, Zinc color, CSS variables yes

**Step 2: Add required components**

```bash
npx shadcn@latest add button card input textarea badge table
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: configure shadcn/ui with required components"
```

---

## Task 3: Create TypeScript Types

**Files:**
- Create: `lib/types.ts`

**Step 1: Create types file**

Create file `lib/types.ts`:
```typescript
export interface RubricItem {
  criterion: string;
  weight: number;
  description: string;
}

export interface RubricScore {
  criterion: string;
  score: number;
  reasoning: string;
}

export interface Challenge {
  id: string;
  role_description: string;
  challenge_text: string;
  rubric_json: RubricItem[];
  created_at: string;
}

export interface Submission {
  id: string;
  challenge_id: string;
  candidate_name: string;
  demo_url: string;
  written_explanation: string;
  video_path: string | null;
  created_at: string;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  rubric_scores_json: RubricScore[];
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

**Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 4: Create Supabase Client

**Files:**
- Create: `lib/supabase.ts`

**Step 1: Create Supabase client file**

Create file `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;
```

**Step 2: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add Supabase client configuration"
```

---

## Task 5: Create Anthropic Client

**Files:**
- Create: `lib/anthropic.ts`

**Step 1: Create Anthropic client file**

Create file `lib/anthropic.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

**Step 2: Commit**

```bash
git add lib/anthropic.ts
git commit -m "feat: add Anthropic client configuration"
```

---

## Task 6: Configure Uploadthing

**Files:**
- Create: `lib/uploadthing.ts`
- Create: `app/api/uploadthing/core.ts`
- Create: `app/api/uploadthing/route.ts`

**Step 1: Create Uploadthing file router**

Create file `app/api/uploadthing/core.ts`:
```typescript
import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  videoUploader: f({ video: { maxFileSize: '512MB', maxFileCount: 1 } })
    .onUploadComplete(async ({ file }) => {
      console.log('Upload complete:', file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

**Step 2: Create Uploadthing route handler**

Create file `app/api/uploadthing/route.ts`:
```typescript
import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

**Step 3: Create Uploadthing React helpers**

Create file `lib/uploadthing.ts`:
```typescript
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
```

**Step 4: Commit**

```bash
git add app/api/uploadthing lib/uploadthing.ts
git commit -m "feat: configure Uploadthing for video uploads"
```

---

## Task 7: Create Supabase Schema File

**Files:**
- Create: `supabase/schema.sql`

**Step 1: Create schema file**

```bash
mkdir -p supabase
```

Create file `supabase/schema.sql`:
```sql
-- Signal App Database Schema
-- Run this in your Supabase SQL Editor

-- challenges: Job challenges created by employers
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_description TEXT NOT NULL,
  challenge_text TEXT NOT NULL,
  rubric_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- submissions: Candidate responses to challenges
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  demo_url TEXT NOT NULL,
  written_explanation TEXT NOT NULL,
  video_path TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- evaluations: AI evaluation results
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  rubric_scores_json JSONB NOT NULL,
  summary_bullets TEXT[] NOT NULL,
  worth_human_attention BOOLEAN NOT NULL,
  flag_reason TEXT,
  rejection_draft TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX idx_evaluations_submission_id ON evaluations(submission_id);
```

**Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase database schema"
```

---

## Task 8: Create Challenges API Route

**Files:**
- Create: `app/api/challenges/route.ts`

**Step 1: Create challenges route handler**

Create file `app/api/challenges/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { Challenge, RubricItem } from '@/lib/types';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Challenge[]);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { role_description, challenge_text, rubric_json } = body as {
    role_description: string;
    challenge_text: string;
    rubric_json: RubricItem[];
  };

  if (!role_description || !challenge_text || !rubric_json) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('challenges')
    .insert({ role_description, challenge_text, rubric_json })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Challenge, { status: 201 });
}
```

**Step 2: Commit**

```bash
git add app/api/challenges/route.ts
git commit -m "feat: add challenges CRUD API route"
```

---

## Task 9: Create Challenge Generation API Route

**Files:**
- Create: `app/api/challenges/generate/route.ts`

**Step 1: Create generation route with streaming**

Create file `app/api/challenges/generate/route.ts`:
```typescript
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
```

**Step 2: Commit**

```bash
git add app/api/challenges/generate/route.ts
git commit -m "feat: add streaming challenge generation API"
```

---

## Task 10: Create Submissions API Route

**Files:**
- Create: `app/api/submissions/route.ts`

**Step 1: Create submissions route handler**

Create file `app/api/submissions/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { SubmissionWithEvaluation } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get('challenge_id');

  let query = supabaseAdmin
    .from('submissions')
    .select(`
      *,
      evaluation:evaluations(*),
      challenge:challenges(*)
    `)
    .order('created_at', { ascending: false });

  if (challengeId) {
    query = query.eq('challenge_id', challengeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    evaluation: Array.isArray(row.evaluation) ? row.evaluation[0] || null : row.evaluation,
    challenge: Array.isArray(row.challenge) ? row.challenge[0] || null : row.challenge,
  })) as SubmissionWithEvaluation[];

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { challenge_id, candidate_name, demo_url, written_explanation, video_path } = body;

  if (!challenge_id || !candidate_name || !demo_url || !written_explanation) {
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
      written_explanation,
      video_path: video_path || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget evaluation - don't await
  const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
  fetch(`${baseUrl}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: data.id }),
  }).catch(console.error);

  return NextResponse.json(data, { status: 201 });
}
```

**Step 2: Commit**

```bash
git add app/api/submissions/route.ts
git commit -m "feat: add submissions API with async evaluation trigger"
```

---

## Task 11: Create Evaluate API Route

**Files:**
- Create: `app/api/evaluate/route.ts`

**Step 1: Create evaluation route**

Create file `app/api/evaluate/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Challenge, Submission, RubricItem } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { submission_id } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
  }

  // Fetch submission with challenge
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
  const rubric = typedChallenge.rubric_json as RubricItem[];

  const systemPrompt = `You are an expert technical evaluator. Evaluate the candidate's submission against the provided rubric.

For each criterion, provide:
- score: 0-100
- reasoning: Brief explanation

Also provide:
- summary_bullets: 3-5 key takeaways
- worth_human_attention: true if promising candidate, false if clear reject
- flag_reason: If flagged, explain why (null otherwise)
- rejection_draft: A polite, constructive rejection email (always include)

Respond with valid JSON matching this schema:
{
  "rubric_scores_json": [{"criterion": "...", "score": 85, "reasoning": "..."}],
  "summary_bullets": ["Point 1", "Point 2"],
  "worth_human_attention": true,
  "flag_reason": null,
  "rejection_draft": "Dear candidate..."
}`;

  const userPrompt = `## Challenge
${typedChallenge.challenge_text}

## Rubric
${rubric.map((r) => `- ${r.criterion} (${r.weight}%): ${r.description}`).join('\n')}

## Candidate Submission
Name: ${typedSubmission.candidate_name}
Demo URL: ${typedSubmission.demo_url}
${typedSubmission.video_path ? `Video: ${typedSubmission.video_path}` : ''}

Written Explanation:
${typedSubmission.written_explanation}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 });
  }

  let evaluation;
  try {
    evaluation = JSON.parse(content.text);
  } catch {
    return NextResponse.json({ error: 'Failed to parse evaluation' }, { status: 500 });
  }

  const { data: evalData, error: evalError } = await supabaseAdmin
    .from('evaluations')
    .insert({
      submission_id,
      rubric_scores_json: evaluation.rubric_scores_json,
      summary_bullets: evaluation.summary_bullets,
      worth_human_attention: evaluation.worth_human_attention,
      flag_reason: evaluation.flag_reason,
      rejection_draft: evaluation.rejection_draft,
    })
    .select()
    .single();

  if (evalError) {
    return NextResponse.json({ error: evalError.message }, { status: 500 });
  }

  return NextResponse.json(evalData, { status: 201 });
}
```

**Step 2: Commit**

```bash
git add app/api/evaluate/route.ts
git commit -m "feat: add AI evaluation API route"
```

---

## Task 12: Create Reject Draft API Route

**Files:**
- Create: `app/api/reject-draft/route.ts`

**Step 1: Create reject draft route**

Create file `app/api/reject-draft/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Evaluation, Submission, Challenge } from '@/lib/types';

export async function POST(request: Request) {
  const { submission_id } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
  }

  // Fetch submission with evaluation and challenge
  const { data: submission, error } = await supabaseAdmin
    .from('submissions')
    .select(`
      *,
      evaluation:evaluations(*),
      challenge:challenges(*)
    `)
    .eq('id', submission_id)
    .single();

  if (error || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const evaluation = Array.isArray(submission.evaluation)
    ? submission.evaluation[0]
    : submission.evaluation;
  const challenge = Array.isArray(submission.challenge)
    ? submission.challenge[0]
    : submission.challenge;

  const typedSubmission = submission as unknown as Submission;
  const typedEvaluation = evaluation as Evaluation | null;
  const typedChallenge = challenge as Challenge | null;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You write polite, constructive rejection emails for job candidates. Be kind but honest. Keep it brief (3-4 paragraphs). Don't be generic - reference specific aspects of their submission.`,
    messages: [
      {
        role: 'user',
        content: `Write a rejection email for this candidate:

Name: ${typedSubmission.candidate_name}
Role: ${typedChallenge?.role_description || 'Unknown role'}
${typedEvaluation ? `Evaluation summary: ${typedEvaluation.summary_bullets.join(', ')}` : ''}
${typedEvaluation?.flag_reason ? `Main concern: ${typedEvaluation.flag_reason}` : ''}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 });
  }

  return NextResponse.json({ rejection_draft: content.text });
}
```

**Step 2: Commit**

```bash
git add app/api/reject-draft/route.ts
git commit -m "feat: add rejection draft generation API"
```

---

## Task 13: Create Root Layout and Landing Page

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**Step 1: Update root layout**

Replace `app/layout.tsx` contents:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Signal - AI-Powered Hiring Challenges',
  description: 'Create challenges, evaluate candidates, hire smarter.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Step 2: Update landing page**

Replace `app/page.tsx` contents:
```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Signal</h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-powered hiring challenges that surface top candidates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>For Employers</CardTitle>
              <CardDescription>
                Create challenges and review candidate submissions.
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 space-y-2">
              <Link href="/create" className="block">
                <Button className="w-full">Create Challenge</Button>
              </Link>
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Candidates</CardTitle>
              <CardDescription>
                Access your challenge link from the employer.
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <p className="text-sm text-gray-500">
                You&apos;ll receive a unique link to submit your work.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
```

**Step 3: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: add root layout and landing page"
```

---

## Task 14: Create Employer Layout

**Files:**
- Create: `app/(employer)/layout.tsx`

**Step 1: Create employer layout**

```bash
mkdir -p app/\(employer\)
```

Create file `app/(employer)/layout.tsx`:
```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Signal
          </Link>
          <nav className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/create">
              <Button variant="ghost">Create Challenge</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "app/(employer)/layout.tsx"
git commit -m "feat: add employer layout with navigation"
```

---

## Task 15: Create Challenge Creation Page

**Files:**
- Create: `app/(employer)/create/page.tsx`

**Step 1: Create the create page**

```bash
mkdir -p app/\(employer\)/create
```

Create file `app/(employer)/create/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { RubricItem } from '@/lib/types';

export default function CreateChallengePage() {
  const router = useRouter();
  const [roleDescription, setRoleDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [challengeText, setChallengeText] = useState('');
  const [rubric, setRubric] = useState<RubricItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStreamedContent('');
    setError('');

    try {
      const response = await fetch('/api/challenges/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_description: roleDescription }),
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
        setStreamedContent(fullText);
      }

      // Parse the final JSON
      const parsed = JSON.parse(fullText);
      setChallengeText(parsed.challenge_text);
      setRubric(parsed.rubric_json);
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
          challenge_text: challengeText,
          rubric_json: rubric,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      router.push(`/dashboard?created=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const hasGenerated = challengeText && rubric.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Challenge</h1>
        <p className="text-gray-600">Describe the role and let AI generate the challenge.</p>
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
            placeholder="e.g., Senior Frontend Engineer with React and TypeScript experience. Should be able to build responsive UIs, work with REST APIs, and write clean, maintainable code..."
            rows={6}
            disabled={isGenerating}
          />
          <Button
            onClick={handleGenerate}
            disabled={!roleDescription.trim() || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Challenge'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      <AnimatePresence>
        {(isGenerating || hasGenerated) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {isGenerating && !hasGenerated && (
              <Card>
                <CardContent className="pt-6">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded">
                    {streamedContent || 'Starting generation...'}
                  </pre>
                </CardContent>
              </Card>
            )}

            {hasGenerated && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Challenge Text</CardTitle>
                    <CardDescription>Edit if needed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={challengeText}
                      onChange={(e) => setChallengeText(e.target.value)}
                      rows={8}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Rubric</CardTitle>
                    <CardDescription>
                      Criteria for evaluating submissions (weights sum to 100)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {rubric.map((item, index) => (
                        <motion.div
                          key={item.criterion}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-base">
                                  {item.criterion}
                                </CardTitle>
                                <span className="text-sm font-semibold text-blue-600">
                                  {item.weight}%
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600">
                                {item.description}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Challenge'}
                  </Button>
                  <Button variant="outline" onClick={handleGenerate}>
                    Regenerate
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "app/(employer)/create/page.tsx"
git commit -m "feat: add challenge creation page with streaming AI generation"
```

---

## Task 16: Create Dashboard Page

**Files:**
- Create: `app/(employer)/dashboard/page.tsx`

**Step 1: Create the dashboard page**

```bash
mkdir -p app/\(employer\)/dashboard
```

Create file `app/(employer)/dashboard/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SubmissionWithEvaluation, RubricScore } from '@/lib/types';

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingRejection, setGeneratingRejection] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
    // Poll for new evaluations every 10 seconds
    const interval = setInterval(fetchSubmissions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
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

      // Update the submission with the new rejection draft
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId && s.evaluation
            ? { ...s, evaluation: { ...s.evaluation, rejection_draft: data.rejection_draft } }
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
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submissions Dashboard</h1>
        <p className="text-gray-600">Review candidate submissions and AI evaluations.</p>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No submissions yet. Share challenge links with candidates to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attention</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <>
                  <TableRow
                    key={submission.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      setExpandedId(expandedId === submission.id ? null : submission.id)
                    }
                  >
                    <TableCell className="font-medium">
                      {submission.candidate_name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {submission.challenge?.role_description || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {new Date(submission.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {submission.evaluation ? (
                        <Badge variant="default">Evaluated</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.evaluation?.worth_human_attention && (
                        <Badge variant="destructive">Review</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        {expandedId === submission.id ? '▲' : '▼'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <AnimatePresence>
                    {expandedId === submission.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 bg-gray-50 space-y-4">
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

                              <div>
                                <h4 className="font-semibold mb-2">Written Explanation</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {submission.written_explanation}
                                </p>
                              </div>

                              {submission.evaluation && (
                                <>
                                  <div>
                                    <h4 className="font-semibold mb-2">Rubric Scores</h4>
                                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                      {(submission.evaluation.rubric_scores_json as RubricScore[]).map(
                                        (score) => (
                                          <Card key={score.criterion}>
                                            <CardHeader className="py-3">
                                              <div className="flex justify-between">
                                                <CardTitle className="text-sm">
                                                  {score.criterion}
                                                </CardTitle>
                                                <Badge
                                                  variant={
                                                    score.score >= 70
                                                      ? 'default'
                                                      : score.score >= 50
                                                      ? 'secondary'
                                                      : 'destructive'
                                                  }
                                                >
                                                  {score.score}
                                                </Badge>
                                              </div>
                                            </CardHeader>
                                            <CardContent className="py-2">
                                              <p className="text-xs text-gray-600">
                                                {score.reasoning}
                                              </p>
                                            </CardContent>
                                          </Card>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-2">Summary</h4>
                                    <ul className="list-disc list-inside text-sm text-gray-700">
                                      {submission.evaluation.summary_bullets.map((bullet, i) => (
                                        <li key={i}>{bullet}</li>
                                      ))}
                                    </ul>
                                  </div>

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
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "app/(employer)/dashboard/page.tsx"
git commit -m "feat: add employer dashboard with submission review"
```

---

## Task 17: Create Candidate Application Page

**Files:**
- Create: `app/apply/[challengeId]/page.tsx`

**Step 1: Create the apply page**

```bash
mkdir -p app/apply/\[challengeId\]
```

Create file `app/apply/[challengeId]/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUploadThing } from '@/lib/uploadthing';
import type { Challenge } from '@/lib/types';

export default function ApplyPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [candidateName, setCandidateName] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [writtenExplanation, setWrittenExplanation] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { startUpload } = useUploadThing('videoUploader');

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      const response = await fetch('/api/challenges');
      const challenges = await response.json();
      const found = challenges.find((c: Challenge) => c.id === challengeId);
      if (found) {
        setChallenge(found);
      } else {
        setError('Challenge not found');
      }
    } catch {
      setError('Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          candidate_name: candidateName,
          demo_url: demoUrl,
          written_explanation: writtenExplanation,
          video_path: videoPath,
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading challenge...
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-6xl">✓</div>
              <h1 className="text-2xl font-bold text-green-600">
                Submission Received!
              </h1>
              <p className="text-gray-600">
                Thank you for your submission. The hiring team will review your work
                and get back to you.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{challenge?.role_description}</CardTitle>
                  <CardDescription>Read the challenge carefully before submitting.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{challenge?.challenge_text}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Submission</CardTitle>
                  <CardDescription>
                    Fill out all required fields. Video is optional but recommended.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Your Name *
                      </label>
                      <Input
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Demo URL *
                      </label>
                      <Input
                        type="url"
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        placeholder="https://your-demo.vercel.app"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Written Explanation *
                      </label>
                      <Textarea
                        value={writtenExplanation}
                        onChange={(e) => setWrittenExplanation(e.target.value)}
                        placeholder="Explain your approach, design decisions, and any trade-offs you made..."
                        rows={6}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Video Walkthrough (optional)
                      </label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max 512MB. Show us your demo in action!
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isUploading
                        ? 'Uploading video...'
                        : isSubmitting
                        ? 'Submitting...'
                        : 'Submit Application'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
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
git add "app/apply/[challengeId]/page.tsx"
git commit -m "feat: add candidate application page with video upload"
```

---

## Task 18: Verify App Runs

**Step 1: Run the development server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

**Step 2: Test in browser**

Open http://localhost:3000 and verify:
- Landing page loads without errors
- Navigation works
- /create page loads
- /dashboard page loads

**Step 3: Fix any TypeScript or lint errors**

```bash
npm run lint
npm run build
```

Expected: No errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify app runs cleanly"
```

---

## Summary

**Total Tasks:** 18

**Files Created:**
- `.env.local` - Environment variables
- `lib/types.ts` - TypeScript interfaces
- `lib/supabase.ts` - Supabase client
- `lib/anthropic.ts` - Anthropic client
- `lib/uploadthing.ts` - Uploadthing helpers
- `app/api/uploadthing/core.ts` - File router
- `app/api/uploadthing/route.ts` - Upload handler
- `app/api/challenges/route.ts` - Challenges CRUD
- `app/api/challenges/generate/route.ts` - AI generation
- `app/api/submissions/route.ts` - Submissions CRUD
- `app/api/evaluate/route.ts` - AI evaluation
- `app/api/reject-draft/route.ts` - Rejection drafts
- `app/(employer)/layout.tsx` - Employer layout
- `app/(employer)/create/page.tsx` - Create challenge
- `app/(employer)/dashboard/page.tsx` - Dashboard
- `app/apply/[challengeId]/page.tsx` - Candidate form
- `supabase/schema.sql` - Database schema

**Key Commands:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Check for lint errors
