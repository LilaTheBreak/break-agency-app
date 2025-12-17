import React from "react";

export function CareersPage() {
  return (
    <div className="bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl space-y-3 px-6 py-10">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Careers</p>
          <h1 className="text-3xl font-semibold">Join The Break.</h1>
          <p className="text-sm text-slate-600">
            We’re building an internal-grade console for creators, brands, and culture teams. When roles open up, we’ll list them here.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Open roles</h2>
          <p className="text-sm text-slate-700">
            No active opportunities right now — please check back soon.
          </p>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Stay in touch</h2>
          <p className="text-sm text-slate-700">
            If you’d like to be considered when positions open, send a short note and portfolio to{" "}
            <a className="underline" href="mailto:careers@thebreakco.com">
              careers@thebreakco.com
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}

export default CareersPage;
