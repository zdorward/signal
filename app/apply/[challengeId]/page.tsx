'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useUploadThing } from '@/lib/uploadthing';
import type { Challenge, Question, Answer } from '@/lib/types';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function ApplyPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { startUpload } = useUploadThing('videoUploader');

  const fetchChallenge = useCallback(async () => {
    try {
      const response = await fetch('/api/challenges');
      if (!response.ok) throw new Error('Failed to fetch');
      const challenges = await response.json();
      const found = challenges.find((c: Challenge) => c.id === challengeId);
      if (found) {
        setChallenge(found);
        // Initialize answers state
        const initialAnswers: Record<string, string> = {};
        (found.questions_json || []).forEach((q: Question) => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } else {
        setNotFound(true);
      }
    } catch {
      setError('Failed to load challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload an MP4, WebM, or MOV file.');
        return;
      }
      setVideoFile(file);
      setVideoFileName(file.name);
      setError('');
    }
  };

  const questions = (challenge?.questions_json || []) as Question[];

  const getWordCount = (questionId: string) => countWords(answers[questionId] || '');
  const getWordLimit = (question: Question) => question.word_limit || 500;
  const isOverLimit = (question: Question) =>
    getWordCount(question.id) > getWordLimit(question);

  const anyOverLimit = questions.some((q) => isOverLimit(q));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (anyOverLimit) {
      setError('One or more answers exceed the word limit. Please shorten them.');
      return;
    }

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

      const answersJson: Answer[] = questions.map((q) => ({
        question_id: q.id,
        text: answers[q.id] || '',
      }));

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          candidate_name: fullName,
          demo_url: demoUrl,
          answers_json: answersJson,
          video_path: videoPath,
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Submission failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading challenge...</div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Challenge Not Found
          </h1>
          <p className="text-gray-600">
            This challenge link is invalid or has expired.
          </p>
        </motion.div>
      </main>
    );
  }

  if (error && !challenge) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Your submission is in.
              </h1>
              <p className="text-lg text-gray-600">We&apos;ll be in touch.</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {challenge?.role_description}
                </h1>
              </div>

              {challenge?.intro_text && (
                <Card className="border-0 shadow-none bg-gray-50">
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed">
                      {challenge.intro_text}
                    </p>
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="h-12"
                  />
                </div>

                {questions.map((question, index) => (
                  <div key={question.id}>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {question.text} <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={answers[question.id] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: e.target.value,
                        }))
                      }
                      placeholder={`Question ${index + 1}`}
                      rows={6}
                      required
                      className={
                        isOverLimit(question)
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                    <div
                      className={`text-sm mt-2 flex justify-end ${
                        isOverLimit(question)
                          ? 'text-red-500 font-medium'
                          : 'text-gray-500'
                      }`}
                    >
                      {getWordCount(question.id)} / {getWordLimit(question)} words
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Link to your submission <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Link to your working demo, portfolio, or project
                  </p>
                  <Input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://"
                    required
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Video Walkthrough{' '}
                    <span className="text-gray-400">(optional)</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    MP4, WebM, or MOV. Max 512MB.
                  </p>
                  <Input
                    type="file"
                    accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoChange}
                    className="h-12"
                  />
                  {videoFileName && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {videoFileName}
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-700 p-4 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isSubmitting || anyOverLimit}
                >
                  {isUploading
                    ? 'Uploading video...'
                    : isSubmitting
                    ? 'Submitting...'
                    : 'Submit'}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
