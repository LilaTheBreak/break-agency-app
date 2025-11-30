import { User, UserRole } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  roles: string[];
  role?: string;
};

export function buildSessionUser(
  user: User & {
    roles: (UserRole & { role: { name: string } })[];
  }
): SessionUser {
  const roles = user.roles.map((r) => r.role.name.toUpperCase());
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    roles,
    role: roles[0]
  };
}
