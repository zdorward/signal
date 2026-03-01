import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Challenge, Submission, RubricItem } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: Request) {
  console.log('[evaluate] Starting evaluation...');

  try {
    const { submission_id } = await request.json();
    console.log('[evaluate] Submission ID:', submission_id);

    if (!submission_id) {
      console.log('[evaluate] ERROR: Missing submission_id');
      return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
    }

    // Step 1: Fetch submission with challenge
    console.log('[evaluate] Step 1: Fetching submission and challenge...');
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*, challenge:challenges(*)')
      .eq('id', submission_id)
      .single();

    if (subError) {
      console.log('[evaluate] ERROR fetching submission:', subError);
      return NextResponse.json({ error: 'Submission not found', details: subError }, { status: 404 });
    }

    if (!submission) {
      console.log('[evaluate] ERROR: Submission is null');
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    console.log('[evaluate] Submission fetched successfully:', {
      id: submission.id,
      candidate_name: submission.candidate_name,
      hasChallenge: !!submission.challenge
    });

    const challenge = Array.isArray(submission.challenge)
      ? submission.challenge[0]
      : submission.challenge;

    if (!challenge) {
      console.log('[evaluate] ERROR: Challenge not found in submission');
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    console.log('[evaluate] Challenge fetched successfully:', {
      id: challenge.id,
      role_description: challenge.role_description?.substring(0, 50) + '...'
    });

    const typedSubmission = submission as unknown as Submission;
    const typedChallenge = challenge as Challenge;
    const rubric = typedChallenge.rubric_json as RubricItem[];

    console.log('[evaluate] Rubric items:', rubric?.length || 0);

    // Step 2: Call Claude API
    console.log('[evaluate] Step 2: Calling Claude API...');

    const systemPrompt = `You are an expert technical evaluator. Evaluate the candidate's submission against the provided rubric.

For each criterion, provide:
- score: 0-100
- reasoning: Brief explanation

Also provide:
- summary_bullets: 3-5 key takeaways
- worth_human_attention: true if promising candidate, false if clear reject
- flag_reason: If flagged, explain why (null otherwise)
- rejection_draft: A polite, constructive rejection email (always include)

IMPORTANT: Respond with RAW JSON only. No markdown code blocks. Just the JSON object.

{
  "rubric_scores_json": [{"criterion": "...", "score": 85, "reasoning": "..."}],
  "summary_bullets": ["Point 1", "Point 2"],
  "worth_human_attention": true,
  "flag_reason": null,
  "rejection_draft": "Dear candidate..."
}`;

    const userPrompt = `## Challenge
${typedChallenge.challenge_text}

## Rubric
${rubric.map((r) => `- ${r.criterion} (${r.weight}%): ${r.description}`).join('\n')}

## Candidate Submission
Name: ${typedSubmission.candidate_name}
Demo URL: ${typedSubmission.demo_url}
${typedSubmission.video_path ? `Video: ${typedSubmission.video_path}` : ''}

Written Explanation:
${typedSubmission.written_explanation}`;

    let response;
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      console.log('[evaluate] Claude API call successful');
      console.log('[evaluate] Response stop_reason:', response.stop_reason);
      console.log('[evaluate] Response content type:', response.content[0]?.type);
    } catch (claudeError) {
      console.log('[evaluate] ERROR calling Claude API:', claudeError);
      return NextResponse.json({
        error: 'Claude API call failed',
        details: claudeError instanceof Error ? claudeError.message : String(claudeError)
      }, { status: 500 });
    }

    const content = response.content[0];
    if (content.type !== 'text') {
      console.log('[evaluate] ERROR: Unexpected response type:', content.type);
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    console.log('[evaluate] Claude response text (first 500 chars):', content.text.substring(0, 500));

    // Step 3: Parse Claude response
    console.log('[evaluate] Step 3: Parsing Claude response...');
    let evaluation;
    try {
      // Strip markdown code blocks if present
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      evaluation = JSON.parse(jsonText);
      console.log('[evaluate] JSON parsed successfully');
      console.log('[evaluate] Evaluation keys:', Object.keys(evaluation));
    } catch (parseError) {
      console.log('[evaluate] ERROR parsing JSON:', parseError);
      console.log('[evaluate] Full response text:', content.text);
      return NextResponse.json({
        error: 'Failed to parse evaluation JSON',
        details: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: content.text.substring(0, 1000)
      }, { status: 500 });
    }

    // Step 4: Insert evaluation into Supabase
    console.log('[evaluate] Step 4: Inserting evaluation into Supabase...');
    console.log('[evaluate] Evaluation data:', {
      submission_id,
      rubric_scores_count: evaluation.rubric_scores_json?.length,
      summary_bullets_count: evaluation.summary_bullets?.length,
      worth_human_attention: evaluation.worth_human_attention,
      has_flag_reason: !!evaluation.flag_reason,
      has_rejection_draft: !!evaluation.rejection_draft
    });

    const { data: evalData, error: evalError } = await supabaseAdmin
      .from('evaluations')
      .insert({
        submission_id,
        rubric_scores_json: evaluation.rubric_scores_json,
        summary_bullets: evaluation.summary_bullets,
        worth_human_attention: evaluation.worth_human_attention,
        flag_reason: evaluation.flag_reason || null,
        rejection_draft: evaluation.rejection_draft || null,
      })
      .select()
      .single();

    if (evalError) {
      console.log('[evaluate] ERROR inserting evaluation:', evalError);
      return NextResponse.json({
        error: 'Failed to save evaluation',
        details: evalError
      }, { status: 500 });
    }

    console.log('[evaluate] Evaluation saved successfully:', evalData.id);
    return NextResponse.json(evalData, { status: 201 });

  } catch (error) {
    console.log('[evaluate] UNHANDLED ERROR:', error);
    return NextResponse.json({
      error: 'Unhandled error in evaluate',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
