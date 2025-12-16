import React from "react";

export function PressPage() {
  return (
    <div className="bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Press</p>
          <h1 className="text-3xl font-semibold">Press and media enquiries.</h1>
          <p className="text-sm text-slate-600">
            For interviews, product information, or media assets, reach the Break press team using the contacts below. We aim to respond within one business day.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Press contacts</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Media enquiries: <a className="underline" href="mailto:press@thebreakco.com">press@thebreakco.com</a></li>
            <li>• Founder interviews: <a className="underline" href="mailto:founder@thebreakco.com">founder@thebreakco.com</a></li>
            <li>• Partnerships or speaking: <a className="underline" href="mailto:partners@thebreakco.com">partners@thebreakco.com</a></li>
          </ul>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">What to include</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Publication or organisation name</li>
            <li>• Deadline and time zone</li>
            <li>• Focus of the story (product, market, creator economy, brand launch)</li>
            <li>• Any asset needs (logos, bios, product screenshots)</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Fast facts</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Break connects brands and creators for campaigns, partnerships, and activations.</li>
            <li>• Operating across the UK, US, and UAE.</li>
            <li>• Platform plus optional founder-led strategy for premium programmes.</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Assets</h2>
          <p className="text-sm text-slate-700">
            For logos, product imagery, and bios, email <a className="underline" href="mailto:press@thebreakco.com">press@thebreakco.com</a> with your request and deadline.
          </p>
        </section>
      </main>
    </div>
  );
}

export default PressPage;
