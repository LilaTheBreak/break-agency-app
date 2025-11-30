import DealPipelineBadge from "./DealPipelineBadge.jsx";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

export default function DealsTable({ deals = [], talentMap = {} }) {
  if (!deals.length) {
    return <p className="text-sm text-brand-black/60">No deals found.</p>;
  }

  return (
    <div className="overflow-auto rounded-2xl border border-brand-black/10 bg-white">
      <table className="min-w-full divide-y divide-brand-black/10 text-sm">
        <thead className="bg-brand-linen/60 text-left text-xs uppercase tracking-[0.25em] text-brand-black/60">
          <tr>
            <th className="px-4 py-3">Brand</th>
            <th className="px-4 py-3">Talent</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-black/10">
          {deals.map((d) => (
            <tr key={d.id} className="hover:bg-brand-linen/30">
              <td className="px-4 py-3 text-brand-black">
                {d.brand?.name || d.brandName || "Unknown"}
              </td>
              <td className="px-4 py-3 text-brand-black/80">
                {(d.talentProfiles || d.talentIds || [])
                  .map((t) => {
                    if (typeof t === "string") return talentMap[t]?.name || t;
                    return t?.name || t?.email || t?.id;
                  })
                  .filter(Boolean)
                  .join(", ")}
              </td>
              <td className="px-4 py-3">
                <DealPipelineBadge stage={d.stage} />
              </td>
              <td className="px-4 py-3 text-brand-black/80">{d.status}</td>
              <td className="px-4 py-3 text-brand-black/60">{formatDate(d.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
