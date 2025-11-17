import React, { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ExclusiveSocialPanel } from "./ExclusiveSocialPanel.jsx";
import { Badge } from "../components/Badge.jsx";
import { Outlet, useOutletContext } from "react-router-dom";
import { ContractsPanel } from "../components/ContractsPanel.jsx";
import { AiAssistantCard } from "../components/AiAssistantCard.jsx";
import { useCampaigns } from "../hooks/useCampaigns.js";
import { MultiBrandCampaignCard } from "../components/MultiBrandCampaignCard.jsx";
import { FALLBACK_CAMPAIGNS } from "../data/campaignsFallback.js";

const NAV_LINKS = (basePath) => [
  { label: "Overview", to: `${basePath}`, end: true },
  { label: "My Profile", to: `${basePath}/profile` },
  { label: "Socials", to: `${basePath}/socials` },
  { label: "Campaigns", to: `${basePath}/campaigns` },
  { label: "Opportunities", to: `${basePath}/opportunities` },
  { label: "Financials", to: `${basePath}/financials` },
  { label: "Messages", to: `${basePath}/messages` },
  { label: "Contracts", to: `${basePath}/contracts` },
  { label: "Settings", to: `${basePath}/settings` }
];

const PROFILE_INFO = {
  name: "Exclusive Creator",
  bio: "Lifestyle + travel creator with concierge support, live residencies, and hybrid IRL launches.",
  location: "New York / Doha",
  email: "exclusive@talent.com",
  agent: "Lila Prasad"
};

const ACTIVE_CAMPAIGNS = [
  { title: "Residency NYC", phase: "Deliverables", budget: "£42K", due: "Files by Friday" },
  { title: "Luxury hospitality tour", phase: "Pre-pro", budget: "£28K", due: "Scout call tomorrow" }
];

const OPPORTUNITIES = [
  {
    title: "Doha pop-up",
    status: "Awaiting reply",
    brand: "Luxury Hospitality",
    value: "£22K",
    nextStep: "Send revised hero concept",
    stage: "Awaiting reply"
  },
  {
    title: "AI finance walkthrough",
    status: "Reviewing offer",
    brand: "Fintech Labs",
    value: "£18K",
    nextStep: "Negotiate usage rights",
    stage: "Reviewing offer"
  },
  {
    title: "Retail capsule",
    status: "Pitch scheduled",
    brand: "Heritage Retail",
    value: "£25K",
    nextStep: "Confirm travel windows",
    stage: "Pitch scheduled"
  },
  {
    title: "GCC Residency series",
    status: "Briefing",
    brand: "Break Concierge",
    value: "£40K",
    nextStep: "Share location scouting deck",
    stage: "Briefing"
  }
];

const FINANCIAL_SUMMARY = [
  { label: "Projected revenue", value: "£74K" },
  { label: "Payouts pending", value: "£9.6K" },
  { label: "Invoices sent", value: "6" }
];
const FINANCIAL_SERIES = {
  Week: [1200, 1600, 900, 2200, 1800],
  Month: [5200, 6100, 4300, 7800, 6500],
  YTD: [32000, 48000, 62000, 74000, 88000]
};
const INVOICES = [
  { id: 1, client: "Break Hospitality", amount: "£4,500", status: "Pending", due: "15 Nov" },
  { id: 2, client: "Fintech Labs", amount: "£6,200", status: "Paid", due: "02 Nov" }
];

const MESSAGES = [
  { subject: "Budget confirmation", context: "Brand ops · 2h ago" },
  { subject: "Residency travel plan", context: "Concierge desk · 5h ago" },
  { subject: "Legal addendum", context: "Break legal · 1d ago" }
];

export default function ExclusiveTalentDashboardLayout({ basePath = "/admin/view/exclusive", session }) {
  return (
    <DashboardShell
      title="Exclusive Talent Control Room"
      subtitle="Preview the concierge roster — pitching, deal flow, and AI assistance for white-glove creators."
      navLinks={NAV_LINKS(basePath)}
    >
      <Outlet context={{ session }} />
    </DashboardShell>
  );
}

