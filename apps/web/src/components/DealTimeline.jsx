export default function DealTimeline({ events = [] }) {
  if (!events.length) {
    return <p className="text-sm text-brand-black/60">No timeline entries yet.</p>;
  }
  return (
    <div className="space-y-4">
      {events.map((e) => (
        <div
          key={e.id}
          className={`rounded-xl border p-4 shadow-sm ${
            !e.actorId && String(e.type || "").toUpperCase().startsWith("AUTO")
              ? "border-yellow-300 bg-yellow-50"
              : "border-brand-black/10 bg-white"
          }`}
        >
          <div className="text-xs text-brand-black/40">{new Date(e.createdAt).toLocaleString()}</div>
          <div className="mt-2 text-sm font-semibold text-brand-black">
            {e.type === "EMAIL" && "Email Received"}
            {e.type === "NOTE" && "Internal Note"}
            {e.type === "STAGE_CHANGE" && "Stage Updated"}
            {!["EMAIL", "NOTE", "STAGE_CHANGE"].includes(e.type || "") ? e.type : null}
          </div>
          <div className="mt-1 text-sm text-brand-black/80">{e.message}</div>
        </div>
      ))}
    </div>
  );
}
