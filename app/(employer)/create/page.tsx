'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { Question, Criterion } from '@/lib/types';

function generateId(): string {
  return crypto.randomUUID();
}

export default function CreateChallengePage() {
  const [roleDescription, setRoleDescription] = useState('');
  const [challengeRequirements, setChallengeRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [introText, setIntroText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedChallengeId, setSavedChallengeId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStreamedContent('');
    setIntroText('');
    setQuestions([]);
    setSavedChallengeId(null);
    setError('');

    try {
      const response = await fetch('/api/challenges/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_description: roleDescription,
          challenge_requirements: challengeRequirements || undefined,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;

        const delimiterIndex = fullText.indexOf('---QUESTIONS---');
        if (delimiterIndex !== -1) {
          setStreamedContent(fullText.substring(0, delimiterIndex).trim());
        } else {
          setStreamedContent(fullText);
        }
      }

      const delimiter = '---QUESTIONS---';
      const delimiterIndex = fullText.indexOf(delimiter);

      if (delimiterIndex === -1) {
        throw new Error('Invalid response format - missing questions delimiter');
      }

      const introPart = fullText.substring(0, delimiterIndex).trim();
      let questionsPart = fullText.substring(delimiterIndex + delimiter.length).trim();

      if (questionsPart.startsWith('```')) {
        questionsPart = questionsPart.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsedQuestions = JSON.parse(questionsPart);
      setIntroText(introPart);
      setQuestions(parsedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_description: roleDescription,
          challenge_requirements: challengeRequirements || null,
          intro_text: introText,
          questions_json: questions,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      setSavedChallengeId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
    );
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      text: '',
      order: questions.length + 1,
      word_limit: 500,
      criteria: [{ id: generateId(), text: '', order: 1 }],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const updateCriterion = (
    questionId: string,
    criterionId: string,
    updates: Partial<Criterion>
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              criteria: q.criteria.map((c) =>
                c.id === criterionId ? { ...c, ...updates } : c
              ),
            }
          : q
      )
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
                { id: generateId(), text: '', order: q.criteria.length + 1 },
              ],
            }
          : q
      )
    );
  };

  const removeCriterion = (questionId: string, criterionId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, criteria: q.criteria.filter((c) => c.id !== criterionId) }
          : q
      )
    );
  };

  const shareableLink = savedChallengeId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${savedChallengeId}`
    : null;

  const copyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
    }
  };

  const hasGenerated = introText && questions.length > 0;

  if (savedChallengeId && shareableLink) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="text-6xl">✓</div>
          <h1 className="text-3xl font-bold text-green-600">Challenge Created!</h1>
          <p className="text-gray-600 text-lg">Share this link with candidates:</p>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg text-sm font-mono break-all">
                  {shareableLink}
                </code>
                <Button onClick={copyLink} variant="outline">
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSavedChallengeId(null);
                setIntroText('');
                setQuestions([]);
                setRoleDescription('');
                setChallengeRequirements('');
                setStreamedContent('');
              }}
            >
              Create Another
            </Button>
            <Button onClick={() => (window.location.href = '/dashboard')}>
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
        <h1 className="text-2xl font-bold">Create Challenge</h1>
        <p className="text-gray-600">
          Describe the role and let AI generate evaluation questions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Description</CardTitle>
          <CardDescription>
            Describe the role, required skills, and what you&apos;re looking for.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            placeholder="e.g., AI Builder role at Wealthsimple. Should be able to integrate LLMs into production applications..."
            rows={4}
            disabled={isGenerating}
          />
          <div>
            <label className="block text-sm font-medium mb-2">
              Challenge Requirements (optional)
            </label>
            <Textarea
              value={challengeRequirements}
              onChange={(e) => setChallengeRequirements(e.target.value)}
              placeholder="e.g., Should include a demo link and video walkthrough. Focus on AI product thinking."
              rows={2}
              disabled={isGenerating}
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!roleDescription.trim() || isGenerating}
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate Questions'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
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
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Generating Questions...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded overflow-auto max-h-96">
                  {streamedContent || 'Starting generation...'}
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
                <CardTitle>Introduction</CardTitle>
                <CardDescription>
                  This text appears at the top of the application form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Questions & Evaluation Criteria</CardTitle>
                <CardDescription>
                  Edit questions and their scoring criteria. Each criterion is scored 1-5.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((question, qIndex) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: qIndex * 0.1 }}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-lg font-bold text-gray-400">
                        Q{qIndex + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={question.text}
                          onChange={(e) =>
                            updateQuestion(question.id, { text: e.target.value })
                          }
                          placeholder="Question text"
                          rows={2}
                        />
                        <div className="flex items-center gap-4">
                          <label className="text-sm text-gray-500">
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
                            className="text-red-500"
                            onClick={() => removeQuestion(question.id)}
                          >
                            Remove Question
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="ml-8 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Evaluation Criteria:
                      </p>
                      {question.criteria.map((criterion, cIndex) => (
                        <div key={criterion.id} className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 w-6">
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
                            className="text-red-500"
                            onClick={() => removeCriterion(question.id, criterion.id)}
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
              <Button onClick={handleSave} disabled={isSaving} size="lg">
                {isSaving ? 'Saving...' : 'Save Challenge'}
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
