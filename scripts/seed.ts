import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Question IDs
const Q1_ID = randomUUID();
const Q2_ID = randomUUID();
const C1_ID = randomUUID();
const C2_ID = randomUUID();
const C3_ID = randomUUID();
const C4_ID = randomUUID();

const challenge = {
  id: randomUUID(),
  role_description: 'AI Builder',
  challenge_requirements: null,
  intro_text: `As an AI Builder, you'll own the full path from problem to shipped system to real-world adoption. That means:

• Identifying business processes that evolved before modern AI existed and redesigning them from scratch as AI-native workflows
• Prototyping quickly, testing assumptions, and iterating based on operational reality
• Working across functions, including engineering, regulatory & compliance, and go-to-market — not specializing in just one
• Collaborating with domain experts to pressure-test ideas before they go live
• Making explicit decisions about where AI should take on responsibility — and where it shouldn't

This isn't a role where you execute someone else's roadmap. You bring the judgment.`,
  challenge_text: `Design and prototype an AI system that meaningfully expands what a human can do. This might mean:

• Rebuilding a legacy workflow
• Handling far more complexity or serving far more people
• Making higher-quality decisions
• Operating reliably in situations that were previously impractical

Your system must:
• Clearly define the human's role
• Take on real cognitive or operational responsibility
• Explicitly name one critical decision that must remain human — and why`,
  questions_json: [
    {
      id: Q1_ID,
      text: 'Why Wealthsimple?',
      order: 1,
      word_limit: 300,
      criteria: [
        { id: C1_ID, text: 'Shows genuine understanding of Wealthsimple\'s mission and values', order: 1 },
        { id: C2_ID, text: 'Connects personal motivation to the company\'s goals', order: 2 },
      ],
    },
    {
      id: Q2_ID,
      text: 'What is the one critical decision in your system that must remain human?',
      order: 2,
      word_limit: 400,
      criteria: [
        { id: C3_ID, text: 'Identifies a genuinely critical decision point', order: 1 },
        { id: C4_ID, text: 'Provides clear reasoning for why AI shouldn\'t make this decision', order: 2 },
      ],
    },
  ],
  deadline: null,
};

