import { Prisma } from "@prisma/client";
import prisma from '../../lib/prisma';

type VersionPayload = Record<string, unknown>;

export async function createVersion(briefId: string, userId: string | null, data: VersionPayload) {
  const brief = await prisma.brandBrief.findUnique({ where: { id: briefId } });
  if (!brief) throw new Error("Brief not found");
  
  const sanitizedData = sanitizePayload(data);
  const versionEntry = {
    versionNumber: (brief.versionHistory?.length ?? 0) + 1,
    data: sanitizedData,
    createdBy: userId,
    createdAt: new Date().toISOString()
  };
  
  const updated = await prisma.brandBrief.update({
    where: { id: briefId },
    data: {
      versionHistory: [...(brief.versionHistory || []), versionEntry]
    }
  });
  
  return versionEntry;
}

export async function getVersions(briefId: string) {
  const brief = await prisma.brandBrief.findUnique({ where: { id: briefId } });
  return brief?.versionHistory || [];
}

export async function restoreVersion(briefId: string, versionNumber: number, userId: string | null) {
  const brief = await prisma.brandBrief.findUnique({ where: { id: briefId } });
  if (!brief) throw new Error("Brief not found");
  
  const version = (brief.versionHistory || []).find((v: any) => v.versionNumber === versionNumber);
  if (!version) throw new Error("Version not found");
  
  const restored = await prisma.brandBrief.update({
    where: { id: briefId },
    data: {
      versionHistory: [...(brief.versionHistory || []), version]
    }
  });
  
  return restored;
}

function sanitizePayload(data: VersionPayload): Prisma.JsonObject {
  try {
    return JSON.parse(JSON.stringify(data ?? {})) as Prisma.JsonObject;
  } catch {
    return { value: String(data) } as Prisma.JsonObject;
  }
}
