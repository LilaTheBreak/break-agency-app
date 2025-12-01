import { PrismaClient, User, UserRoleType } from '@prisma/client';

const prisma = new PrismaClient();

interface RosterFilters {
  name?: string;
  category?: string;
  tags?: string[];
  platform?: string;
}

const applyUserFilters = (filters: RosterFilters) => {
  const where: any = { include_in_roster: true };
  if (filters.name) {
    where.name = { contains: filters.name, mode: 'insensitive' };
  }
  if (filters.category) {
    where.roster_category = filters.category;
  }
  if (filters.tags && filters.tags.length > 0) {
    where.ugc_categories = { hasSome: filters.tags };
  }
  if (filters.platform) {
    where.socialAccounts = { some: { platform: filters.platform.toUpperCase() as any } };
  }
  return where;
};

const applyVipFilters = (filters: RosterFilters) => {
    const where: any = {};
    if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.category) {
        where.category = { contains: filters.category, mode: 'insensitive' };
    }
    if (filters.tags && filters.tags.length > 0) {
        where.customTags = { hasSome: filters.tags };
    }
    return where;
};

/**
 * Fetches the complete roster, applying any specified filters.
 */
const getFullRoster = async (filters: RosterFilters) => {
  const userWhere = applyUserFilters(filters);
  const vipWhere = applyVipFilters(filters);

  const [exclusiveTalent, talent, founders, ugc, vip] = await Promise.all([
    prisma.user.findMany({ where: { ...userWhere, roster_category: 'EXCLUSIVE' }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { ...userWhere, roster_category: 'TALENT' }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { ...userWhere, roster_category: 'FOUNDER' }, orderBy: { name: 'asc' } }),
    prisma.uGCListing.findMany({
      where: { approved: true, visibility: true, creator: userWhere },
      include: { creator: true },
      orderBy: { creator: { name: 'asc' } },
    }),
    prisma.friendsOfHouse.findMany({ where: vipWhere, orderBy: { name: 'asc' } }),
  ]);

  return { exclusiveTalent, talent, founders, ugc, vip };
};

/**
 * Fetches the limited roster for Brand Free users.
 */
const getBrandFreeRoster = async (filters: RosterFilters) => {
  const userWhere = applyUserFilters(filters);
  const vipWhere = applyVipFilters(filters);

  const [ugc, vip] = await Promise.all([
    prisma.uGCListing.findMany({
      where: { approved: true, visibility: true, creator: userWhere },
      include: { creator: true },
      orderBy: { creator: { name: 'asc' } },
    }),
    prisma.friendsOfHouse.findMany({ where: vipWhere, orderBy: { name: 'asc' } }),
  ]);

  // Return locked placeholders for premium categories
  return {
    exclusiveTalent: { locked: true, reason: 'Upgrade to Premium to view Exclusive Talent.' },
    talent: { locked: true, reason: 'Upgrade to Premium to view Managed Talent.' },
    founders: { locked: true, reason: 'Upgrade to Premium to view Founders.' },
    ugc,
    vip,
  };
};

/**
 * Main service function to get the appropriate roster based on the user's role.
 * @param user The authenticated user making the request.
 * @param filters Optional filters for searching the roster.
 * @returns A roster object filtered according to the user's permissions.
 */
export const getRosterForUser = async (user: User, filters: RosterFilters) => {
  const viewingRole = user.role as UserRoleType;

  switch (viewingRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'FOUNDER':
    case 'BRAND_PREMIUM':
      return await getFullRoster(filters);

    case 'BRAND_FREE':
      return await getBrandFreeRoster(filters);

    default: // Exclusive Talent, Talent, UGC Creators
      return {}; // Return an empty object for roles with no roster access
  }
};