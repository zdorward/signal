'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { RubricItem } from '@/lib/types';

export default function CreateChallengePage() {
  const [roleDescription, setRoleDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [challengeText, setChallengeText] = useState('');
  const [rubric, setRubric] = useState<RubricItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedChallengeId, setSavedChallengeId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStreamedContent('');
    setChallengeText('');
    setRubric([]);
    setSavedChallengeId(null);
    setError('');

    try {
      const response = await fetch('/api/challenges/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_description: roleDescription }),
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
        setStreamedContent(fullText);
      }

      // Strip markdown code blocks if present, then parse JSON
      let jsonText = fullText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(jsonText);
      setChallengeText(parsed.challenge_text);
      setRubric(parsed.rubric_json);
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
          challenge_text: challengeText,
          rubric_json: rubric,
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

  const shareableLink = savedChallengeId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${savedChallengeId}`
    : null;

  const copyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
    }
  };

  const hasGenerated = challengeText && rubric.length > 0;

  // Show success state after saving
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
                setChallengeText('');
                setRubric([]);
                setRoleDescription('');
                setStreamedContent('');
              }}
            >
              Create Another
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'}>
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
        <p className="text-gray-600">Describe the role and let AI generate a work-sample challenge.</p>
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
            placeholder="e.g., AI Builder role at a fintech company. Should be able to integrate LLMs into production applications, build reliable data pipelines, and create intuitive user interfaces for AI-powered features..."
            rows={4}
            disabled={isGenerating}
          />
          <Button
            onClick={handleGenerate}
            disabled={!roleDescription.trim() || isGenerating}
            size="lg"
          >
            {isGenerating ? 'Generating...' : 'Generate Challenge'}
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
                  Generating Challenge...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded overflow-auto max-h-96">
                    {streamedContent || 'Starting generation...'}
                  </pre>
                </div>
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
                <CardTitle>Challenge</CardTitle>
                <CardDescription>Review and edit if needed</CardDescription>
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
                <CardTitle>Evaluation Rubric</CardTitle>
                <CardDescription>
                  5 criteria for evaluating submissions (weights sum to 100)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rubric.map((item, index) => (
                    <motion.div
                      key={item.criterion}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        delay: index * 0.15,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }}
                    >
                      <Card className="h-full">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-base leading-tight">
                              {item.criterion}
                            </CardTitle>
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {item.weight}%
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving} size="lg">
                {isSaving ? 'Saving...' : 'Save Challenge'}
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
