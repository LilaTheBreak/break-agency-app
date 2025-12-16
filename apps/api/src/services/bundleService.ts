/**
 * bundleService.ts
 * Placeholder service so the API can run without crashing.
 *
 * When ready, replace these mocks with real bundle logic.
 */

import prisma from "../lib/prisma.js";

export async function listBundles() {
  return [
    {
      id: "mock-bundle-1",
      name: "Starter Bundle",
      description: "Example placeholder bundle",
      priceMin: 500,
      priceMax: 1500,
      items: [
        { type: "Instagram Story Set", qty: 2 },
        { type: "Reel", qty: 1 }
      ]
    }
  ];
}

export async function getBundleById(bundleId: string) {
  return {
    id: bundleId,
    name: "Mock Bundle",
    description: "Placeholder bundle response",
    priceMin: 500,
    priceMax: 1500,
    items: [{ type: "Reel", qty: 1 }]
  };
}

export async function createBundle(data: any) {
  console.log("[bundleService] createBundle called with:", data);

  return {
    id: "mock-created-bundle",
    ...data,
    createdAt: new Date()
  };
}

export async function updateBundle(bundleId: string, data: any) {
  console.log("[bundleService] updateBundle called:", { bundleId, data });

  return {
    id: bundleId,
    ...data,
    updatedAt: new Date()
  };
}

export async function deleteBundle(bundleId: string) {
  console.log("[bundleService] deleteBundle called:", bundleId);

  return { success: true };
}

