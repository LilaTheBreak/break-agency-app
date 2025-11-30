export default function NegotiationSuggestion({ strategy }) {
  if (!strategy) return null;

  return (
    <div className="rounded-xl border p-4 bg-brand-linen">
      <h3 className="font-semibold mb-2">AI Negotiation Recommendation</h3>
      <p className="text-sm mb-2">{strategy.reasoning}</p>
      <div className="text-sm">
        <strong>Suggested Counter:</strong> £{strategy.recommendedCounter?.amount}
      </div>
    </div>
  );
}
