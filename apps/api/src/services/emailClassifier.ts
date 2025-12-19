import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  body: string;
  receivedAt: Date;
}

interface OpportunityClassification {
  isOpportunity: boolean;
  confidence: number;
  category: string | null;
  isUrgent: boolean;
  details: {
    brandName: string | null;
    opportunityType: string | null;
    deliverables: string[] | null;
    dates: string | null;
    location: string | null;
    paymentDetails: string | null;
    contactEmail: string | null;
  };
  suggestedActions: string[];
  reasoning: string;
}

const OPPORTUNITY_CATEGORIES = {
  EVENT_INVITE: "EVENT_INVITE",
  BRAND_OPPORTUNITY: "BRAND_OPPORTUNITY",
  COLLABORATION_REQUEST: "COLLABORATION_REQUEST",
  INBOUND_BRAND_INTEREST: "INBOUND_BRAND_INTEREST"
};

const EXCLUDE_PATTERNS = [
  /unsubscribe/i,
  /newsletter/i,
  /receipt/i,
  /order confirmation/i,
  /shipping notification/i,
  /password reset/i,
  /verify your email/i,
  /noreply@/i,
  /no-reply@/i
];

export async function classifyEmailOpportunity(
  message: EmailMessage
): Promise<OpportunityClassification> {
  // Quick filters for obvious non-opportunities
  if (shouldExcludeEmail(message)) {
    return {
      isOpportunity: false,
      confidence: 0,
      category: null,
      isUrgent: false,
      details: {
        brandName: null,
        opportunityType: null,
        deliverables: null,
        dates: null,
        location: null,
        paymentDetails: null,
        contactEmail: null
      },
      suggestedActions: [],
      reasoning: "Excluded: automated/promotional email"
    };
  }

  // Use AI to classify
  try {
    const prompt = buildClassificationPrompt(message);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert email classifier for content creators. 
          Your job is to identify genuine business opportunities and extract key details.
          
          Opportunity Categories:
          - EVENT_INVITE: Launches, panels, dinners, press events, trips
          - BRAND_OPPORTUNITY: Paid campaigns, sponsorships, partnerships, ambassadorships
          - COLLABORATION_REQUEST: UGC requests, gifted collabs, affiliate proposals
          - INBOUND_BRAND_INTEREST: Brands expressing interest (even without pricing)
          
          Return ONLY valid JSON with no additional text.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from AI");
    }

    const classification = JSON.parse(response);
    
    return {
      isOpportunity: classification.isOpportunity || false,
      confidence: classification.confidence || 0,
      category: classification.category || null,
      isUrgent: classification.isUrgent || false,
      details: {
        brandName: classification.brandName || null,
        opportunityType: classification.opportunityType || null,
        deliverables: classification.deliverables || null,
        dates: classification.dates || null,
        location: classification.location || null,
        paymentDetails: classification.paymentDetails || null,
        contactEmail: extractEmail(message.from) || null
      },
      suggestedActions: classification.suggestedActions || [],
      reasoning: classification.reasoning || ""
    };
  } catch (error) {
    console.error("AI classification error:", error);
    
    // Fallback to basic pattern matching
    return basicPatternMatch(message);
  }
}

function shouldExcludeEmail(message: EmailMessage): boolean {
  const text = `${message.subject} ${message.from} ${message.body}`.toLowerCase();
  
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(text));
}

function buildClassificationPrompt(message: EmailMessage): string {
  // Truncate body to avoid token limits
  const bodyPreview = message.body.slice(0, 3000);
  
  return `Analyze this email and determine if it's a genuine creator opportunity:

Subject: ${message.subject}
From: ${message.from}
Date: ${message.receivedAt.toISOString()}

Body:
${bodyPreview}

Return JSON with this structure:
{
  "isOpportunity": boolean,
  "confidence": number (0-1),
  "category": "EVENT_INVITE" | "BRAND_OPPORTUNITY" | "COLLABORATION_REQUEST" | "INBOUND_BRAND_INTEREST" | null,
  "isUrgent": boolean (check for urgent language or tight deadlines),
  "brandName": string or null,
  "opportunityType": string or null (e.g. "Sponsored Post", "Event Attendance", "UGC Content"),
  "deliverables": array of strings or null,
  "dates": string or null (any mentioned dates/deadlines),
  "location": string or null (for events),
  "paymentDetails": string or null (budget, rates, compensation mentioned),
  "suggestedActions": array of strings (e.g. ["Reply with availability", "Request full brief", "Negotiate rate"]),
  "reasoning": string (brief explanation)
}`;
}

function basicPatternMatch(message: EmailMessage): OpportunityClassification {
  const text = `${message.subject} ${message.body}`.toLowerCase();
  
  // Brand opportunity keywords
  const brandKeywords = [
    "campaign", "partnership", "sponsor", "collaborate", "ambassador",
    "paid opportunity", "compensation", "budget", "rate"
  ];
  
  // Event keywords
  const eventKeywords = [
    "event", "launch", "invite", "dinner", "panel", "press",
    "rsvp", "attend", "trip", "experience"
  ];
  
  // Collaboration keywords
  const collabKeywords = [
    "ugc", "gifted", "affiliate", "content creation", "product review"
  ];
  
  let category: string | null = null;
  let confidence = 0;
  
  if (brandKeywords.some(kw => text.includes(kw))) {
    category = OPPORTUNITY_CATEGORIES.BRAND_OPPORTUNITY;
    confidence = 0.7;
  } else if (eventKeywords.some(kw => text.includes(kw))) {
    category = OPPORTUNITY_CATEGORIES.EVENT_INVITE;
    confidence = 0.7;
  } else if (collabKeywords.some(kw => text.includes(kw))) {
    category = OPPORTUNITY_CATEGORIES.COLLABORATION_REQUEST;
    confidence = 0.6;
  }
  
  // Check for urgency
  const urgentKeywords = ["urgent", "asap", "deadline", "expires", "limited time"];
  const isUrgent = urgentKeywords.some(kw => text.includes(kw));
  
  return {
    isOpportunity: category !== null,
    confidence,
    category,
    isUrgent,
    details: {
      brandName: null,
      opportunityType: null,
      deliverables: null,
      dates: null,
      location: null,
      paymentDetails: null,
      contactEmail: extractEmail(message.from)
    },
    suggestedActions: category ? ["Review opportunity", "Reply"] : [],
    reasoning: "Basic pattern match"
  };
}

function extractEmail(from: string): string | null {
  const emailMatch = from.match(/[\w.-]+@[\w.-]+\.\w+/);
  return emailMatch ? emailMatch[0] : null;
}
