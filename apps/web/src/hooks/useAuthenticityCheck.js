import { apiFetch } from "../services/apiClient.js";

export async function checkAuthenticity({ senderEmail, text, links }) {
  const res = await apiFetch("/authenticity/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderEmail,
      messageText: text,
      links
    })
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload?.message || "Unable to check authenticity.");
  return payload;
}
