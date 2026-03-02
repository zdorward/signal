import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Challenge, Submission, Question, Answer } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: Request) {
  console.log('[evaluate] Starting evaluation...');

  try {
    const { submission_id } = await request.json();

    if (!submission_id) {
      return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
    }

    // Step 1: Fetch submission with challenge
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*, challenge:challenges(*)')
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const challenge = Array.isArray(submission.challenge)
      ? submission.challenge[0]
      : submission.challenge;

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const typedSubmission = submission as unknown as Submission;
    const typedChallenge = challenge as Challenge;
    const questions = typedChallenge.questions_json as Question[];
    const answers = typedSubmission.answers_json as Answer[];

    // Step 2: Check URL and fetch content for relevance check
    let urlPassed = false;
    let urlNotes = '';
    let pageContent = '';

    try {
      const urlResponse = await fetch(typedSubmission.demo_url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Signal-Evaluation-Bot/1.0' },
      });

      if (urlResponse.ok) {
        const contentType = urlResponse.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const html = await urlResponse.text();
          // Extract text content (simple extraction)
          pageContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 2000);
        }
        urlPassed = true;
        urlNotes = `URL resolves (HTTP ${urlResponse.status})`;
      } else {
        urlNotes = `URL returned HTTP ${urlResponse.status}`;
      }
    } catch (urlError) {
      urlNotes = `URL check failed: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`;
    }

    // Step 3: Build evaluation prompt
    const systemPrompt = `You are an expert evaluator assessing candidate responses.

SCORING SCALE (use the full range):
5 - Exceeds expectations: Thoughtful, specific, demonstrates real understanding. Does NOT require perfection.
4 - Meets expectations: Solid answer that addresses the question well.
3 - Adequate: Answers the question but lacks depth or specificity.
2 - Weak: Partially addresses the question, missing key elements.
1 - Poor: Doesn't answer the question, generic, or off-topic.

CALIBRATION RULES:
- If an answer directly addresses the criterion with specific, relevant detail, score it 4 or 5.
- A 5 doesn't mean perfect - it means thoughtful and specific.
- Only score 1-2 for answers that genuinely miss the mark.
- Evaluate against the criterion ONLY. Don't impose unstated requirements.

REJECTION DRAFT:
- Always generate a rejection_draft for candidates who are clearly not suitable (avg score < 3, or URL is irrelevant)
- The draft should be professional, brief, and kind
- For strong candidates (avg score >= 4), set rejection_draft to null

OUTPUT FORMAT (raw JSON only, no markdown):
{
  "criterion_scores": [
    {"criterion_id": "...", "question_id": "...", "score": 4, "reasoning": "Brief explanation"}
  ],
  "url_relevant": true,
  "url_relevance_note": "Brief note about whether URL content matches challenge requirements",
  "summary_bullets": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
  "worth_human_attention": true,
  "flag_reason": null,
  "rejection_draft": "Dear [name],\\n\\nThank you for your interest... (or null for strong candidates)"
}`;

    // Build question/answer pairs with criteria
    let questionsSection = '';
    for (const question of questions) {
      const answer = answers.find((a) => a.question_id === question.id);
      questionsSection += `\n## Question: ${question.text}\n`;
      questionsSection += `Candidate's Answer: ${answer?.text || '(No answer provided)'}\n`;
      questionsSection += `\nEvaluate against these criteria:\n`;
      for (const criterion of question.criteria) {
        questionsSection += `- [${criterion.id}] ${criterion.text}\n`;
      }
    }

    const userPrompt = `## Challenge Context
Role: ${typedChallenge.role_description}
${typedChallenge.challenge_requirements ? `Requirements: ${typedChallenge.challenge_requirements}` : ''}

## Candidate
Name: ${typedSubmission.candidate_name}
Demo URL: ${typedSubmission.demo_url}
URL Status: ${urlNotes}
${pageContent ? `Page Content Preview: ${pageContent.substring(0, 500)}...` : ''}

## Questions and Answers
${questionsSection}

Evaluate each criterion and provide scores.`;

    // Step 4: Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    // Step 5: Parse response
    let evaluation;
    try {
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      evaluation = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[evaluate] Parse error:', parseError, content.text);
      return NextResponse.json({ error: 'Failed to parse evaluation' }, { status: 500 });
    }

    // Update URL status based on AI relevance check
    if (urlPassed && evaluation.url_relevant === false) {
      urlPassed = false;
      urlNotes = evaluation.url_relevance_note || 'URL content does not match challenge requirements';
    } else if (urlPassed && evaluation.url_relevance_note) {
      urlNotes = evaluation.url_relevance_note;
    }

    // Step 6: Save evaluation
    const { data: evalData, error: evalError } = await supabaseAdmin
      .from('evaluations')
      .insert({
        submission_id,
        criterion_scores_json: evaluation.criterion_scores || [],
        url_passed: urlPassed,
        url_notes: urlNotes,
        summary_bullets: evaluation.summary_bullets || ['Evaluation completed'],
        worth_human_attention: evaluation.worth_human_attention ?? false,
        flag_reason: evaluation.flag_reason || null,
        rejection_draft: evaluation.rejection_draft || null,
      })
      .select()
      .single();

    if (evalError) {
      console.error('[evaluate] Save error:', evalError);
      return NextResponse.json({ error: evalError.message }, { status: 500 });
    }

    console.log('[evaluate] Evaluation saved successfully:', evalData.id);

    // Fire-and-forget: trigger video evaluation if video exists
    if (typedSubmission.video_path) {
      console.log('[evaluate] Triggering video evaluation...');
      // Use Railway URL for video processing (has ffmpeg), fallback to same host
      const videoEvalUrl = process.env.VIDEO_EVAL_URL
        || `https://${request.headers.get('host') || 'localhost:3000'}`;
      console.log('[evaluate] Video eval URL:', videoEvalUrl);

      // Fire-and-forget with timeout - don't wait for Railway to finish processing
      const triggerVideoEval = async () => {
        // Small delay to ensure submission is committed to database
        await new Promise(r => setTimeout(r, 1000));
        console.log(`[evaluate] Triggering video eval at ${videoEvalUrl}/api/evaluate-video`);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const res = await fetch(`${videoEvalUrl}/api/evaluate-video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submission_id }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          console.log(`[evaluate] Video eval request sent, status: ${res.status}`);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            console.log('[evaluate] Video eval request timed out (expected - Railway processing in background)');
          } else {
            console.error('[evaluate] Video eval trigger failed:', err);
          }
        }
      };
      triggerVideoEval();
    }

    return NextResponse.json(evalData, { status: 201 });
  } catch (error) {
    console.error('[evaluate] Unhandled error:', error);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
