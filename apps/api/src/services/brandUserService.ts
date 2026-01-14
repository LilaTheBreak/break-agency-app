/**
 * Brand User Service
 * 
 * Handles brand user management, team invites, and workspace creation
 */

import prisma from '../lib/prisma';
import { BrandRole, isValidBrandRole } from '../utils/permissionHelper';

export interface CreateBrandInput {
  name: string;
  websiteUrl: string;
  domain: string;
  industry?: string;
}

export interface CreateBrandUserInput {
  brandId: string;
  userId: string;
  role?: BrandRole;
}

/**
 * Create a new brand
 */
export async function createBrand(input: CreateBrandInput) {
  const { name, websiteUrl, domain, industry } = input;

  const brand = await prisma.brand.create({
    data: {
      name,
      websiteUrl,
      domain,
      industry,
      values: [],
      restrictedCategories: [],
      preferredCreatorTypes: [],
    },
    include: {
      // @ts-ignore - Relation exists in schema but TypeScript cache is stale
      BrandUsers: true,
    },
  });

  return brand;
}

/**
 * Get brand by ID with users
 */
export async function getBrand(brandId: string) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      // @ts-ignore - Relation exists in schema but TypeScript cache is stale
      BrandUsers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return brand;
}

/**
 * Get brand by domain
 */
export async function getBrandByDomain(domain: string) {
  const brand = await prisma.brand.findUnique({
    where: { domain },
    include: {
      // @ts-ignore - Relation exists in schema but TypeScript cache is stale
      BrandUsers: true,
    },
  });

  return brand;
}

/**
 * Create first brand admin user
 */
export async function createBrandAdminUser(
  brandId: string,
  userId: string,
  role: BrandRole = "ADMIN"
) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const brandUser = await prisma.brandUser.create({
    data: {
      brandId,
      userId,
      role,
      status: "ACTIVE",
      acceptedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      brand: true,
    },
  });

  return brandUser;
}

/**
 * Invite a user to a brand
 */
export async function inviteUserToBrand(
  brandId: string,
  email: string,
  role: BrandRole = "VIEWER"
) {
  if (!isValidBrandRole(role)) {
    throw new Error("Invalid role");
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    throw new Error("User not found. User must sign up first.");
  }

  // Check if already a member
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const existingBrandUser = await prisma.brandUser.findUnique({
    where: {
      brandId_userId: {
        brandId,
        userId: existingUser.id,
      },
    },
  });

  if (existingBrandUser) {
    throw new Error("User is already a member of this brand");
  }

  // Create invite
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const brandUser = await prisma.brandUser.create({
    data: {
      brandId,
      userId: existingUser.id,
      role,
      status: "ACTIVE",
      acceptedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return brandUser;
}

/**
 * Get brand users
 */
export async function getBrandUsers(brandId: string) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const brandUsers = await prisma.brandUser.findMany({
    where: { brandId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return brandUsers;
}

/**
 * Get user's brands
 */
export async function getUserBrands(userId: string) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const brandUsers = await prisma.brandUser.findMany({
    where: { userId },
    include: {
      brand: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return brandUsers;
}

/**
 * Get user's role in brand
 */
export async function getUserBrandRole(
  brandId: string,
  userId: string
): Promise<BrandRole | null> {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const brandUser = await prisma.brandUser.findUnique({
    where: {
      brandId_userId: {
        brandId,
        userId,
      },
    },
  });

  return (brandUser?.role as BrandRole) || null;
}

/**
 * Update brand user role
 */
export async function updateBrandUserRole(
  brandId: string,
  userId: string,
  newRole: BrandRole
) {
  if (!isValidBrandRole(newRole)) {
    throw new Error("Invalid role");
  }

  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const brandUser = await prisma.brandUser.update({
    where: {
      brandId_userId: {
        brandId,
        userId,
      },
    },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return brandUser;
}

/**
 * Remove user from brand
 */
export async function removeUserFromBrand(
  brandId: string,
  userId: string
) {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  await prisma.brandUser.delete({
    where: {
      brandId_userId: {
        brandId,
        userId,
      },
    },
  });
}

/**
 * Check if user is brand member
 */
export async function isBrandMember(
  brandId: string,
  userId: string
): Promise<boolean> {
  // @ts-ignore - Model exists in schema but TypeScript cache is stale
  const brandUser = await prisma.brandUser.findUnique({
    where: {
      brandId_userId: {
        brandId,
        userId,
      },
    },
  });

  return !!brandUser;
}

/**
 * Check if user is brand admin
 */
export async function isBrandAdmin(
  brandId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserBrandRole(brandId, userId);
  return role === "ADMIN";
}

/**
 * Get all brands with pagination
 */
export async function listBrands(
  limit: number = 20,
  offset: number = 0
) {
  const brands = await prisma.brand.findMany({
    take: limit,
    skip: offset,
    include: {
      // @ts-ignore - Relation exists in schema but TypeScript cache is stale
      BrandUsers: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.brand.count();

  return { brands, total };
}
