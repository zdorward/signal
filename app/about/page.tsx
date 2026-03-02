import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-wider">
            Why Signal Exists
          </h1>
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
            The case for proof-of-work hiring
          </p>
        </div>

        <article className="space-y-6 text-sm text-muted-foreground leading-relaxed">
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
