import React, { useState } from "react";
import { BlockRenderer } from "../components/BlockRenderer.jsx";
import { usePublicCmsPage } from "../hooks/usePublicCmsPage.js";

export function ContactPage() {
  // Fetch CMS content for contact page (public, no auth required)
  const cms = usePublicCmsPage("contact");

  // If CMS has blocks, render them instead of hardcoded content
  // Note: Contact form functionality is preserved in hardcoded fallback
  if (!cms.loading && cms.blocks && cms.blocks.length > 0) {
    return (
      <div className="bg-white text-slate-900 min-h-screen">
        <BlockRenderer blocks={cms.blocks} />
      </div>
    );
  }

  // Fallback to hardcoded content if CMS is empty or loading
  return <ContactPageHardcoded />;
}

function ContactPageHardcoded() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "brand",
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder: integrate with API/email if available.
    alert("Thanks for reaching out. We'll reply shortly.");
  };

  return (
    <div className="bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Contact</p>
          <h1 className="text-3xl font-semibold">Talk to the Break team.</h1>
          <p className="text-sm text-slate-600">
            Tell us a bit about what you need. We’ll respond with the right next step for your brand or creator account.
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
          <label className="text-sm text-slate-700">
            I’m a
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              <option value="brand">Brand</option>
              <option value="creator">Creator</option>
              <option value="partner">Partner</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            How can we help?
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              placeholder="Tell us about your campaign, timeline, or what you need from Break."
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white hover:bg-brand-red/90"
          >
            Submit
          </button>
          <p className="text-xs text-slate-500">
            Prefer email? Reach us at{" "}
            <a href="mailto:hello@thebreakco.com" className="underline">
              hello@thebreakco.com
            </a>
            .
          </p>
        </form>
      </main>
    </div>
  );
}

export default ContactPage;
