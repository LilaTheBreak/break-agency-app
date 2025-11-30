export default function DealsFilters({ filters, update, talents = [], brands = [] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        value={filters.talentId}
        onChange={(e) => update("talentId", e.target.value)}
        className="rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
      >
        <option value="">All Talent</option>
        {talents.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name || t.email || t.id}
          </option>
        ))}
      </select>

      <select
        value={filters.brandId}
        onChange={(e) => update("brandId", e.target.value)}
        className="rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
      >
        <option value="">All Brands</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name || b.id}
          </option>
        ))}
      </select>

      <select
        value={filters.stage}
        onChange={(e) => update("stage", e.target.value)}
        className="rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
      >
        <option value="">All Stages</option>
        {[
          "NEW_LEAD",
          "BRIEF_RECEIVED",
          "NEGOTIATING",
          "PENDING_CONTRACT",
          "CONTRACT_SENT",
          "LIVE",
          "CONTENT_SUBMITTED",
          "APPROVED",
          "PAYMENT_SENT",
          "CLOSED_WON",
          "CLOSED_LOST"
        ].map((stage) => (
          <option key={stage} value={stage}>
            {stage.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => update("status", e.target.value)}
        className="rounded-lg border border-brand-black/20 px-3 py-2 text-sm"
      >
        <option value="">Open & Closed</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>
    </div>
  );
}
