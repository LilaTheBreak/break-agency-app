export default function AuthenticityWarnings({ summary, warnings }) {
  if (!warnings?.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-brand-orange/30 bg-brand-orange/5 p-4">
      <p className="mb-2 font-semibold text-brand-orange">{summary}</p>
      <ul className="space-y-1">
        {warnings.map((w) => (
          <li key={w.id} className="text-sm text-brand-orange/90">
            • {w.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
