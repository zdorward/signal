# Signal App Design

## Overview

Signal is a hiring tool that lets employers create AI-generated coding challenges, receive candidate submissions with video demos, and get AI-powered evaluations that surface the most promising candidates.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui (default theme)
- Framer Motion (streaming animations, transitions)
- Supabase (database + JS client)
- Anthropic SDK (Claude for evaluation + generation)
- Uploadthing (video uploads, video only)

## Key Decisions

- No auth for MVP
- Route handlers + direct Supabase client
- Video upload optional (nullable)
- Async evaluation (fire-and-forget, don't block candidate)
- AI-generated challenges with streaming display
- Weighted rubric criteria (weights sum to 100)

## Project Structure

```
signal/
├── app/
│   ├── (employer)/
│   │   ├── dashboard/page.tsx    # Review submissions list
│   │   ├── create/page.tsx       # Create challenge (AI-generated)
│   │   └── layout.tsx            # Shared employer layout
│   ├── apply/[challengeId]/page.tsx  # Candidate submission form
│   ├── api/
│   │   ├── challenges/
│   │   │   ├── route.ts          # GET (list), POST (save)
│   │   │   └── generate/route.ts # POST (stream AI generation)
│   │   ├── submissions/route.ts  # GET (list), POST (create + async eval)
│   │   ├── evaluate/route.ts     # POST (AI evaluation, internal)
│   │   └── reject-draft/route.ts # POST (generate rejection email)
│   ├── layout.tsx
│   ├── page.tsx                  # Landing page
│   └── globals.css
├── components/ui/                # shadcn/ui components
├── lib/
│   ├── supabase.ts               # Supabase client setup
│   ├── anthropic.ts              # Anthropic client setup
│   ├── uploadthing.ts            # Uploadthing config
│   └── types.ts                  # Shared TypeScript interfaces
├── .env.local
└── package.json
```

## Database Schema

```sql
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
```

## TypeScript Types

```typescript
interface RubricItem {
  criterion: string;
  weight: number;
  description: string;
}

interface RubricScore {
  criterion: string;
  score: number;        // 0-100
  reasoning: string;
}

interface Challenge {
  id: string;
  role_description: string;
  challenge_text: string;
  rubric_json: RubricItem[];
  created_at: string;
}

interface Submission {
  id: string;
  challenge_id: string;
  candidate_name: string;
  demo_url: string;
  written_explanation: string;
  video_path: string | null;
  created_at: string;
}

interface Evaluation {
  id: string;
  submission_id: string;
  rubric_scores_json: RubricScore[];
  summary_bullets: string[];
  worth_human_attention: boolean;
  flag_reason: string | null;
  rejection_draft: string | null;
  created_at: string;
}
```

## API Routes

### GET/POST /api/challenges
- GET: List all challenges
- POST: Save a reviewed challenge (role_description, challenge_text, rubric_json)

### POST /api/challenges/generate
- Takes role_description
- Streams AI-generated challenge_text + rubric_json
- maxDuration: 60s for Vercel

### GET/POST /api/submissions
- GET: List submissions with evaluations (joined), optional challenge_id filter
- POST: Create submission, fire-and-forget call to /api/evaluate, return success immediately

### POST /api/evaluate
- Internal route (called by submissions POST)
- Takes submission_id, fetches submission + challenge
- Calls Claude with rubric, saves evaluation
- maxDuration: 60s for Vercel

### POST /api/reject-draft
- Takes submission_id
- Fetches evaluation, generates polite rejection email via Claude

## Page Designs

### /dashboard (Employer)
- Table of submissions with evaluations
- Columns: candidate name, challenge, date, evaluation status
- Expandable rows for rubric scores, summary bullets, flags
- "Generate Rejection" button per row
- shadcn/ui: Table, Card, Badge, Button

### /create (Employer)
- Single textarea for role description
- "Generate Challenge" button streams AI output
- Real-time streaming display (magic moment)
- After generation: editable challenge text, rubric as readable cards
- "Save Challenge" button
- Framer Motion for streaming animations

### /apply/[challengeId] (Candidate)
- Displays challenge details (role + challenge text)
- Form: name, demo URL, written explanation, optional video
- Uploadthing for video upload
- Success state after submission
- Framer Motion for transitions

### / (Landing)
- Simple links to dashboard and create pages

## Data Flow

### Challenge Creation
1. Employer enters role description
2. Clicks "Generate Challenge"
3. POST /api/challenges/generate streams response
4. Employer reviews/edits
5. POST /api/challenges saves final version

### Candidate Submission
1. Candidate fills form on /apply/[challengeId]
2. POST /api/submissions saves submission
3. Returns success immediately (async eval)
4. Fire-and-forget: POST /api/evaluate runs
5. Evaluation saved when complete

### Employer Review
1. Dashboard fetches submissions + evaluations
2. Shows pending/complete evaluation status
3. Employer can generate rejection drafts
