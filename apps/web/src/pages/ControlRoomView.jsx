import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { AiAssistantCard } from "../components/AiAssistantCard.jsx";
import { apiFetch } from "../services/apiClient.js";
import { getGmailAuthUrl } from "../services/gmailClient.js";

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function ControlRoomView({ config, children, session, showStatusSummary = false }) {
  const [dynamicMetrics, setDynamicMetrics] = useState([]);
  const [isDispatchLoading, setIsDispatchLoading] = useState(false);
  
  if (!config) {
    return null;
  }

  const {
    title,
    subtitle,
    orientation,
    queue,
    quickLinks = [],
    opportunities = [],
    meetings,
    projects,
    goals,
    audienceSignals,
    brandTrust,
    nicheAlignment,
    brandEcosystem,
    meetingsTranslation,
    strategyUpdates
  } = config;
  const navLinks = config.navLinks ?? [];
  const tabs = config.tabs ?? [];
  const baseMetrics = config.metrics ?? [];
  
  useEffect(() => {
    const loadMetrics = async () => {
      const updated = await Promise.all(
        baseMetrics.map(async (metric) => {
          if (metric.apiEndpoint) {
            try {
              const res = await apiFetch(metric.apiEndpoint);
              if (res.ok) {
                const data = await res.json();
                return { ...metric, value: String(data.count || 0) };
              }
            } catch (err) {
              console.error(`Failed to load metric ${metric.label}:`, err);
            }
          }
          return metric;
        })
      );
      setDynamicMetrics(updated);
    };
    
    if (baseMetrics.length > 0) {
      loadMetrics();
    }
  }, []);
  
  const metrics = dynamicMetrics.length > 0 ? dynamicMetrics : baseMetrics;

  const handleDispatchUpdate = async () => {
    if (!queue?.items || queue.items.length === 0) {
      alert("No items in queue to dispatch");
      return;
    }

    setIsDispatchLoading(true);
    try {
      const response = await apiFetch("/gmail/auth/draft-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueItems: queue.items,
          subject: `${config.role.toUpperCase()} Queue Update - ${new Date().toLocaleDateString()}`,
          recipient: "" // User will fill this in the draft
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert("Gmail draft created successfully! Check your Gmail drafts.");
      } else {
        const error = await response.json();
        if (error.error === "Gmail not connected") {
          // Prompt user to connect Gmail
          const shouldConnect = confirm("Gmail is not connected. Would you like to connect it now?");
          if (shouldConnect) {
            const authData = await getGmailAuthUrl();
            window.location.href = authData.url;
          }
        } else {
          alert(`Failed to create draft: ${error.message || error.error}`);
        }
      }
    } catch (error) {
      console.error("Failed to dispatch update:", error);
      alert("An error occurred while creating the Gmail draft");
    } finally {
      setIsDispatchLoading(false);
    }
  };

  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      role={config.role}
      navLinks={navLinks}
      navigation={navLinks.length ? undefined : tabs}
      showStatusSummary={showStatusSummary}
    >
      <div className="space-y-6">
        {config.role === "founder" && orientation ? (
          <section className="rounded-3xl border border-brand-black/10 bg-brand-linen/70 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">How to use this space</p>
            <p className="mt-2 text-sm text-brand-black/70">{orientation}</p>
          </section>
        ) : null}

        {config.role === "founder" ? (
          <>
            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Your goals</p>
                  <h3 className="font-display text-2xl uppercase">Founder North Star</h3>
                </div>
                <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
                  Calm, strategic focus
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Primary goal(s)</p>
                  <ul className="mt-2 space-y-2 text-sm text-brand-black/70">
                    {(goals?.primary || ["Goals will be captured here as we align on your intent."]).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Current quarter focus</p>
                  <p className="mt-2 text-sm text-brand-black/70">{goals?.quarterFocus || "Quarterly focus will be added once we set the near-term plan."}</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Not a priority right now</p>
                  <p className="mt-2 text-sm text-brand-black/70">{goals?.notPriority || "We’ll note deprioritized items to protect focus."}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Audience signals</p>
                  <h3 className="font-display text-2xl uppercase">What your audience is responding to</h3>
                </div>
                <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
                  Qualitative, not vanity metrics
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(audienceSignals || [
                  { title: "Signals will populate here", points: ["We’ll synthesize what your audience is leaning into across platforms."] }
                ]).map((entry) => (
                  <div key={entry.title} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{entry.title}</p>
                    <ul className="mt-2 space-y-2 text-sm text-brand-black/70">
                      {(entry.points || []).map((point) => (
                        <li key={point}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Brand understanding & trust read</p>
                  <h3 className="font-display text-2xl uppercase">Clarity over reach</h3>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Positioning clarity</p>
                  <ul className="mt-2 space-y-2 text-sm text-brand-black/70">
                    {(brandTrust?.clarity || ["We’ll capture how clearly your audience understands your positioning."]).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Trust signals</p>
                  <ul className="mt-2 space-y-2 text-sm text-brand-black/70">
                    {(brandTrust?.trustSignals || ["Trust signals will appear here as we collect feedback, saves, and DMs."]).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Where to sharpen</p>
                  <ul className="mt-2 space-y-2 text-sm text-brand-black/70">
                    {(brandTrust?.misalignment || ["Messaging gaps will be tracked here to keep language tight."]).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Niche performance & alignment</p>
                  <h3 className="font-display text-2xl uppercase">Where you’re resonating</h3>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {(nicheAlignment || [{ label: "Primary niche will appear here", status: "In review", note: "We’ll map engagement strength by niche." }]).map((niche) => (
                  <div key={niche.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-brand-black">{niche.label}</p>
                      <Badge tone={niche.status === "Strong alignment" ? "positive" : niche.status === "Mixed signals" ? "neutral" : "caution"}>
                        {niche.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-brand-black/70">{niche.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Your brand ecosystem</p>
                  <h3 className="font-display text-2xl uppercase">Assets we’re building around</h3>
                </div>
                <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
                  Links are client-facing
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {(brandEcosystem || [{ label: "Brand assets will be linked here", description: "We’ll link your core properties as they’re confirmed.", url: "#" }]).map((asset) => (
                  <div key={asset.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                    <p className="font-semibold text-brand-black">{asset.label}</p>
                    <p className="text-sm text-brand-black/70">{asset.description}</p>
                    <Link
                      to={asset.url || "#"}
                      className="mt-2 inline-flex text-xs uppercase tracking-[0.3em] text-brand-red underline underline-offset-4"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
        {opportunities.length ? (
          <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
                Opportunities
              </p>
              <h3 className="font-display text-2xl uppercase">What brands and ops are looking for</h3>
            </div>
            <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">New briefs daily</span>
          </div>
          {chunkArray(opportunities, 3).map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="grid gap-4 md:grid-cols-3">
              {row.map((opp) => (
                <article
                  key={opp.title}
                  className="flex h-full flex-col overflow-hidden rounded-[28px] border border-brand-black/10 bg-white shadow-[0_35px_120px_rgba(0,0,0,0.08)]"
                >
                  <div className="relative h-32 w-full">
                    <img
                      src={opp.coverPhoto || "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=900&q=80"}
                      alt={opp.brand}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute left-4 top-4 h-12 w-12 overflow-hidden rounded-2xl border border-white bg-white/70">
                      <img src={opp.logo} alt={`${opp.brand} logo`} className="h-full w-full object-contain" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">{opp.brand}</p>
                      <h4 className="text-xl font-semibold text-brand-black">{opp.title}</h4>
                    </div>
                    <p className="text-sm text-brand-black/70">{opp.requirements}</p>
                    <p className="text-sm font-semibold text-brand-black">{opp.pay}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">{opp.apply}</p>
                    <button
                      className={`mt-auto rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] ${
                        opp.tone === "caution" ? "border border-brand-red text-brand-red" : "bg-brand-black text-brand-white"
                      }`}
                    >
                      Apply via board
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ))}
          <div className="flex justify-center pt-2">
            <Link
              to="/creator"
              className="rounded-full border border-brand-black px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:bg-brand-black hover:text-brand-white"
            >
              See more opportunities
            </Link>
          </div>
        </section>
        ) : null}
        <AiAssistantCard
          session={session}
          role={config.role || "admin"}
          title="AI Assistant"
          description="Ask AI how to optimize this week."
        />
        {config.role === "founder" && (strategyUpdates?.length || 0) > 0 ? (
          <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Strategy updates</p>
                <h3 className="font-display text-2xl uppercase">Progress between sessions</h3>
              </div>
              <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
                Founder visibility
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(strategyUpdates || []).map((update) => (
                <div key={update.title} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-brand-black">{update.title}</p>
                    <span className="text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/60">{update.when || "This week"}</span>
                  </div>
                  <p className="mt-2 text-sm text-brand-black/70">{update.detail}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        {metrics.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{metric.label}</p>
                <p className="mt-2 font-display text-4xl uppercase text-brand-black">{metric.value}</p>
                <p className="text-sm text-brand-black/60">{metric.sub}</p>
              </div>
            ))}
          </section>
        ) : null}

        {meetings ? (
          <section
            id={meetings.anchor || (config.role === "founder" ? "founder-sessions" : undefined)}
            className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Meetings</p>
                <h3 className="font-display text-2xl uppercase">Upcoming sessions & notes</h3>
              </div>
              <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
                Founder → Break
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Upcoming</p>
                {meetings.upcoming && meetings.upcoming.length ? (
                  meetings.upcoming.map((meeting) => (
                    <div key={meeting.title} className="rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-brand-black">{meeting.title}</p>
                        <span className="text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/60">
                          {meeting.date}
                        </span>
                      </div>
                      <p className="text-xs text-brand-black/60">With {meeting.owner}</p>
                      <p className="text-sm text-brand-black/70">{meeting.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-brand-black/60">Sessions will appear here as they are scheduled. Request a slot via Support.</p>
                )}
              </div>
              <div className="space-y-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Notes & action points</p>
                {meetings.notes && meetings.notes.length ? (
                  meetings.notes.map((note) => (
                    <div key={note.title} className="rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                      <p className="font-semibold text-brand-black">{note.title}</p>
                      <p className="text-sm text-brand-black/70">{note.detail}</p>
                      {note.action ? (
                        <p className="text-xs uppercase tracking-[0.3em] text-brand-red">Next: {note.action}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-brand-black/60">Notes will appear as your sessions are documented.</p>
                )}
              </div>
            </div>
          </section>
        ) : null}
        {config.role === "founder" ? (
          <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Meetings → Strategy translation</p>
                <h3 className="font-display text-2xl uppercase">How conversations become action</h3>
              </div>
              <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
                Founder sessions to execution
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(meetingsTranslation || [
                {
                  title: "Strategy sessions will map here",
                  insight: "We’ll capture the key insight from each conversation.",
                  decision: "Decisions will be summarized so you have a clear record.",
                  action: "Next moves will show what The Break is executing."
                }
              ]).map((item) => (
                <div key={item.title} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="font-semibold text-brand-black">{item.title}</p>
                  <p className="mt-2 text-sm text-brand-black/70"><strong>Insight:</strong> {item.insight}</p>
                  <p className="text-sm text-brand-black/70"><strong>Decision:</strong> {item.decision}</p>
                  <p className="text-sm text-brand-black/70"><strong>Action:</strong> {item.action}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {projects ? (
          <section
            id={projects.anchor || (config.role === "founder" ? "founder-projects" : undefined)}
            className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Projects</p>
                <h3 className="font-display text-2xl uppercase">Inward workstreams</h3>
              </div>
              <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
                Internal projects (not campaigns)
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Active projects</p>
                {(projects.active || []).map((proj) => (
                  <article key={proj.title} className="rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-brand-black">{proj.title}</p>
                      <Badge tone="neutral">{proj.status || "Active"}</Badge>
                    </div>
                    <p className="text-xs text-brand-black/60">Owner: {proj.owner}</p>
                    <p className="text-xs text-brand-black/60">Due: {proj.due}</p>
                    <p className="text-sm text-brand-black/70">{proj.detail}</p>
                  </article>
                ))}
              </div>
              <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Timelines & milestones</p>
                {(projects.milestones || []).map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                    <div>
                      <p className="font-semibold text-brand-black">{item.title}</p>
                      <p className="text-xs text-brand-black/60">{item.date}</p>
                    </div>
                    <Badge tone="neutral">{item.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Deliverables</p>
                {(projects.deliverables || []).map((deliv) => (
                  <div key={deliv.title} className="rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                    <p className="font-semibold text-brand-black">{deliv.title}</p>
                    <p className="text-xs text-brand-black/60">Owner: {deliv.owner}</p>
                    <p className="text-xs text-brand-black/60">Status: {deliv.status}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Files & assets</p>
                {(projects.files || []).map((file) => (
                  <div key={file.title} className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                    <div>
                      <p className="font-semibold text-brand-black">{file.title}</p>
                      <p className="text-xs text-brand-black/60">{file.type}</p>
                    </div>
                    <Link to={file.url || "#"} className="text-xs uppercase tracking-[0.3em] text-brand-red underline">
                      Open
                    </Link>
                  </div>
                ))}
              </div>
              <div className="space-y-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Status updates</p>
                {(projects.updates || []).map((update) => (
                  <div key={update.title} className="rounded-xl border border-brand-black/10 bg-brand-white px-3 py-2">
                    <p className="font-semibold text-brand-black">{update.title}</p>
                    <p className="text-sm text-brand-black/70">{update.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {config.role === "founder" ? (
          <>
            <section id="founder-strategy" className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Strategy</p>
                  <h3 className="font-display text-2xl uppercase">Current thesis & moves</h3>
                </div>
                <span className="rounded-full border border-brand-black/15 bg-brand-linen/60 px-3 py-1 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/70">
                  Founder-facing
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Strategic thesis</p>
                  <p className="mt-2 text-sm text-brand-black/70">We’ll keep your current strategic bet summarized here. Expect updates after each session.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Risks / watchouts</p>
                  <p className="mt-2 text-sm text-brand-black/70">Risks and assumptions we’re monitoring for the active phase.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Decision log</p>
                  <p className="mt-2 text-sm text-brand-black/70">Key decisions from founder sessions will be logged here so you have a single source of truth.</p>
                </div>
              </div>
            </section>

            <section id="founder-offers" className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Offers & revenue</p>
                  <h3 className="font-display text-2xl uppercase">Offer ladder & revenue thinking</h3>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Offer ladder</p>
                  <p className="mt-2 text-sm text-brand-black/70">Entry, core, and premium offers with working price ranges will appear here.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Revenue priorities</p>
                  <p className="mt-2 text-sm text-brand-black/70">Where we’re focusing revenue this quarter: proof, pipeline, or pricing validation.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Proof points</p>
                  <p className="mt-2 text-sm text-brand-black/70">Case studies, testimonials, and signals we’ll activate to support the offer.</p>
                </div>
              </div>
            </section>

            <section id="founder-content" className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Content & distribution</p>
                  <h3 className="font-display text-2xl uppercase">What we’re saying and where</h3>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Talk tracks</p>
                  <p className="mt-2 text-sm text-brand-black/70">Monthly themes and talking points — updated as signals evolve.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Channels</p>
                  <p className="mt-2 text-sm text-brand-black/70">Primary channels and cadence. We’ll note where we’re doubling down.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">CTAs & destinations</p>
                  <p className="mt-2 text-sm text-brand-black/70">Where traffic is being directed (offer, waitlist, diagnostic, community).</p>
                </div>
              </div>
            </section>

            <section id="founder-sessions" className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Sessions & support</p>
                  <h3 className="font-display text-2xl uppercase">Access & rhythm</h3>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Session cadence</p>
                  <p className="mt-2 text-sm text-brand-black/70">We’ll list weekly/biweekly founder sessions and the intent for each.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Async support</p>
                  <p className="mt-2 text-sm text-brand-black/70">Where to drop questions between sessions; expect replies from Strategy Pod.</p>
                </div>
              </div>
            </section>

            <section id="founder-resources" className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Resources</p>
                  <h3 className="font-display text-2xl uppercase">Reference materials</h3>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Narrative board</p>
                  <p className="mt-2 text-sm text-brand-black/70">Link to the latest narrative board or FigJam once available.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Offer one-pagers</p>
                  <p className="mt-2 text-sm text-brand-black/70">PDFs/Sheets summarizing the active offer stack.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Playbooks</p>
                  <p className="mt-2 text-sm text-brand-black/70">Distribution, launch, and nurture playbooks will be linked here.</p>
                </div>
              </div>
            </section>

            <section id="founder-account" className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Account</p>
                  <h3 className="font-display text-2xl uppercase">Admin & preferences</h3>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Profile & access</p>
                  <p className="mt-2 text-sm text-brand-black/70">Profile details, access, and session preferences will be managed here.</p>
                </div>
                <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Billing & plan</p>
                  <p className="mt-2 text-sm text-brand-black/70">Billing preferences and plan details will surface here when connected.</p>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {queue ? (
          <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
                  {queue.label || "Queues"}
                </p>
                <h3 className="font-display text-2xl uppercase">{queue.title || "Pipeline"}</h3>
              </div>
              {queue.cta ? (
                <button 
                  onClick={handleDispatchUpdate}
                  disabled={isDispatchLoading}
                  className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition hover:bg-brand-black hover:text-brand-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDispatchLoading ? "Creating draft..." : queue.cta}
                </button>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              {queue.items?.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-brand-black">{item.title}</p>
                    {item.owner ? (
                      <p className="text-sm text-brand-black/60">Owner: {item.owner}</p>
                    ) : item.meta ? (
                      <p className="text-sm text-brand-black/60">{item.meta}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">
                    {item.status ? (
                      <Badge tone={item.tone || "positive"}>{item.status}</Badge>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-brand-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                      >
                        Mark complete
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-red transition hover:-translate-y-0.5 hover:bg-brand-red/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {quickLinks.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2">
            {quickLinks.map((panel) =>
              panel.to ? (
                <Link
                  key={panel.title}
                  to={panel.to}
                  className="rounded-3xl border border-brand-black/10 bg-brand-linen/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:bg-brand-white"
                >
                  <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
                    {panel.title}
                  </p>
                  <p className="mt-2 text-sm text-brand-black/70">{panel.copy}</p>
                </Link>
              ) : (
                <div
                  key={panel.title}
                  className="rounded-3xl border border-brand-black/10 bg-brand-linen/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
                >
                  <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
                    {panel.title}
                  </p>
                  <p className="mt-2 text-sm text-brand-black/70">{panel.copy}</p>
                </div>
              )
            )}
          </section>
        ) : null}
        {children}
      </div>
    </DashboardShell>
  );
}
