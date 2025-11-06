export type ID = string & { readonly brand: unique symbol };

export type Role = "AGENT" | "SELLER" | "BUYER" | "ADMIN";
