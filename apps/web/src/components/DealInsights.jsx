export default function DealInsights({ insights }) {
  if (!insights) return null;

  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-brand-black">AI Deal Insights</h3>
      <pre className="whitespace-pre-wrap text-sm text-brand-black/80">{insights}</pre>
    </div>
  );
}
