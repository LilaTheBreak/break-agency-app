import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

const STORAGE_KEY = "break_exclusive_goals_v1";
const DRAFT_KEY = "break_exclusive_goals_draft_v1";
const JUST_SET_KEY = "break_exclusive_goals_just_set_v1";

const CREATIVE_INTENTIONS = [
  { id: "brand-partnerships", title: "More brand partnerships", body: "More aligned campaigns, fewer random asks." },
  { id: "speaking-events", title: "Speaking or live events", body: "Panels, hosting, appearances, keynotes." },
  { id: "launch-product", title: "Launching a product", body: "Build something you own — with support." },
  { id: "grow-platform", title: "Grow a specific platform", body: "Focus on one channel for a season." },
  { id: "passion-projects", title: "More passion projects", body: "Space to make what you actually love." },
  { id: "balance", title: "Better balance / less burnout", body: "Protect energy and stay consistent." }
];

const REVENUE_RANGES = [
  { id: "prefer-not", label: "Prefer not to say" },
  { id: "0-25", label: "£0–£25k this season" },
  { id: "25-75", label: "£25k–£75k this season" },
  { id: "75-150", label: "£75k–£150k this season" },
  { id: "150+", label: "£150k+ this season" }
];

const COMMERCIAL_CHECKS = [
  { id: "replace-income", label: "Replace my main income" },
  { id: "supplement-income", label: "Supplement my income" },
  { id: "fund-project", label: "Fund a specific project" }
];

const SUPPORT_AREAS = [
  { id: "ideas-trends", title: "Content ideas & trends", body: "Hooks, formats, angles, weekly plan." },
  { id: "insights", title: "Analytics & insights", body: "High-level signal without overwhelm." },
  { id: "event-access", title: "Event access", body: "Invites worth your time." },
  { id: "product-dev", title: "Product development", body: "Early-stage ideation and roadmap." },
  { id: "audience-growth", title: "Audience growth", body: "Platform focus and consistency support." },
  { id: "positioning", title: "Brand positioning", body: "Voice, boundaries, and premium alignment." }
];

function safeRead(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWrite(key, value) {
  if (typeof window === "undefined") return { ok: false };
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function normalizeSelections(value, options, labelKey) {
  if (!Array.isArray(value)) return [];
  const byId = new Map(options.map((o) => [o.id, o]));
  return value
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const match = byId.get(item);
        return match ? { id: match.id, [labelKey]: match[labelKey], body: match.body } : { id: item, [labelKey]: item };
      }
      if (typeof item === "object" && item.id) {
        const match = byId.get(item.id);
        if (match) return { id: match.id, [labelKey]: match[labelKey], body: match.body };
        if (item[labelKey]) return item;
      }
      return null;
    })
    .filter(Boolean);
}

function normalizeRevenue(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const match = REVENUE_RANGES.find((r) => r.id === value);
    return match ? { id: match.id, label: match.label } : { id: value, label: value };
  }
  if (typeof value === "object" && value.id) {
    const match = REVENUE_RANGES.find((r) => r.id === value.id);
    return match ? { id: match.id, label: match.label } : value;
  }
  return null;
}

function normalizeCommercialChecks(value) {
  if (!Array.isArray(value)) return [];
  const byId = new Map(COMMERCIAL_CHECKS.map((c) => [c.id, c]));
  return value
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const match = byId.get(item);
        return match ? { id: match.id, label: match.label } : { id: item, label: item };
      }
      if (typeof item === "object" && item.id) {
        const match = byId.get(item.id);
        return match ? { id: match.id, label: match.label } : item;
      }
      return null;
    })
    .filter(Boolean);
}

