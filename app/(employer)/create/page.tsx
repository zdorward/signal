"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { Question, Criterion } from "@/lib/types";

function generateId(): string {
  return crypto.randomUUID();
}

export default function CreateChallengePage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [challengeRequirements, setChallengeRequirements] = useState("");
  const [deadline, setDeadline] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T23:59`;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [introText, setIntroText] = useState("");
  const [challengeText, setChallengeText] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedChallengeId, setSavedChallengeId] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStreamedContent("");
    setIntroText("");
    setChallengeText("");
    setQuestions([]);
    setSavedChallengeId(null);
    setHasGenerated(false);
    setError("");

    try {
      const response = await fetch("/api/challenges/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_description: `${jobTitle}${jobDescription ? `\n\n${jobDescription}` : ""}`,
          challenge_requirements: challengeRequirements || undefined,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;

        const challengeDelim = fullText.indexOf("---CHALLENGE---");
        const questionsDelim = fullText.indexOf("---QUESTIONS---");
        if (questionsDelim !== -1) {
          setStreamedContent(fullText.substring(0, questionsDelim).trim());
        } else if (challengeDelim !== -1) {
          setStreamedContent(fullText.substring(0, challengeDelim).trim());
        } else {
          setStreamedContent(fullText);
        }
      }

      const challengeDelimiter = "---CHALLENGE---";
      const questionsDelimiter = "---QUESTIONS---";

      const challengeIndex = fullText.indexOf(challengeDelimiter);
      const questionsIndex = fullText.indexOf(questionsDelimiter);

      if (challengeIndex === -1 || questionsIndex === -1) {
        throw new Error("Invalid response format - missing delimiters");
      }

      const introPart = fullText.substring(0, challengeIndex).trim();
      const challengePart = fullText
        .substring(challengeIndex + challengeDelimiter.length, questionsIndex)
        .trim();
      let questionsPart = fullText
        .substring(questionsIndex + questionsDelimiter.length)
        .trim();

      if (questionsPart.startsWith("```")) {
        questionsPart = questionsPart
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const parsedQuestions = JSON.parse(questionsPart);
      setIntroText(introPart);
      setChallengeText(challengePart);
      setQuestions(parsedQuestions);
      setHasGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_description: jobTitle,
          challenge_requirements: challengeRequirements || null,
          intro_text: introText,
          challenge_text: challengeText,
          questions_json: questions,
          deadline: deadline || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      const data = await response.json();
      setSavedChallengeId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
    );
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      text: "",
      order: questions.length + 1,
      word_limit: 500,
      criteria: [{ id: generateId(), text: "", order: 1 }],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const updateCriterion = (
    questionId: string,
    criterionId: string,
    updates: Partial<Criterion>,
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              criteria: q.criteria.map((c) =>
                c.id === criterionId ? { ...c, ...updates } : c,
              ),
            }
          : q,
      ),
    );
  };

  const addCriterion = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              criteria: [
                ...q.criteria,
                { id: generateId(), text: "", order: q.criteria.length + 1 },
              ],
            }
          : q,
      ),
    );
  };

  const removeCriterion = (questionId: string, criterionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, criteria: q.criteria.filter((c) => c.id !== criterionId) }
          : q,
      ),
    );
  };

  const shareableLink = savedChallengeId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/apply/${savedChallengeId}`
    : null;

  const copyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (savedChallengeId && shareableLink) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="text-6xl text-primary">◆</div>
          <h1 className="text-3xl font-bold text-primary uppercase tracking-wider">
            Job Posted
          </h1>
          <p className="text-muted-foreground">
            Share this link with candidates:
          </p>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-secondary border border-border px-4 py-3 text-sm font-mono break-all text-foreground">
                  {shareableLink}
                </code>
                <Button onClick={copyLink} variant={copied ? "primary" : "outline"}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSavedChallengeId(null);
                setIntroText("");
                setChallengeText("");
                setQuestions([]);
                setJobTitle("");
                setJobDescription("");
                setChallengeRequirements("");
                const newDeadline = new Date();
                newDeadline.setDate(newDeadline.getDate() + 7);
                const year = newDeadline.getFullYear();
                const month = String(newDeadline.getMonth() + 1).padStart(2, "0");
                const day = String(newDeadline.getDate()).padStart(2, "0");
                setDeadline(`${year}-${month}-${day}T23:59`);
                setStreamedContent("");
                setHasGenerated(false);
              }}
            >
              Create Another
            </Button>
            <Button variant="primary" onClick={() => (window.location.href = "/dashboard")}>
              View Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground uppercase tracking-wider">Create Job</h1>
        <p className="text-muted-foreground text-sm">
          Describe the role and let AI generate evaluation questions.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Job Title</label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="AI Builder"
              disabled={isGenerating}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Role Description
            </label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="As an AI Builder, you'll own the full path from problem to shipped system to real-world adoption. That means..."
              rows={4}
              disabled={isGenerating}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Project Requirements{" "}
              <span className="text-muted-foreground font-normal lowercase">(optional)</span>
            </label>
            <Textarea
              value={challengeRequirements}
              onChange={(e) => setChallengeRequirements(e.target.value)}
              placeholder="Create an AI-enabled financial planning recommendation system..."
              rows={2}
              disabled={isGenerating}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Application Deadline{" "}
              <span className="text-muted-foreground font-normal lowercase">(optional)</span>
            </label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!jobTitle.trim() || isGenerating}
            size="lg"
            variant="primary"
          >
            {isGenerating ? (
              <>
                Generating<span className="animate-blink">_</span>
              </>
            ) : (
              "Generate Application"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="border border-destructive text-destructive p-4">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {isGenerating && !hasGenerated && (
          <motion.div
            key="streaming"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  Generating<span className="animate-blink">_</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm font-mono bg-secondary border border-border p-4 overflow-auto max-h-96 text-foreground">
                  {streamedContent || "Initializing..."}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {hasGenerated && (
          <motion.div
            key="generated"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Introduction</CardTitle>
                <CardDescription className="text-foreground">
                  Brief intro that appears at the top of the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  rows={2}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Project</CardTitle>
                <CardDescription className="text-foreground">
                  The project candidates must build. Supports markdown.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={challengeText}
                  onChange={(e) => setChallengeText(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Supplementary Questions</CardTitle>
                <CardDescription className="text-foreground">
                  Additional questions alongside the challenge. Each criterion
                  is scored 1-5.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((question, qIndex) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: qIndex * 0.1 }}
                    className="border border-border p-4 space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-lg font-bold text-muted-foreground">
                        Q{qIndex + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={question.text}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              text: e.target.value,
                            })
                          }
                          placeholder="Question text"
                          rows={2}
                        />
                        <div className="flex items-center gap-4">
                          <label className="text-sm text-muted-foreground">
                            Word limit:
                            <Input
                              type="number"
                              value={question.word_limit}
                              onChange={(e) =>
                                updateQuestion(question.id, {
                                  word_limit: parseInt(e.target.value) || 500,
                                })
                              }
                              className="w-20 ml-2 inline-block"
                            />
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeQuestion(question.id)}
                          >
                            Remove Question
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="ml-8 space-y-2">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Evaluation Criteria:
                      </p>
                      {question.criteria.map((criterion, cIndex) => (
                        <div
                          key={criterion.id}
                          className="flex items-center gap-2"
                        >
                          <span className="text-sm text-muted-foreground w-6">
                            {cIndex + 1}.
                          </span>
                          <Input
                            value={criterion.text}
                            onChange={(e) =>
                              updateCriterion(question.id, criterion.id, {
                                text: e.target.value,
                              })
                            }
                            placeholder="What to evaluate in the answer"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() =>
                              removeCriterion(question.id, criterion.id)
                            }
                            disabled={question.criteria.length <= 1}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCriterion(question.id)}
                      >
                        + Add Criterion
                      </Button>
                    </div>
                  </motion.div>
                ))}

                <Button variant="outline" onClick={addQuestion}>
                  + Add Question
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving} size="lg" variant="primary">
                {isSaving ? (
                  <>
                    Publishing<span className="animate-blink">_</span>
                  </>
                ) : (
                  "Publish Job"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
