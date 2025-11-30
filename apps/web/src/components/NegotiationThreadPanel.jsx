export default function NegotiationThreadPanel({ thread }) {
  if (!thread) return null;

  return (
    <div className="rounded-xl p-4 bg-brand-linen border border-brand-black/10">
      <h3 className="font-semibold mb-3">Negotiation Thread</h3>
      {(thread.messages || []).map((m, i) => (
        <div key={i} className="mb-2">
          <div className="text-xs uppercase text-brand-black/50">{m.direction}</div>
          <div className="text-sm">{m.snippet || m.body}</div>
          {m.amount != null && (
            <div className="text-xs text-brand-black/40">Offer: £{m.amount}</div>
          )}
        </div>
      ))}
    </div>
  );
}