function readCurrentGoals() {
  const stored = safeRead(STORAGE_KEY);
  if (!stored) return null;
  if (stored?.version === 1 && stored?.current) return stored.current;
  // Back-compat: old flat shape
  if (stored?.intentions || stored?.support || stored?.creativeIntentions) {
    return {
      creativeIntentions: normalizeSelections(stored.creativeIntentions || stored.intentions, CREATIVE_INTENTIONS, "title"),
      revenueRange: normalizeRevenue(stored.revenueRange),
      commercialChecks: normalizeCommercialChecks(stored.commercialChecks || stored.commercial),
      supportAreas: normalizeSelections(stored.supportAreas || stored.support, SUPPORT_AREAS, "title"),
      wellbeingNote: stored.wellbeingNote || "",
      commercialSkipped: stored?.commercialSkipped || stored?.revenueRange === "prefer-not",
      updatedAt: stored.updatedAt
    };
  }
  return null;
}

function readDraft() {
  const stored = safeRead(DRAFT_KEY);
  if (!stored) return null;
  return {
    stageId: stored.stageId || "creative",
    creativeIntentions: normalizeSelections(stored.creativeIntentions, CREATIVE_INTENTIONS, "title"),
    revenueRange: normalizeRevenue(stored.revenueRange),
    commercialChecks: normalizeCommercialChecks(stored.commercialChecks),
    supportAreas: normalizeSelections(stored.supportAreas, SUPPORT_AREAS, "title"),
    wellbeingNote: stored.wellbeingNote || "",
    commercialSkipped: Boolean(stored.commercialSkipped),
    updatedAt: stored.updatedAt
  };
}

function buildStages({ commercialSkipped }) {
  return [
    { id: "creative", label: "Creative" },
    ...(commercialSkipped ? [] : [{ id: "commercial", label: "Success (optional)" }]),
    { id: "support", label: "Support" },
    { id: "wellbeing", label: "Wellbeing + summary" }
  ];
}

function stageIndexById(stages, id) {
  const idx = stages.findIndex((s) => s.id === id);
  return idx < 0 ? 0 : idx;
}

function toIdSet(items) {
  return new Set((items || []).map((i) => (typeof i === "string" ? i : i?.id)).filter(Boolean));
}

function pushVersion(previous, next) {
  const stored = safeRead(STORAGE_KEY);
  const existing =
    stored?.version === 1 && stored?.current ? stored : { version: 1, current: previous, history: [] };
  const history = Array.isArray(existing.history) ? existing.history.slice(0) : [];
  if (existing.current) history.unshift(existing.current);
  return { version: 1, current: next, history: history.slice(0, 10) };
}

