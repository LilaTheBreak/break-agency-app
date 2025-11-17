import React from "react";
import { Badge } from "../components/Badge.jsx";
import { UgcBoard } from "../components/UgcBoard.jsx";

export function CreatorPage({ onRequestSignIn }) {
  return (
    <div className="bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-12 space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Creator pathway</p>
          <h1 className="text-3xl font-semibold">View opportunities, create your profile, join campaigns.</h1>
          <p className="text-white/70">
            Visitors can browse the opportunities board. Applying requires a Break profile and
            consent-backed onboarding. Approved creators unlock dashboards, AI co-pilots, content
            calendars, and revenue tools.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRequestSignIn}
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-brand-red/90"
            >
              Create profile
            </button>
            <a
              href="#opportunities-board"
              className="rounded-full border border-white/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/10"
            >
              Browse opportunities
            </a>
          </div>
        </div>
      </section>
      <section id="opportunities-board" className="mx-auto max-w-6xl px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Opportunities board</h2>
          <Badge>Visible to all · Apply requires login</Badge>
        </div>
        <UgcBoard canApply={false} />
      </section>
      <section className="border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl px-6 py-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Onboarding</p>
            <h3 className="mt-3 text-lg font-semibold">Profile creation</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Personal info, social handles, performance screenshots.</li>
              <li>• Rates, exclusivity preferences, usage rights consent.</li>
              <li>• Optional vetting (portfolio review + reference check).</li>
              <li>• Spellcheck across questionnaires.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Dashboard unlocks</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Performance & metrics (platform APIs).</li>
              <li>• AI agent for deals, reminders, rate guidance.</li>
              <li>• Content calendar, tasks, messages, and files.</li>
              <li>• Opportunities board with autofill + priority briefs.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
