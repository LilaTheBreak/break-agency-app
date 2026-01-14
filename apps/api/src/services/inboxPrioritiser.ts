import { scoreEmail } from './opportunityScoring.js';

export type ParsedMessage = {
  id: string;
  from: string | null;
  to: string | null;
  subject: string | null;
  date: string | null;
  body: string;
};

type Priority = "high" | "medium" | "low";

export function prioritiseMessages(messages: ParsedMessage[]) {
  const scored = messages.map((msg) => {
    const scoring = scoreEmail(msg);
    const priority: Priority =
      scoring.score >= 60 ? "high" : scoring.score >= 30 ? "medium" : "low";
    return { id: msg.id, parsed: msg, scoring, priority };
  });

  const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

  return scored.sort((a, b) => {
    const rankDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (rankDiff !== 0) return rankDiff;
    const dateA = a.parsed.date ? new Date(a.parsed.date).getTime() : 0;
    const dateB = b.parsed.date ? new Date(b.parsed.date).getTime() : 0;
    return dateB - dateA;
  });
}
