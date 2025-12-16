import React from "react";
import { Link } from "react-router-dom";

export function LegalPrivacyPage() {
  return (
    <div className="bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Legal &amp; Privacy</p>
          <h1 className="text-3xl font-semibold">Terms, privacy, and data protection.</h1>
          <p className="text-sm text-slate-600">
            This page sets out how Break operates, what you can expect from us, and how we handle your data. It applies to all visitors, brands, and creators using Break.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Who we are</h2>
          <p className="text-sm text-slate-700">
            Break is a creator-brand platform that helps brands run campaigns and creators find and apply to opportunities. We are a private company operating across the UK, US, and UAE.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Using Break</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Brands create briefs and profiles to request creator partnerships.</li>
            <li>• Creators create profiles and may be reviewed and approved before applying.</li>
            <li>• We may update the service and these terms from time to time; we will note the effective date when updated.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Accounts and eligibility</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• You must be at least 18 and able to enter a contract.</li>
            <li>• Keep your account secure; you are responsible for activity under your login.</li>
            <li>• We may refuse, suspend, or remove access where there is misuse, fraud, or non-compliance.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Acceptable use</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Do not upload unlawful, infringing, or harmful content.</li>
            <li>• Do not attempt to breach security, misuse data, or interfere with service operation.</li>
            <li>• Respect confidentiality of briefs, rates, and creator details shared via Break.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Fees and payments</h2>
          <p className="text-sm text-slate-700">
            Fees, payment terms, and any commissions are set out in your specific agreement or in the brief. Break may use third-party payment processors; your use of those services may be subject to their terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Intellectual property</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• You retain rights to your content. You grant Break and relevant counterparties the limited rights necessary to operate briefs, reviews, and campaigns.</li>
            <li>• Break retains all rights to the platform, brand, and materials we provide.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Confidentiality</h2>
          <p className="text-sm text-slate-700">
            Briefs, rates, creator details, and non-public campaign information shared through Break are confidential. Use them only for evaluating and delivering the relevant campaign.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Privacy and data protection</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• We collect account details, profile info, usage data, and content you submit to operate the service.</li>
            <li>• We use third-party providers (e.g., hosting, analytics, payment) under appropriate safeguards.</li>
            <li>• You can request access, correction, or deletion of your personal data subject to legal limits.</li>
            <li>• We use cookies and similar tech for essential functions and to improve the product; adjust your browser settings if you wish to limit them.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Security</h2>
          <p className="text-sm text-slate-700">
            We implement technical and organisational measures to protect data. No service is completely secure; notify us promptly of any suspected breach.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Disclaimers and liability</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Break is provided “as is” without warranties. We do not guarantee campaign outcomes.</li>
            <li>• To the extent permitted by law, we exclude indirect or consequential losses and cap direct liability to fees paid in the prior 6 months.</li>
            <li>• Nothing excludes liability that cannot be excluded by law.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Termination</h2>
          <p className="text-sm text-slate-700">
            You may close your account at any time. We may suspend or end access for breach, misuse, or legal/compliance reasons. Sections on confidentiality, IP, liability, and privacy survive termination.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Governing law</h2>
          <p className="text-sm text-slate-700">
            These terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction, subject to any mandatory protections that apply to you by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">13. Contact</h2>
          <p className="text-sm text-slate-700">
            For legal, privacy, or data requests, contact us at{" "}
            <a href="mailto:legal@thebreakco.com" className="underline">
              legal@thebreakco.com
            </a>
            .
          </p>
        </section>

        <div className="border-t border-slate-200 pt-6 text-sm text-slate-500">
          <p>Effective date: January 2026</p>
          <p className="mt-1">
            Looking for help? Visit the <Link to="/help" className="underline">Help Centre</Link> or <Link to="/contact" className="underline">Contact</Link> us.
          </p>
        </div>
      </main>
    </div>
  );
}

export default LegalPrivacyPage;
