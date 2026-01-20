/**
 * Assisted Outreach Service
 * 
 * Generates premium, quality-first outreach email drafts
 * NO bulk sending, NO automation, NO spammy vibes
 * 
 * Version A: Strategic / Consultative
 * Version B: Creative / Opportunity-led
 * Version C: Founder-to-Founder
 */

import prisma from "../lib/prisma.js";
import { openai } from "../lib/openai.js";

export interface OutreachContext {
  campaignId: string;
  brandName: string;
  brandWebsite?: string;
  brandIndustry?: string;
  brandRegion?: string;
  
  contactFirstName: string;
  contactLastName: string;
  contactRole: string;
  contactEmail: string;
  
  goal: "STRATEGY_AUDIT" | "CREATIVE_CONCEPTS" | "CREATOR_MATCHING";
  senderName: string;  // e.g., "Lila" or "Maureen"
  senderTitle?: string;
}

export interface OutreachDraft {
  version: "A" | "B" | "C";
  subject: string;
  body: string;
  positioning: string; // Description of approach
}

/**
 * Generate 3 draft emails for outreach campaign
 * 
 * @param context - Brand, contact, and goal information
 * @returns Array of 3 OutreachDraft objects (A, B, C)
 */
export async function generateAssistedOutreachDrafts(
  context: OutreachContext
): Promise<OutreachDraft[]> {
  try {
    // Build prompt for AI
    const goalDescription = {
      STRATEGY_AUDIT: "Schedule a discovery call to audit brand strategy and identify creator partnership opportunities",
      CREATIVE_CONCEPTS: "Collaborate on creative concepts and campaigns using Break's creator platform",
      CREATOR_MATCHING: "Showcase AI-powered creator matching specifically for the brand's objectives"
    }[context.goal];

    const prompt = buildOutreachPrompt(context, goalDescription);

    // Call OpenAI to generate drafts
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert business development professional specializing in high-end, premium outreach. 
You write emails that feel human, consultative, and never salesy. 
You never use emojis, calendar links, or aggressive sales language.
Each email is 2-3 short paragraphs maximum.
The recipient is a luxury brand director - they should feel the reach out respects their time.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Parse AI response to extract 3 drafts
    const drafts = parseOutreachDrafts(content, context);

    // Save drafts to database
    const savedDrafts = await Promise.all(
      drafts.map(draft =>
        prisma.outreachDraft.create({
          data: {
            campaignId: context.campaignId,
            version: draft.version,
            subject: draft.subject,
            body: draft.body,
            isApproved: false,
            wasEdited: false
          }
        })
      )
    );

    return drafts;
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error generating drafts:", error);
    throw new Error("Failed to generate outreach drafts");
  }
}

/**
 * Build the prompt for AI draft generation
 */
function buildOutreachPrompt(
  context: OutreachContext,
  goalDescription: string
): string {
  return `Generate 3 premium, personalized cold outreach email drafts for:

**RECIPIENT:**
- Name: ${context.contactFirstName} ${context.contactLastName}
- Role: ${context.contactRole}
- Company: ${context.brandName}
- Website: ${context.brandWebsite || "Unknown"}
- Industry: ${context.brandIndustry || "Unknown"}
- Region: ${context.brandRegion || "Unknown"}

**SENDER:**
- Name: ${context.senderName}
- Title: ${context.senderTitle || "Creator Partnerships"}
- Company: Break Agency
- Website: break.com

**PURPOSE:**
${goalDescription}

**REQUIREMENTS:**
- Each draft should have a distinct positioning and approach
- Draft A: Strategic / Consultative (Focus on business value, audit framing)
- Draft B: Creative / Opportunity-led (Focus on creative possibilities, project opportunity)
- Draft C: Founder-to-Founder (Personal, direct, peer-to-peer tone)
- Each email: 2-3 short paragraphs MAX
- NO emojis, NO calendar links, NO aggressive sales language
- NO subject line buzzwords (avoid "Quick question", "Opportunity", etc)
- Professional, respectful, consultative tone
- Personalized with brand/contact details
- Include ${context.senderName}'s name as sender

**OUTPUT FORMAT:**
Provide response as JSON array with 3 objects:
[
  {
    "version": "A",
    "subject": "...",
    "body": "...",
    "positioning": "Strategic / Consultative"
  },
  {
    "version": "B",
    "subject": "...",
    "body": "...",
    "positioning": "Creative / Opportunity-led"
  },
  {
    "version": "C",
    "subject": "...",
    "body": "...",
    "positioning": "Founder-to-Founder"
  }
]

Generate only the JSON array, no other text.`;
}

