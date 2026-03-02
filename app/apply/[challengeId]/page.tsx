'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useUploadThing } from '@/lib/uploadthing';
import type { Challenge, Question, Answer, CompanySettings } from '@/lib/types';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function isDeadlinePassed(deadline: string): boolean {
  return new Date(deadline) < new Date();
}

export default function ApplyPage() {
  const params = useParams();
  const challengeId = params.challengeId as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'application'>('overview');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { startUpload } = useUploadThing('videoUploader');

  const fetchData = useCallback(async () => {
    try {
      const [challengesRes, settingsRes] = await Promise.all([
        fetch('/api/challenges'),
        fetch('/api/settings'),
      ]);

      if (!challengesRes.ok) throw new Error('Failed to fetch');

      const challenges = await challengesRes.json();
      const found = challenges.find((c: Challenge) => c.id === challengeId);

      if (found) {
        setChallenge(found);
        const initialAnswers: Record<string, string> = {};
        (found.questions_json || []).forEach((q: Question) => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } else {
        setNotFound(true);
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setCompanySettings(settings);
      }
    } catch {
      setError('Failed to load application. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const deadlinePassed = challenge?.deadline && isDeadlinePassed(challenge.deadline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (anyOverLimit) {
      setError('One or more answers exceed the word limit. Please shorten them.');
      return;
    }

    if (deadlinePassed) {
      setError('The application deadline has passed.');
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
          candidate_email: email,
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
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-warning">
          Loading<span className="animate-blink">_</span>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-wider mb-2">
            Application Not Found
          </h1>
          <p className="text-muted-foreground">
            This application link is invalid or has expired.
          </p>
        </motion.div>
      </main>
    );
  }

  if (error && !challenge) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-wider mb-2">
            Error
          </h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </motion.div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
            className="text-6xl text-primary mb-6"
          >
            ◆
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground uppercase tracking-wider mb-3">
            Application Submitted
          </h1>
          <p className="text-muted-foreground">We&apos;ll be in touch.</p>
        </motion.div>
      </main>
    );
  }

  const companyName = companySettings?.company_name || 'Company';

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{companyName}</p>
          <h1 className="text-2xl font-bold text-foreground">
            {challenge?.role_description}
          </h1>
          {challenge?.deadline && (
            <p className={`text-sm mt-2 ${deadlinePassed ? 'text-destructive' : 'text-muted-foreground'}`}>
              {deadlinePassed ? 'Applications closed' : `Apply by ${formatDeadline(challenge.deadline)}`}
            </p>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('application')}
              className={`py-4 border-b-2 text-sm uppercase tracking-wider transition-colors ${
                activeTab === 'application'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Application
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Company Mission */}
              {companySettings?.mission && (
                <section>
                  <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    About {companyName}
                  </h2>
                  <p className="text-foreground whitespace-pre-wrap">
                    {companySettings.mission}
                  </p>
                </section>
              )}

              {/* Role Intro */}
              {challenge?.intro_text && (
                <section>
                  <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    About the Role
                  </h2>
                  <p className="text-foreground whitespace-pre-wrap">
                    {challenge.intro_text}
                  </p>
                </section>
              )}

              {/* Project Challenge */}
              {challenge?.challenge_text && (
                <section>
                  <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    The Project
                  </h2>
                  <Card>
                    <CardContent className="p-6">
                      <div className="whitespace-pre-wrap text-foreground">
                        {challenge.challenge_text}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Benefits */}
              {companySettings?.benefits && (
                <section>
                  <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Benefits
                  </h2>
                  <p className="text-foreground whitespace-pre-wrap">
                    {companySettings.benefits}
                  </p>
                </section>
              )}

              {/* Apply CTA */}
              <div className="pt-4">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => { setActiveTab('application'); window.scrollTo(0, 0); }}
                  disabled={!!deadlinePassed}
                >
                  {deadlinePassed ? 'Applications Closed' : 'Apply Now'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="application"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {deadlinePassed ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <h2 className="text-xl font-semibold text-foreground uppercase tracking-wider mb-2">
                      Applications Closed
                    </h2>
                    <p className="text-muted-foreground">
                      The deadline for this position has passed.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                            Full Name <span className="text-destructive">*</span>
                          </label>
                          <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                            Email <span className="text-destructive">*</span>
                          </label>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                      </div>

                      {questions.map((question, index) => (
                        <div key={question.id}>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                            {question.text} <span className="text-destructive">*</span>
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
                                ? 'border-destructive'
                                : ''
                            }
                          />
                          <div
                            className={`text-xs mt-2 flex justify-end uppercase tracking-wider ${
                              isOverLimit(question)
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {getWordCount(question.id)} / {getWordLimit(question)} words
                          </div>
                        </div>
                      ))}

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                          Link to your submission <span className="text-destructive">*</span>
                        </label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Link to your working demo, portfolio, or project
                        </p>
                        <Input
                          type="url"
                          value={demoUrl}
                          onChange={(e) => setDemoUrl(e.target.value)}
                          placeholder="https://"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                          Video Walkthrough{' '}
                          <span className="text-muted-foreground lowercase">(optional)</span>
                        </label>
                        <p className="text-sm text-muted-foreground mb-2">
                          MP4, WebM, or MOV. Max 512MB.
                        </p>
                        <Input
                          type="file"
                          accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                          onChange={handleVideoChange}
                        />
                        {videoFileName && (
                          <p className="text-sm text-primary mt-2">
                            Selected: {videoFileName}
                          </p>
                        )}
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-destructive text-destructive p-4 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        variant="primary"
                        disabled={isSubmitting || anyOverLimit}
                      >
                        {isUploading ? (
                          <>Uploading video<span className="animate-blink">_</span></>
                        ) : isSubmitting ? (
                          <>Submitting<span className="animate-blink">_</span></>
                        ) : (
                          'Submit Application'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
