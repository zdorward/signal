'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { RubricItem } from '@/lib/types';

export default function CreateChallengePage() {
  const router = useRouter();
  const [roleDescription, setRoleDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [challengeText, setChallengeText] = useState('');
  const [rubric, setRubric] = useState<RubricItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStreamedContent('');
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

      // Parse the final JSON
      const parsed = JSON.parse(fullText);
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
      router.push(`/dashboard?created=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const hasGenerated = challengeText && rubric.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Challenge</h1>
        <p className="text-gray-600">Describe the role and let AI generate the challenge.</p>
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
            placeholder="e.g., Senior Frontend Engineer with React and TypeScript experience. Should be able to build responsive UIs, work with REST APIs, and write clean, maintainable code..."
            rows={6}
            disabled={isGenerating}
          />
          <Button
            onClick={handleGenerate}
            disabled={!roleDescription.trim() || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Challenge'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      <AnimatePresence>
        {(isGenerating || hasGenerated) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {isGenerating && !hasGenerated && (
              <Card>
                <CardContent className="pt-6">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded">
                    {streamedContent || 'Starting generation...'}
                  </pre>
                </CardContent>
              </Card>
            )}

            {hasGenerated && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Challenge Text</CardTitle>
                    <CardDescription>Edit if needed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={challengeText}
                      onChange={(e) => setChallengeText(e.target.value)}
                      rows={8}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Rubric</CardTitle>
                    <CardDescription>
                      Criteria for evaluating submissions (weights sum to 100)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {rubric.map((item, index) => (
                        <motion.div
                          key={item.criterion}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-base">
                                  {item.criterion}
                                </CardTitle>
                                <span className="text-sm font-semibold text-blue-600">
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
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Challenge'}
                  </Button>
                  <Button variant="outline" onClick={handleGenerate}>
                    Regenerate
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
