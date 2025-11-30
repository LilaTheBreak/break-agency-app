/**
 * Builds a structured JSON array of slides from a CampaignAIPlan.
 * @param plan - The AI-generated campaign plan.
 * @returns An array of slide objects.
 */
export function generateDeckSlides(plan: any) {
  console.log(`[DECK TEMPLATE] Generating slides for plan ${plan.id}`);
  return [
    {
      title: 'Campaign Proposal',
      subtitle: `A Partnership with ${plan.brandName}`,
      type: 'cover',
    },
    {
      title: 'Executive Summary',
      content: plan.aiSummary,
      type: 'summary',
    },
    {
      title: 'Campaign Objectives',
      content: 'Our primary goal is to...', // This would be extracted from the brief
      type: 'objectives',
    },
    {
      title: 'Key Messaging & Tone',
      content: 'The campaign will focus on...', // Extracted from brief
      type: 'messaging',
    },
    {
      title: 'Target Audience',
      content: plan.audience,
      type: 'audience',
    },
    {
      title: 'Creative Concepts',
      content: (plan.strategy?.creativeDirections || []).join('\n- '),
      type: 'concepts',
    },
    {
      title: 'Proposed Deliverables',
      content: (plan.deliverables || []).map((d: any) => `${d.quantity}x ${d.platform} ${d.type}`).join('\n'),
      type: 'deliverables',
    },
    {
      title: 'Budget Overview',
      content: `Total Estimated Budget: £${plan.budget?.total}`,
      type: 'budget',
    },
    // Add more slides for KPIs, Talent, Timeline, etc.
    {
      title: 'Next Steps',
      content: '1. Approve creative brief\n2. Finalize contract\n3. Campaign kick-off',
      type: 'next_steps',
    },
  ];
}