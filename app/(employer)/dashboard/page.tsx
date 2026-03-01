'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Challenge, SubmissionWithEvaluation, RubricScore } from '@/lib/types';

export default function DashboardPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingRejection, setGeneratingRejection] = useState<string | null>(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              No challenges yet. <a href="/create" className="text-blue-600 hover:underline">Create your first challenge</a>.
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
        <p className="text-gray-600 mb-4">Review candidate submissions and AI evaluations.</p>

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
                ))}
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
                return (
                  <Card>
                    <CardContent className="p-6 space-y-4">
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
