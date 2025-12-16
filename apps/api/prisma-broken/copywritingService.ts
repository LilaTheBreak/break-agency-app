import { PrismaClient, Deliverable } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simulates an AI engine to generate a full suite of copy for a deliverable.
 * @param deliverable The deliverable to generate copy for.
 * @returns The newly created GeneratedCopy object.
 */
export const generateCopy = async (deliverable: Deliverable) => {
  if (!deliverable.userId || !deliverable.campaignId) {
    throw new Error('Deliverable must be linked to a user and campaign.');
  }

  // 1. Ingest context (brief, creative direction, persona)
  const creativeDirection = await prisma.creativeDirection.findUnique({
    where: { campaignId: deliverable.campaignId },
  });
  const persona = await prisma.creatorPersonaProfile.findUnique({
    where: { userId: deliverable.userId },
  });

  // 2. Mock AI Generation based on context
  const tone = persona?.writingStyle || 'Engaging and Authentic';

  const hooks = creativeDirection?.hooks || [
    'You need to hear this...',
    'The ultimate hack for [topic]...',
    'Unboxing the product everyone is talking about.',
  ];

  const ctaOptions = [
    'Check the link in my bio to learn more!',
    'Comment your thoughts below! 👇',
    'Shop now and use my code CREATOR15 for 15% off.',
  ];

  const hashtags = ['#ad', `#${deliverable.title.replace(/\s+/g, '')}`, '#newproduct'];

  const shortCaption = `${hooks[0]} ${ctaOptions[0]} ${hashtags.join(' ')}`;
  const longCaption = `Let's talk about ${deliverable.title}. ${creativeDirection?.concept?.summary || ''} I've been using it for a week and here are my thoughts... ${ctaOptions[1]} ${hashtags.join(' ')}`;

  const scriptOutline = [
    { time: '0-3s', action: 'Hook: Show the problem visually.' },
    { time: '4-8s', action: 'Introduce the product as the solution.' },
    { time: '9-15s', action: 'Quick demo and share key benefit.' },
    { time: '16-20s', action: 'Call to action with text overlay.' },
  ];

  // 3. Create the GeneratedCopy record in the database
  const newCopy = await prisma.generatedCopy.create({
    data: {
      deliverableId: deliverable.id,
      userId: deliverable.userId,
      platform: 'INSTAGRAM', // Should come from deliverable
      longCaption,
      shortCaption,
      scriptOutline,
      fullScript: scriptOutline.map(s => s.action).join('\n'),
      hooks,
      ctaOptions,
      hashtags,
      toneVersion: tone,
    },
  });

  return newCopy;
};