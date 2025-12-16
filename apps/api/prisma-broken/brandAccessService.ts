import { User, SubscriptionStatus } from '@prisma/client';

/**
 * Checks if a user has a premium brand subscription.
 * @param user The user object, which must include subscription_status.
 * @returns True if the user's subscription status is 'PREMIUM'.
 */
export const isPremiumBrand = (user: Pick<User, 'subscription_status'>): boolean => {
  return user.subscription_status === 'PREMIUM';
};

/**
 * Middleware-like function to assert that a user has a premium subscription.
 * Throws an error if the user is not premium, which can be caught by an error handler to send a 402 response.
 * @param user The user object.
 */
export const assertPremium = (user: Pick<User, 'subscription_status'>) => {
  if (!isPremiumBrand(user)) {
    const error: any = new Error('This feature requires a Premium subscription.');
    error.statusCode = 402; // Payment Required
    throw error;
  }
};

/**
 * Filters a creator's profile data based on the viewing brand's subscription status.
 * Free brands will see a locked/limited version of premium talent profiles.
 * @param brandUser The brand user viewing the profile.
 * @param creatorProfile The full profile of the creator being viewed.
 * @returns A full or locked profile object.
 */
export const filterProfileForBrand = (brandUser: User, creatorProfile: any) => {
  const premiumTalentCategories = ['EXCLUSIVE', 'TALENT', 'FOUNDER'];

  // If the brand is premium or the creator is not premium talent, return the full profile.
  if (isPremiumBrand(brandUser) || !premiumTalentCategories.includes(creatorProfile.roster_category)) {
    return { ...creatorProfile, locked: false };
  }

  // Otherwise, return a locked profile for the Free brand.
  const lockedProfileObject = {
    id: creatorProfile.id,
    name: creatorProfile.name,
    avatarUrl: creatorProfile.avatarUrl,
    roster_category: creatorProfile.roster_category,
    locked: true,
    // Include a few teaser fields
    followerCount: creatorProfile.socialAccounts?.[0]?.followers,
    bioSnippet: creatorProfile.bio?.substring(0, 100) + '...',
  };

  return lockedProfileObject;
};