# Signal

AI-powered candidate evaluation platform. Proof of work is the only reliable signal left.

## What it does

Signal helps employers evaluate candidates based on actual work, not resumes. Candidates submit:
- Written responses to custom questions
- A demo URL showing their work
- A video walkthrough explaining their solution

The platform uses AI to evaluate submissions against employer-defined criteria, verify URLs, and analyze video demos. Candidates are automatically triaged into Priority, Maybe, or Skip with draft emails generated.

## Tech Stack

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui

**Backend:** Supabase (PostgreSQL), UploadThing (video storage)

**AI Services:**
- Claude Sonnet 4 (text evaluation + vision)
- Whisper (audio transcription)

**Infrastructure:** Vercel (web app) + Railway (video processing with FFmpeg)

## Architecture

```
Candidate submits → Vercel (Next.js)
                      ↓
              Written answers → Claude (evaluation)
              Demo URL → Fetch + Claude (verification)
              Video → Railway (FFmpeg + Whisper + Claude Vision)
                      ↓
              Supabase (store results)
                      ↓
              Employer dashboard (triaged candidates)
```

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase, Anthropic, OpenAI, and UploadThing keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
UPLOADTHING_TOKEN=
VIDEO_EVAL_URL=        # Railway URL for video processing
```

## License

MIT
