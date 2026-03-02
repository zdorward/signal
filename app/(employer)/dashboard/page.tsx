"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  Challenge,
  SubmissionWithEvaluation,
  CriterionScore,
  Question,
  Answer,
} from "@/lib/types";

function calculateAverageScore(scores: CriterionScore[]): number {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round((sum / scores.length) * 2);
}

function getJobNumber(id: string): string {
  return id.substring(0, 8).toUpperCase();
}

export default function DashboardPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithEvaluation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [generatingRejection, setGeneratingRejection] = useState<string | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchChallenges = async () => {
    try {
      const response = await fetch("/api/challenges");
      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/submissions");
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
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

  // Auto-expand if only 1 job has submissions
  useEffect(() => {
    if (!loading && submissions.length > 0) {
      const jobIds = Array.from(new Set(submissions.map(s => s.challenge_id)));
      if (jobIds.length === 1) {
        setExpandedJobId(jobIds[0]);
      }
    }
  }, [loading, submissions]);

  const copyApplyLink = (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    const link = `${window.location.origin}/apply/${challengeId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(challengeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteChallenge = async (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    if (
      !confirm("Delete this position? This will also delete all submissions.")
    )
      return;

    setDeletingId(challengeId);
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
        setSubmissions((prev) =>
          prev.filter((s) => s.challenge_id !== challengeId),
        );
      }
    } catch (error) {
      console.error("Failed to delete challenge:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const clearAllSubmissions = async () => {
    if (!confirm("Clear ALL submissions? This cannot be undone.")) return;

    try {
      const response = await fetch("/api/submissions", {
        method: "DELETE",
      });
      if (response.ok) {
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Failed to clear submissions:", error);
    }
  };

  const handleGenerateRejection = async (submissionId: string) => {
    setGeneratingRejection(submissionId);
    try {
      const response = await fetch("/api/reject-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId }),
      });
      const data = await response.json();

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId && s.evaluation
            ? {
                ...s,
                evaluation: {
                  ...s.evaluation,
                  rejection_draft: data.rejection_draft,
                },
              }
            : s,
        ),
      );
    } catch (error) {
      console.error("Failed to generate rejection:", error);
    } finally {
      setGeneratingRejection(null);
    }
  };

  const questionsPass = (submission: SubmissionWithEvaluation) => {
    if (!submission.evaluation?.criterion_scores_json) return false;
    const score = calculateAverageScore(
      submission.evaluation.criterion_scores_json as CriterionScore[],
    );
    return score >= 6;
  };

  const sortedSubmissions = [...submissions].sort((a, b) => {
    const aQuestionsPass = questionsPass(a);
    const bQuestionsPass = questionsPass(b);
    const aUrlPass = a.evaluation?.url_passed ?? false;
    const bUrlPass = b.evaluation?.url_passed ?? false;
    const aBothPass = aQuestionsPass && aUrlPass;
    const bBothPass = bQuestionsPass && bUrlPass;

    if (bBothPass !== aBothPass) return bBothPass ? 1 : -1;

    const aVideoScore = a.evaluation?.video_score ?? -1;
    const bVideoScore = b.evaluation?.video_score ?? -1;
    return bVideoScore - aVideoScore;
  });


  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <span className="text-warning">Loading</span>
        <span className="animate-blink text-warning">_</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Positions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground uppercase tracking-wider">Open Positions</h1>
            <p className="text-muted-foreground text-sm">
              Manage your job postings and application links.
            </p>
          </div>
          <Button onClick={() => (window.location.href = "/create")}>
            + New Position
          </Button>
        </div>

        {challenges.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No positions yet.{" "}
              <a href="/create" className="text-primary hover:underline">
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
                  <TableHead className="w-48">Position</TableHead>
                  <TableHead className="w-28">Applicants</TableHead>
                  <TableHead>Application Link</TableHead>
                  <TableHead className="w-28">Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge) => {
                  const applyLink = `${typeof window !== "undefined" ? window.location.origin : ""}/apply/${challenge.id}`;
                  const applicantCount = submissions.filter((s) => s.challenge_id === challenge.id).length;
                  return (
                  <React.Fragment key={challenge.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedChallengeId(
                          expandedChallengeId === challenge.id
                            ? null
                            : challenge.id,
                        )
                      }
                    >
                      <TableCell className="font-mono text-sm text-foreground">
                        {getJobNumber(challenge.id)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {challenge.role_description}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        {applicantCount}
                      </TableCell>
                      <TableCell>
                        <div
                          className="group relative cursor-pointer"
                          onClick={(e) => copyApplyLink(e, challenge.id)}
                        >
                          <span className="text-muted-foreground text-sm truncate block group-hover:opacity-0 transition-opacity">
                            {applyLink.replace(/^https?:\/\//, "")}
                          </span>
                          <span className="absolute inset-0 flex items-center text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="flex-1 border-t border-primary"></span>
                            <span className="px-2">{copiedId === challenge.id ? "Copied!" : "Click to copy"}</span>
                            <span className="flex-1 border-t border-primary"></span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(challenge.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteChallenge(e, challenge.id)}
                          disabled={deletingId === challenge.id}
                          title="Delete position"
                        >
                          {deletingId === challenge.id ? (
                            <span className="animate-blink">_</span>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedChallengeId === challenge.id && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-secondary p-0">
                          <div className="p-6 space-y-4">
                            {challenge.intro_text && (
                              <div>
                                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                  Introduction
                                </h4>
                                <p className="text-foreground">
                                  {challenge.intro_text}
                                </p>
                              </div>
                            )}
                            {challenge.challenge_text && (
                              <div>
                                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                  Project
                                </h4>
                                <div className="text-foreground whitespace-pre-wrap">
                                  {challenge.challenge_text}
                                </div>
                              </div>
                            )}
                            {challenge.questions_json &&
                              challenge.questions_json.length > 0 && (
                                <div>
                                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                                    Questions
                                  </h4>
                                  <ul className="space-y-2">
                                    {(
                                      challenge.questions_json as Question[]
                                    ).map((q, i) => (
                                      <li key={q.id} className="text-foreground">
                                        <span className="text-muted-foreground">
                                          Q{i + 1}:
                                        </span>{" "}
                                        {q.text}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );})}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Submissions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">Applications</h2>
            <p className="text-muted-foreground text-sm">
              Review candidate submissions and AI evaluations.
            </p>
          </div>
          {submissions.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllSubmissions}>
              Clear All
            </Button>
          )}
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No applications yet. Share position links with candidates to get
              started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Group submissions by challenge */}
            {Array.from(new Set(submissions.map(s => s.challenge_id))).map(challengeId => {
              const challenge = challenges.find(c => c.id === challengeId);
              const jobSubmissions = sortedSubmissions.filter(s => s.challenge_id === challengeId);
              const isExpanded = expandedJobId === challengeId;

              return (
                <Card key={challengeId}>
                  {/* Job header row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedJobId(isExpanded ? null : challengeId)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-muted-foreground">
                        {getJobNumber(challengeId)}
                      </span>
                      <span className="font-medium text-foreground">
                        {challenge?.role_description || "Unknown Position"}
                      </span>
                      <Badge variant="secondary">{jobSubmissions.length} applicant{jobSubmissions.length !== 1 ? "s" : ""}</Badge>
                    </div>
                    <svg
                      className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Expanded applicants table */}
                  {isExpanded && (
                    <TooltipProvider>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Candidate</TooltipTrigger>
                                <TooltipContent>Candidate name</TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="w-28">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Questions</TooltipTrigger>
                                <TooltipContent>Pass/fail based on written responses (≥6/10 to pass)</TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="w-20">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">URL</TooltipTrigger>
                                <TooltipContent>Whether the demo URL resolves and is relevant</TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="w-28">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Video Score</TooltipTrigger>
                                <TooltipContent>AI evaluation of video demo (1-10)</TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="w-36">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Worth a Look?</TooltipTrigger>
                                <TooltipContent>Yes (8+), Maybe (5-7), No (&lt;5) based on video score</TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead>
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Video Summary</TooltipTrigger>
                                <TooltipContent>One-line summary from video evaluation</TooltipContent>
                              </Tooltip>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {jobSubmissions.map((submission) => {
                            const avgScore = submission.evaluation
                              ? calculateAverageScore(
                                  submission.evaluation
                                    .criterion_scores_json as CriterionScore[],
                                )
                              : null;

                            const questions = (submission.challenge?.questions_json ||
                              []) as Question[];
                            const answers = (submission.answers_json || []) as Answer[];
                            const criterionScores = (submission.evaluation
                              ?.criterion_scores_json || []) as CriterionScore[];

                            return (
                              <React.Fragment key={submission.id}>
                                <TableRow
                                  className="cursor-pointer"
                                  onClick={() =>
                                    setExpandedSubmissionId(
                                      expandedSubmissionId === submission.id ? null : submission.id,
                                    )
                                  }
                                >
                                  <TableCell className="font-medium text-foreground">
                                    {submission.candidate_name}
                                  </TableCell>
                                  <TableCell>
                                    {avgScore !== null ? (
                                      avgScore >= 6 ? (
                                        <span className="text-primary">PASS</span>
                                      ) : (
                                        <span className="text-destructive">FAIL</span>
                                      )
                                    ) : (
                                      <span className="inline-block w-2 h-2 bg-warning rounded-full animate-pulse" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {submission.evaluation ? (
                                      submission.evaluation.url_passed ? (
                                        <span className="text-primary">PASS</span>
                                      ) : (
                                        <span className="text-destructive">FAIL</span>
                                      )
                                    ) : (
                                      <span className="inline-block w-2 h-2 bg-warning rounded-full animate-pulse" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {submission.evaluation?.video_score != null ? (
                                      <Badge
                                        variant={
                                          submission.evaluation.video_score >= 8
                                            ? "priority"
                                            : submission.evaluation.video_score >= 5
                                              ? "warning"
                                              : "destructive"
                                        }
                                      >
                                        {submission.evaluation.video_score}/10
                                      </Badge>
                                    ) : submission.video_path ? (
                                      <span className="inline-block w-2 h-2 bg-warning rounded-full animate-pulse" />
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {(() => {
                                      const qPass = avgScore !== null && avgScore >= 6;
                                      const urlPass =
                                        submission.evaluation?.url_passed ?? false;
                                      const bothPass = qPass && urlPass;
                                      const videoScore = submission.evaluation?.video_score;

                                      if (!submission.evaluation) {
                                        return <span className="inline-block w-2 h-2 bg-warning rounded-full animate-pulse" />;
                                      }

                                      if (!bothPass) {
                                        return <Badge variant="secondary">○ Skip</Badge>;
                                      }

                                      if (videoScore == null) {
                                        return submission.video_path ? (
                                          <span className="inline-block w-2 h-2 bg-warning rounded-full animate-pulse" />
                                        ) : (
                                          <Badge variant="warning">◇ Maybe</Badge>
                                        );
                                      }

                                      if (videoScore >= 8) {
                                        return <Badge variant="priority">◆ Priority</Badge>;
                                      } else if (videoScore >= 5) {
                                        return <Badge variant="warning">◇ Maybe</Badge>;
                                      } else {
                                        return <Badge variant="secondary">○ Skip</Badge>;
                                      }
                                    })()}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                    {submission.evaluation?.video_notes ? (
                                      submission.evaluation.video_notes.split("\n\n")[0]
                                    ) : submission.video_path ? (
                                      <span className="inline-block w-2 h-2 bg-warning rounded-full animate-pulse" />
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                </TableRow>
                                {expandedSubmissionId === submission.id && (
                                  <TableRow>
                                    <TableCell colSpan={6} className="bg-secondary p-0">
                                      <div className="p-6 space-y-6">
                                        {/* URL and Video */}
                                        <div className="grid gap-4 md:grid-cols-2">
                                          <div>
                                            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Demo URL</h4>
                                            <a
                                              href={submission.demo_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-primary hover:underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {submission.demo_url}
                                            </a>
                                            {submission.evaluation && (
                                              <p className="text-sm text-muted-foreground mt-1">
                                                {submission.evaluation.url_notes}
                                              </p>
                                            )}
                                          </div>
                                          {submission.video_path && (
                                            <div>
                                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Video</h4>
                                              <a
                                                href={submission.video_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                View Video
                                              </a>
                                            </div>
                                          )}
                                        </div>

                                        {/* Video Evaluation Details */}
                                        {submission.evaluation?.video_notes && (
                                          <div>
                                            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Video Evaluation</h4>
                                            <div className="text-sm text-foreground whitespace-pre-wrap border border-border p-4">
                                              {submission.evaluation.video_notes}
                                            </div>
                                          </div>
                                        )}

                                        {/* Questions and Answers with Scores */}
                                        <div className="space-y-6">
                                          <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Questions & Answers</h4>
                                          {questions.map((question) => {
                                            const answer = answers.find(
                                              (a) => a.question_id === question.id,
                                            );
                                            const questionScores = criterionScores.filter(
                                              (s) => s.question_id === question.id,
                                            );

                                            return (
                                              <div
                                                key={question.id}
                                                className="border border-border p-4 space-y-3"
                                              >
                                                <p className="font-medium text-foreground">
                                                  {question.text}
                                                </p>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                  {answer?.text || "(No answer)"}
                                                </p>

                                                {questionScores.length > 0 && (
                                                  <div className="pt-2 border-t border-border space-y-2">
                                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                      Evaluation
                                                    </p>
                                                    {questionScores.map((score) => {
                                                      const criterion = question.criteria.find(
                                                        (c) => c.id === score.criterion_id,
                                                      );
                                                      const scoreValue = score.score * 2;
                                                      return (
                                                        <div
                                                          key={score.criterion_id}
                                                          className="space-y-1"
                                                        >
                                                          <div className="flex items-center gap-3">
                                                            <Badge
                                                              variant={
                                                                scoreValue >= 8
                                                                  ? "priority"
                                                                  : scoreValue >= 6
                                                                    ? "warning"
                                                                    : "destructive"
                                                              }
                                                              className="shrink-0"
                                                            >
                                                              {scoreValue}/10
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground uppercase">
                                                              {criterion?.text || "Criterion"}
                                                            </span>
                                                          </div>
                                                          <div className="score-bar w-full max-w-xs">
                                                            <div
                                                              className={`score-bar-fill ${
                                                                scoreValue >= 8
                                                                  ? "score-bar-fill-green"
                                                                  : scoreValue >= 6
                                                                    ? "score-bar-fill-amber"
                                                                    : "score-bar-fill-red"
                                                              }`}
                                                              style={{ width: `${scoreValue * 10}%` }}
                                                            />
                                                          </div>
                                                          <p className="text-sm text-muted-foreground">
                                                            {score.reasoning}
                                                          </p>
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
                                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Summary</h4>
                                              <ul className="list-disc list-inside text-sm text-foreground">
                                                {submission.evaluation.summary_bullets.map(
                                                  (bullet, i) => (
                                                    <li key={i}>{bullet}</li>
                                                  ),
                                                )}
                                              </ul>
                                            </div>

                                            {/* Flag Reason */}
                                            {submission.evaluation.flag_reason && (
                                              <div className="border border-warning p-3">
                                                <h4 className="text-xs uppercase tracking-wider text-warning mb-1">
                                                  Flag Reason
                                                </h4>
                                                <p className="text-sm text-warning">
                                                  {submission.evaluation.flag_reason}
                                                </p>
                                              </div>
                                            )}

                                            {/* Rejection Draft */}
                                            <div>
                                              <div className="flex items-center gap-4 mb-2">
                                                <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Rejection Draft</h4>
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
                                                    ? "Generating..."
                                                    : "Regenerate"}
                                                </Button>
                                              </div>
                                              {submission.evaluation.rejection_draft && (
                                                <>
                                                  <pre className="text-sm text-foreground whitespace-pre-wrap bg-background p-4 border border-border mb-3">
                                                    {submission.evaluation.rejection_draft}
                                                  </pre>
                                                  <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      alert("Email sending is not implemented yet.");
                                                    }}
                                                  >
                                                    Send Email
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          </>
                                        )}

                                        {!submission.evaluation && (
                                          <div className="text-center py-4 text-warning">
                                            Evaluation in progress<span className="animate-blink">_</span>
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TooltipProvider>
                  )}
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
