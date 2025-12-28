import { z } from "zod";

// Public roles that can be selected during signup
export const PUBLIC_ROLES = ["BRAND", "FOUNDER", "CREATOR", "UGC", "TALENT_MANAGER"] as const;

// Restricted roles that cannot be created via public signup
export const RESTRICTED_ROLES = ["EXCLUSIVE_TALENT", "ADMIN", "SUPERADMIN"] as const;

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(PUBLIC_ROLES, {
    errorMap: () => ({ message: "Please select a valid role" })
  })
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

