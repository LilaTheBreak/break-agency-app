import DealPipelineBadge from "./DealPipelineBadge.jsx";
import { useDealInsights } from "../hooks/useDealInsights.js";
import DealInsights from "./DealInsights.jsx";
import { useDealNegotiation } from "../hooks/useDealNegotiation.js";
import { useDeliverables } from "../hooks/useDeliverables.js";
import DeliverableCard from "./DeliverableCard.jsx";
import { OutreachRecordsPanel } from "./OutreachRecordsPanel.jsx";

export default function DealThreadViewer({ thread }) {
  const dealId = thread?.id;
  const { data: insightData, status: insightStatus } = useDealInsights(dealId);
  const { loading: negLoading, error: negError, data: negotiation, generate } = useDealNegotiation(dealId);
  const { items: deliverables, runQA, runPredict } = useDeliverables(dealId);
  if (!thread) return null;
  return (
    <div className="space-y-4 rounded-2xl border border-brand-black/10 bg-brand-white p-4">
      <div>
        <h2 className="text-xl font-bold text-brand-black">{thread.subjectRoot || "Deal thread"}</h2>
        <p className="text-sm text-brand-black/60">{thread.brandEmail || "Unknown sender"}</p>
        {thread.brand?.name ? (
          <p className="text-sm text-brand-black/70">Brand: {thread.brand.name}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-black/50">Status: {thread.status}</p>
          <DealPipelineBadge stage={thread.stage} />
        </div>
        {(thread.talentProfiles?.length || thread.agentProfiles?.length) ? (
          <div className="mt-2 space-y-1 text-xs text-brand-black/70">
            {thread.talentProfiles?.length ? (
              <p>
                Talent:{" "}
                {thread.talentProfiles.map((t) => t?.name || t?.email || t?.id).filter(Boolean).join(", ")}
              </p>
            ) : null}
            {thread.agentProfiles?.length ? (
              <p>
                Agents:{" "}
                {thread.agentProfiles.map((a) => a?.name || a?.email || a?.id).filter(Boolean).join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {thread.emails?.map((e) => (
          <div key={e.id} className="rounded-xl border border-brand-black/10 bg-brand-linen/60 p-3">
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-brand-black/60">
              {new Date(e.receivedAt).toLocaleString()}
            </p>
            <p className="font-semibold text-sm text-brand-black">{e.subject || "(No subject)"}</p>
            <p className="text-sm text-brand-black/70">{e.snippet || "No snippet available."}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-black/60">AI Insights</h3>
        {insightStatus === "loading" ? (
          <p className="text-sm text-brand-black/60">Loading insights...</p>
        ) : (
          <DealInsights insights={insightData?.insights?.summary ? formatInsights(insightData.insights) : insightData?.insights} />
        )}
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">Negotiation</p>
            <p className="text-sm text-brand-black/80">Generate AI counter-offer guidance.</p>
          </div>
          <button
            type="button"
            onClick={() => generate().catch(() => undefined)}
            disabled={negLoading}
            className="rounded-full border border-brand-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black disabled:opacity-50"
          >
            {negLoading ? "Generating..." : "Generate Advice"}
          </button>
        </div>
        {negError ? <p className="text-sm text-brand-red">{negError}</p> : null}
        {negotiation ? (
          <div className="mt-3 space-y-2 text-sm text-brand-black/80">
            <p>
              <strong>Fair Market Value:</strong> £{negotiation.fair_market_value ?? "—"}
            </p>
            <p>
              <strong>Suggested Counter:</strong> £{negotiation.suggested_counter_offer ?? "—"}
            </p>
            {negotiation.summary ? <p>{negotiation.summary}</p> : null}
            {negotiation.suggested_email_reply ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/60">Suggested email</p>
                <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-white/60 p-2 text-xs text-brand-black/80">
                  {negotiation.suggested_email_reply}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {deliverables?.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-black/60">Deliverables</h3>
          {deliverables.map((d) => (
            <DeliverableCard key={d.id} deliverable={d} onRunQA={runQA} onRunPredict={runPredict} />
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-black/60">Outreach history</h3>
        <OutreachRecordsPanel
          mode="embedded"
          filter={{ dealId: thread.id, brandId: thread.brand?.id }}
          limit={6}
          title="Outreach history"
          subtitle=""
        />
      </div>
    </div>
  );
}

function formatInsights(insights) {
  if (typeof insights === "string") return insights;
  const {
    summary,
    risk_level: risk,
    next_steps: next,
    missing_items: missing,
    due_dates: due,
    recommended_reply: reply
  } = insights || {};
  const lines = [];
  if (summary) lines.push(`Summary:\n${summary}`);
  if (risk) lines.push(`Risk: ${risk}`);
  if (Array.isArray(next) && next.length) lines.push(`Next steps:\n- ${next.join("\n- ")}`);
  if (Array.isArray(missing) && missing.length) lines.push(`Missing items:\n- ${missing.join("\n- ")}`);
  if (Array.isArray(due) && due.length) lines.push(`Due dates:\n- ${due.join("\n- ")}`);
  if (reply) lines.push(`Suggested reply:\n${reply}`);
  return lines.join("\n\n");
}
