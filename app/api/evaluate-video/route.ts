import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import { openai } from '@/lib/openai';
import type { Challenge, Submission } from '@/lib/types';
import { writeFile, readFile, readdir, mkdir, rm } from 'fs/promises';
import { createReadStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const maxDuration = 300;

export async function POST(request: Request) {
  const startTime = new Date().toISOString();
  console.log(`[evaluate-video] === FUNCTION INVOKED at ${startTime} ===`);

  let submissionId: string | null = null;

  try {
    const body = await request.json();
    submissionId = body.submission_id;
    console.log(`[evaluate-video] Processing submission_id: ${submissionId} at ${startTime}`);

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
    }

    const submission_id = submissionId;

    // Fetch submission with challenge (retry a few times in case of race condition)
    console.log('[evaluate-video] Fetching submission from database...');
    let submission = null;
    let subError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        console.log(`[evaluate-video] Retrying submission fetch, attempt ${attempt + 1}...`);
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s between retries
      }
      console.log(`[evaluate-video] Supabase query attempt ${attempt + 1}...`);
      const result = await supabaseAdmin
        .from('submissions')
        .select('*, challenge:challenges(*)')
        .eq('id', submission_id)
        .single();
      console.log(`[evaluate-video] Supabase query completed, data: ${!!result.data}, error: ${!!result.error}`);

      if (result.data) {
        submission = result.data;
        break;
      }
      subError = result.error;
    }

    if (!submission) {
      console.error('[evaluate-video] Submission not found after retries:', subError);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    console.log('[evaluate-video] Submission fetched successfully');

    const typedSubmission = submission as unknown as Submission;

    if (!typedSubmission.video_path) {
      return NextResponse.json({ error: 'No video to evaluate' }, { status: 400 });
    }

    const challenge = Array.isArray(submission.challenge)
      ? submission.challenge[0]
      : submission.challenge;

    const typedChallenge = challenge as Challenge;

    // Fetch video from URL
    console.log('[evaluate-video] Fetching video from:', typedSubmission.video_path);
    const fetchStart = Date.now();
    const videoResponse = await fetch(typedSubmission.video_path);
    console.log(`[evaluate-video] Fetch response received in ${Date.now() - fetchStart}ms, status:`, videoResponse.status);

    if (!videoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
    }

    const bufferStart = Date.now();
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const videoSizeMB = videoBuffer.byteLength / (1024 * 1024);
    console.log(`[evaluate-video] Video buffered in ${Date.now() - bufferStart}ms, size: ${videoSizeMB.toFixed(2)}MB`);

    // Check file size - skip processing for videos over 150MB
    const MAX_VIDEO_SIZE_MB = 150;
    if (videoSizeMB > MAX_VIDEO_SIZE_MB) {
      console.warn(`[evaluate-video] Video too large (${videoSizeMB.toFixed(2)}MB > ${MAX_VIDEO_SIZE_MB}MB), skipping automated analysis`);
      await supabaseAdmin
        .from('evaluations')
        .update({
          video_notes: `Video file too large for automated analysis (${videoSizeMB.toFixed(0)}MB). Requires human review.`,
        })
        .eq('submission_id', submission_id);
      return NextResponse.json({ message: 'Video too large for automated processing' }, { status: 200 });
    }

    // Check if ffmpeg is available
    try {
      await execAsync('which ffmpeg', { timeout: 5000 });
    } catch {
      console.warn('[evaluate-video] ffmpeg not available, skipping video evaluation');
      // Update evaluation to indicate video needs manual review
      await supabaseAdmin
        .from('evaluations')
        .update({
          video_notes: 'Video uploaded but automated evaluation unavailable (ffmpeg not installed). Manual review required.',
        })
        .eq('submission_id', submission_id);
      return NextResponse.json({ message: 'Video evaluation skipped - ffmpeg not available' }, { status: 200 });
    }

    // Create temp directory for processing
    const tempDir = join(tmpdir(), `signal-video-${submission_id}`);
    await mkdir(tempDir, { recursive: true });

    const videoPath = join(tempDir, 'video.mp4');
    await writeFile(videoPath, videoBuffer);

    // Extract frames using ffmpeg (1 frame every 2 seconds, max 30 frames)
    console.log('[evaluate-video] Extracting frames...');
    const ffmpegStart = Date.now();
    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -vf "fps=0.33,scale=480:-1" -frames:v 10 -q:v 5 "${tempDir}/frame_%03d.jpg" -y`,
        { timeout: 60000 }
      );
      console.log(`[evaluate-video] Frames extracted in ${Date.now() - ffmpegStart}ms`);
    } catch (ffmpegError) {
      console.error('[evaluate-video] ffmpeg error after', Date.now() - ffmpegStart, 'ms:', ffmpegError);
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
      return NextResponse.json({ error: 'Failed to extract video frames' }, { status: 500 });
    }

    // Read extracted frames
    const files = await readdir(tempDir);
    const frameFiles = files.filter(f => f.startsWith('frame_')).sort();

    if (frameFiles.length === 0) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
      return NextResponse.json({ error: 'No frames extracted from video' }, { status: 500 });
    }

    console.log(`[evaluate-video] Extracted ${frameFiles.length} frames`);

    // Convert frames to base64
    const frameImages: Array<{ type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }> = [];
    for (const frameFile of frameFiles) {
      const frameData = await readFile(join(tempDir, frameFile));
      frameImages.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: frameData.toString('base64'),
        },
      });
    }

    // Extract audio and transcribe with Whisper
    let transcript = '';
    const audioPath = join(tempDir, 'audio.mp3');

    try {
      console.log('[evaluate-video] Extracting audio...');
      await execAsync(
        `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 "${audioPath}" -y`,
        { timeout: 60000 }
      );

      console.log('[evaluate-video] Transcribing with Whisper...');
      const whisperStart = Date.now();
      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(audioPath),
        model: 'whisper-1',
      });
      transcript = transcription.text;
      console.log(`[evaluate-video] Whisper completed in ${Date.now() - whisperStart}ms, transcript: ${transcript.substring(0, 100)}...`);
    } catch (audioError) {
      console.warn('[evaluate-video] Audio extraction/transcription failed:', audioError);
      // Continue without transcript - video may not have audio
    }

    // Clean up temp files
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});

    // Build evaluation prompt
    const transcriptSection = transcript
      ? `\n\nAUDIO TRANSCRIPT OF CANDIDATE DEMO VIDEO:\n"${transcript}"\n`
      : '\n\nNOTE: No audio transcript available for this video.\n';

    const prompt = `You are evaluating a candidate's demo video for a technical job application.

You have access to:
- Video frames (images showing what the candidate demonstrated)
- Audio transcript (what the candidate said during the demo)${transcriptSection}
ROLE: ${typedChallenge.role_description}

PROJECT REQUIREMENTS:
${typedChallenge.challenge_text}

EVALUATE ON THREE DIMENSIONS (1-10 each):

1. DOES IT WORK?
   - Is there a functioning solution demonstrated?
   - Are the project requirements addressed?
   - Does it show real functionality, not just static mockups?

2. DO THEY UNDERSTAND IT?
   - Can they explain their technical choices (in transcript)?
   - Do they show awareness of trade-offs and limitations?
   - Does the demo structure suggest they understand what they built?

3. CAN THEY COMMUNICATE IT?
   - Is the demo focused and efficient?
   - Is the verbal explanation clear and helpful?
   - Do they come across as someone you'd want on the team?

CALIBRATION:

A 10 means:
- The solution clearly works
- The candidate clearly understands and can explain what they built
- The presentation is clear and professional
- You would confidently move them to the next round

Do NOT deduct points for:
- Minor UI polish issues
- Not covering every edge case
- Nervous speaking (if content is clear)
- Video/audio quality (if understandable)
- Accent or speaking style

Give LOW scores (1-4) when you see:
- Solution doesn't actually work or is barely functional
- Candidate can't explain basic choices ("I just followed a tutorial")
- Just scrolling through code with no working demo
- Obvious template/boilerplate with minimal customization
- No visible effort beyond the bare minimum

Provide your evaluation as JSON only (no markdown):
{
  "does_it_work": <1-10>,
  "do_they_understand": <1-10>,
  "can_they_communicate": <1-10>,
  "overall_score": <1-10 average of above three>,
  "short_summary": "<3-5 words: what they built, e.g. 'AI recipe generator app'>",
  "summary": "<2-3 sentence summary including what the candidate said>",
  "green_flags": ["<positive signal 1>", "<positive signal 2>"],
  "red_flags": []
}`;

    // Call Claude with extracted frames and transcript
    console.log('[evaluate-video] Calling Claude with', frameImages.length, 'frames and transcript...');
    const claudeStart = Date.now();

    const introText = transcript
      ? `The following ${frameImages.length} images are frames extracted from a candidate's demo video (1 frame every 2 seconds). The audio has been transcribed and is included in the evaluation prompt. Analyze both the visual demonstration and what the candidate said.`
      : `The following ${frameImages.length} images are frames extracted from a candidate's demo video (1 frame every 2 seconds). No audio was available. Analyze the visual demonstration.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: introText,
            },
            ...frameImages,
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    const responseText = content.text;
    console.log(`[evaluate-video] Claude response received in ${Date.now() - claudeStart}ms`);

    // Parse response - extract JSON from anywhere in the response
    let evaluation;
    try {
      let jsonText = responseText.trim();
      // Remove markdown code blocks
      if (jsonText.includes('```')) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) jsonText = match[1].trim();
      }
      // Try to find JSON object in the text
      const jsonMatch = jsonText.match(/\{[\s\S]*"overall_score"[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      evaluation = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[evaluate-video] Parse error:', parseError);
      console.error('[evaluate-video] Raw response:', responseText.substring(0, 500));
      // Fallback: create a minimal evaluation
      evaluation = {
        does_it_work: 1,
        do_they_understand: 1,
        can_they_communicate: 1,
        overall_score: 1,
        short_summary: 'Evaluation failed',
        summary: 'Could not parse video evaluation response.',
        green_flags: [],
        red_flags: ['Automated evaluation failed'],
      };
    }

    // Update evaluation with video score
    const shortSummary = evaluation.short_summary || 'Demo project';
    const scores = `Works: ${evaluation.does_it_work}/10 | Understands: ${evaluation.do_they_understand}/10 | Communicates: ${evaluation.can_they_communicate}/10`;
    const greenFlags = evaluation.green_flags?.length ? `\n\nGreen flags: ${evaluation.green_flags.join(', ')}` : '';
    const redFlags = evaluation.red_flags?.length ? `\n\nRed flags: ${evaluation.red_flags.join(', ')}` : '';
    const videoNotes = `${shortSummary}\n\n${evaluation.summary}\n\n${scores}${greenFlags}${redFlags}`;

    const { data: evalData, error: evalError } = await supabaseAdmin
      .from('evaluations')
      .update({
        video_score: evaluation.overall_score,
        video_notes: videoNotes,
      })
      .eq('submission_id', submission_id)
      .select()
      .single();

    if (evalError) {
      console.error('[evaluate-video] Update error:', evalError);
      return NextResponse.json({ error: evalError.message }, { status: 500 });
    }

    console.log('[evaluate-video] Video evaluation saved successfully');
    return NextResponse.json(evalData, { status: 200 });

  } catch (error) {
    console.error('[evaluate-video] Unhandled error:', error);
    // Attempt cleanup on error
    if (submissionId) {
      const tempDir = join(tmpdir(), `signal-video-${submissionId}`);
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Video evaluation failed'
    }, { status: 500 });
  }
}
