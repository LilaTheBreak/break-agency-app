export type ParsedEmail = {
  id: string;
  from: string | null;
  to: string | null;
  subject: string | null;
  date: string | null;
  body: string;
};

export function parseEmailMetadata(message: {
  id: string;
  headers: Record<string, string>;
  snippet: string;
  body: string | null;
}): ParsedEmail {
  const headers = Object.fromEntries(
    Object.entries(message.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  const body = message.body?.trim() || message.snippet || "";
  return {
    id: message.id,
    from: headers["from"] || null,
    to: headers["to"] || null,
    subject: headers["subject"] || null,
    date: headers["date"] || null,
    body
  };
}
