'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  Challenge,
  SubmissionWithEvaluation,
  CriterionScore,
  Question,
  Answer,
} from '@/lib/types';

function calculateAverageScore(scores: CriterionScore[]): number {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

function getJobNumber(id: string): string {
  return id.substring(0, 8).toUpperCase();
}

export default function DashboardPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [generatingRejection, setGeneratingRejection] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  }, []);

  const copyApplyLink = (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    const link = `${window.location.origin}/apply/${challengeId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(challengeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteChallenge = async (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this position? This will also delete all submissions.')) return;

    setDeletingId(challengeId);
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
        setSubmissions((prev) => prev.filter((s) => s.challenge_id !== challengeId));
      }
    } catch (error) {
      console.error('Failed to delete challenge:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const clearAllSubmissions = async () => {
    if (!confirm('Clear ALL submissions? This cannot be undone.')) return;

    try {
      const response = await fetch('/api/submissions', {
        method: 'DELETE',
      });
      if (response.ok) {
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Failed to clear submissions:', error);
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

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId && s.evaluation
            ? {
                ...s,
                evaluation: { ...s.evaluation, rejection_draft: data.rejection_draft },
              }
            : s
        )
      );
    } catch (error) {
      console.error('Failed to generate rejection:', error);
    } finally {
      setGeneratingRejection(null);
    }
  };

  // Sort submissions: needs review first, then by score descending
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const aReview = a.evaluation?.worth_human_attention ? 1 : 0;
    const bReview = b.evaluation?.worth_human_attention ? 1 : 0;
    if (bReview !== aReview) return bReview - aReview;

    const aScore = a.evaluation ? calculateAverageScore(a.evaluation.criterion_scores_json as CriterionScore[]) : 0;
    const bScore = b.evaluation ? calculateAverageScore(b.evaluation.criterion_scores_json as CriterionScore[]) : 0;
    return bScore - aScore;
  });

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Positions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Open Positions</h1>
            <p className="text-gray-600">Manage your job postings and application links.</p>
          </div>
          <Button onClick={() => (window.location.href = '/create')}>
            + New Position
          </Button>
        </div>

        {challenges.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No positions yet.{' '}
              <a href="/create" className="text-blue-600 hover:underline">
                Create your first position
              </a>
              .
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Job #</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="w-32">Created</TableHead>
                  <TableHead className="w-48 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge) => (
                  <>
                    <TableRow
                      key={challenge.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        setExpandedChallengeId(
                          expandedChallengeId === challenge.id ? null : challenge.id
                        )
                      }
                    >
                      <TableCell className="font-mono text-sm">
                        {getJobNumber(challenge.id)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {challenge.role_description}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(challenge.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => copyApplyLink(e, challenge.id)}
                        >
                          {copiedId === challenge.id ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => deleteChallenge(e, challenge.id)}
                          disabled={deletingId === challenge.id}
                        >
                          {deletingId === challenge.id ? '...' : 'Delete'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedChallengeId === challenge.id && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-gray-50 p-0">
                          <div className="p-6 space-y-4">
                            {challenge.intro_text && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Introduction</h4>
                                <p className="text-gray-700">{challenge.intro_text}</p>
                              </div>
                            )}
                            {challenge.challenge_text && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Challenge</h4>
                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                  {challenge.challenge_text}
                                </div>
                              </div>
                            )}
                            {challenge.questions_json && challenge.questions_json.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Questions</h4>
                                <ul className="space-y-2">
                                  {(challenge.questions_json as Question[]).map((q, i) => (
                                    <li key={q.id} className="text-gray-700">
                                      <span className="font-medium">Q{i + 1}:</span> {q.text}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Submissions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Applications</h2>
            <p className="text-gray-600">
              Review candidate submissions and AI evaluations.
            </p>
          </div>
          {submissions.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllSubmissions}>
              Clear All (Testing)
            </Button>
          )}
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No applications yet. Share position links with candidates to get started.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Job #</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead className="w-28">Questions</TableHead>
                  <TableHead className="w-20">URL</TableHead>
                  <TableHead className="w-28">Review</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSubmissions.map((submission) => {
                  const avgScore = submission.evaluation
                    ? calculateAverageScore(
                        submission.evaluation.criterion_scores_json as CriterionScore[]
                      )
                    : null;

                  return (
                    <TableRow
                      key={submission.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        setExpandedId(
                          expandedId === submission.id ? null : submission.id
                        )
                      }
                    >
                      <TableCell className="font-mono text-sm">
                        {submission.challenge ? getJobNumber(submission.challenge.id) : '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {submission.candidate_name}
                      </TableCell>
                      <TableCell>
                        {avgScore !== null ? (
                          <Badge
                            variant={
                              avgScore >= 4
                                ? 'default'
                                : avgScore >= 3
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {avgScore}/5
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.evaluation ? (
                          submission.evaluation.url_passed ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.evaluation ? (
                          submission.evaluation.worth_human_attention ? (
                            <Badge variant="default" className="bg-amber-500">
                              Needs Review
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          {expandedId === submission.id ? '▲' : '▼'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

                const questions = (submission.challenge?.questions_json ||
                  []) as Question[];
                const answers = (submission.answers_json || []) as Answer[];
                const criterionScores = (submission.evaluation
                  ?.criterion_scores_json || []) as CriterionScore[];

                return (
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      {/* URL and Video */}
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
                          {submission.evaluation && (
                            <p className="text-sm text-gray-500 mt-1">
                              {submission.evaluation.url_notes}
                            </p>
                          )}
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

                      {/* Questions and Answers with Scores */}
                      <div className="space-y-6">
                        <h4 className="font-semibold">Questions & Answers</h4>
                        {questions.map((question) => {
                          const answer = answers.find(
                            (a) => a.question_id === question.id
                          );
                          const questionScores = criterionScores.filter(
                            (s) => s.question_id === question.id
                          );

                          return (
                            <div
                              key={question.id}
                              className="border rounded-lg p-4 space-y-3"
                            >
                              <p className="font-medium text-gray-900">
                                {question.text}
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {answer?.text || '(No answer)'}
                              </p>

                              {questionScores.length > 0 && (
                                <div className="pt-2 border-t space-y-2">
                                  <p className="text-xs font-medium text-gray-500 uppercase">
                                    Evaluation
                                  </p>
                                  {questionScores.map((score) => {
                                    const criterion = question.criteria.find(
                                      (c) => c.id === score.criterion_id
                                    );
                                    return (
                                      <div
                                        key={score.criterion_id}
                                        className="flex items-start gap-3"
                                      >
                                        <Badge
                                          variant={
                                            score.score >= 4
                                              ? 'default'
                                              : score.score >= 3
                                              ? 'secondary'
                                              : 'destructive'
                                          }
                                          className="shrink-0"
                                        >
                                          {score.score}/5
                                        </Badge>
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            {criterion?.text || 'Criterion'}:
                                          </span>{' '}
                                          <span className="text-gray-600">
                                            {score.reasoning}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {submission.evaluation && (
                        <>
                          {/* Summary */}
                          <div>
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <ul className="list-disc list-inside text-sm text-gray-700">
                              {submission.evaluation.summary_bullets.map(
                                (bullet, i) => (
                                  <li key={i}>{bullet}</li>
                                )
                              )}
                            </ul>
                          </div>

                          {/* Flag Reason */}
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

                          {/* Rejection Draft */}
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
