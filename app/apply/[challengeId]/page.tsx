'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUploadThing } from '@/lib/uploadthing';
import type { Challenge } from '@/lib/types';

export default function ApplyPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [candidateName, setCandidateName] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [writtenExplanation, setWrittenExplanation] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { startUpload } = useUploadThing('videoUploader');

  const fetchChallenge = useCallback(async () => {
    try {
      const response = await fetch('/api/challenges');
      const challenges = await response.json();
      const found = challenges.find((c: Challenge) => c.id === challengeId);
      if (found) {
        setChallenge(found);
      } else {
        setError('Challenge not found');
      }
    } catch {
      setError('Failed to load challenge');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let videoPath: string | null = null;

      if (videoFile) {
        setIsUploading(true);
        const uploadResult = await startUpload([videoFile]);
        if (uploadResult && uploadResult[0]) {
          videoPath = uploadResult[0].url;
        }
        setIsUploading(false);
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          candidate_name: candidateName,
          demo_url: demoUrl,
          written_explanation: writtenExplanation,
          video_path: videoPath,
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading challenge...
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-6xl">✓</div>
              <h1 className="text-2xl font-bold text-green-600">
                Submission Received!
              </h1>
              <p className="text-gray-600">
                Thank you for your submission. The hiring team will review your work
                and get back to you.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{challenge?.role_description}</CardTitle>
                  <CardDescription>Read the challenge carefully before submitting.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{challenge?.challenge_text}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Submission</CardTitle>
                  <CardDescription>
                    Fill out all required fields. Video is optional but recommended.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Your Name *
                      </label>
                      <Input
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="Jane Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Demo URL *
                      </label>
                      <Input
                        type="url"
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        placeholder="https://your-demo.vercel.app"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Written Explanation *
                      </label>
                      <Textarea
                        value={writtenExplanation}
                        onChange={(e) => setWrittenExplanation(e.target.value)}
                        placeholder="Explain your approach, design decisions, and any trade-offs you made..."
                        rows={6}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Video Walkthrough (optional)
                      </label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Max 512MB. Show us your demo in action!
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isUploading
                        ? 'Uploading video...'
                        : isSubmitting
                        ? 'Submitting...'
                        : 'Submit Application'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
