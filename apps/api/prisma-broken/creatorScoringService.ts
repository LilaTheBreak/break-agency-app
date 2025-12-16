import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

// This is a mock AI client. In a real application, this would make a call
// to an external AI service like OpenAI, Anthropic, or a custom model endpoint.
const aiClient = {
  analyzeCreatorProfile: async (profileInput: any) => {
    console.log('AI Client: Analyzing creator profile...', profileInput);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI response
    const score = Math.floor(Math.random() * 50) + 50; // 50-99
    const upgrade_suggestion = score > 85;
    const recommended_role = score > 80 ? 'EXCLUSIVE_TALENT' : score > 65 ? 'TALENT' : 'UGC_CREATOR';

    return {
      score,
      reasoning: {
        profile_completeness: 0.9,
        audience_engagement: 0.78,
        content_quality: 0.88,
        notes: 'Strong potential for brand partnerships in the lifestyle sector.',
      },
      recommended_role,
      upgrade_suggestion,
      ugc_categories: ['lifestyle', 'fashion'],
    };
  },
};

export async function scoreCreator(user: User, profileInput: any) {
  const result = await aiClient.analyzeCreatorProfile(profileInput);

  // Create a new score record linked to the user
  return prisma.creatorScore.create({
    data: {
      userId: user.id,
      score: result.score,
      reasoning: result.reasoning,
      recommendedRole: result.recommended_role,
      upgradeSuggested: result.upgrade_suggestion,
      ugcCategories: result.ugc_categories ?? [],
    },
  });
}