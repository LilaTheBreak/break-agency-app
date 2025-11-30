export function inferStageFromEmail(email: { subject: string; snippet?: string }) {
  const txt = `${email?.subject || ""} ${email?.snippet || ""}`.toLowerCase();

  if (/brief/i.test(txt)) return "BRIEF_RECEIVED";
  if (/scope|deliverables/i.test(txt)) return "NEGOTIATING";
  if (/contract attached|please find contract/i.test(txt)) return "CONTRACT_SENT";
  if (/signed contract/i.test(txt)) return "PENDING_CONTRACT";
  if (/go live|launch date/i.test(txt)) return "LIVE";
  if (/submit content|draft content/i.test(txt)) return "CONTENT_SUBMITTED";
  if (/approved/i.test(txt)) return "APPROVED";
  if (/invoice|payment/i.test(txt)) return "PAYMENT_SENT";
  if (/closed won|confirmed/i.test(txt)) return "CLOSED_WON";
  if (/cancel|no longer|not moving forward/i.test(txt)) return "CLOSED_LOST";

  return "NEW_LEAD";
}
