export async function inboxAiReply(req, res) {
  try {
    return res.json({
      ok: true,
      reply: "This is a placeholder AI reply until the real LLM is connected.",
    });
  } catch (err) {
    console.error("AI reply controller error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
