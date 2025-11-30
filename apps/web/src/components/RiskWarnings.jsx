export default function RiskWarnings({ summary, findings }) {
  if (!findings?.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-brand-red/30 bg-brand-red/5 p-4">
      <p className="mb-2 font-semibold text-brand-red">{summary}</p>
      <ul className="space-y-1">
        {findings.map((f) => (
          <li key={f.id} className="text-sm text-brand-red/90">
            • {f.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
