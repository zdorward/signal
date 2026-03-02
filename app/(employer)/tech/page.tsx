import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TechPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground uppercase tracking-wider">
          Technical Architecture
        </h1>
        <p className="text-muted-foreground">
          How Signal evaluates candidates using AI-powered analysis.
        </p>
        <a
          href="https://github.com/zdorward/signal"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            View Source Code
          </Button>
        </a>
      </div>

      {/* Tech Stack */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">
          Tech Stack
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Frontend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Framework</span>
                <span className="text-foreground">Next.js 14 (App Router)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="text-foreground">TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Styling</span>
                <span className="text-foreground">Tailwind CSS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Components</span>
                <span className="text-foreground">shadcn/ui</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Backend & Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database</span>
                <span className="text-foreground">Supabase (PostgreSQL)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Storage</span>
                <span className="text-foreground">UploadThing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hosting</span>
                <span className="text-foreground">Vercel + Railway</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Video Processing</span>
                <span className="text-foreground">FFmpeg (Railway)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                AI Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Text Evaluation</span>
                <span className="text-foreground">Claude Sonnet 4 (Anthropic)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Video Analysis</span>
                <span className="text-foreground">Claude Sonnet 4 (Vision)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Audio Transcription</span>
                <span className="text-foreground">Whisper (OpenAI)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Evaluation Pipeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">
          AI Evaluation Pipeline
        </h2>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
                Written Response Evaluation
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Candidate answers are evaluated against employer-defined criteria using Claude.
                Each criterion receives a 1-5 score with reasoning. The system is calibrated
                to use the full scoring range and avoid artificial strictness.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
                URL Verification
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Demo URLs are fetched and verified for accessibility. Page content is extracted
                and analyzed for relevance to the challenge requirements.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
                Video Demo Analysis
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Videos are processed on Railway (FFmpeg). Frames are extracted at regular intervals
                and audio is transcribed using Whisper. Claude Vision analyzes the visual demonstration
                alongside the transcript to evaluate:
              </p>
              <ul className="text-sm text-muted-foreground ml-12 list-disc space-y-1">
                <li><strong>Does it work?</strong> — Functioning solution vs. mockups</li>
                <li><strong>Do they understand it?</strong> — Technical explanation quality</li>
                <li><strong>Can they communicate it?</strong> — Presentation clarity</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">4</span>
                Triage & Drafts
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Candidates are automatically triaged into Priority, Maybe, or Skip based on
                combined scores. The system generates interview invitation drafts for top
                candidates and rejection drafts for others.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Architecture Diagram */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">
          System Architecture
        </h2>
        <Card>
          <CardContent className="pt-6">
            <pre className="text-xs text-muted-foreground overflow-x-auto">
{`┌─────────────────────────────────────────────────────────────────────┐
│                           CANDIDATE                                  │
│                              │                                       │
│                    Submit Application                                │
│                              ▼                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │   Vercel     │    │  Supabase    │    │     UploadThing      │   │
│  │  (Next.js)   │◄──►│ (PostgreSQL) │    │   (Video Storage)    │   │
│  └──────┬───────┘    └──────────────┘    └──────────┬───────────┘   │
│         │                                           │               │
│         │ Trigger Evaluation                        │               │
│         ▼                                           │               │
│  ┌──────────────┐                                   │               │
│  │   Claude     │ ◄── Written answers               │               │
│  │  (Anthropic) │     + URL content                 │               │
│  └──────────────┘                                   │               │
│                                                     │               │
│         │ Trigger Video Eval                        │               │
│         ▼                                           ▼               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        Railway                                │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │   │
│  │  │ FFmpeg  │───►│ Whisper │───►│ Claude  │───►│Supabase │    │   │
│  │  │ (Frames)│    │ (Audio) │    │ (Vision)│    │ (Save)  │    │   │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                           EMPLOYER                                   │
│                              │                                       │
│                    View Dashboard                                    │
│                              ▼                                       │
│                   Triaged Candidates                                 │
│              (Priority / Maybe / Skip)                               │
└─────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Key Design Decisions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">
          Key Design Decisions
        </h2>
        <div className="space-y-4 text-sm">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2">Split Processing Architecture</h3>
              <p className="text-muted-foreground">
                Text evaluation runs on Vercel (fast, serverless), while video processing runs on
                Railway (requires FFmpeg, longer runtime). This optimizes for both speed and capability.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2">Frame-Based Video Analysis</h3>
              <p className="text-muted-foreground">
                Rather than processing full video, we extract frames at regular intervals and combine
                with audio transcription. This enables Claude Vision to analyze demos efficiently
                while keeping costs manageable.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2">Calibrated Scoring</h3>
              <p className="text-muted-foreground">
                The evaluation prompts are carefully calibrated to use the full 1-5 scoring range
                and avoid artificial strictness. A 5 means &quot;thoughtful and specific&quot; — not perfection.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Built by{" "}
          <a
            href="https://github.com/zdorward"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Zack Dorward
          </a>
        </p>
      </div>
    </div>
  );
}
