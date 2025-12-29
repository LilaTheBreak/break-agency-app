import React from "react";
import { Link } from "react-router-dom";

export function TermsOfServicePage() {
  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Terms of Service</p>
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-slate-600">
            These terms govern your use of The Break platform, including Gmail integration features.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Who We Are</h2>
          <p className="text-sm text-slate-700">
            The Break is a creator-brand platform that helps brands run campaigns and creators find and apply to opportunities. We are a private company operating across the UK, US, and UAE.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Using The Break</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Brands create briefs and profiles to request creator partnerships.</li>
            <li>• Creators create profiles and may be reviewed and approved before applying.</li>
            <li>• Users can connect their Gmail accounts to sync emails into The Break platform for unified inbox management.</li>
            <li>• We may update the service and these terms from time to time; we will note the effective date when updated.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Gmail Integration</h2>
          <p className="text-sm text-slate-700">
            When you connect your Gmail account to The Break:
          </p>
          <ul className="space-y-2 text-sm text-slate-700 mt-2">
            <li>• You grant The Break permission to access your Gmail account through Google OAuth.</li>
            <li>• We will sync your emails into The Break platform to provide unified inbox management.</li>
            <li>• You may choose to send emails through The Break using your connected Gmail account.</li>
            <li>• You can disconnect your Gmail account at any time through your account settings.</li>
            <li>• You are responsible for maintaining the security of your Gmail account and Google credentials.</li>
            <li>• The Break is not responsible for any actions taken through your Gmail account outside of The Break platform.</li>
            <li>• You agree to use Gmail integration in compliance with Google's Terms of Service and applicable laws.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Accounts and Eligibility</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• You must be at least 18 years old and able to enter a legally binding contract.</li>
            <li>• Keep your account secure; you are responsible for all activity under your login credentials.</li>
            <li>• We may refuse, suspend, or remove access where there is misuse, fraud, or non-compliance with these terms.</li>
            <li>• You must provide accurate and complete information when creating your account.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Do not upload unlawful, infringing, or harmful content.</li>
            <li>• Do not attempt to breach security, misuse data, or interfere with service operation.</li>
            <li>• Respect confidentiality of briefs, rates, and creator details shared via The Break.</li>
            <li>• Do not use Gmail integration to send spam, phishing emails, or any unlawful communications.</li>
            <li>• Do not attempt to access other users' accounts or data without authorization.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Fees and Payments</h2>
          <p className="text-sm text-slate-700">
            Fees, payment terms, and any commissions are set out in your specific agreement or in the brief. The Break may use third-party payment processors; your use of those services may be subject to their terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• You retain rights to your content. You grant The Break and relevant counterparties the limited rights necessary to operate briefs, reviews, and campaigns.</li>
            <li>• The Break retains all rights to the platform, brand, and materials we provide.</li>
            <li>• Content you submit through The Break, including emails synced from Gmail, remains your property.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Confidentiality</h2>
          <p className="text-sm text-slate-700">
            Briefs, rates, creator details, and non-public campaign information shared through The Break are confidential. Use them only for evaluating and delivering the relevant campaign. Email content synced from Gmail is treated as confidential and is only accessible to you and authorized The Break administrators.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Privacy and Data Protection</h2>
          <p className="text-sm text-slate-700">
            Your use of The Break, including Gmail integration, is subject to our Privacy Policy. By using The Break, you consent to the collection, use, and storage of your information as described in our Privacy Policy.
          </p>
          <p className="text-sm text-slate-700 mt-2">
            For details on how we handle your Gmail data and personal information, please see our <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Security</h2>
          <p className="text-sm text-slate-700">
            We implement technical and organizational measures to protect data, including Gmail data. No service is completely secure; notify us promptly of any suspected breach or unauthorized access to your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Disclaimers and Liability</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• The Break is provided "as is" without warranties. We do not guarantee campaign outcomes or email delivery.</li>
            <li>• To the extent permitted by law, we exclude indirect or consequential losses and cap direct liability to fees paid in the prior 6 months.</li>
            <li>• The Break is not responsible for any issues with your Gmail account, Google services, or email delivery outside of The Break platform.</li>
            <li>• Nothing excludes liability that cannot be excluded by law.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Termination</h2>
          <p className="text-sm text-slate-700">
            You may close your account at any time. We may suspend or end access for breach, misuse, or legal/compliance reasons. Sections on confidentiality, IP, liability, and privacy survive termination. When you disconnect your Gmail account or close your The Break account, we will stop syncing new emails, but previously synced data may remain in our database as permitted by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">13. Governing Law</h2>
          <p className="text-sm text-slate-700">
            These terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction, subject to any mandatory protections that apply to you by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">14. Contact</h2>
          <p className="text-sm text-slate-700">
            For questions about these terms, Gmail integration, or other service-related inquiries, contact us at:
          </p>
          <p className="text-sm text-slate-700 mt-2">
            <strong>Email:</strong> <a href="mailto:lila@thebreakco.com" className="underline">lila@thebreakco.com</a>
          </p>
          <p className="text-sm text-slate-700">
            <strong>Legal Contact:</strong> <a href="mailto:legal@thebreakco.com" className="underline">legal@thebreakco.com</a>
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

export default TermsOfServicePage;

