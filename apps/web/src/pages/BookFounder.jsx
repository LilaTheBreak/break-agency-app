import React, { useState } from "react";

export function BookFounderPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    timeline: "",
    notes: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder submit; integrate calendar/booking later.
    alert("Request received. We’ll follow up to schedule your founder session.");
  };

  return (
    <div className="bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Founder-led strategy</p>
          <h1 className="text-3xl font-semibold">Book a founder session.</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tell us about your brand, the campaign you want to run, and your timelines. We’ll respond with calendar slots to confirm the session and share prep materials.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="text-sm text-slate-700">
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Company
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="text-sm text-slate-700">
              Role
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              />
            </label>
          </div>
          <label className="text-sm text-slate-700">
            Ideal timeline
            <input
              name="timeline"
              value={form.timeline}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="e.g., Launching Q2, need shortlist in 2 weeks"
            />
          </label>
          <label className="text-sm text-slate-700">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Briefly describe your campaign goals, budget range, and target audience."
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90"
          >
            Submit request
          </button>
          <p className="text-xs text-slate-500">
            We’ll follow up with booking links and confirm the founder-led session time.
          </p>
        </form>
      </main>
    </div>
  );
}

export default BookFounderPage;
