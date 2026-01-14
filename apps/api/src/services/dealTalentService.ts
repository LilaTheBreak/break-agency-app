import prisma from '../lib/prisma';

export async function detectTalentForEmail(email: any) {
  const matches: string[] = [];

  const to = String(email?.raw?.to || email?.to || "").toLowerCase();
  const cc = String(email?.raw?.cc || email?.cc || "").toLowerCase();
  const body = `${email?.subject || ""} ${email?.snippet || ""}`.toLowerCase();

  const talents = await prisma.user.findMany({
    where: { accountType: "talent" },
    select: { id: true, email: true, name: true }
  });

  for (const t of talents) {
    if (!t.email) continue;
    const emailLower = t.email.toLowerCase();
    const nameLower = (t.name || "").toLowerCase();
    if (to.includes(emailLower) || cc.includes(emailLower) || (nameLower && body.includes(nameLower))) {
      matches.push(t.id);
    }
  }

  return Array.from(new Set(matches));
}
