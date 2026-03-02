import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold tracking-tight text-foreground">
            Signal<span className="text-primary animate-blink">_</span>
          </h1>
          <p className="mt-4 text-sm uppercase tracking-widest text-muted-foreground">
            AI-Powered Candidate Intelligence
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                Employers
              </CardTitle>
              <CardDescription className="text-foreground mt-2">
                Create jobs and review candidate submissions.
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 space-y-2">
              <Link href="/create" className="block">
                <Button variant="primary" className="w-full">
                  Create Job
                </Button>
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
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                Candidates
              </CardTitle>
              <CardDescription className="text-foreground mt-2">
                Access your application link from the employer.
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                You&apos;ll receive a unique link to submit your work.
              </p>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Status: <span className="text-primary">Operational</span>
          </p>
        </div>
      </div>
    </main>
  );
}
