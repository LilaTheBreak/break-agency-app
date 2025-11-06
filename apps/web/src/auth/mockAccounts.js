import { Roles } from "./session";

export const MOCK_ACCOUNTS = [
  {
    email: "buyer@test.com",
    password: "password",
    name: "Buyer Beta",
    roles: [Roles.BUYER],
    avatar: null
  },
  {
    email: "seller@test.com",
    password: "password",
    name: "Seller Summit",
    roles: [Roles.SELLER],
    avatar: null
  },
  {
    email: "valuation@test.com",
    password: "password",
    name: "Valuation Preview",
    roles: [Roles.SELLER],
    avatar: null
  },
  {
    email: "agent@test.com",
    password: "password",
    name: "Agent Apex",
    roles: [Roles.AGENT],
    avatar: null
  },
  {
    email: "buyerseller@test.com",
    password: "password",
    name: "Hybrid Hero",
    roles: [Roles.BUYER, Roles.SELLER],
    avatar: null
  }
];