export function ExclusiveGoalsOnboardingPage() {
  const navigate = useNavigate();
  const { basePath } = useOutletContext() || {};
  const overviewPath = basePath || "/admin/view/exclusive";

  const initial = useMemo(() => {
    const draft = readDraft();
    if (draft) return draft;
    const current = readCurrentGoals();
    if (!current) return null;
    return {
      stageId: "wellbeing",
      creativeIntentions: normalizeSelections(current.creativeIntentions, CREATIVE_INTENTIONS, "title"),
      revenueRange: normalizeRevenue(current.revenueRange),
      commercialChecks: normalizeCommercialChecks(current.commercialChecks),
      supportAreas: normalizeSelections(current.supportAreas, SUPPORT_AREAS, "title"),
      wellbeingNote: current.wellbeingNote || "",
      commercialSkipped: Boolean(current.commercialSkipped || current?.revenueRange?.id === "prefer-not"),
      updatedAt: current.updatedAt
    };
  }, []);

  const [commercialSkipped, setCommercialSkipped] = useState(Boolean(initial?.commercialSkipped));
  const stages = useMemo(() => buildStages({ commercialSkipped }), [commercialSkipped]);
  const [stageIndex, setStageIndex] = useState(() =>
    stageIndexById(stages, initial?.stageId || "creative")
  );
  const stage = stages[stageIndex];

  const [creativeIntentions, setCreativeIntentions] = useState(() => initial?.creativeIntentions || []);
  const [revenueRange, setRevenueRange] = useState(() => initial?.revenueRange || null);
  const [commercialChecks, setCommercialChecks] = useState(() => initial?.commercialChecks || []);
  const [supportAreas, setSupportAreas] = useState(() => initial?.supportAreas || []);
  const [wellbeingNote, setWellbeingNote] = useState(() => initial?.wellbeingNote || "");
  const [showWellbeingExamples, setShowWellbeingExamples] = useState(false);

  const [saveState, setSaveState] = useState({ status: "idle", message: "" }); // idle | saving | saved | paused

  const selectedCreativeIds = useMemo(() => toIdSet(creativeIntentions), [creativeIntentions]);
  const selectedSupportIds = useMemo(() => toIdSet(supportAreas), [supportAreas]);
  const selectedCommercialIds = useMemo(() => toIdSet(commercialChecks), [commercialChecks]);

  const persistDraft = (override = {}) => {
    setSaveState((prev) => (prev.status === "paused" ? prev : { status: "saving", message: "" }));
    const payload = {
      stageId: stage?.id || "creative",
      creativeIntentions,
      revenueRange,
      commercialChecks,
      supportAreas,
      wellbeingNote,
      commercialSkipped,
      updatedAt: new Date().toISOString(),
      ...override
    };
    const result = safeWrite(DRAFT_KEY, payload);
    setSaveState(
      result.ok
        ? { status: "saved", message: "Autosaved" }
        : { status: "paused", message: "Saving paused — we’ll retry quietly." }
    );
  };

  // Autosave after every interaction (local-only; no blocking errors)
  useEffect(() => {
    persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creativeIntentions, revenueRange, commercialChecks, supportAreas, wellbeingNote, commercialSkipped, stageIndex]);

  // Keep stageIndex valid if commercial step is collapsed while on it.
  useEffect(() => {
    const nextStages = buildStages({ commercialSkipped });
    const currentStageId = stage?.id || "creative";
    if (!nextStages.find((s) => s.id === currentStageId)) {
      const nextIndex = stageIndexById(nextStages, "support");
      setStageIndex(nextIndex);
      persistDraft({ stageId: nextStages[nextIndex]?.id || "support" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commercialSkipped]);

  const exit = () => navigate(overviewPath);

  const saveAndExit = () => {
    const next = {
      creativeIntentions,
      revenueRange,
      commercialChecks,
      supportAreas,
      wellbeingNote,
      commercialSkipped,
      updatedAt: new Date().toISOString()
    };
    const previous = readCurrentGoals();
    safeWrite(STORAGE_KEY, pushVersion(previous, next));
    safeWrite(DRAFT_KEY, null);
    safeWrite(JUST_SET_KEY, { at: new Date().toISOString() });
    navigate(overviewPath);
  };

  const nextStage = () => {
    const nextIndex = Math.min(stageIndex + 1, stages.length - 1);
    setStageIndex(nextIndex);
    persistDraft({ stageId: stages[nextIndex]?.id });
  };

  const prevStage = () => {
    const prevIndex = Math.max(stageIndex - 1, 0);
    setStageIndex(prevIndex);
    persistDraft({ stageId: stages[prevIndex]?.id });
  };

  const goToStage = (id) => {
    const nextStages = buildStages({ commercialSkipped });
    setStageIndex(stageIndexById(nextStages, id));
    persistDraft({ stageId: id });
  };

  const toggleFromList = (current, option) => {
    const set = toIdSet(current);
    const next = new Set(set);
    if (next.has(option.id)) next.delete(option.id);
    else next.add(option.id);
    const byId = new Map((current || []).map((i) => [i.id, i]));
    return Array.from(next).map((id) => byId.get(id) || option);
  };

  return (
    <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Goals</p>
          <h2 className="font-display text-3xl uppercase text-brand-black">A creative check-in</h2>
          <p className="text-sm text-brand-black/70">
            There’s no right way to grow. Let’s understand what matters to you right now.
          </p>
          <p className="text-xs text-brand-black/60">
            These goals help us support you better — they’re not commitments.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-brand-black/10 bg-brand-linen/50 px-3 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/70">
            {saveState.status === "paused"
              ? "Saving paused"
              : saveState.status === "saved"
                ? "Autosaved"
                : saveState.status === "saving"
                  ? "Saving…"
                  : "Autosave"}
          </span>
          <button
            type="button"
            onClick={exit}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
          >
            Exit
          </button>
          <button
            type="button"
            onClick={saveAndExit}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            Save & continue
          </button>
        </div>
      </header>

      {saveState.status === "paused" ? (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 text-sm text-brand-black/80">
          {saveState.message}
        </div>
      ) : null}

      <ProgressDots stages={stages} currentIndex={stageIndex} onJump={(idx) => setStageIndex(idx)} />

      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-6">
        {stage?.id === "creative" ? (
          <StageBlock
            title="What do you want more of in your creative life right now?"
            subtitle="Pick anything that feels true today. No need to rank it."
          >
            <CardGrid
              items={CREATIVE_INTENTIONS}
              selectedIds={selectedCreativeIds}
              showDetailsOnSelect
              onToggle={(item) => setCreativeIntentions((prev) => toggleFromList(prev, item))}
            />
          </StageBlock>
        ) : null}

        {stage?.id === "commercial" ? (
          <StageBlock
            title="If it feels right, what would “success” look like this season?"
            subtitle="Optional. You can skip this — it’s handled by your agent."
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-brand-black/70">Use ranges and interest signals. Nothing is locked in.</p>
              <button
                type="button"
                onClick={() => {
                  setCommercialSkipped(true);
                  setRevenueRange({ id: "prefer-not", label: "Prefer not to say" });
                  setCommercialChecks([]);
                }}
                className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
              >
                Skip this step
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Revenue range</p>
                <div className="mt-3 space-y-2">
                  {REVENUE_RANGES.map((range) => (
                    <label
                      key={range.id}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black/80"
                    >
                      <span>{range.label}</span>
                      <input
                        type="radio"
                        name="revenueRange"
                        value={range.id}
                        checked={revenueRange?.id === range.id}
                        onChange={() => {
                          const nextValue = { id: range.id, label: range.label };
                          setRevenueRange(nextValue);
                          if (range.id === "prefer-not") {
                            setCommercialChecks([]);
                            setCommercialSkipped(true);
                          }
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">What it enables</p>
                <p className="mt-2 text-sm text-brand-black/70">
                  Optional. These help your team support your priorities — you might choose none.
                </p>
                <div className="mt-3 space-y-2">
                  {COMMERCIAL_CHECKS.map((check) => (
                    <label
                      key={check.id}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black/80"
                    >
                      <span>{check.label}</span>
                      <input
                        type="checkbox"
                        checked={selectedCommercialIds.has(check.id)}
                        disabled={revenueRange?.id === "prefer-not"}
                        onChange={() => setCommercialChecks((prev) => toggleFromList(prev, check))}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </StageBlock>
        ) : null}

        {stage?.id === "support" ? (
          <StageBlock
            title="Where would you like support?"
            subtitle="When you select something, we’ll expand what support looks like. No lock-in, no urgency."
          >
            <CardGrid
              items={SUPPORT_AREAS}
              selectedIds={selectedSupportIds}
              showDetailsOnSelect
              onToggle={(item) => setSupportAreas((prev) => toggleFromList(prev, item))}
            />
          </StageBlock>
        ) : null}

        {stage?.id === "wellbeing" ? (
          <StageBlock
            title="Anything personal you want us to be mindful of?"
            subtitle="Optional. Saved privately and used only to soften AI tone and influence scheduling suggestions."
          >
            <textarea
              id="wellbeing-note"
              value={wellbeingNote}
              onChange={(e) => setWellbeingNote(e.target.value)}
              className="min-h-[140px] w-full rounded-2xl border border-brand-black/10 bg-brand-white/80 p-4 text-sm text-brand-black outline-none focus:border-brand-black/30"
              placeholder="Write anything that might help us support you better (optional)"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowWellbeingExamples((prev) => !prev)}
                className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
              >
                {showWellbeingExamples ? "Hide examples" : "Show examples"}
              </button>
              <span className="text-xs text-brand-black/60">Never shown on dashboards.</span>
            </div>

            {showWellbeingExamples ? (
              <div className="mt-3 rounded-2xl border border-brand-black/10 bg-brand-white/70 p-4 text-sm text-brand-black/70">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Examples (optional)</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Travel flexibility this month</li>
                  <li>Less pressure this quarter</li>
                  <li>More structure and planning</li>
                  <li>Be mindful of burnout</li>
                </ul>
              </div>
            ) : null}

            <div className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white/70 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Here’s what we’re hearing…</p>
              <p className="mt-2 text-sm text-brand-black/70">
                Neutral summary — nothing is locked in. You can edit any part.
              </p>

              <div className="mt-4 space-y-3">
                <SummaryRow
                  label="Creative direction"
                  value={
                    creativeIntentions.length ? creativeIntentions.map((i) => i.title).join(" • ") : "Not set yet"
                  }
                  onEdit={() => goToStage("creative")}
                />
                <SummaryRow
                  label="Commercial (optional)"
                  value={
                    commercialSkipped || revenueRange?.id === "prefer-not"
                      ? "Skipped"
                      : revenueRange?.label
                        ? `${revenueRange.label}${commercialChecks.length ? ` • ${commercialChecks.map((c) => c.label).join(" • ")}` : ""}`
                        : "Not set"
                  }
                  onEdit={() => {
                    if (commercialSkipped) setCommercialSkipped(false);
                    goToStage("commercial");
                  }}
                  editLabel={commercialSkipped ? "Add" : "Edit"}
                />
                <SummaryRow
                  label="Support areas"
                  value={supportAreas.length ? supportAreas.map((s) => s.title).join(" • ") : "Not set yet"}
                  onEdit={() => goToStage("support")}
                />
                <SummaryRow
                  label="Wellbeing note"
                  value={wellbeingNote.trim() ? "Saved privately" : "Not added"}
                  onEdit={() => {
                    const el = document.getElementById("wellbeing-note");
                    if (el && typeof el.focus === "function") el.focus();
                    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center" });
                  }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveAndExit}
                  className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Save & continue
                </button>
                <button
                  type="button"
                  onClick={saveAndExit}
                  className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
                >
                  I’ll refine this later
                </button>
              </div>
            </div>
          </StageBlock>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={prevStage}
          disabled={stageIndex === 0}
          className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={nextStage}
          disabled={stageIndex === stages.length - 1}
          className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}

function ProgressDots({ stages, currentIndex, onJump }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Progress</p>
      <div className="flex items-center gap-2">
        {stages.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(idx)}
            className={`h-2 w-2 rounded-full transition ${
              idx === currentIndex ? "bg-brand-red" : "bg-brand-black/20 hover:bg-brand-black/40"
            }`}
            aria-label={s.label}
            title={s.label}
          />
        ))}
      </div>
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{stages[currentIndex]?.label}</p>
    </div>
  );
}

function StageBlock({ title, subtitle, children }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="font-display text-2xl uppercase text-brand-black">{title}</h3>
        {subtitle ? <p className="text-sm text-brand-black/70">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function CardGrid({ items, selectedIds, onToggle, showDetailsOnSelect = false }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item)}
            className={`rounded-3xl border p-4 text-left transition ${
              isSelected
                ? "border-brand-red bg-brand-white shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
                : "border-brand-black/10 bg-brand-white/60 hover:bg-brand-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{item.title}</p>
                {showDetailsOnSelect ? (
                  isSelected ? (
                    <p className="mt-2 text-sm text-brand-black/70">{item.body}</p>
                  ) : (
                    <p className="mt-2 text-sm text-brand-black/50">Tap to select</p>
                  )
                ) : (
                  <p className="mt-2 text-sm text-brand-black/70">{item.body}</p>
                )}
              </div>
              <span
                className={`h-9 w-9 shrink-0 rounded-full border text-center text-[0.65rem] font-semibold uppercase tracking-[0.25em] leading-9 ${
                  isSelected
                    ? "border-brand-red bg-brand-red text-white"
                    : "border-brand-black/20 bg-brand-white text-brand-black/60"
                }`}
              >
                {isSelected ? "On" : "—"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SummaryRow({ label, value, onEdit, editLabel = "Edit" }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">{label}</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-brand-black/80">{value}</p>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
          >
            {editLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default ExclusiveGoalsOnboardingPage;
