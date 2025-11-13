import { Roles } from "./session";

export const MOCK_ACCOUNTS = [
  {
    email: "creator@test.com",
    password: "password",
    name: "Creator Nova",
    roles: [Roles.CREATOR],
    avatar: null
  },
  {
    email: "brand@test.com",
    password: "password",
    name: "Brand Orbit",
    roles: [Roles.BRAND],
    avatar: null
  },
  {
    email: "manager@test.com",
    password: "password",
    name: "Talent Manager",
    roles: [Roles.TALENT_MANAGER],
    avatar: null
  },
  {
    email: "admin@test.com",
    password: "password",
    name: "Break Admin",
    roles: [Roles.ADMIN, Roles.TALENT_MANAGER],
    avatar: null
  }
];
