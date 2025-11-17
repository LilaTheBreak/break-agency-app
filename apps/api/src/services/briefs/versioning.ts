import prisma from "../../lib/prisma.js";

type VersionPayload = Record<string, unknown>;

export async function createVersion(briefId: string, userId: string | null, data: VersionPayload) {
  const brief = await prisma.brief.findUnique({ where: { id: briefId } });
  if (!brief) throw new Error("Brief not found");
  const versionNumber = (brief.currentVersionNumber ?? 0) + 1;
  const sanitizedData = sanitizePayload(data);
  const version = await prisma.briefVersion.create({
    data: {
      briefId,
      versionNumber,
      data: sanitizedData,
      createdBy: userId
    }
  });
  await prisma.brief.update({
    where: { id: briefId },
    data: { currentVersionNumber: versionNumber, metadata: sanitizedData }
  });
  return version;
}

export async function getVersions(briefId: string) {
  await ensureBriefExists(briefId);
  return prisma.briefVersion.findMany({
    where: { briefId },
    orderBy: { versionNumber: "desc" },
    take: 50
  });
}

export async function restoreVersion(versionId: string, userId: string | null) {
  const version = await prisma.briefVersion.findUnique({ where: { id: versionId } });
  if (!version) throw new Error("Version not found");
  const brief = await prisma.brief.findUnique({ where: { id: version.briefId } });
  if (!brief) throw new Error("Brief not found");
  const newVersion = await createVersion(version.briefId, userId, version.data as VersionPayload);
  return { restored: version, newVersion };
}

async function ensureBriefExists(briefId: string) {
  const exists = await prisma.brief.findUnique({ where: { id: briefId }, select: { id: true } });
  if (!exists) throw new Error("Brief not found");
}

function sanitizePayload(data: VersionPayload) {
  try {
    return JSON.parse(JSON.stringify(data ?? {}));
  } catch {
    return { value: String(data) };
  }
}