// Candidate data with varying quality
const candidates = [
  // HIGH QUALITY (6 candidates)
  {
    name: 'Candidate 1',
    email: 'sarah.chen@example.com',
    quality: 'high',
    demo_url: 'https://github.com/sarahchen/ai-tax-optimizer',
    answers: [
      {
        question_id: Q1_ID,
        text: `Wealthsimple represents something rare in fintech: a company that genuinely believes financial tools should work for everyone, not just the wealthy. I've spent five years building AI systems at scale, and I've seen how technology can either widen or narrow inequality gaps.

What draws me specifically is how Wealthsimple thinks about automation. You don't just automate for efficiency—you automate to make sophisticated financial strategies accessible. The halal investing portfolio, the socially responsible options, the roundup features—these aren't afterthoughts. They're design decisions that show you understand your users are people with values, not just accounts to optimize.

I want to build AI that expands what's possible for people who've been underserved by traditional finance. Wealthsimple is the place to do that.`,
      },
      {
        question_id: Q2_ID,
        text: `In my tax optimization system, the AI handles scenario modeling, identifies deductions, and surfaces opportunities—but the decision to realize a capital loss must remain human.

Here's why: tax-loss harvesting involves real financial consequences that depend on factors the AI can't fully model. A user might need that asset for an upcoming purchase. They might have emotional attachment to a stock they inherited. They might be planning a major life change that would make the "optimal" tax move suboptimal.

More importantly, there's a psychological dimension. When people make their own financial decisions, they own the outcomes. When an AI makes the decision, a bad outcome feels like betrayal. The human must remain the author of their financial story—we just give them better information to write it with.`,
      },
    ],
    scores: { q1c1: 5, q1c2: 5, q2c1: 5, q2c2: 5 },
    url_passed: true,
    video_score: 9,
    video_summary: 'AI tax optimization tool', // PRIORITY
  },
  {
    name: 'Candidate 2',
    email: 'marcus.w@example.com',
    quality: 'high',
    demo_url: 'https://replit.com/@marcusw/portfolio-rebalancer',
    answers: [
      {
        question_id: Q1_ID,
        text: `I've been a Wealthsimple user since 2019. What kept me wasn't the interface or the fees—it was the feeling that you actually wanted me to succeed financially, not just stay engaged with the app.

The AI Builder role feels like a chance to work on the problems I care about most: helping people make better decisions with their money. I've built recommendation systems, I've built trading algorithms, but I've never worked somewhere that combined technical excellence with genuine mission alignment.

Also, candidly: I've seen what happens when AI in finance goes wrong. Flash crashes. Biased lending. Opaque decisions. I want to build AI that does the opposite—that makes finance more transparent, more accessible, and more trustworthy.`,
      },
      {
        question_id: Q2_ID,
        text: `My system automates portfolio rebalancing, but the decision to change risk tolerance must stay human.

The AI can detect life changes from behavioral signals—spending patterns shifting, unusual withdrawals, changes in deposit frequency. It can even suggest that a user's stated risk tolerance might no longer match their actual situation. But it cannot decide for them.

Risk tolerance isn't just a number. It's a reflection of someone's relationship with uncertainty, their life circumstances, their values. Two people with identical financial situations might need completely different portfolios because they experience risk differently. The AI can inform, can prompt reflection, can make the conversation easier—but the human has to own the answer.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 4, q2c1: 4, q2c2: 4 },
    url_passed: true,
    video_score: 7,
    video_summary: 'Portfolio rebalancing automation', // MAYBE
  },
  {
    name: 'Candidate 3',
    email: 'priya.sharma@example.com',
    quality: 'high',
    demo_url: 'https://ai-financial-coach.vercel.app',
    answers: [
      {
        question_id: Q1_ID,
        text: `I grew up watching my parents struggle with financial decisions—not because they weren't smart, but because the system wasn't designed for immigrants who didn't have generational wealth or financial advisors in their network.

Wealthsimple is building what my parents needed: sophisticated financial tools that don't require a minimum balance or a referral from the right people. The democratization isn't just marketing—I've seen the product decisions that back it up.

As an AI Builder here, I could help create systems that actively bridge knowledge gaps instead of exploiting them. That's not something I can do at most companies.`,
      },
      {
        question_id: Q2_ID,
        text: `In my financial coaching system, the AI provides personalized guidance and tracks progress, but the decision to take on debt must remain human.

Debt is fundamentally different from other financial decisions because it constrains future choices. An AI can model whether someone can afford a mortgage payment, but it can't know whether that mortgage will feel like a home or a prison in five years.

The human must weigh factors that aren't in the data: family plans, career ambitions, tolerance for being locked in. The AI's job is to make sure they understand the true cost and the realistic scenarios—not to make the call.`,
      },
    ],
    scores: { q1c1: 5, q1c2: 4, q2c1: 5, q2c2: 4 },
    url_passed: true,
    video_score: 8,
    video_summary: 'AI financial coaching app', // PRIORITY
  },
  {
    name: 'Candidate 4',
    email: 'james.liu@example.com',
    quality: 'high',
    demo_url: 'https://github.com/jamesliu/fraud-detection-demo',
    answers: [
      {
        question_id: Q1_ID,
        text: `I spent three years at a bank building fraud detection systems. The technology worked, but the institution didn't care about false positives—blocked transactions, frozen accounts, customers treated like criminals. The incentives were wrong.

Wealthsimple has the incentives right. When you're building for people who are trusting you with their financial future, you can't afford to be cavalier about errors. Every false positive is a broken promise.

I want to build AI that's accountable to users, not just to risk metrics. That requires working somewhere that actually measures success by user outcomes, not just model performance.`,
      },
      {
        question_id: Q2_ID,
        text: `My fraud detection system flags suspicious transactions and can automatically block obvious fraud, but the decision to permanently close an account must remain human.

Account closure is irreversible and consequential. It affects credit scores, disrupts bill payments, and can cascade into real financial harm. The AI might be 99% confident that an account is being used for fraud—but that 1% represents real people who would be wrongly cut off from their money.

A human reviewer can call the customer, investigate context, make judgment calls that consider the full picture. The AI identifies patterns; the human decides fates.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 4, q2c1: 4, q2c2: 4 },
    url_passed: true,
    video_score: 6,
    video_summary: 'Fraud detection with human oversight', // MAYBE
  },
  {
    name: 'Candidate 5',
    email: 'elena.r@example.com',
    quality: 'high',
    demo_url: 'https://retirement-planner-ai.netlify.app',
    answers: [
      {
        question_id: Q1_ID,
        text: `Most fintech companies optimize for engagement metrics that don't correlate with user wellbeing. Wealthsimple is one of the few that seems to understand the difference.

I've been following your product evolution—the way you've added features that help people save more without making the app addictive, the way you've resisted gamification that works against users. These are hard choices that most companies don't make.

I want to build AI at a company where "user-aligned" isn't just positioning. The AI Builder role is a chance to shape what that looks like at the system level.`,
      },
      {
        question_id: Q2_ID,
        text: `My retirement planning system handles projections, scenario modeling, and contribution optimization, but the decision about when to retire must remain human.

Retirement timing involves trade-offs that can't be quantified: more time with aging parents, pursuing a second career, health considerations, partner synchronization. The "optimal" retirement date mathematically might be the wrong date for a person's life.

The AI can show someone exactly what different retirement dates mean financially—but it can't weigh working another year against watching grandchildren grow up. That calculus is fundamentally human.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 4, q2c1: 4, q2c2: 3 },
    url_passed: true,
    video_score: 5,
    video_summary: 'AI retirement planning system', // MAYBE
  },
  {
    name: 'Candidate 6',
    email: 'david.park@example.com',
    quality: 'high',
    demo_url: 'https://github.com/dpark/investment-research-ai',
    answers: [
      {
        question_id: Q1_ID,
        text: `Wealthsimple is solving a problem I care deeply about: making good financial advice accessible to people who can't afford wealth managers.

I've worked on AI systems at scale—recommendation engines, search ranking, personalization. The common thread was optimizing for metrics that sometimes worked against users. At Wealthsimple, the business model and user interests are aligned. You make money when users succeed, not when they make mistakes.

That alignment is rare and valuable. It's the foundation you need to build AI that genuinely helps people.`,
      },
      {
        question_id: Q2_ID,
        text: `My investment research system synthesizes information across sources, identifies relevant trends, and summarizes complex financial data—but the decision to invest in individual stocks must remain human.

Individual stock picking is fundamentally speculative. The AI can provide better information, faster—but it can't remove the uncertainty. If the AI makes the pick and it goes wrong, the user learns nothing and loses trust. If the human makes the pick with AI assistance and it goes wrong, they understand why and can make better decisions next time.

Ownership of decisions is essential for learning. The AI should make users more capable, not more dependent.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 4, q2c1: 4, q2c2: 4 },
    url_passed: true,
    video_score: 6,
    video_summary: 'Investment research AI assistant', // MAYBE
  },

  // MEDIUM QUALITY (8 candidates)
  {
    name: 'Candidate 7',
    email: 'alex.t@example.com',
    quality: 'medium',
    demo_url: 'https://github.com/alexthompson/budget-bot',
    answers: [
      {
        question_id: Q1_ID,
        text: `Wealthsimple seems like a great place to work on interesting AI problems. I've been following the company for a while and I like the product. The mission of making financial tools accessible is something I believe in.

I have experience building chatbots and recommendation systems that I think would translate well to this role. I'm excited about the opportunity to work on AI that helps people with their finances.`,
      },
      {
        question_id: Q2_ID,
        text: `In my budgeting system, the AI categorizes transactions and suggests budgets, but the decision to set savings goals should stay human.

People have different priorities for their money. The AI might think someone should save more, but they might have personal reasons to spend on certain things. Only the human knows what matters to them.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 3, q2c1: 4, q2c2: 3 },
    url_passed: true,
    video_score: 4,
    video_summary: 'Budget categorization bot', // SKIP - low video
  },
  {
    name: 'Candidate 8',
    email: 'jennifer.kim@example.com',
    quality: 'medium',
    demo_url: 'https://expense-tracker-demo.herokuapp.com',
    answers: [
      {
        question_id: Q1_ID,
        text: `I use Wealthsimple for my own investments and have always been impressed with how easy it is to use. The company has a good reputation for treating users well, which is important to me.

I want to work on AI that makes a difference in people's lives. Finance is an area where AI can really help people who don't have access to expensive advisors. This role seems like a good fit for my skills.`,
      },
      {
        question_id: Q2_ID,
        text: `My expense tracking system automatically categorizes spending and identifies patterns, but major purchase decisions should remain human.

Big purchases like a car or vacation involve more than just financial calculations. People need to decide based on their values and life circumstances, not just what the numbers say. The AI provides information but shouldn't make these calls.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 4, q2c1: 3, q2c2: 4 },
    url_passed: true,
    video_score: 7,
    video_summary: 'Expense tracking system', // MAYBE
  },
  {
    name: 'Candidate 9',
    email: 'mbrown@example.com',
    quality: 'medium',
    demo_url: 'https://stock-alerts.vercel.app',
    answers: [
      {
        question_id: Q1_ID,
        text: `Wealthsimple is one of the top fintech companies in Canada and I'd love to be part of the team. The AI Builder role caught my attention because I have experience with machine learning and want to apply it to finance.

I think there's a lot of potential to use AI to help people make better investment decisions. Wealthsimple is well-positioned to do this.`,
      },
      {
        question_id: Q2_ID,
        text: `My stock alerting system monitors portfolios and sends notifications about significant events, but the decision to sell should remain human.

Selling a stock can have tax implications and other consequences that the system can't fully understand. The human needs to make the final call based on their complete financial situation.`,
      },
    ],
    scores: { q1c1: 3, q1c2: 4, q2c1: 3, q2c2: 4 },
    url_passed: true,
    video_score: 5,
    video_summary: 'Stock alert notifications', // MAYBE
  },
  {
    name: 'Candidate 10',
    email: 'lisa.wang@example.com',
    quality: 'medium',
    demo_url: 'https://github.com/lisawang/savings-gamification',
    answers: [
      {
        question_id: Q1_ID,
        text: `I've been interested in fintech for a while and Wealthsimple stands out as a company that cares about its users. The products are well-designed and the company culture seems positive.

Building AI for finance is exciting because of the real-world impact. I want to help people achieve their financial goals through better technology.`,
      },
      {
        question_id: Q2_ID,
        text: `My savings gamification system encourages saving through rewards and challenges, but the decision about emergency fund size should remain human.

Everyone's situation is different. Some people need more of a buffer than others depending on job stability, health, and family. The AI can suggest but the human should decide what feels safe to them.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 3, q2c1: 4, q2c2: 3 },
    url_passed: true,
    video_score: 3,
    video_summary: 'Savings gamification app', // SKIP - low video
  },
  {
    name: 'Candidate 11',
    email: 'ryan.murphy@example.com',
    quality: 'medium',
    demo_url: 'https://crypto-portfolio-tracker.web.app',
    answers: [
      {
        question_id: Q1_ID,
        text: `Wealthsimple Crypto got me interested in the company. I appreciate that you make investing accessible to regular people, not just finance experts.

I have a background in data science and I'm interested in applying ML to financial problems. The AI Builder role seems like a good match for someone who wants to build practical AI solutions.`,
      },
      {
        question_id: Q2_ID,
        text: `My portfolio tracker shows crypto holdings and performance, but the decision to invest in specific cryptocurrencies must remain human.

Crypto is highly volatile and speculative. People need to make their own choices about risk. The AI can show data and trends but shouldn't recommend specific coins to buy.`,
      },
    ],
    scores: { q1c1: 3, q1c2: 4, q2c1: 4, q2c2: 3 },
    url_passed: true,
    video_score: 6,
    video_summary: 'Crypto portfolio tracker', // MAYBE
  },
  {
    name: 'Candidate 12',
    email: 'amanda.f@example.com',
    quality: 'medium',
    demo_url: 'https://bill-splitter-ai.netlify.app',
    answers: [
      {
        question_id: Q1_ID,
        text: `I discovered Wealthsimple when I started investing a few years ago. What I like about the company is that it doesn't make you feel stupid for not knowing everything about finance.

I'm looking for a role where I can build AI that helps everyday people. Finance is intimidating for a lot of people and I think AI can make it more approachable.`,
      },
      {
        question_id: Q2_ID,
        text: `My bill splitting app uses AI to fairly divide shared expenses, but deciding who pays for group gifts should remain human.

Group dynamics and relationships are complicated. The AI can suggest fair splits mathematically, but people might want to pay more or less based on their relationship with others in the group. Only humans understand these social dynamics.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 4, q2c1: 3, q2c2: 4 },
    url_passed: false,
    video_score: 7,
    video_summary: 'AI bill splitting app', // SKIP - URL fails
  },
  {
    name: 'Candidate 13',
    email: 'chris.a@example.com',
    quality: 'medium',
    demo_url: 'https://github.com/canderson/financial-news-summarizer',
    answers: [
      {
        question_id: Q1_ID,
        text: `I'm drawn to Wealthsimple because of the focus on user experience. Too many financial apps are confusing and overwhelming. Your approach of making things simple without being simplistic is impressive.

I have NLP experience that I think could be valuable for building AI features. The financial domain is interesting because the stakes are real.`,
      },
      {
        question_id: Q2_ID,
        text: `My news summarizer condenses financial news into key points, but the decision to act on news should remain human.

News can be misleading or out of context. Even with AI summarization, humans need to interpret what the news means for their specific situation and decide whether to change their investments accordingly.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 3, q2c1: 4, q2c2: 3 },
    url_passed: true,
    video_score: 4,
    video_summary: 'Financial news summarizer', // SKIP - low video
  },
  {
    name: 'Candidate 14',
    email: 'nicole.z@example.com',
    quality: 'medium',
    demo_url: 'https://subscription-manager.vercel.app',
    answers: [
      {
        question_id: Q1_ID,
        text: `Wealthsimple's mission resonates with me because I've seen friends and family struggle with financial planning. Having access to good tools can make a real difference.

I'm excited about the AI Builder role because it combines my technical skills with meaningful impact. Building AI for finance feels like work that matters.`,
      },
      {
        question_id: Q2_ID,
        text: `My subscription manager identifies and tracks recurring charges, but the decision to cancel a subscription must remain human.

What seems like a waste of money might be important to someone. Maybe they're not using a gym membership now but plan to start next month. The AI can highlight spending patterns, but only the person knows what they actually value.`,
      },
    ],
    scores: { q1c1: 3, q1c2: 4, q2c1: 3, q2c2: 4 },
    url_passed: true,
    video_score: 5,
    video_summary: 'Subscription manager tool', // MAYBE
  },

  // LOW QUALITY (6 candidates)
  {
    name: 'Candidate 15',
    email: 'jake.wilson@example.com',
    quality: 'low',
    demo_url: 'https://todo-app-demo.com',
    answers: [
      {
        question_id: Q1_ID,
        text: `Wealthsimple seems like a cool company. I've heard good things and the office looks nice. I'm interested in AI and finance seems like a growing field.`,
      },
      {
        question_id: Q2_ID,
        text: `The human should decide when to use the AI. The AI is just a tool so the human is always in control of everything important.`,
      },
    ],
    scores: { q1c1: 3, q1c2: 3, q2c1: 3, q2c2: 3 },
    url_passed: true,
    video_score: 3,
    video_summary: 'Unrelated todo app', // SKIP - low video
  },
  {
    name: 'Candidate 16',
    email: 'brittany.m@example.com',
    quality: 'low',
    demo_url: 'https://my-portfolio-site.wixsite.com',
    answers: [
      {
        question_id: Q1_ID,
        text: `I want to work at Wealthsimple because I need a job and this one pays well. I saw the job posting and thought I could probably do it. AI is the future and I want to be part of it.`,
      },
      {
        question_id: Q2_ID,
        text: `Humans should make all important decisions. AI is good for simple tasks but anything that matters should have a human doing it. My system would let humans override the AI anytime.`,
      },
    ],
    scores: { q1c1: 2, q1c2: 2, q2c1: 2, q2c2: 2 },
    url_passed: true,
    video_score: 2,
    video_summary: 'Personal portfolio website', // SKIP - questions fail
  },
  {
    name: 'Candidate 17',
    email: 'tyler.j@example.com',
    quality: 'low',
    demo_url: 'https://broken-link-404.com',
    answers: [
      {
        question_id: Q1_ID,
        text: `WealthSimple is a big name in Canada. I think working here would look good on my resume. The AI role is interesting because AI is a hot field right now.`,
      },
      {
        question_id: Q2_ID,
        text: `All money decisions should be made by humans because AI can make mistakes. The AI should only suggest things and never actually do anything without asking first.`,
      },
    ],
    scores: { q1c1: 3, q1c2: 4, q2c1: 3, q2c2: 3 },
    url_passed: false,
    video_score: 6,
    video_summary: 'Basic ML demo', // SKIP - URL fails
  },
  {
    name: 'Candidate 18',
    email: 'sam.davis@example.com',
    quality: 'low',
    demo_url: 'https://github.com/samdavis/hello-world',
    answers: [
      {
        question_id: Q1_ID,
        text: `I like the Wealthsimple app, it's easy to use. I think I could help make it even better. The AI job sounds fun and I'm good with computers.`,
      },
      {
        question_id: Q2_ID,
        text: `The human should decide everything important. AI is just a helper. In my system the human would be in charge and the AI would assist them.`,
      },
    ],
    scores: { q1c1: 4, q1c2: 3, q2c1: 3, q2c2: 4 },
    url_passed: true,
    video_score: 4,
    video_summary: 'Basic hello world repo', // SKIP - low video
  },
  {
    name: 'Candidate 19',
    email: 'kevin.clark@example.com',
    quality: 'low',
    demo_url: 'https://example.com',
    answers: [
      {
        question_id: Q1_ID,
        text: `Toronto is a nice city and Wealthsimple is based there. I'm looking for tech jobs and this one seems good. I don't have much finance experience but I'm a quick learner.`,
      },
      {
        question_id: Q2_ID,
        text: `I think buying and selling should be human decisions. AI can help with analysis but the person should always click the button themselves.`,
      },
    ],
    scores: { q1c1: 3, q1c2: 3, q2c1: 4, q2c2: 3 },
    url_passed: true,
    video_score: null,
    video_summary: null, // MAYBE - no video yet
  },
  {
    name: 'Candidate 20',
    email: 'ashley.w@example.com',
    quality: 'low',
    demo_url: 'https://linkedin.com/in/ashleywhite',
    answers: [
      {
        question_id: Q1_ID,
        text: `Wealthsimple is a good company with good benefits. I'm interested in finance and tech. This role combines both which is exciting.`,
      },
      {
        question_id: Q2_ID,
        text: `Humans should decide about money since it's personal. The AI helps but final say goes to the user. This is important for trust.`,
      },
    ],
    scores: { q1c1: 3, q1c2: 4, q2c1: 4, q2c2: 3 },
    url_passed: true,
    video_score: 8,
    video_summary: 'Solid AI assistant demo', // PRIORITY
  },
];

async function seed() {
  console.log('Seeding database...');

  // Clear existing submissions and evaluations (keeps challenges/positions)
  console.log('Clearing existing submissions...');
  await supabase.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Create challenge
  console.log('Creating challenge...');
  const { error: challengeError } = await supabase.from('challenges').insert(challenge);
  if (challengeError) {
    console.error('Error creating challenge:', challengeError);
    return;
  }

  // Create submissions and evaluations
  console.log('Creating submissions and evaluations...');
  for (const candidate of candidates) {
    const submissionId = randomUUID();

    // Create submission
    const { error: subError } = await supabase.from('submissions').insert({
      id: submissionId,
      challenge_id: challenge.id,
      candidate_name: candidate.name,
      candidate_email: candidate.email,
      demo_url: candidate.demo_url,
      answers_json: candidate.answers,
      video_path: candidate.video_score != null ? `https://example.com/videos/${submissionId}.mp4` : null,
    });

    if (subError) {
      console.error(`Error creating submission for ${candidate.name}:`, subError);
      continue;
    }

    // Create evaluation
    const criterionScores = [
      { criterion_id: C1_ID, question_id: Q1_ID, score: candidate.scores.q1c1, reasoning: 'Evaluation reasoning' },
      { criterion_id: C2_ID, question_id: Q1_ID, score: candidate.scores.q1c2, reasoning: 'Evaluation reasoning' },
      { criterion_id: C3_ID, question_id: Q2_ID, score: candidate.scores.q2c1, reasoning: 'Evaluation reasoning' },
      { criterion_id: C4_ID, question_id: Q2_ID, score: candidate.scores.q2c2, reasoning: 'Evaluation reasoning' },
    ];

    const avgScore = (candidate.scores.q1c1 + candidate.scores.q1c2 + candidate.scores.q2c1 + candidate.scores.q2c2) / 4;

    const { error: evalError } = await supabase.from('evaluations').insert({
      id: randomUUID(),
      submission_id: submissionId,
      criterion_scores_json: criterionScores,
      url_passed: candidate.url_passed,
      url_notes: candidate.url_passed ? 'URL resolves and is relevant' : 'URL does not resolve or is not relevant to the challenge',
      video_score: candidate.video_score,
      video_notes: candidate.video_summary ? `${candidate.video_summary}\n\nWorks: ${candidate.video_score}/10 | Understands: ${candidate.video_score}/10 | Communicates: ${candidate.video_score}/10` : null,
      summary_bullets: [
        `${candidate.quality.charAt(0).toUpperCase() + candidate.quality.slice(1)} quality submission`,
        `Average score: ${avgScore.toFixed(1)}/5`,
        candidate.url_passed ? 'Demo URL is functional' : 'Demo URL has issues',
      ],
      worth_human_attention: avgScore >= 4 && candidate.url_passed,
      flag_reason: null,
      rejection_draft: avgScore < 3 ? `Dear ${candidate.name.split(' ')[0]},\n\nThank you for your interest in the AI Builder role at Wealthsimple. After careful review, we've decided to move forward with other candidates.\n\nWe appreciate the time you invested in your application.\n\nBest,\nThe Wealthsimple Team` : null,
      interview_draft: (avgScore >= 3 && candidate.url_passed && (candidate.video_score ?? 0) >= 8) ? `Dear ${candidate.name.split(' ')[0]},\n\nThank you for applying to the AI Builder role at Wealthsimple. We were impressed by your submission and would love to learn more about you.\n\nWould you be available for a 30-minute conversation next week? Please let us know your availability and we'll send over a calendar invite.\n\nLooking forward to speaking with you!\n\nBest,\nThe Wealthsimple Team` : null,
    });

    if (evalError) {
      console.error(`Error creating evaluation for ${candidate.name}:`, evalError);
    } else {
      console.log(`Created: ${candidate.name} (${candidate.quality})`);
    }
  }

  console.log('Done!');
}

seed().catch(console.error);
