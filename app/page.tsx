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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Signal</h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-powered hiring that surfaces top candidates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>For Employers</CardTitle>
              <CardDescription>
                Create jobs and review candidate submissions.
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 space-y-2">
              <Link href="/create" className="block">
                <Button className="w-full">Create Job</Button>
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
                Access your application link from the employer.
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
