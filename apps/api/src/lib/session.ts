import { User } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: string; // Single canonical role
  onboardingStatus?: string;
};

export function buildSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role, // Single role from User.role enum
    onboardingStatus: user.onboarding_status
  };
}

