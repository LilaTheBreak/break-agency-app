import prisma from '../../lib/prisma.js';

/**
 * Determines which parts of the roster a user is allowed to see.
 * @param user - The user object, including roles.
 */
export async function getVisibleRosterForUser(user: any) {
  const userRoles = user.roles?.map((r: any) => r.role.name) || [];

  const isFullAccess = userRoles.some((role: string) =>
    ['super_admin', 'admin', 'brand_premium'].includes(role)
  );

  const isBrandFree = userRoles.includes('brand_free');
  const isTalent = userRoles.some((role: string) =>
    ['exclusive_talent', 'talent', 'ugc'].includes(role)
  );

  // Talent sees an empty roster
  if (isTalent && !isFullAccess) {
    return {};
  }

  // Fetch all potential roster members
  const allTalent = await prisma.user.findMany({
    where: { include_in_roster: true },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      roster_category: true,
    },
  });

  const friendsOfHouse = await prisma.friendsOfHouse.findMany();

  // Group results
  const roster: Record<string, any[]> = {
    vip: friendsOfHouse,
    founders: [],
    exclusive: [],
    talent: [],
    ugc: [],
  };

  for (const person of allTalent) {
    const category = person.roster_category || 'talent';
    if (roster[category]) {
      roster[category].push(person);
    }
  }

  // Apply visibility rules
  if (isFullAccess) {
    return roster;
  }

  if (isBrandFree) {
    return {
      vip: roster.vip,
      ugc: roster.ugc,
    };
  }

  // Default to empty for any other unhandled roles
  return {};
}