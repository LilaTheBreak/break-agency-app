import React from "react";
import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { Badge } from "../components/Badge.jsx";
import { AiAssistantCard } from "../components/AiAssistantCard.jsx";

export function ControlRoomView({ config, children, session }) {
  if (!config) {
    return null;
  }

  const {
    title,
    subtitle,
    queue,
    quickLinks = []
  } = config;
  const navLinks = config.navLinks ?? [];
  const tabs = config.tabs ?? [];
  const metrics = config.metrics ?? [];

  return (
    <DashboardShell
      title={title}
      subtitle={subtitle}
      role={config.role}
      navLinks={navLinks}
      navigation={navLinks.length ? undefined : tabs}
    >
      <div className="mb-6">
        <AiAssistantCard
          session={session}
          role={config.role || "admin"}
          title="AI Assistant"
          description="Ask AI how to optimize this week."
        />
      </div>
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

      {queue ? (
        <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
                {queue.label || "Queues"}
              </p>
              <h3 className="font-display text-2xl uppercase">{queue.title || "Pipeline"}</h3>
            </div>
            {queue.cta ? (
              <button className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
                {queue.cta}
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
                {item.status ? (
                  <Badge tone={item.tone || "positive"}>{item.status}</Badge>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {quickLinks.length > 0 ? (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
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
    </DashboardShell>
  );
}
