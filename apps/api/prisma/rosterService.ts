import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Constructs the complete roster based on the viewing user's role.
 * @param user The authenticated user object.
 * @returns An object containing different categories of the roster.
 */
export async function getRosterForUser(user: User) {
  const viewingRole = user.role;

  // For Brand Free, only return VIPs and UGC creators
  if (viewingRole === 'BRAND_FREE') {
    const vip = await prisma.friendOfHouse.findMany();
    const ugc = await prisma.user.findMany({
      where: { role: 'UGC_CREATOR', include_in_roster: true },
    });
    return { vip, ugc };
  }

  // Talent and UGC creators do not have access to the roster
  if (viewingRole === 'TALENT' || viewingRole === 'UGC_CREATOR') {
    return {};
  }

  // For all other roles (Admin, Founder, Exclusive, Brand Premium), fetch all categories
  const [exclusive, talent, founder, vip, ugc] = await Promise.all([
    prisma.user.findMany({ where: { roster_category: 'EXCLUSIVE', include_in_roster: true } }),
    prisma.user.findMany({ where: { roster_category: 'TALENT', include_in_roster: true } }),
    prisma.user.findMany({ where: { roster_category: 'FOUNDER', include_in_roster: true } }),
    prisma.friendOfHouse.findMany(),
    prisma.user.findMany({ where: { role: 'UGC_CREATOR', include_in_roster: true } }),
  ]);

  const fullRoster = { exclusive, talent, founder, vip, ugc };

  // Apply final filtering based on specific roles
  switch (viewingRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'FOUNDER':
    case 'BRAND_PREMIUM':
      return fullRoster;
    case 'EXCLUSIVE_TALENT':
      return { exclusive, founder }; // Exclusive talent see each other and founders
    default:
      return {};
  }
}