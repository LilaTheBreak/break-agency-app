export default function DeliverableCard({ deliverable, onRunQA, onRunPredict }) {
  if (!deliverable) return null;
  return (
    <div className="rounded-xl border border-brand-black/10 bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-black">{deliverable.type}</h3>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Status: {deliverable.status}</p>
          {deliverable.caption ? <p className="text-sm text-brand-black/80">Caption: {deliverable.caption}</p> : null}
          {deliverable.notes ? <p className="text-sm text-brand-black/70">Notes: {deliverable.notes}</p> : null}
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => onRunQA?.(deliverable.id)}
            className="rounded-full border border-brand-black px-3 py-1 uppercase tracking-[0.3em]"
          >
            Run AI QA
          </button>
          <button
            type="button"
            onClick={() => onRunPredict?.(deliverable.id)}
            className="rounded-full border border-brand-black px-3 py-1 uppercase tracking-[0.3em]"
          >
            Predict
          </button>
        </div>
      </div>

      {deliverable.aiQA ? (
        <div className="mt-2 rounded-lg bg-brand-linen/60 p-3 text-sm text-brand-black/80">
          <p>
            <strong>Compliance:</strong> {deliverable.aiQA.compliance_score}
          </p>
          <p>
            <strong>Brand Fit:</strong> {deliverable.aiQA.brand_fit_score}
          </p>
          <p>{deliverable.aiQA.summary}</p>
        </div>
      ) : null}

      {deliverable.aiPrediction ? (
        <div className="mt-2 rounded-lg bg-brand-linen/60 p-3 text-sm text-brand-black/80">
          <p>
            <strong>Expected Views:</strong> {deliverable.aiPrediction.expected_views}
          </p>
          <p>
            <strong>Engagement Rate:</strong> {deliverable.aiPrediction.expected_engagement_rate}%
          </p>
          <p>{deliverable.aiPrediction.summary}</p>
        </div>
      ) : null}
    </div>
  );
}