export function ExclusiveOverviewPage() {
  const { session } = useOutletContext() || {};
  return <ExclusiveOverview session={session} />;
}

export function ExclusiveProfilePage() {
  return <ExclusiveProfile />;
}

export function ExclusiveSocialsPage() {
  return <ExclusiveSocialPanel />;
}

export function ExclusiveCampaignsPage() {
  const { session } = useOutletContext() || {};
  return <ExclusiveCampaigns session={session} />;
}

export function ExclusiveOpportunitiesPage() {
  return <ExclusiveOpportunities />;
}

export function ExclusiveFinancialsPage() {
  return <ExclusiveFinancials />;
}

export function ExclusiveMessagesPage() {
  return <ExclusiveMessages />;
}

export function ExclusiveContractsPage() {
  const { session } = useOutletContext() || {};
  return (
    <section id="exclusive-contracts" className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <ContractsPanel
        session={session}
        title="Contracts"
        description="VIP agreements, concierge retainers, and residencies awaiting signature."
      />
    </section>
  );
}

export function ExclusiveSettingsPage() {
  return <ExclusiveSettings />;
}

function ExclusiveOverview({ session }) {
  return (
    <section id="exclusive-overview" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <AiAssistantCard
        session={session}
        role="exclusive"
        title="AI Assistant"
        description="Ask AI how to balance concierge work this week."
      />
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Overview</p>
      <p className="text-sm text-brand-black/70">
        Snapshot of concierge activity: pitching status, social velocity, and task queue for the current residency cycle.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Active projects", value: "3", detail: "Residency + 2 campaigns" },
          { label: "Projected revenue", value: "£120K", detail: "Next 90 days" },
          { label: "Tasks due", value: "5", detail: "In concierge queue" }
        ].map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-brand-black">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{metric.label}</p>
            <p className="text-2xl font-semibold">{metric.value}</p>
            <p className="text-xs text-brand-black/60">{metric.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExclusiveProfile() {
  return (
    <section id="exclusive-profile" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">My profile</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <h3 className="font-display text-xl uppercase">{PROFILE_INFO.name}</h3>
          <p className="text-sm text-brand-black/70">{PROFILE_INFO.bio}</p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm text-brand-black/80">
          <p>Location: {PROFILE_INFO.location}</p>
          <p>Contact: {PROFILE_INFO.email}</p>
          <p>Concierge lead: {PROFILE_INFO.agent}</p>
        </div>
      </div>
    </section>
  );
}

function ExclusiveCampaigns({ session }) {
  const { campaigns, loading, error } = useCampaigns({ session });
  const data = campaigns.length ? campaigns : FALLBACK_CAMPAIGNS;
  const [selectedId, setSelectedId] = useState(data[0]?.id ?? null);
  useEffect(() => {
    setSelectedId((current) => current || data[0]?.id || null);
  }, [data]);
  const selectedCampaign = data.find((campaign) => campaign.id === selectedId) || data[0];
  return (
    <section id="exclusive-campaigns" className="mt-4 space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Campaigns</p>
        <button className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]">
          Add update
        </button>
      </div>
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
      {loading && !campaigns.length ? (
        <p className="text-sm text-brand-black/60">Loading campaigns…</p>
      ) : (
        <>
          <div className="space-y-3">
            {data.map((campaign) => (
              <article
                key={campaign.id}
                className={`rounded-2xl border border-brand-black/10 px-4 py-3 text-sm text-brand-black/80 ${
                  selectedId === campaign.id ? "bg-brand-linen/70" : "bg-brand-linen/40"
                }`}
                onClick={() => setSelectedId(campaign.id)}
              >
                <p className="font-semibold text-brand-black">{campaign.title}</p>
                <p className="text-xs text-brand-black/60">Stage: {campaign.stage}</p>
                <p className="text-xs text-brand-black/60">
                  Brands: {campaign.brandSummaries?.map((brand) => brand.name).join(", ")}
                </p>
              </article>
            ))}
          </div>
          {selectedCampaign ? (
            <div className="pt-4">
              <MultiBrandCampaignCard campaign={selectedCampaign} showNotes={false} />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function ExclusiveOpportunities() {
  const [stageFilter, setStageFilter] = useState("All");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const stages = ["All", "Awaiting reply", "Reviewing offer", "Pitch scheduled", "Briefing"];
  const filtered = OPPORTUNITIES.filter((item) => stageFilter === "All" || item.stage === stageFilter);

  return (
    <section id="exclusive-opportunities" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
          <p className="text-sm text-brand-black/70">Pipeline of briefs and brand inbound.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em]">
          {stages.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className={`rounded-full border px-3 py-1 ${
                stageFilter === stage ? "border-brand-red bg-brand-red text-brand-white" : "border-brand-black/20"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black/80"
            onClick={() => setSelectedOpportunity(item)}
          >
            <div>
              <p className="font-semibold text-brand-black">{item.title}</p>
              <p className="text-xs text-brand-black/60">
                {item.brand} · {item.value}
              </p>
            </div>
            <Badge>{item.status}</Badge>
          </div>
        ))}
      </div>
      {selectedOpportunity ? (
        <Modal title="Opportunity" onClose={() => setSelectedOpportunity(null)}>
          <p className="font-semibold text-brand-black">{selectedOpportunity.title}</p>
          <p className="text-sm text-brand-black/70">{selectedOpportunity.brand}</p>
          <p className="mt-2 text-xs text-brand-black/60">Stage: {selectedOpportunity.stage}</p>
          <p className="text-xs text-brand-black/60">Value: {selectedOpportunity.value}</p>
          <p className="mt-3 text-sm text-brand-black/70">{selectedOpportunity.nextStep}</p>
        </Modal>
      ) : null}
    </section>
  );
}

function ExclusiveFinancials() {
  const [timeframe, setTimeframe] = useState("Month");
  const [campaignEdit, setCampaignEdit] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState({ open: false, invoice: null });
  const [invoices, setInvoices] = useState(INVOICES);
  const [chartPoints, setChartPoints] = useState(FINANCIAL_SERIES[timeframe]);

  useEffect(() => {
    setChartPoints(FINANCIAL_SERIES[timeframe] || FINANCIAL_SERIES.Month);
  }, [timeframe]);

  const openCampaignEdit = (campaign) => setCampaignEdit(campaign);
  const closeCampaignEdit = () => setCampaignEdit(null);

  const openInvoiceModal = (invoice = null) => setInvoiceModal({ open: true, invoice });
  const closeInvoiceModal = () => setInvoiceModal({ open: false, invoice: null });
  const handleInvoiceSave = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: invoiceModal.invoice?.id || Date.now(),
      client: formData.get("client") || "Untitled",
      amount: formData.get("amount") || "£0",
      status: formData.get("status") || "Pending",
      due: formData.get("due") || "TBD"
    };
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === payload.id);
      if (exists) return prev.map((inv) => (inv.id === payload.id ? payload : inv));
      return [payload, ...prev];
    });
    closeInvoiceModal();
  };

  return (
    <section id="exclusive-financials" className="space-y-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Financials</p>
          <h3 className="font-display text-3xl uppercase">Revenue analytics</h3>
        </div>
        <div className="flex gap-2 text-xs uppercase tracking-[0.3em]">
          {["Week", "Month", "YTD"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTimeframe(option)}
              className={`rounded-full border px-3 py-1 ${
                timeframe === option ? "border-brand-red bg-brand-red text-brand-white" : "border-brand-black/20"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FINANCIAL_SUMMARY.map((item) => (
          <article key={item.label} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-brand-black">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{item.label}</p>
            <p className="text-2xl font-semibold">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Revenue trend</p>
        <LineChart points={chartPoints} />
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Campaign revenue</p>
          <button className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]">
            Add campaign
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {ACTIVE_CAMPAIGNS.map((campaign) => (
            <div
              key={campaign.title}
              className="cursor-pointer rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-sm text-brand-black/80"
              onClick={() => openCampaignEdit(campaign)}
            >
              <p className="font-semibold">{campaign.title}</p>
              <p className="text-xs text-brand-black/60">
                {campaign.phase} · {campaign.budget} · {campaign.due}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Invoices</p>
          <button
            type="button"
            onClick={() => openInvoiceModal()}
            className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
          >
            + New invoice
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="cursor-pointer rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-2 text-sm text-brand-black/80"
              onClick={() => openInvoiceModal(invoice)}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{invoice.client}</p>
                <Badge tone="positive">{invoice.amount}</Badge>
              </div>
              <p className="text-xs text-brand-black/60">
                {invoice.status} · Due {invoice.due}
              </p>
            </div>
          ))}
        </div>
      </div>

      {campaignEdit ? (
        <Modal title="Edit campaign" onClose={closeCampaignEdit}>
          <p className="text-sm text-brand-black/70">{campaignEdit.title}</p>
          <p className="text-xs text-brand-black/60">{campaignEdit.due}</p>
          <button
            type="button"
            onClick={closeCampaignEdit}
            className="mt-4 rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Close
          </button>
        </Modal>
      ) : null}

      {invoiceModal.open ? (
        <Modal title={invoiceModal.invoice ? "Edit invoice" : "New invoice"} onClose={closeInvoiceModal}>
          <form className="space-y-3 text-sm" onSubmit={handleInvoiceSave}>
            <label className="block">
              Client
              <input
                name="client"
                defaultValue={invoiceModal.invoice?.client}
                className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
            <label className="block">
              Amount
              <input
                name="amount"
                defaultValue={invoiceModal.invoice?.amount}
                className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
            <label className="block">
              Status
              <select
                name="status"
                defaultValue={invoiceModal.invoice?.status || "Pending"}
                className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              >
                <option>Pending</option>
                <option>Paid</option>
                <option>Overdue</option>
              </select>
            </label>
            <label className="block">
              Due date
              <input
                name="due"
                defaultValue={invoiceModal.invoice?.due}
                className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeInvoiceModal}
                className="rounded-full border border-brand-black px-3 py-2 text-xs uppercase tracking-[0.3em]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

function LineChart({ points }) {
  const max = Math.max(...points);
  return (
    <svg viewBox="0 0 100 40" className="mt-3 h-32 w-full">
      <path
        d={points
          .map((value, index) => {
            const x = (index / (points.length - 1)) * 100;
            const y = 40 - (value / max) * 40;
            return `${index === 0 ? "M" : "L"}${x},${y}`;
          })
          .join(" ")}
        fill="none"
        stroke="#b22222"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ExclusiveMessages() {
  return (
    <section id="exclusive-messages" className="space-y-3 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Messages</p>
      <div className="space-y-2">
        {MESSAGES.map((message) => (
          <div key={message.subject} className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-2 text-sm text-brand-black/80">
            <p className="font-semibold">{message.subject}</p>
            <p className="text-xs text-brand-black/60">{message.context}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExclusiveSettings() {
  return (
    <section id="exclusive-settings" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Settings</p>
      <p className="text-sm text-brand-black/70">
        Configure notifications and concierge access. These controls preview how permissions will display inside the production environment.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm">
          <p className="font-semibold text-brand-black">Alerts</p>
          <p className="text-xs text-brand-black/60">Concierge updates: Enabled</p>
          <p className="text-xs text-brand-black/60">Finance approvals: Enabled</p>
        </div>
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4 text-sm">
          <p className="font-semibold text-brand-black">Access</p>
          <p className="text-xs text-brand-black/60">AI agent: Allowed</p>
          <p className="text-xs text-brand-black/60">Multi-currency payouts: Allowed</p>
        </div>
      </div>
    </section>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-[32px] border border-brand-black/15 bg-brand-white p-6 text-brand-black shadow-[0_35px_80px_rgba(0,0,0,0.4)]">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-display text-2xl uppercase">{title}</h4>
          <button type="button" onClick={onClose} className="text-xs uppercase tracking-[0.3em] text-brand-black/60">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
