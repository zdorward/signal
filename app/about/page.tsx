"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AboutPage() {
  const router = useRouter();
  const [view, setView] = useState<"general" | "wealthsimple">("wealthsimple");

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Back
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-wider">
            Why Signal Exists
          </h1>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setView("wealthsimple")}
              className={`text-xs uppercase tracking-wider px-3 py-1 border ${
                view === "wealthsimple"
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              For Wealthsimple
            </button>
            <button
              onClick={() => setView("general")}
              className={`text-xs uppercase tracking-wider px-3 py-1 border ${
                view === "general"
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              General
            </button>
          </div>
        </div>

        {view === "wealthsimple" ? (
          <article className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs">
              What Signal changes about hiring
            </h2>

            <p>
              The resume made sense when applying for a job was expensive. You
              printed it, mailed it, or hand-delivered it. Candidates applied to
              a handful of roles they actually wanted. Employers got a
              manageable pile and read them carefully. The friction was real, so
              the signal was real.
            </p>

            <p>
              That world is gone. AI writes resumes in seconds. ATS systems
              screen them automatically. Candidates apply to hundreds of roles
              with one click. Nobody is evaluating a human anymore. AI generates
              the applications, AI filters them, and the whole thing is just
              noise.
            </p>

            <p>
              Wealthsimple figured out the escape: require proof of work. You
              can generate a resume with a prompt. You cannot generate a working
              system with one. Asking candidates to build something real
              immediately separates the people who want this job from the people
              who are applying to everything.
            </p>

            <p>The problem is it doesn&apos;t scale. Signal fixes that.</p>

            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs pt-4">
              What the human can now do
            </h2>

            <p>
              Right now, someone at Wealthsimple is watching every video,
              reading every written explanation, and writing back to every
              candidate. All of it compressed into 48 hours. With Signal, that
              changes. Every video has already been watched. Every explanation
              has already been scored. Every borderline case has already been
              flagged. The reviewer opens the dashboard and makes decisions.
              That&apos;s it. That&apos;s the part that actually needed a human.
            </p>

            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs pt-4">
              What AI is responsible for
            </h2>

            <p>
              Signal watches the demo videos, transcribes the audio, and
              determines whether the candidate built something real or mocked
              something up. It scores written explanations against a rubric. It
              produces a summary of every submission. It drafts a personalized
              rejection for every candidate who doesn&apos;t advance. The processing
              happens before the human ever opens the dashboard.
            </p>

            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs pt-4">
              Where AI must stop
            </h2>

            <p>
              The offer decision. Hiring has legal weight. It requires reading
              someone&apos;s potential, not just their output. A strong demo doesn&apos;t
              guarantee the right person. A weak demo doesn&apos;t disqualify one
              either. That judgment belongs to a human. AI surfaces the signal,
              the human decides what it means.
            </p>

            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs pt-4">
              What breaks first at scale
            </h2>

            <p>
              Rubric quality for specialized roles. For common roles, Signal
              generates solid evaluation criteria. For niche positions, a weak
              rubric creates false confidence. The human stops questioning the
              shortlist. That&apos;s the failure mode. It doesn&apos;t break loudly, it
              breaks quietly. That&apos;s where the next investment goes: getting
              domain experts to validate rubrics before challenges go live.
            </p>

            <p className="text-foreground pt-4">
              The goal isn&apos;t to make hiring easier to automate. It&apos;s to make it
              harder to fake.
            </p>
          </article>
        ) : (
          <article className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              The case for proof-of-work hiring
            </p>

            <p>The hiring process is broken. Everyone knows it.</p>

            <p>
              Ten years ago, editing your resume took real effort. You picked a
              few roles you actually wanted and applied carefully. Remote work
              wasn&apos;t everywhere. The friction meant something. It filtered out
              people who weren&apos;t serious.
            </p>

            <p>
              Now AI writes the resume. AI screens it. Candidates apply to
              hundreds of jobs in an afternoon. Employers get flooded. Nobody
              wins. The tools built to help made everything worse.
            </p>

            <p>
              There&apos;s also a skill problem. An engineer with 10 years of
              experience at some legacy company might be far less useful than a
              new grad who&apos;s been building with modern AI tools. The resume
              doesn&apos;t tell you that. The interview doesn&apos;t either. Leetcode
              definitely doesn&apos;t. We&apos;re testing people on things AI can do in
              seconds, trying to infer whether they can handle problems that
              didn&apos;t exist when the test was designed.
            </p>

            <p className="text-foreground font-medium">
              The only thing that cuts through it is proof of work.
            </p>

            <p>
              You can fake a resume. You can&apos;t fake a working product. You can
              memorize interview answers. You can&apos;t memorize your way to a
              deployed system. The demo doesn&apos;t lie.
            </p>

            <p>
              Signal is built on that. Employers define a challenge. Candidates
              build something. AI handles the evaluation workload so the human
              can focus on the judgment call at the end. The submission tells
              you more in two minutes than a resume tells you in twenty.
            </p>

            <p>
              It also does something else. Requiring real work filters for
              genuine interest. Someone who spends a weekend building a system
              for your company wants to work there. That&apos;s a signal too.
            </p>

            <p className="text-foreground">
              We&apos;re not trying to fix hiring with more AI. We&apos;re trying to fix
              it with more proof.
            </p>
          </article>
        )}

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Built by{" "}
            <a
              href="https://zackdorward.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Zack Dorward
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
