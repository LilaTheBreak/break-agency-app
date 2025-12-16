import { scoreCreator } from '../../services/scoring/creatorScoringEngine.js';

/**
 * A workflow function triggered after a user completes onboarding.
 * @param userId - The ID of the user who completed onboarding.
 */
export async function handleOnboardingCompletion(userId: string) {
  console.log(`[WORKFLOW] Onboarding completed for user ${userId}. Triggering initial scoring.`);
  await scoreCreator(userId);
  // Additional logic like sending a welcome email can go here.
}