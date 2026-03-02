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
              The resume made sense when applying for a job was expensive. You printed it, mailed it, or hand-delivered it. Candidates applied to a handful of roles they genuinely wanted. Employers received a manageable pile and read them carefully. The signal was decent because the friction was real.
            </p>

            <p>
              That world is gone. AI writes resumes in seconds. ATS systems screen them automatically. Candidates apply to hundreds of roles with one click. The result is a system where AI generates applications and AI filters them, and no human has evaluated another human at any point in the process. The signal has collapsed entirely.
            </p>

            <p>
              Wealthsimple understood this and did something about it — they asked for proof of work instead of a resume. You can&apos;t generate a working system with a prompt. What you can do is spend two hours building something real, which immediately separates candidates who want this specific job from candidates who are spray-applying to everything.
            </p>

            <p className="text-foreground">
              Signal is the infrastructure that makes that process scale.
            </p>

            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs pt-4">
              What the human can now do
            </h2>

            <p>
              A hiring manager running Wealthsimple&apos;s process today watches every video, reads every written explanation, and personally responds to every candidate — compressed into 48 hours. Signal changes what that person can do: instead of processing submissions, they evaluate people. Every video has already been watched. Every explanation has already been scored. Every borderline case has already been flagged. The human opens the dashboard and makes decisions — which is the only part that required a human in the first place.
            </p>

            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs pt-4">
              What AI is responsible for
            </h2>

            <p>
              Signal&apos;s AI watches demo videos, transcribes audio, and evaluates whether the candidate built something real or mocked something up. It scores written explanations against an explicit rubric — did they define the human boundary, did they demonstrate systems thinking, does the demo actually work? It produces a structured summary of every submission and drafts a personalized rejection for every candidate who doesn&apos;t advance. It does the processing so the human can do the judging.
            </p>

            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs pt-4">
              Where AI must stop
            </h2>

            <p>
              The offer decision. Hiring carries legal weight, requires reading a person&apos;s potential rather than their current output, and involves a cultural judgment that no rubric can capture. An experienced engineer with an underwhelming demo might be exactly who you need. A polished submission might hide someone who can&apos;t operate in ambiguity. AI surfaces the signal — the human decides what it means.
            </p>

            <h2 className="text-foreground font-medium uppercase tracking-wider text-xs pt-4">
              What breaks first at scale
            </h2>

            <p>
              Rubric quality for specialized roles. Signal generates evaluation criteria from a job description, and for common roles this works well. For highly specialized positions — a regulatory compliance lead, a senior risk officer — the rubric may not capture what genuine expertise looks like. The risk isn&apos;t a bad hire. It&apos;s false confidence in a shortlist the human stops questioning. That&apos;s where careful oversight and domain-specific rubric validation becomes the next engineering investment.
            </p>

            <p className="text-foreground pt-4">
              The process should be harder to game, not easier to automate. Signal is built on that principle.
            </p>
          </article>
        ) : (
          <article className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              The case for proof-of-work hiring
            </p>

            <p>
              The hiring process is broken, and everyone knows it.
            </p>

            <p>
              On one side, candidates spend hours crafting resumes and cover letters that get filtered by automated systems looking for keyword matches. They apply to hundreds of positions, hoping something sticks. On the other side, employers wade through floods of applications, most generated or enhanced by AI, trying to find genuine signal in an ocean of noise.
            </p>

            <p>
              The tools meant to help have made things worse. ATS systems reject qualified candidates for missing keywords. AI resume builders produce polished documents that reveal nothing about actual capability. LinkedIn endorsements are exchanged like trading cards. The entire system optimizes for appearance over substance.
            </p>

            <p>
              The result is a market failure. Good candidates get filtered out. Mediocre candidates with optimized profiles get through. Employers spend enormous resources on interviews that could have been avoided. Everyone loses time and trust.
            </p>

            <p className="text-foreground font-medium">
              But there&apos;s one thing that cuts through all of this: proof of work.
            </p>

            <p>
              You can fake a resume. You can&apos;t fake a working product. You can embellish your experience. You can&apos;t embellish a deployed system that reviewers can actually use. The demo doesn&apos;t lie.
            </p>

            <p>
              This is the insight Signal is built on. Instead of asking candidates to describe what they can do, we ask them to show it. Instead of parsing resumes for signals of competence, we evaluate actual artifacts. Instead of trusting claims, we verify capability.
            </p>

            <p>
              The approach is simple: employers define a challenge relevant to the role. Candidates build something that demonstrates their skills. AI assists in evaluation—analyzing the submission, checking if the demo works, assessing the quality of thinking in written responses—but the core signal comes from the work itself.
            </p>

            <p>
              This isn&apos;t about making hiring harder. It&apos;s about making it more honest. A candidate who can build a working solution in a weekend tells you more than a candidate with a perfect resume and rehearsed interview answers. The investment of effort is itself a signal—of genuine interest, of capability under constraints, of the ability to ship.
            </p>

            <p>
              Signal exists because the old methods have failed. Resumes don&apos;t predict performance. Interviews are easily gamed. Credentials indicate access, not ability. The only reliable indicator of whether someone can do the work is whether they&apos;ve done the work.
            </p>

            <p className="text-foreground">
              We&apos;re not trying to fix hiring with more AI. We&apos;re trying to fix it with more proof.
            </p>

            <p>
              That&apos;s why Signal exists.
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