/**
 * Parse AI response and extract 3 draft emails
 */
function parseOutreachDrafts(
  aiResponse: string,
  context: OutreachContext
): OutreachDraft[] {
  try {
    // Extract JSON from response (AI might include some explanation)
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!Array.isArray(parsed) || parsed.length !== 3) {
      throw new Error("Response did not contain exactly 3 drafts");
    }

    // Clean and validate each draft
    return parsed.map((draft: any, idx: number) => {
      const version = ["A", "B", "C"][idx] as "A" | "B" | "C";
      
      return {
        version,
        subject: (draft.subject || "").trim().substring(0, 100),
        body: (draft.body || "").trim(),
        positioning: draft.positioning || ""
      };
    });
  } catch (error) {
    console.error("[ASSISTED_OUTREACH] Error parsing AI response:", error);
    // Fallback: generate basic templates
    return generateFallbackDrafts(context);
  }
}

/**
 * Fallback drafts if AI generation fails
 * Ensures system continues to work
 */
function generateFallbackDrafts(context: OutreachContext): OutreachDraft[] {
  const goalText = {
    STRATEGY_AUDIT: "explore creator partnership opportunities",
    CREATIVE_CONCEPTS: "discuss creative collaboration",
    CREATOR_MATCHING: "showcase creator matching capabilities"
  }[context.goal];

  return [
    {
      version: "A",
      subject: `${context.brandName} × Creator Partnerships - Strategic Opportunity`,
      body: `Hi ${context.contactFirstName},

I've been following ${context.brandName}'s work in ${context.brandIndustry || "your industry"} and believe there's real opportunity to ${goalText} through our platform.

We help brands like yours connect with the right creators at scale. Would you be open to a brief call to explore this?

Best,
${context.senderName}
Break Agency`,
      positioning: "Strategic / Consultative"
    },
    {
      version: "B",
      subject: `New Creator Ideas for ${context.brandName}`,
      body: `${context.contactFirstName},

I came across your work at ${context.brandName} and immediately thought of some creators who'd be perfect for what you're building.

Rather than send a long list, I'd love to schedule 15 minutes to understand your current priorities first. Would next week work?

${context.senderName}
Break`,
      positioning: "Creative / Opportunity-led"
    },
    {
      version: "C",
      subject: `Let's talk creators`,
      body: `${context.contactFirstName},

We work with brands like ${context.brandName} to find and manage creator partnerships. It's become a critical channel, and I think we could add real value.

Free to grab coffee next week? Happy to travel if you're in ${context.brandRegion || "London"}.

${context.senderName}`,
      positioning: "Founder-to-Founder"
    }
  ];
}

/**
 * Detect sentiment in reply email
 * Lightweight keyword-based approach
 */
export function detectSentiment(replyText: string): {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  confidence: number;
} {
  const text = replyText.toLowerCase();

  // Positive signals
  const positiveSignals = [
    /interested|i'm in|let's|sounds good|great idea|love this|perfect timing/,
    /call|meeting|schedule|when can we|how about/,
    /absolutely|definitely|would love|count me in/
  ];

  // Negative signals
  const negativeSignals = [
    /not interested|not at this time|unfortunately|can't|don't think/,
    /remove|unsubscribe|stop|don't contact|spam|too busy/,
    /no thanks|not now|no way/
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveSignals.forEach(signal => {
    if (signal.test(text)) positiveCount++;
  });

  negativeSignals.forEach(signal => {
    if (signal.test(text)) negativeCount++;
  });

  if (positiveCount > negativeCount) {
    return {
      sentiment: "POSITIVE",
      confidence: Math.min(0.95, 0.6 + positiveCount * 0.15)
    };
  } else if (negativeCount > positiveCount) {
    return {
      sentiment: "NEGATIVE",
      confidence: Math.min(0.95, 0.6 + negativeCount * 0.15)
    };
  }

  return {
    sentiment: "NEUTRAL",
    confidence: 0.5
  };
}

export default {
  generateAssistedOutreachDrafts,
  detectSentiment
};
