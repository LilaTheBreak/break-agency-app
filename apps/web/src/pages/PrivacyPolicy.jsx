import React from "react";
import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Privacy Policy</p>
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-slate-600">
            This privacy policy explains how The Break collects, uses, and protects your personal information, including Gmail data when you connect your account.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• <strong>Account Information:</strong> Name, email address, profile information, and authentication credentials.</li>
            <li>• <strong>Gmail Data (with your consent):</strong> When you connect your Gmail account, we access your emails to sync them into The Break platform for unified inbox management. This includes email content, sender information, subject lines, and timestamps.</li>
            <li>• <strong>Instagram Data (with your consent):</strong> When you connect your Instagram account, we access your profile information, follower counts, and analytics data through Instagram Graph API in read-only mode. We do not post content, send messages, or modify your account.</li>
            <li>• <strong>TikTok Data (with your consent):</strong> When you connect your TikTok account, we access your profile information, follower counts, and analytics data through TikTok Login Kit in read-only mode. We do not post content, send messages, or modify your account.</li>
            <li>• <strong>Usage Data:</strong> How you interact with the platform, including pages visited, features used, and actions taken.</li>
            <li>• <strong>Content You Submit:</strong> Profile information, campaign briefs, applications, messages, and other content you create on the platform.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• <strong>Service Operation:</strong> To provide, maintain, and improve The Break platform and its features.</li>
            <li>• <strong>Gmail Integration:</strong> To sync your emails into the platform, identify brand contacts and opportunities, and enable email management through The Break.</li>
            <li>• <strong>Instagram & TikTok Integration:</strong> To access your social media analytics and profile data for talent management, opportunity matching, and internal CRM visibility. All access is read-only—we do not post content, send messages, run ads, or modify your accounts.</li>
            <li>• <strong>Communication:</strong> To send you service-related notifications, updates, and respond to your inquiries.</li>
            <li>• <strong>Analytics:</strong> To understand how the platform is used and improve user experience.</li>
            <li>• <strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Third-Party Platform Data Usage</h2>
          
          <h3 className="text-lg font-semibold mt-4">3.1 Gmail Data Usage</h3>
          <p className="text-sm text-slate-700">
            When you connect your Gmail account to The Break:
          </p>
          <ul className="space-y-2 text-sm text-slate-700 mt-2">
            <li>• We access your Gmail account with your explicit consent through Google OAuth.</li>
            <li>• We read your emails to sync them into The Break platform for unified inbox management.</li>
            <li>• We may send emails on your behalf through your connected Gmail account if you choose to use this feature.</li>
            <li>• Email data is stored securely in our database and is only accessible to you and authorized Break platform administrators.</li>
            <li>• We use email content to identify brand contacts, opportunities, and help organize your communications.</li>
            <li>• <strong>We do not sell, share, or use your Gmail data for advertising purposes.</strong></li>
            <li>• You can disconnect your Gmail account at any time, which will stop new email syncing.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">3.2 Instagram Graph API Data Usage</h3>
          <p className="text-sm text-slate-700">
            When you connect your Instagram account to The Break:
          </p>
          <ul className="space-y-2 text-sm text-slate-700 mt-2">
            <li>• We access your Instagram account with your explicit consent through Meta's Instagram Graph API.</li>
            <li>• <strong>READ-ONLY ACCESS:</strong> The Break uses Instagram Graph API in read-only mode. We do not post content, send messages, run ads, or modify your Instagram account in any way.</li>
            <li>• We access your Instagram profile information, follower counts, and analytics data (e.g., post engagement metrics) for talent management and opportunity matching purposes.</li>
            <li>• This data is used internally by The Break to help brands evaluate creator profiles and match creators with relevant opportunities.</li>
            <li>• Instagram data is stored securely in our database and is only accessible to you and authorized Break platform administrators.</li>
            <li>• <strong>We do not sell, share, or use your Instagram data for advertising purposes.</strong></li>
            <li>• You can disconnect your Instagram account at any time through your account settings.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">3.3 TikTok Login Kit Data Usage</h3>
          <p className="text-sm text-slate-700">
            When you connect your TikTok account to The Break:
          </p>
          <ul className="space-y-2 text-sm text-slate-700 mt-2">
            <li>• We access your TikTok account with your explicit consent through TikTok's Login Kit API.</li>
            <li>• <strong>READ-ONLY ACCESS:</strong> The Break uses TikTok Login Kit in read-only mode. We do not post content, send messages, run ads, or modify your TikTok account in any way.</li>
            <li>• We access your TikTok profile information, follower counts, and analytics data (e.g., video engagement metrics) for talent management and opportunity matching purposes.</li>
            <li>• This data is used internally by The Break to help brands evaluate creator profiles and match creators with relevant opportunities.</li>
            <li>• TikTok data is stored securely in our database and is only accessible to you and authorized Break platform administrators.</li>
            <li>• <strong>We do not sell, share, or use your TikTok data for advertising purposes.</strong></li>
            <li>• You can disconnect your TikTok account at any time through your account settings.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Data Storage and Security</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Your data, including Gmail data, is stored securely in our database using industry-standard encryption.</li>
            <li>• We implement technical and organizational measures to protect your data from unauthorized access, disclosure, or loss.</li>
            <li>• We use third-party service providers (hosting, database, email services) that are bound by appropriate data protection agreements.</li>
            <li>• While we take security seriously, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Data Sharing</h2>
          <p className="text-sm text-slate-700">
            We do not sell your personal information or Gmail data. We may share your information only in the following circumstances:
          </p>
          <ul className="space-y-2 text-sm text-slate-700 mt-2">
            <li>• <strong>Service Providers:</strong> With trusted third-party service providers who help us operate the platform (e.g., hosting, database, payment processing), subject to confidentiality obligations.</li>
            <li>• <strong>Legal Requirements:</strong> When required by law, court order, or government regulation.</li>
            <li>• <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to users.</li>
            <li>• <strong>With Your Consent:</strong> When you explicitly authorize us to share your information.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Your Rights</h2>
          <p className="text-sm text-slate-700">
            You have the following rights regarding your personal information:
          </p>
          <ul className="space-y-2 text-sm text-slate-700 mt-2">
            <li>• <strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
            <li>• <strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
            <li>• <strong>Deletion:</strong> Request deletion of your personal information, subject to legal and operational requirements.</li>
            <li>• <strong>Account Disconnection:</strong> Disconnect your Gmail, Instagram, or TikTok accounts at any time through your account settings. This will stop new data syncing, but historical data may be retained for a limited period as required for service continuity.</li>
            <li>• <strong>Data Portability:</strong> Request your data in a machine-readable format.</li>
            <li>• <strong>Objection:</strong> Object to certain processing of your personal information.</li>
          </ul>
          <p className="text-sm text-slate-700 mt-2">
            To exercise these rights, contact us at <a href="mailto:lila@thebreakco.com" className="underline">lila@thebreakco.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Cookies and Tracking</h2>
          <p className="text-sm text-slate-700">
            We use cookies and similar technologies for essential platform functions, authentication, and to improve the user experience. You can adjust your browser settings to limit cookies, though this may affect platform functionality.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Children's Privacy</h2>
          <p className="text-sm text-slate-700">
            The Break is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. International Data Transfers</h2>
          <p className="text-sm text-slate-700">
            The Break operates across the UK, US, and UAE. Your data may be transferred to and stored in countries outside your jurisdiction. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
          <p className="text-sm text-slate-700">
            We may update this privacy policy from time to time. We will notify you of significant changes by posting the updated policy on this page and updating the effective date. Your continued use of The Break after changes become effective constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Contact Us</h2>
          <p className="text-sm text-slate-700">
            For questions, concerns, or requests regarding this privacy policy or your personal information, please contact us at:
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

export default PrivacyPolicyPage;

