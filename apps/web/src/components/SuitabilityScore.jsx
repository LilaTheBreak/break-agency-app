export default function SuitabilityScore({ score, sharedCategories = [], matchingPlatforms = [], warnings = [] }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-black/10 bg-white p-4 shadow-sm">
      <div className="text-3xl font-bold text-brand-black">{score ?? 0}/100</div>

      <div>
        <p className="text-sm font-semibold text-brand-black">Category Matches</p>
        <p className="text-sm text-brand-black/70">{sharedCategories.join(", ") || "None"}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-brand-black">Platform Fit</p>
        <p className="text-sm text-brand-black/70">{matchingPlatforms.join(", ") || "None"}</p>
      </div>

      {warnings?.length > 0 ? (
        <div className="space-y-1 text-sm text-brand-red">
          <p className="font-semibold">Warnings</p>
          {warnings.map((w, i) => (
            <p key={i}>• {w}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
