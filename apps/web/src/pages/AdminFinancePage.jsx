import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { Badge } from "../components/Badge.jsx";
import { FeatureGate, DisabledNotice } from "../components/FeatureGate.jsx";
import { isFeatureEnabled } from "../config/features.js";

const STORAGE_KEYS = {
  payouts: "break_admin_finance_payouts_v1",
  invoices: "break_admin_finance_invoices_v1",
  cashIn: "break_admin_finance_cash_in_v1",
  cleared: "break_admin_finance_cleared_v1",
  documents: "break_admin_finance_documents_v1",
  timeline: "break_admin_finance_timeline_v1",
  nextActions: "break_admin_finance_next_actions_v1",
  xero: "break_admin_finance_xero_v1"
};

const DATE_RANGES = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
  { label: "All time", value: null }
];

const ANALYTICS_TABS = [
  { id: "cashflow", label: "Cash Flow" },
  { id: "rev-vs-payouts", label: "Revenue vs Payouts" },
  { id: "outstanding-vs-cleared", label: "Outstanding vs Cleared" },
  { id: "monthly-trend", label: "Monthly Trend" }
];

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseMoney(amountString) {
  if (!amountString) return { currency: "", value: 0 };
  const trimmed = String(amountString).trim();
  const currency = trimmed.match(/^[^0-9]+/)?.[0]?.trim() || trimmed[0] || "";
  const numeric = Number.parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  return { currency: currency.replace(/\s+/g, ""), value: Number.isNaN(numeric) ? 0 : numeric };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function withinRange(dateValue, rangeDays) {
  if (!rangeDays) return true;
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const diff = Date.now() - date.getTime();
  return diff <= rangeDays * 24 * 60 * 60 * 1000;
}

function daysOverdue(dateValue) {
  if (!dateValue) return 0;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 0;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function isOverdue(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now() - 24 * 60 * 60 * 1000;
}

function isDueSoon(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const diff = date.getTime() - Date.now();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function sumCurrency(amounts) {
  if (!amounts.length) return { currency: "", value: 0 };
  const parsed = amounts.map(parseMoney).filter((item) => item.value > 0);
  if (!parsed.length) return { currency: "", value: 0 };
  const currencies = new Set(parsed.map((p) => p.currency));
  const currency = currencies.size === 1 ? parsed[0].currency : "";
  const value = parsed.reduce((sum, p) => sum + p.value, 0);
  return { currency, value };
}

function compactMoney({ currency, value }) {
  if (!value) return "—";
  const compact = value >= 1_000_000 ? `${Math.round((value / 1_000_000) * 10) / 10}M` : value >= 1000 ? `${Math.round((value / 1000) * 10) / 10}k` : `${Math.round(value)}`;
  return `${currency}${compact}`;
}

function makeCsv(rows) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

function downloadCsv(filename, rows) {
  const csv = makeCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const SEED = {
  payouts: [
    {
      id: "payout-1",
      creator: "Elan Collective",
      dealId: "deal-heritage-hotel",
      dealName: "Heritage hotel series",
      amount: "£8,400",
      status: "Scheduled",
      expectedDate: "2025-01-18",
      createdAt: "2025-01-07T10:00:00Z",
      proofDocIds: []
    },
    {
      id: "payout-2",
      creator: "Atelier North",
      dealId: "deal-atelier-heritage",
      dealName: "Atelier heritage series",
      amount: "$6,250",
      status: "Awaiting approval",
      expectedDate: "2025-01-12",
      createdAt: "2025-01-05T09:00:00Z",
      proofDocIds: []
    },
    {
      id: "payout-3",
      creator: "UGC Creator Pool",
      dealId: "deal-ugc-retainer",
      dealName: "UGC retainer batch",
      amount: "£23,000",
      status: "Paid",
      expectedDate: "2025-01-08",
      createdAt: "2025-01-03T09:00:00Z",
      paidAt: "2025-01-08T12:00:00Z",
      proofDocIds: ["doc-2"]
    }
  ],
  invoices: [
    {
      id: "inv-447",
      brand: "Maison Orion",
      ref: "#447",
      dealId: "deal-villa-residency",
      dealName: "Villa residency program",
      amount: "£18,000",
      status: "Due",
      dueDate: "2025-01-20",
      createdAt: "2025-01-07T12:00:00Z",
      xeroId: null,
      docIds: ["doc-2"]
    },
    {
      id: "inv-463",
      brand: "Aurora Studio",
      ref: "#463",
      dealId: "deal-ai-pilot",
      dealName: "AI co-marketing pilot",
      amount: "$28,000",
      status: "Overdue",
      dueDate: "2025-01-09",
      createdAt: "2025-01-05T10:00:00Z",
      xeroId: "xero-inv-463",
      docIds: ["doc-1"]
    },
    {
      id: "inv-455",
      brand: "Vista Shores",
      ref: "#455",
      dealId: "deal-vista-residency",
      dealName: "Vista Shores residency",
      amount: "£34,000",
      status: "Paid",
      dueDate: "2024-12-22",
      createdAt: "2024-12-01T10:00:00Z",
      paidAt: "2025-01-05T09:00:00Z",
      xeroId: null,
      docIds: []
    }
  ],
  cashIn: [
    {
      id: "cashin-1",
      brand: "Aurora Studio",
      dealId: "deal-ai-pilot",
      dealName: "AI co-marketing pilot",
      invoiceId: "inv-463",
      amount: "$28,000",
      status: "Pending confirmation",
      timeline: ["Invoice sent", "Wire initiated", "Pending confirmation"],
      updatedAt: "2025-01-11",
      note: "",
      confirmationDocIds: ["doc-1"]
    },
    {
      id: "cashin-2",
      brand: "Maison Orion",
      dealId: "deal-villa-residency",
      dealName: "Villa residency program",
      invoiceId: "inv-447",
      amount: "£45,000",
      status: "PO issued",
      timeline: ["Invoice sent", "PO issued", "Awaiting wire"],
      updatedAt: "2025-01-10",
      note: "",
      confirmationDocIds: []
    }
  ],
  cleared: [
    {
      id: "clr-1",
      type: "Payout",
      label: "Atelier North payout",
      amount: "$3,200",
      clearedAt: "2025-01-06",
      payoutId: "payout-2",
      docIds: []
    },
    {
      id: "clr-2",
      type: "Payment received",
      label: "Vista Shores invoice paid",
      amount: "£34,000",
      clearedAt: "2025-01-05",
      invoiceId: "inv-455",
      docIds: []
    }
  ],
  documents: [
    {
      id: "doc-1",
      label: "Wire confirmation",
      fileName: "aurora_wire_confirmation.pdf",
      fileType: "PDF",
      uploadedAt: "2025-01-11T10:00:00Z",
      linkedType: "invoice",
      linkedId: "inv-463",
      progress: 100,
      url: null
    },
    {
      id: "doc-2",
      label: "Invoice #447",
      fileName: "invoice_447.pdf",
      fileType: "PDF",
      uploadedAt: "2025-01-10T12:00:00Z",
      linkedType: "invoice",
      linkedId: "inv-447",
      progress: 100,
      url: null
    }
  ],
  timeline: [
    {
      id: "t-1",
      type: "Invoice created",
      label: "Invoice #463 created",
      at: "2025-01-05T10:00:00Z",
      actor: "Finance",
      details: "Created invoice draft and shared with brand finance contact.",
      link: { type: "invoice", id: "inv-463" }
    },
    {
      id: "t-2",
      type: "Payment received",
      label: "Vista Shores payment received",
      at: "2025-01-05T09:00:00Z",
      actor: "Finance",
      details: "Wire confirmed and marked invoice as paid.",
      link: { type: "invoice", id: "inv-455" }
    },
    {
      id: "t-3",
      type: "Payout processed",
      label: "Atelier North payout processed",
      at: "2025-01-06T12:00:00Z",
      actor: "Finance",
      details: "Payout queued and reconciled against delivery acceptance.",
      link: { type: "payout", id: "payout-2" }
    },
    {
      id: "t-4",
      type: "Reconciliation",
      label: "Wire confirmation logged",
      at: "2025-01-11T10:00:00Z",
      actor: "Finance",
      details: "Payment confirmation uploaded and linked to invoice.",
      link: { type: "document", id: "doc-1" }
    }
  ],
  nextActions: [
    {
      id: "na-1",
      owner: "Finance",
      text: "Confirm bank receipt for Aurora Studio wire",
      link: { type: "cashin", id: "cashin-1" },
      status: "Open",
      snoozedUntil: null
    },
    {
      id: "na-2",
      owner: "Mo",
      text: "Approve Atelier North payout release",
      link: { type: "payout", id: "payout-2" },
      status: "Open",
      snoozedUntil: null
    },
    {
      id: "na-3",
      owner: "Lila",
      text: "Follow up on overdue invoice #463",
      link: { type: "invoice", id: "inv-463" },
      status: "Open",
      snoozedUntil: null
    }
  ],
  xero: {
    connected: false,
    lastSyncAt: null
  }
};

export function AdminFinancePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [payouts, setPayouts] = useState(() => readStorage(STORAGE_KEYS.payouts, SEED.payouts));
  const [invoices, setInvoices] = useState(() => readStorage(STORAGE_KEYS.invoices, SEED.invoices));
  const [cashInRisks, setCashInRisks] = useState(() => readStorage(STORAGE_KEYS.cashIn, SEED.cashIn));
  const [cleared, setCleared] = useState(() => readStorage(STORAGE_KEYS.cleared, SEED.cleared));
  const [documents, setDocuments] = useState(() => readStorage(STORAGE_KEYS.documents, SEED.documents));
  const [timeline, setTimeline] = useState(() => readStorage(STORAGE_KEYS.timeline, SEED.timeline));
  const [nextActions, setNextActions] = useState(() => readStorage(STORAGE_KEYS.nextActions, SEED.nextActions));
  const [xero, setXero] = useState(() => readStorage(STORAGE_KEYS.xero, SEED.xero));

  const [dateRange, setDateRange] = useState(30);
  const [creatorFilter, setCreatorFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [dealFilter, setDealFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loadingBySection, setLoadingBySection] = useState({
    snapshot: false,
    payouts: false,
    invoices: false,
    cashIn: false,
    cleared: false,
    documents: false,
    timeline: false,
    nextActions: false,
    analytics: false
  });

  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const [analyticsTab, setAnalyticsTab] = useState("cashflow");
  const [expandedTimelineIds, setExpandedTimelineIds] = useState(() => new Set());

  const [payoutSelection, setPayoutSelection] = useState(() => new Set());

  const [modal, setModal] = useState({ type: null, payload: null });

  useEffect(() => writeStorage(STORAGE_KEYS.payouts, payouts), [payouts]);
  useEffect(() => writeStorage(STORAGE_KEYS.invoices, invoices), [invoices]);
  useEffect(() => writeStorage(STORAGE_KEYS.cashIn, cashInRisks), [cashInRisks]);
  useEffect(() => writeStorage(STORAGE_KEYS.cleared, cleared), [cleared]);
  useEffect(() => writeStorage(STORAGE_KEYS.documents, documents), [documents]);
  useEffect(() => writeStorage(STORAGE_KEYS.timeline, timeline), [timeline]);
  useEffect(() => writeStorage(STORAGE_KEYS.nextActions, nextActions), [nextActions]);
  useEffect(() => writeStorage(STORAGE_KEYS.xero, xero), [xero]);

  const showToast = (message) => {
    setToast(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setLoadingBySection((prev) => ({
      ...prev,
      snapshot: true,
      payouts: true,
      invoices: true,
      cashIn: true,
      cleared: true,
      documents: true,
      timeline: true,
      nextActions: true,
      analytics: true
    }));
    const timeout = window.setTimeout(() => {
      setLoadingBySection((prev) => ({
        ...prev,
        snapshot: false,
        payouts: false,
        invoices: false,
        cashIn: false,
        cleared: false,
        documents: false,
        timeline: false,
        nextActions: false,
        analytics: false
      }));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [dateRange, creatorFilter, brandFilter, dealFilter, statusFilter]);

  const creators = useMemo(() => {
    return Array.from(new Set(payouts.map((item) => item.creator))).sort((a, b) => a.localeCompare(b));
  }, [payouts]);

  const brands = useMemo(() => {
    return Array.from(new Set([...invoices.map((i) => i.brand), ...cashInRisks.map((c) => c.brand)])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [invoices, cashInRisks]);

  const deals = useMemo(() => {
    return Array.from(
      new Set([
        ...payouts.map((p) => p.dealName),
        ...invoices.map((i) => i.dealName),
        ...cashInRisks.map((c) => c.dealName)
      ])
    ).sort((a, b) => a.localeCompare(b));
  }, [payouts, invoices, cashInRisks]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter((item) => {
      if (creatorFilter !== "All" && item.creator !== creatorFilter) return false;
      if (dealFilter !== "All" && item.dealName !== dealFilter) return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      const anchor = item.expectedDate || item.createdAt;
      return withinRange(anchor, dateRange);
    });
  }, [payouts, creatorFilter, dealFilter, statusFilter, dateRange]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      if (brandFilter !== "All" && item.brand !== brandFilter) return false;
      if (dealFilter !== "All" && item.dealName !== dealFilter) return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      const anchor = item.dueDate || item.createdAt;
      return withinRange(anchor, dateRange);
    });
  }, [invoices, brandFilter, dealFilter, statusFilter, dateRange]);

  const filteredCashIn = useMemo(() => {
    return cashInRisks.filter((item) => {
      if (brandFilter !== "All" && item.brand !== brandFilter) return false;
      if (dealFilter !== "All" && item.dealName !== dealFilter) return false;
      if (statusFilter !== "All") return false;
      return withinRange(item.updatedAt, dateRange);
    });
  }, [cashInRisks, brandFilter, dealFilter, statusFilter, dateRange]);

  const filteredCleared = useMemo(() => {
    return cleared.filter((item) => withinRange(item.clearedAt, dateRange));
  }, [cleared, dateRange]);

  const filteredDocuments = useMemo(() => {
    const linkLookup = (doc) => {
      if (doc.linkedType === "invoice") return invoices.find((i) => i.id === doc.linkedId);
      if (doc.linkedType === "payout") return payouts.find((p) => p.id === doc.linkedId);
      if (doc.linkedType === "cashin") return cashInRisks.find((c) => c.id === doc.linkedId);
      if (doc.linkedType === "deal") return null;
      return null;
    };
    return documents
      .filter((doc) => withinRange(doc.uploadedAt, dateRange))
      .filter((doc) => {
        if (dealFilter === "All") return true;
        const linked = linkLookup(doc);
        if (!linked) return false;
        return linked.dealName === dealFilter;
      });
  }, [documents, dateRange, dealFilter, invoices, payouts, cashInRisks]);

  const snapshot = useMemo(() => {
    const cashIn = sumCurrency(filteredInvoices.filter((inv) => inv.status === "Paid").map((inv) => inv.amount));
    const cashOut = sumCurrency(filteredPayouts.filter((p) => p.status === "Paid").map((p) => p.amount));
    const receivables = sumCurrency(filteredInvoices.filter((inv) => inv.status !== "Paid").map((inv) => inv.amount));
    const liabilities = sumCurrency(filteredPayouts.filter((p) => p.status !== "Paid").map((p) => p.amount));
    const net = { currency: cashIn.currency || cashOut.currency, value: cashIn.value - cashOut.value };
    return { cashIn, cashOut, receivables, liabilities, net };
  }, [filteredInvoices, filteredPayouts]);

  const attention = useMemo(() => {
    const overdueInvoices = filteredInvoices.filter((inv) => inv.status === "Overdue");
    const delayedPayouts = filteredPayouts.filter((p) => isOverdue(p.expectedDate) && p.status !== "Paid");
    const missingConfirmations = filteredCashIn.filter((item) => item.status === "Pending confirmation");
    const mismatched = []; // design-only placeholder

    return [
      ...overdueInvoices.map((inv) => ({
        id: `att-inv-${inv.id}`,
        label: `Overdue invoice ${inv.ref}`,
        detail: `${inv.brand} · ${inv.amount} · due ${formatDate(inv.dueDate)}`,
        link: { type: "invoice", id: inv.id }
      })),
      ...delayedPayouts.map((p) => ({
        id: `att-pay-${p.id}`,
        label: "Delayed payout",
        detail: `${p.creator} · ${p.amount} · expected ${formatDate(p.expectedDate)}`,
        link: { type: "payout", id: p.id }
      })),
      ...missingConfirmations.map((item) => ({
        id: `att-conf-${item.id}`,
        label: "Missing payment confirmation",
        detail: `${item.brand} · ${item.amount} · updated ${formatDate(item.updatedAt)}`,
        link: { type: "cashin", id: item.id }
      })),
      ...mismatched
    ];
  }, [filteredInvoices, filteredPayouts, filteredCashIn]);

  const entityFromParams = useMemo(() => {
    const invoiceId = searchParams.get("invoice");
    if (invoiceId) return { type: "invoice", id: invoiceId };
    const payoutId = searchParams.get("payout");
    if (payoutId) return { type: "payout", id: payoutId };
    const cashinId = searchParams.get("cashin");
    if (cashinId) return { type: "cashin", id: cashinId };
    const documentId = searchParams.get("doc");
    if (documentId) return { type: "document", id: documentId };
    const dealId = searchParams.get("deal");
    if (dealId) return { type: "deal", id: dealId };
    return null;
  }, [searchParams]);

  const openEntity = (entity) => {
    const params = new URLSearchParams(searchParams);
    ["invoice", "payout", "cashin", "doc", "deal"].forEach((key) => params.delete(key));
    if (entity?.type && entity?.id) {
      const keyMap = { invoice: "invoice", payout: "payout", cashin: "cashin", document: "doc", deal: "deal" };
      params.set(keyMap[entity.type], entity.id);
    }
    setSearchParams(params, { replace: false });
  };

  const closeDrawer = () => openEntity(null);

  const resetFilters = () => {
    setDateRange(30);
    setCreatorFilter("All");
    setBrandFilter("All");
    setDealFilter("All");
    setStatusFilter("All");
    showToast("Filters reset");
  };

  const addTimelineEvent = ({ type, label, details, link }) => {
    const entry = {
      id: createId("t"),
      type,
      label,
      at: new Date().toISOString(),
      actor: "Finance",
      details: details || "",
      link: link || null
    };
    setTimeline((prev) => [entry, ...prev]);
  };

  const markPayoutPaid = (payoutId, { bulk = false } = {}) => {
    const payout = payouts.find((p) => p.id === payoutId);
    if (!payout) return;
    if (payout.status === "Paid") return;
    setPayouts((prev) =>
      prev.map((p) => (p.id === payoutId ? { ...p, status: "Paid", paidAt: new Date().toISOString() } : p))
    );
    setCleared((prev) => [
      {
        id: createId("clr"),
        type: "Payout",
        label: `${payout.creator} payout`,
        amount: payout.amount,
        clearedAt: new Date().toISOString(),
        payoutId: payoutId,
        docIds: payout.proofDocIds || []
      },
      ...prev
    ]);
    addTimelineEvent({
      type: "Payout processed",
      label: `Payout marked as paid · ${payout.creator}`,
      details: `Marked ${payout.amount} as paid for ${payout.dealName}.`,
      link: { type: "payout", id: payoutId }
    });
    if (!bulk) showToast("Payout marked as paid");
  };

  const markInvoicePaid = (invoiceId) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;
    if (invoice.status === "Paid") return;
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, status: "Paid", paidAt: new Date().toISOString() } : i)));
    setCleared((prev) => [
      {
        id: createId("clr"),
        type: "Payment received",
        label: `${invoice.brand} invoice paid`,
        amount: invoice.amount,
        clearedAt: new Date().toISOString(),
        invoiceId: invoiceId,
        docIds: invoice.docIds || []
      },
      ...prev
    ]);
    addTimelineEvent({
      type: "Payment received",
      label: `Invoice marked as paid · ${invoice.ref}`,
      details: `Marked ${invoice.amount} as received from ${invoice.brand}.`,
      link: { type: "invoice", id: invoiceId }
    });
    showToast("Invoice marked as paid");
  };

  const markCashInReceived = (cashInId) => {
    const entry = cashInRisks.find((c) => c.id === cashInId);
    if (!entry) return;
    setCashInRisks((prev) =>
      prev.map((c) =>
        c.id === cashInId
          ? { ...c, status: "Payment received", updatedAt: new Date().toISOString(), timeline: [...c.timeline, "Payment received"] }
          : c
      )
    );
    addTimelineEvent({
      type: "Payment received",
      label: `Payment received · ${entry.brand}`,
      details: `Marked ${entry.amount} as received for ${entry.dealName}.`,
      link: { type: "cashin", id: cashInId }
    });
    showToast("Marked payment received");
  };

  const syncXero = () => {
    if (!xero.connected) {
      showToast("Xero is unavailable. Connect Xero to sync.");
      return;
    }
    setXero((prev) => ({ ...prev, lastSyncAt: new Date().toISOString() }));
    addTimelineEvent({ type: "Sync", label: "Xero sync completed", details: "Manual sync triggered from Finance action bar.", link: null });
    showToast("Sync complete");
  };

  const handleBulkMarkPaid = () => {
    const selected = Array.from(payoutSelection);
    if (!selected.length) return;
    if (!confirm(`Mark ${selected.length} payout(s) as paid?`)) return;
    selected.forEach((id) => markPayoutPaid(id, { bulk: true }));
    setPayoutSelection(new Set());
    showToast("Bulk update applied");
  };

  const handleBulkExport = () => {
    const selected = Array.from(payoutSelection);
    const rows = [
      ["Payout ID", "Creator", "Deal", "Amount", "Status", "Expected Date"],
      ...filteredPayouts
        .filter((p) => (selected.length ? selected.includes(p.id) : true))
        .map((p) => [p.id, p.creator, p.dealName, p.amount, p.status, p.expectedDate])
    ];
    downloadCsv("payouts_export.csv", rows);
    showToast("Export generated");
  };

  const handleAttachProof = (payload) => {
    setModal({ type: "upload-document", payload });
  };

  const addDocument = ({ file, label, linkedType, linkedId }) => {
    const id = createId("doc");
    const url = file ? URL.createObjectURL(file) : null;
    const fileType = file ? (file.type?.includes("pdf") ? "PDF" : file.type || "FILE") : "PDF";
    const doc = {
      id,
      label: label || (file ? file.name : "Document"),
      fileName: file ? file.name : "document.pdf",
      fileType: fileType.toUpperCase(),
      uploadedAt: new Date().toISOString(),
      linkedType: linkedType || "none",
      linkedId: linkedId || null,
      progress: 0,
      url
    };
    setDocuments((prev) => [doc, ...prev]);
    // Simulate progress
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, Math.round((elapsed / 600) * 100));
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, progress } : d)));
      if (progress < 100) window.setTimeout(tick, 80);
    };
    window.setTimeout(tick, 80);

    addTimelineEvent({
      type: "Document uploaded",
      label: `Document uploaded · ${doc.label}`,
      details: `Uploaded ${doc.fileName} and linked to ${linkedType || "record"}.`,
      link: { type: "document", id }
    });

    if (linkedType === "invoice" && linkedId) {
      setInvoices((prev) => prev.map((i) => (i.id === linkedId ? { ...i, docIds: Array.from(new Set([...(i.docIds || []), id])) } : i)));
    }
    if (linkedType === "payout" && linkedId) {
      setPayouts((prev) => prev.map((p) => (p.id === linkedId ? { ...p, proofDocIds: Array.from(new Set([...(p.proofDocIds || []), id])) } : p)));
    }
    if (linkedType === "cashin" && linkedId) {
      setCashInRisks((prev) => prev.map((c) => (c.id === linkedId ? { ...c, confirmationDocIds: Array.from(new Set([...(c.confirmationDocIds || []), id])) } : c)));
    }
  };

  const openModal = (type, payload = null) => setModal({ type, payload });
  const closeModal = () => setModal({ type: null, payload: null });

  const xeroButtonLabel = xero.connected ? (xero.lastSyncAt ? `Sync Xero · ${formatDateTime(xero.lastSyncAt)}` : "Sync Xero") : "Sync Xero · Unavailable";

  return (
    <DashboardShell
      title="Finance"
      subtitle="Track money owed, money paid, and reconciliation in one calm control room."
      navLinks={ADMIN_NAV_LINKS}
    >
      {toast ? (
        <div className="mb-4 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 text-sm text-brand-black/80">
          {toast}
        </div>
      ) : null}

      <section className="mb-4 rounded-3xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Finance snapshot</p>
            <h3 className="font-display text-2xl uppercase text-brand-black">At-a-glance position</h3>
            <p className="text-sm text-brand-black/60">Designed for weekly reviews. Calm signal, clear risk.</p>
          </div>

          <div className="sticky top-3 z-10 flex flex-wrap items-center gap-2 rounded-3xl border border-brand-black/10 bg-brand-white/95 p-2 backdrop-blur">
            <ActionButton label="Add Invoice" onClick={() => openModal("add-invoice")} />
            <ActionButton label="Add Payout" onClick={() => openModal("add-payout")} />
            <FeatureGate feature="XERO_INTEGRATION_ENABLED" mode="button">
              <ActionButton
                label={xeroButtonLabel}
                onClick={syncXero}
                disabled={!xero.connected || !isFeatureEnabled('XERO_INTEGRATION_ENABLED')}
              />
            </FeatureGate>
            {!isFeatureEnabled('XERO_INTEGRATION_ENABLED') && (
              <DisabledNotice feature="XERO_INTEGRATION_ENABLED" />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dateRange === null ? "all" : String(dateRange)}
              onChange={(event) => setDateRange(event.target.value === "all" ? null : Number(event.target.value))}
              className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              {DATE_RANGES.map((range) => (
                <option key={range.label} value={range.value === null ? "all" : String(range.value)}>
                  {range.label}
                </option>
              ))}
            </select>

            <select
              value={creatorFilter}
              onChange={(event) => setCreatorFilter(event.target.value)}
              className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              <option value="All">All creators</option>
              {creators.map((creator) => (
                <option key={creator} value={creator}>
                  {creator}
                </option>
              ))}
            </select>

            <select
              value={brandFilter}
              onChange={(event) => setBrandFilter(event.target.value)}
              className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              <option value="All">All brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={dealFilter}
              onChange={(event) => setDealFilter(event.target.value)}
              className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              <option value="All">All deals</option>
              {deals.map((deal) => (
                <option key={deal} value={deal}>
                  {deal}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              <option value="All">All statuses</option>
              {["Awaiting approval", "Scheduled", "Paid", "Due", "Overdue"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
          >
            Reset filters
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <SnapshotCard loading={loadingBySection.snapshot} label="Total cash in" value={compactMoney(snapshot.cashIn)} sub="This month" />
          <SnapshotCard loading={loadingBySection.snapshot} label="Total cash out" value={compactMoney(snapshot.cashOut)} sub="This month" />
          <SnapshotCard loading={loadingBySection.snapshot} label="Net position" value={compactMoney(snapshot.net)} sub="This month" />
          <SnapshotCard loading={loadingBySection.snapshot} label="Outstanding liabilities" value={compactMoney(snapshot.liabilities)} sub="Payouts owed" />
          <SnapshotCard loading={loadingBySection.snapshot} label="Outstanding receivables" value={compactMoney(snapshot.receivables)} sub="Invoices owed" />
        </div>
      </section>

      <FinanceCard
        kicker="Attention required"
        title="Review list"
        subtitle="A calm shortlist of what needs eyes this week."
        loading={loadingBySection.snapshot}
      >
        {attention.length ? (
          <ul className="mt-4 space-y-2 text-sm text-brand-black/80">
            {attention.map((item) => (
              <li
                key={item.id}
                className="flex flex-col justify-between gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 md:flex-row md:items-center"
              >
                <div>
                  <p className="font-semibold text-brand-black">{item.label}</p>
                  <p className="text-xs text-brand-black/60">{item.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEntity(item.link)}
                    className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
                  >
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="All clear" body="No overdue invoices, delayed payouts, or missing confirmations in this range." />
        )}
      </FinanceCard>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <FinanceCard
          kicker="Payouts to creators"
          title="Liabilities"
          subtitle="What we owe creators, grouped by expected payout date."
          loading={loadingBySection.payouts}
          headerRight={
            payoutSelection.size ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{payoutSelection.size} selected</span>
                <button
                  type="button"
                  onClick={handleBulkMarkPaid}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                >
                  Bulk mark paid
                </button>
                <button
                  type="button"
                  onClick={handleBulkExport}
                  className="rounded-full border border-brand-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutSelection(new Set())}
                  className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Clear
                </button>
              </div>
            ) : null
          }
        >
          {loadingBySection.payouts ? (
            <SkeletonList rows={4} />
          ) : filteredPayouts.length ? (
            <ul className="mt-4 space-y-2 text-sm text-brand-black/80">
              {filteredPayouts.map((item) => {
                const selected = payoutSelection.has(item.id);
                return (
                  <li key={item.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => {
                            const next = new Set(payoutSelection);
                            if (event.target.checked) next.add(item.id);
                            else next.delete(item.id);
                            setPayoutSelection(next);
                          }}
                          className="mt-1 h-4 w-4"
                          aria-label="Select payout"
                        />
                        <div>
                          <button
                            type="button"
                            onClick={() => openEntity({ type: "payout", id: item.id })}
                            className="text-left font-semibold text-brand-black hover:underline"
                          >
                            {item.creator}
                          </button>
                          <p className="text-xs text-brand-black/60">{item.dealName}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-brand-black">{item.amount}</span>
                        <StatusPill status={item.status} dueDate={item.expectedDate} />
                        <ActionMenu
                          actions={[
                            { label: "View details", onClick: () => openEntity({ type: "payout", id: item.id }) },
                            { label: "Edit payout", onClick: () => openModal("edit-payout", { payoutId: item.id }) },
                            {
                              label: "Mark as paid",
                              onClick: () => {
                                if (confirm("Mark this payout as paid?")) markPayoutPaid(item.id);
                              },
                              disabled: item.status === "Paid"
                            },
                            { label: "Attach proof", onClick: () => handleAttachProof({ linkedType: "payout", linkedId: item.id }) },
                            { label: "Open linked deal", onClick: () => openEntity({ type: "deal", id: item.dealId }) }
                          ]}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-brand-black/60">Expected payout: {formatDate(item.expectedDate)}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No payouts pending" body="All payouts are up to date for the selected filters." />
          )}
        </FinanceCard>

        <FinanceCard
          kicker="Invoices to brands"
          title="Receivables"
          subtitle="What brands owe us, separated by scanable risk."
          loading={loadingBySection.invoices}
        >
          {loadingBySection.invoices ? (
            <SkeletonColumns columns={3} rows={3} />
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InvoiceColumn
                title="Overdue"
                items={filteredInvoices.filter((i) => i.status === "Overdue")}
                onOpen={(id) => openEntity({ type: "invoice", id })}
                onEdit={(id) => openModal("edit-invoice", { invoiceId: id })}
                onMarkPaid={markInvoicePaid}
                onReminder={(id) => {
                  const invoice = invoices.find((inv) => inv.id === id);
                  addTimelineEvent({
                    type: "Reminder",
                    label: `Reminder queued · ${invoice?.ref || "Invoice"}`,
                    details: "Reminder action captured for admin review. No emails are sent automatically.",
                    link: { type: "invoice", id }
                  });
                  showToast("Reminder queued (no send)");
                }}
                xero={xero}
              />
              <InvoiceColumn
                title="Due"
                items={filteredInvoices.filter((i) => i.status === "Due")}
                onOpen={(id) => openEntity({ type: "invoice", id })}
                onEdit={(id) => openModal("edit-invoice", { invoiceId: id })}
                onMarkPaid={markInvoicePaid}
                onReminder={(id) => {
                  const invoice = invoices.find((inv) => inv.id === id);
                  addTimelineEvent({
                    type: "Reminder",
                    label: `Reminder queued · ${invoice?.ref || "Invoice"}`,
                    details: "Reminder action captured for admin review. No emails are sent automatically.",
                    link: { type: "invoice", id }
                  });
                  showToast("Reminder queued (no send)");
                }}
                xero={xero}
              />
              <InvoiceColumn
                title="Paid"
                items={filteredInvoices.filter((i) => i.status === "Paid")}
                onOpen={(id) => openEntity({ type: "invoice", id })}
                onEdit={(id) => openModal("edit-invoice", { invoiceId: id })}
                onMarkPaid={markInvoicePaid}
                onReminder={() => {}}
                xero={xero}
              />
            </div>
          )}
        </FinanceCard>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <FinanceCard
          kicker="Awaiting brand payment"
          title="Cash-in risk"
          subtitle="Post-invoice, pre-cash movement tracking."
          loading={loadingBySection.cashIn}
        >
          {loadingBySection.cashIn ? (
            <SkeletonList rows={3} />
          ) : filteredCashIn.length ? (
            <ul className="mt-4 space-y-2 text-sm text-brand-black/80">
              {filteredCashIn.map((item) => (
                <li key={item.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => openEntity({ type: "cashin", id: item.id })}
                        className="text-left font-semibold text-brand-black hover:underline"
                      >
                        {item.brand}
                      </button>
                      <p className="text-xs text-brand-black/60">{item.dealName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-brand-black">{item.amount}</span>
                      <Badge tone="neutral">{item.status}</Badge>
                      <ActionMenu
                        actions={[
                          { label: "Open", onClick: () => openEntity({ type: "cashin", id: item.id }) },
                          { label: "Mark payment received", onClick: () => markCashInReceived(item.id) },
                          { label: "Upload confirmation", onClick: () => handleAttachProof({ linkedType: "cashin", linkedId: item.id }) },
                          {
                            label: "Add internal note",
                            onClick: () => {
                              const next = prompt("Internal note");
                              if (!next) return;
                              setCashInRisks((prev) => prev.map((c) => (c.id === item.id ? { ...c, note: next, updatedAt: new Date().toISOString() } : c)));
                              addTimelineEvent({
                                type: "Note",
                                label: `Note added · ${item.brand}`,
                                details: next,
                                link: { type: "cashin", id: item.id }
                              });
                              showToast("Note saved");
                            }
                          },
                          { label: "Open invoice", onClick: () => openEntity({ type: "invoice", id: item.invoiceId }) }
                        ]}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-brand-black/60">
                    {item.timeline.map((step) => (
                      <span key={step} className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-black/30" />
                        {step}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-brand-black/60">Last updated: {formatDate(item.updatedAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No cash-in items pending" body="Nothing is currently waiting for brand payment confirmation." />
          )}
        </FinanceCard>

        <FinanceCard
          kicker="Reconciled / cleared"
          title="Confidence log"
          subtitle="Recently cleared payments that reassure the system is flowing."
          loading={loadingBySection.cleared}
        >
          {loadingBySection.cleared ? (
            <SkeletonList rows={3} />
          ) : filteredCleared.length ? (
            <ul className="mt-4 space-y-2 text-sm text-brand-black/80">
              {filteredCleared.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col justify-between gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 md:flex-row md:items-center"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => openEntity({ type: "cleared", id: item.id })}
                      className="text-left font-semibold text-brand-black hover:underline"
                    >
                      {item.label}
                    </button>
                    <p className="text-xs text-brand-black/60">
                      Cleared: {formatDate(item.clearedAt)} · {item.type}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="positive">Cleared</Badge>
                    <span className="text-sm font-semibold text-brand-black">{item.amount}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.invoiceId) openEntity({ type: "invoice", id: item.invoiceId });
                        else if (item.payoutId) openEntity({ type: "payout", id: item.payoutId });
                      }}
                      className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
                    >
                      Open record
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No cleared payments yet" body="Cleared items will appear here after reconciliation." />
          )}
        </FinanceCard>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <FinanceCard
          kicker="Finance documents"
          title="Receipts & proofs"
          subtitle="Drag-and-drop uploads with clear linkage."
          loading={loadingBySection.documents}
          headerRight={
            <button
              type="button"
              className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
              onClick={() => openModal("upload-document")}
            >
              Upload
            </button>
          }
        >
          <DocumentDropzone
            onFiles={(files) => {
              if (!files.length) return;
              openModal("upload-document", { files });
            }}
          />
          {loadingBySection.documents ? (
            <SkeletonList rows={3} />
          ) : filteredDocuments.length ? (
            <ul className="mt-4 space-y-2 text-sm text-brand-black/80">
              {filteredDocuments.map((doc) => (
                <li key={doc.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => openEntity({ type: "document", id: doc.id })}
                        className="text-left font-semibold text-brand-black hover:underline"
                      >
                        {doc.label}
                      </button>
                      <p className="text-xs text-brand-black/60">
                        {doc.fileType} · {formatDateTime(doc.uploadedAt)} · Attached to {doc.linkedType ? `${doc.linkedType} ${doc.linkedId || ""}` : "—"}
                      </p>
                      {doc.progress < 100 ? (
                        <div className="mt-2 h-2 w-full rounded-full bg-brand-black/5">
                          <div className="h-2 rounded-full bg-brand-black/30" style={{ width: `${doc.progress}%` }} />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{doc.fileType}</Badge>
                      <button
                        type="button"
                        className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
                        onClick={() => openModal("preview-document", { docId: doc.id })}
                        disabled={!doc.url}
                        title={!doc.url ? "Preview available for newly uploaded files only (frontend-only)." : "Preview"}
                      >
                        Preview
                      </button>
                      <ActionMenu
                        actions={[
                          { label: "Open details", onClick: () => openEntity({ type: "document", id: doc.id }) },
                          { label: "Relink", onClick: () => openModal("relink-document", { docId: doc.id }) }
                        ]}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No receipts uploaded" body="Upload the first receipt or confirmation to start building proof trails." />
          )}
        </FinanceCard>

        <FinanceCard
          kicker="Financial activity timeline"
          title="Chronological view"
          subtitle="Clickable investigation trail (no editing)."
          loading={loadingBySection.timeline}
        >
          {loadingBySection.timeline ? (
            <SkeletonList rows={4} />
          ) : timeline.length ? (
            <ol className="mt-4 space-y-3">
              {timeline.map((event) => {
                const expanded = expandedTimelineIds.has(event.id);
                return (
                  <li key={event.id} className="flex gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-black/30" />
                      <span className="mt-2 h-full w-px bg-brand-black/10" />
                    </div>
                    <div className="flex-1 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 text-left">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => (event.link ? openEntity(event.link) : null)}
                          className="text-left font-semibold text-brand-black hover:underline"
                          disabled={!event.link}
                        >
                          {event.label}
                        </button>
                        <span className="text-xs text-brand-black/60">{formatDateTime(event.at)}</span>
                      </div>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{event.type}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-brand-black/60">Actor: {event.actor || "—"}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(expandedTimelineIds);
                            if (expanded) next.delete(event.id);
                            else next.add(event.id);
                            setExpandedTimelineIds(next);
                          }}
                          className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black"
                        >
                          {expanded ? "Collapse" : "Expand"}
                        </button>
                      </div>
                      {expanded ? <p className="mt-2 text-sm text-brand-black/70">{event.details || "No additional details captured."}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState title="No activity yet" body="Invoice and payout events will populate this timeline as finance work happens." />
          )}
        </FinanceCard>
      </section>

      <FinanceCard
        kicker="Finance analytics"
        title="Trends & distribution"
        subtitle="Calm visuals for review (hover tooltips only)."
        loading={loadingBySection.analytics}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          {ANALYTICS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAnalyticsTab(tab.id)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${
                analyticsTab === tab.id ? "border-brand-red bg-brand-red text-white" : "border-brand-black/20 text-brand-black hover:bg-brand-black/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadingBySection.analytics ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : (
          <FinanceAnalytics
            tab={analyticsTab}
            payouts={filteredPayouts}
            invoices={filteredInvoices}
            creators={creators}
          />
        )}
      </FinanceCard>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <FinanceCard
          kicker="Xero connection"
          title="Visibility & control"
          subtitle="No automation. Just connection status and manual sync entry points."
          loading={false}
        >
          <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-4">
            {xero.connected ? (
              <>
                <p className="font-semibold text-brand-black">Connected</p>
                <p className="mt-1 text-sm text-brand-black/70">
                  Last sync: {xero.lastSyncAt ? formatDateTime(xero.lastSyncAt) : "Not yet synced"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={syncXero}
                    className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                  >
                    Sync now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setXero({ connected: false, lastSyncAt: null });
                      showToast("Xero disconnected");
                    }}
                    className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
                  >
                    Disconnect
                  </button>
                </div>
                <p className="mt-3 text-xs text-brand-black/60">
                  Sync visibility: invoices, payments, reconciliation timestamps.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-brand-black">Not connected</p>
                <p className="mt-1 text-sm text-brand-black/70">
                  Sync is currently unavailable. You can still track invoices, payouts, and proofs manually.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setXero({ connected: true, lastSyncAt: null });
                      showToast("Xero connected");
                    }}
                    className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                  >
                    Connect Xero
                  </button>
                </div>
              </>
            )}
          </div>
        </FinanceCard>

        <FinanceCard
          kicker="Next actions"
          title="What finance needs to do next"
          subtitle="Clickable, owner-aware checklist. No page reload."
          loading={loadingBySection.nextActions}
        >
          {loadingBySection.nextActions ? (
            <SkeletonList rows={3} />
          ) : nextActions.length ? (
            <ul className="mt-4 space-y-3 text-sm text-brand-black/80">
              {nextActions
                .filter((action) => {
                  if (action.status === "Done") return false;
                  if (action.snoozedUntil && new Date(action.snoozedUntil).getTime() > Date.now()) return false;
                  return true;
                })
                .map((action) => (
                  <li key={action.id} className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={action.status === "Done"}
                          onChange={() => {
                            setNextActions((prev) =>
                              prev.map((a) => (a.id === action.id ? { ...a, status: a.status === "Done" ? "Open" : "Done" } : a))
                            );
                            showToast(action.status === "Done" ? "Reopened" : "Completed");
                          }}
                          className="mt-1 h-4 w-4"
                          aria-label="Mark complete"
                        />
                        <div>
                          <p className="font-semibold text-brand-black">{action.text}</p>
                          <button
                            type="button"
                            onClick={() => openEntity(action.link)}
                            className="mt-1 text-xs text-brand-black/60 underline underline-offset-4"
                          >
                            Open related record
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{action.owner}</Badge>
                        <ActionMenu
                          actions={[
                            { label: "Open record", onClick: () => openEntity(action.link) },
                            {
                              label: "Snooze 1 day",
                              onClick: () => {
                                const snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                                setNextActions((prev) => prev.map((a) => (a.id === action.id ? { ...a, snoozedUntil } : a)));
                                showToast("Snoozed");
                              }
                            },
                            {
                              label: "Snooze 3 days",
                              onClick: () => {
                                const snoozedUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
                                setNextActions((prev) => prev.map((a) => (a.id === action.id ? { ...a, snoozedUntil } : a)));
                                showToast("Snoozed");
                              }
                            },
                            {
                              label: "Snooze 7 days",
                              onClick: () => {
                                const snoozedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                                setNextActions((prev) => prev.map((a) => (a.id === action.id ? { ...a, snoozedUntil } : a)));
                                showToast("Snoozed");
                              }
                            }
                          ]}
                        />
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <EmptyState title="No actions queued" body="Finance is up to date." />
          )}
        </FinanceCard>
      </section>

      {entityFromParams ? (
        <FinanceDrawer
          entity={entityFromParams}
          payouts={payouts}
          invoices={invoices}
          cashIn={cashInRisks}
          documents={documents}
          xero={xero}
          onClose={closeDrawer}
          onOpen={openEntity}
          onMarkInvoicePaid={markInvoicePaid}
          onMarkPayoutPaid={(id) => markPayoutPaid(id)}
          onMarkCashInReceived={markCashInReceived}
          onAttachDoc={(payload) => handleAttachProof(payload)}
        />
      ) : null}

      {modal.type === "add-invoice" || modal.type === "edit-invoice" ? (
        <InvoiceModal
          mode={modal.type === "edit-invoice" ? "edit" : "create"}
          invoice={modal.payload?.invoiceId ? invoices.find((i) => i.id === modal.payload.invoiceId) : null}
          onClose={closeModal}
          onSave={(payload) => {
            if (modal.type === "edit-invoice" && payload.id) {
              setInvoices((prev) => prev.map((i) => (i.id === payload.id ? { ...i, ...payload, updatedAt: new Date().toISOString() } : i)));
              addTimelineEvent({ type: "Invoice updated", label: `Invoice updated · ${payload.ref || payload.id}`, details: "Invoice details edited in Finance UI.", link: { type: "invoice", id: payload.id } });
              showToast("Invoice updated");
              closeModal();
              return;
            }
            const id = createId("inv");
            const next = {
              id,
              brand: payload.brand,
              ref: payload.ref || `#${Math.floor(Math.random() * 900 + 100)}`,
              dealId: payload.dealId || createId("deal"),
              dealName: payload.dealName || "Unlinked deal",
              amount: payload.amount,
              status: payload.status || "Due",
              dueDate: payload.dueDate || new Date().toISOString().slice(0, 10),
              createdAt: new Date().toISOString(),
              xeroId: payload.xeroId || null,
              docIds: []
            };
            setInvoices((prev) => [next, ...prev]);
            addTimelineEvent({ type: "Invoice created", label: `Invoice created · ${next.ref}`, details: `${next.brand} · ${next.amount}`, link: { type: "invoice", id } });
            showToast("Invoice added");
            closeModal();
          }}
        />
      ) : null}

      {modal.type === "add-payout" || modal.type === "edit-payout" ? (
        <PayoutModal
          mode={modal.type === "edit-payout" ? "edit" : "create"}
          payout={modal.payload?.payoutId ? payouts.find((p) => p.id === modal.payload.payoutId) : null}
          onClose={closeModal}
          onSave={(payload) => {
            if (modal.type === "edit-payout" && payload.id) {
              setPayouts((prev) => prev.map((p) => (p.id === payload.id ? { ...p, ...payload, updatedAt: new Date().toISOString() } : p)));
              addTimelineEvent({ type: "Payout updated", label: `Payout updated · ${payload.creator || payload.id}`, details: "Payout details edited in Finance UI.", link: { type: "payout", id: payload.id } });
              showToast("Payout updated");
              closeModal();
              return;
            }
            const id = createId("payout");
            const next = {
              id,
              creator: payload.creator,
              dealId: payload.dealId || createId("deal"),
              dealName: payload.dealName || "Unlinked deal",
              amount: payload.amount,
              status: payload.status || "Awaiting approval",
              expectedDate: payload.expectedDate || new Date().toISOString().slice(0, 10),
              createdAt: new Date().toISOString(),
              proofDocIds: []
            };
            setPayouts((prev) => [next, ...prev]);
            addTimelineEvent({ type: "Payout created", label: `Payout created · ${next.creator}`, details: `${next.amount} · ${next.dealName}`, link: { type: "payout", id } });
            showToast("Payout added");
            closeModal();
          }}
        />
      ) : null}

      {modal.type === "upload-document" ? (
        <DocumentUploadModal
          payload={modal.payload}
          invoices={invoices}
          payouts={payouts}
          cashIn={cashInRisks}
          onClose={closeModal}
          onUpload={(upload) => {
            upload.files.forEach((file) =>
              addDocument({
                file,
                label: upload.label,
                linkedType: upload.linkedType,
                linkedId: upload.linkedId
              })
            );
            showToast("Upload queued");
            closeModal();
          }}
        />
      ) : null}

      {modal.type === "preview-document" ? (
        <DocumentPreviewModal
          doc={documents.find((d) => d.id === modal.payload?.docId) || null}
          onClose={closeModal}
        />
      ) : null}

      {modal.type === "relink-document" ? (
        <DocumentRelinkModal
          doc={documents.find((d) => d.id === modal.payload?.docId) || null}
          invoices={invoices}
          payouts={payouts}
          cashIn={cashInRisks}
          onClose={closeModal}
          onSave={(nextLink) => {
            setDocuments((prev) => prev.map((d) => (d.id === nextLink.docId ? { ...d, linkedType: nextLink.linkedType, linkedId: nextLink.linkedId } : d)));
            showToast("Document relinked");
            closeModal();
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

function ActionButton({ label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-brand-black/20 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-brand-black transition hover:bg-brand-black/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function FinanceCard({ kicker, title, subtitle, headerRight, children, loading = false }) {
  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{kicker}</p>
          <h4 className="font-display text-2xl uppercase text-brand-black">{title}</h4>
          <p className="text-sm text-brand-black/60">{subtitle}</p>
        </div>
        {headerRight ? <div className="flex items-center gap-2">{headerRight}</div> : null}
      </div>
      {loading ? null : null}
      <div>{children}</div>
    </section>
  );
}

function SnapshotCard({ label, value, sub, loading = false }) {
  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{label}</p>
      <p className="mt-2 font-display text-3xl uppercase text-brand-black">{loading ? "…" : value}</p>
      <p className="text-sm text-brand-black/60">{sub}</p>
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-4">
      <p className="font-semibold text-brand-black">{title}</p>
      <p className="mt-1 text-sm text-brand-black/70">{body}</p>
    </div>
  );
}

function StatusPill({ status, dueDate }) {
  const overdue = Boolean(dueDate && isOverdue(dueDate) && status !== "Paid");
  const soon = Boolean(dueDate && isDueSoon(dueDate) && status !== "Paid" && !overdue);
  if (overdue) {
    return (
      <span className="inline-flex items-center rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-red">
        Overdue
      </span>
    );
  }
  if (soon) {
    return (
      <span className="inline-flex items-center rounded-full border border-brand-black/15 bg-brand-white/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black/70">
        Due soon
      </span>
    );
  }
  return <Badge tone={status === "Paid" ? "positive" : "neutral"}>{status}</Badge>;
}

function ActionMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-brand-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ⋯
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-brand-black/10 bg-brand-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick?.();
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-brand-black hover:bg-brand-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InvoiceColumn({ title, items, onOpen, onEdit, onMarkPaid, onReminder, xero }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-3">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-2 text-sm text-brand-black/80">
          {items.map((inv) => (
            <li key={inv.id} className="rounded-xl border border-brand-black/10 bg-brand-white/70 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button type="button" onClick={() => onOpen(inv.id)} className="text-left font-semibold text-brand-black hover:underline">
                    {inv.brand}
                  </button>
                  <p className="text-xs text-brand-black/60">{inv.ref}</p>
                  <p className="text-xs text-brand-black/60">{inv.dealName}</p>
                </div>
                <span className="text-sm font-semibold text-brand-black">{inv.amount}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-brand-black/60">Due: {formatDate(inv.dueDate)}</span>
                {inv.status === "Overdue" ? (
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-red">
                    {daysOverdue(inv.dueDate)}d overdue
                  </span>
                ) : (
                  <Badge tone={inv.status === "Paid" ? "positive" : "neutral"}>{inv.status}</Badge>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ActionMenu
                  actions={[
                    { label: "View invoice", onClick: () => onOpen(inv.id) },
                    { label: "Edit invoice", onClick: () => onEdit(inv.id) },
                    { label: "Mark as paid", onClick: () => onMarkPaid(inv.id), disabled: inv.status === "Paid" },
                    {
                      label: "Send reminder",
                      onClick: () => onReminder(inv.id),
                      disabled: inv.status === "Paid"
                    },
                    { label: "Open linked deal", onClick: () => onOpen(`deal:${inv.dealId}`) }
                  ]}
                />
                {inv.xeroId ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!xero.connected) return;
                      window.open(`https://go.xero.com/AccountsReceivable/View.aspx?invoiceID=${encodeURIComponent(inv.xeroId)}`, "_blank", "noopener,noreferrer");
                    }}
                    className="rounded-full border border-brand-black/20 px-3 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black disabled:opacity-50"
                    disabled={!xero.connected}
                    title={!xero.connected ? "Connect Xero to open" : "Open in Xero"}
                  >
                    Open in Xero
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-brand-black/60">
          {title === "Paid" ? "No paid invoices in this range." : `No ${title.toLowerCase()} invoices.`}
        </p>
      )}
    </div>
  );
}

function DocumentDropzone({ onFiles }) {
  const [active, setActive] = useState(false);
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        const files = Array.from(event.dataTransfer.files || []);
        onFiles(files);
      }}
      className={[
        "mt-4 rounded-2xl border border-dashed px-4 py-4 text-sm text-brand-black/70 transition",
        active ? "border-brand-black bg-brand-black/5" : "border-brand-black/20 bg-brand-linen/40"
      ].join(" ")}
    >
      Drag & drop PDFs, confirmations, or invoices here. (Frontend-only preview for newly uploaded files.)
    </div>
  );
}

function ModalFrame({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-black/40 p-4">
      <div className="w-full max-w-3xl rounded-[36px] border border-brand-black/15 bg-white p-6 text-left text-brand-black shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-3xl uppercase">{title}</h3>
            {subtitle ? <p className="text-sm text-brand-black/60">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function InvoiceModal({ mode, invoice, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    id: invoice?.id || "",
    brand: invoice?.brand || "",
    ref: invoice?.ref || "",
    dealId: invoice?.dealId || "",
    dealName: invoice?.dealName || "",
    amount: invoice?.amount || "",
    status: invoice?.status || "Due",
    dueDate: invoice?.dueDate || "",
    xeroId: invoice?.xeroId || ""
  }));

  return (
    <ModalFrame
      title={mode === "edit" ? "Edit invoice" : "Add invoice"}
      subtitle="Frontend-only. This does not send or sync automatically."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(form)} className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            Save
          </button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Brand
          <input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Invoice reference
          <input value={form.ref} onChange={(e) => setForm((p) => ({ ...p, ref: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" placeholder="#463" />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Amount
          <input value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" placeholder="£18,000" />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Deal name
          <input value={form.dealName} onChange={(e) => setForm((p) => ({ ...p, dealName: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Due date
          <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Status
          <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm">
            <option>Due</option>
            <option>Overdue</option>
            <option>Paid</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Xero invoice ID (optional)
          <input value={form.xeroId} onChange={(e) => setForm((p) => ({ ...p, xeroId: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" placeholder="xero-inv-123" />
        </label>
      </div>
    </ModalFrame>
  );
}

function PayoutModal({ mode, payout, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    id: payout?.id || "",
    creator: payout?.creator || "",
    dealId: payout?.dealId || "",
    dealName: payout?.dealName || "",
    amount: payout?.amount || "",
    status: payout?.status || "Awaiting approval",
    expectedDate: payout?.expectedDate || ""
  }));

  return (
    <ModalFrame
      title={mode === "edit" ? "Edit payout" : "Add payout"}
      subtitle="Frontend-only. This does not release payments."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(form)} className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            Save
          </button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Creator
          <input value={form.creator} onChange={(e) => setForm((p) => ({ ...p, creator: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Deal name
          <input value={form.dealName} onChange={(e) => setForm((p) => ({ ...p, dealName: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Amount
          <input value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" placeholder="£8,400" />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Status
          <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm">
            <option>Awaiting approval</option>
            <option>Scheduled</option>
            <option>Paid</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Expected payout date
          <input type="date" value={form.expectedDate} onChange={(e) => setForm((p) => ({ ...p, expectedDate: e.target.value }))} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" />
        </label>
      </div>
    </ModalFrame>
  );
}

function DocumentUploadModal({ payload, invoices, payouts, cashIn, onClose, onUpload }) {
  const initialFiles = Array.isArray(payload?.files) ? payload.files : [];
  const [files, setFiles] = useState(initialFiles);
  const [label, setLabel] = useState("");
  const [linkedType, setLinkedType] = useState(payload?.linkedType || "none");
  const [linkedId, setLinkedId] = useState(payload?.linkedId || "");

  const recordOptions = useMemo(() => {
    if (linkedType === "invoice") return invoices.map((i) => ({ id: i.id, label: `${i.brand} ${i.ref}` }));
    if (linkedType === "payout") return payouts.map((p) => ({ id: p.id, label: `${p.creator} · ${p.dealName}` }));
    if (linkedType === "cashin") return cashIn.map((c) => ({ id: c.id, label: `${c.brand} · ${c.dealName}` }));
    return [];
  }, [linkedType, invoices, payouts, cashIn]);

  useEffect(() => {
    if (linkedType === "none") return;
    if (!linkedId && recordOptions.length) setLinkedId(recordOptions[0].id);
  }, [linkedType, recordOptions, linkedId]);

  return (
    <ModalFrame
      title="Upload document"
      subtitle="Drag-and-drop is supported. Link this doc to an invoice, payout, or payment confirmation."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onUpload({ files, label, linkedType, linkedId })}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            disabled={files.length === 0}
          >
            Upload
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-4">
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full text-sm"
          />
          <p className="mt-2 text-xs text-brand-black/60">Selected: {files.length ? files.map((f) => f.name).join(", ") : "None"}</p>
        </div>
        <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm" placeholder="Wire confirmation / Invoice PDF / Payout receipt" />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Attach to
            <select value={linkedType} onChange={(e) => setLinkedType(e.target.value)} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm">
              <option value="none">None</option>
              <option value="invoice">Invoice</option>
              <option value="payout">Payout</option>
              <option value="cashin">Awaiting payment</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Linked record
            <select
              value={linkedId}
              onChange={(e) => setLinkedId(e.target.value)}
              disabled={linkedType === "none"}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm disabled:opacity-50"
            >
              {linkedType === "none" ? <option value="">—</option> : null}
              {recordOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </ModalFrame>
  );
}

function DocumentPreviewModal({ doc, onClose }) {
  return (
    <ModalFrame
      title="Document preview"
      subtitle={doc ? `${doc.fileName} · ${doc.fileType}` : "No document selected"}
      onClose={onClose}
    >
      {doc?.url ? (
        doc.fileType?.toUpperCase() === "PDF" ? (
          <iframe title={doc.fileName} src={doc.url} className="h-[70vh] w-full rounded-2xl border border-brand-black/10 bg-brand-white" />
        ) : (
          <p className="text-sm text-brand-black/70">Preview is available for PDFs only.</p>
        )
      ) : (
        <p className="text-sm text-brand-black/70">
          Preview is available for newly uploaded files only (frontend-only). Existing seeded docs have no local URL.
        </p>
      )}
    </ModalFrame>
  );
}

function DocumentRelinkModal({ doc, invoices, payouts, cashIn, onClose, onSave }) {
  const [linkedType, setLinkedType] = useState(doc?.linkedType || "none");
  const [linkedId, setLinkedId] = useState(doc?.linkedId || "");

  const recordOptions = useMemo(() => {
    if (linkedType === "invoice") return invoices.map((i) => ({ id: i.id, label: `${i.brand} ${i.ref}` }));
    if (linkedType === "payout") return payouts.map((p) => ({ id: p.id, label: `${p.creator} · ${p.dealName}` }));
    if (linkedType === "cashin") return cashIn.map((c) => ({ id: c.id, label: `${c.brand} · ${c.dealName}` }));
    return [];
  }, [linkedType, invoices, payouts, cashIn]);

  useEffect(() => {
    if (linkedType === "none") return;
    if (!linkedId && recordOptions.length) setLinkedId(recordOptions[0].id);
  }, [linkedType, recordOptions, linkedId]);

  return (
    <ModalFrame
      title="Relink document"
      subtitle="Update which record this document is attached to."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => (doc ? onSave({ docId: doc.id, linkedType, linkedId: linkedType === "none" ? null : linkedId }) : null)}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            disabled={!doc}
          >
            Save
          </button>
        </div>
      }
    >
      {doc ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Attach to
            <select value={linkedType} onChange={(e) => setLinkedType(e.target.value)} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm">
              <option value="none">None</option>
              <option value="invoice">Invoice</option>
              <option value="payout">Payout</option>
              <option value="cashin">Awaiting payment</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Linked record
            <select value={linkedId} onChange={(e) => setLinkedId(e.target.value)} disabled={linkedType === "none"} className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm disabled:opacity-50">
              {linkedType === "none" ? <option value="">—</option> : null}
              {recordOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <p className="text-sm text-brand-black/70">Document not found.</p>
      )}
    </ModalFrame>
  );
}

function FinanceDrawer({
  entity,
  payouts,
  invoices,
  cashIn,
  documents,
  xero,
  onClose,
  onOpen,
  onMarkInvoicePaid,
  onMarkPayoutPaid,
  onMarkCashInReceived,
  onAttachDoc
}) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const record = (() => {
    if (entity.type === "invoice") return invoices.find((i) => i.id === entity.id) || null;
    if (entity.type === "payout") return payouts.find((p) => p.id === entity.id) || null;
    if (entity.type === "cashin") return cashIn.find((c) => c.id === entity.id) || null;
    if (entity.type === "document") return documents.find((d) => d.id === entity.id) || null;
    if (entity.type === "deal") return null;
    return null;
  })();

  const breadcrumbs = useMemo(() => {
    const items = [{ label: "Finance", onClick: onClose }];
    items.push({ label: entity.type, onClick: () => {} });
    items.push({ label: entity.id, onClick: () => {} });
    return items;
  }, [entity.type, entity.id, onClose]);

  const externalUrl = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "/admin/finance";
    const params = new URLSearchParams();
    if (entity.type === "invoice") params.set("invoice", entity.id);
    if (entity.type === "payout") params.set("payout", entity.id);
    if (entity.type === "cashin") params.set("cashin", entity.id);
    if (entity.type === "document") params.set("doc", entity.id);
    if (entity.type === "deal") params.set("deal", entity.id);
    return `${base}?${params.toString()}`;
  }, [entity.type, entity.id]);

  const linkedDocs = useMemo(() => {
    if (!record) return [];
    if (entity.type === "invoice") return documents.filter((d) => d.linkedType === "invoice" && d.linkedId === record.id);
    if (entity.type === "payout") return documents.filter((d) => d.linkedType === "payout" && d.linkedId === record.id);
    if (entity.type === "cashin") return documents.filter((d) => d.linkedType === "cashin" && d.linkedId === record.id);
    if (entity.type === "document") return [record];
    return [];
  }, [documents, entity.type, record]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-brand-black/30" onClick={onClose} />
      <aside className={`absolute right-0 top-0 h-full overflow-y-auto border-l border-brand-black/10 bg-brand-white p-6 text-brand-black shadow-[0_30px_120px_rgba(0,0,0,0.35)] transition-all duration-300 ${
        isFullscreen ? "w-full" : "w-full max-w-xl"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Breadcrumbs</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-brand-black/70">
              {breadcrumbs.map((crumb, idx) => (
                <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-2">
                  <button type="button" className="underline underline-offset-4" onClick={crumb.onClick}>
                    {crumb.label}
                  </button>
                  {idx < breadcrumbs.length - 1 ? <span className="text-brand-black/30">/</span> : null}
                </span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-full border border-brand-black/20 px-3 py-1.5 text-xs uppercase tracking-[0.3em] text-brand-black/70 hover:bg-brand-black/5 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            <button type="button" onClick={onClose} className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]">
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{entity.type}</p>
              <h3 className="font-display text-2xl uppercase text-brand-black">{entity.id}</h3>
            </div>
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
            >
              Open in new tab
            </a>
          </div>
          <p className="mt-2 text-sm text-brand-black/70">{record ? "Details are read-only in this drawer unless explicitly actioned." : "Record not found."}</p>
        </div>

        {entity.type === "invoice" && record ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Invoice</p>
              <p className="mt-1 text-sm text-brand-black/70">
                {record.brand} · {record.ref} · {record.amount}
              </p>
              <p className="mt-1 text-xs text-brand-black/60">Due: {formatDate(record.dueDate)} · Status: {record.status}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onMarkInvoicePaid(record.id)} className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]" disabled={record.status === "Paid"}>
                  Mark paid
                </button>
                <button type="button" onClick={() => onOpen({ type: "deal", id: record.dealId })} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                  Open deal
                </button>
                <button type="button" onClick={() => onAttachDoc({ linkedType: "invoice", linkedId: record.id })} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                  Attach doc
                </button>
                {record.xeroId ? (
                  <button
                    type="button"
                    disabled={!xero.connected}
                    onClick={() => window.open(`https://go.xero.com/AccountsReceivable/View.aspx?invoiceID=${encodeURIComponent(record.xeroId)}`, "_blank", "noopener,noreferrer")}
                    className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] disabled:opacity-50"
                    title={!xero.connected ? "Connect Xero to open" : "Open in Xero"}
                  >
                    View in Xero
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {entity.type === "payout" && record ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Payout</p>
              <p className="mt-1 text-sm text-brand-black/70">
                {record.creator} · {record.amount}
              </p>
              <p className="mt-1 text-xs text-brand-black/60">Expected: {formatDate(record.expectedDate)} · Status: {record.status}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onMarkPayoutPaid(record.id)} className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]" disabled={record.status === "Paid"}>
                  Mark paid
                </button>
                <button type="button" onClick={() => onOpen({ type: "deal", id: record.dealId })} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                  Open deal
                </button>
                <button type="button" onClick={() => onAttachDoc({ linkedType: "payout", linkedId: record.id })} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                  Attach proof
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {entity.type === "cashin" && record ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Awaiting payment</p>
              <p className="mt-1 text-sm text-brand-black/70">
                {record.brand} · {record.amount}
              </p>
              <p className="mt-1 text-xs text-brand-black/60">Status: {record.status} · Updated: {formatDate(record.updatedAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onMarkCashInReceived(record.id)} className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]">
                  Mark received
                </button>
                <button type="button" onClick={() => onOpen({ type: "invoice", id: record.invoiceId })} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                  Open invoice
                </button>
                <button type="button" onClick={() => onAttachDoc({ linkedType: "cashin", linkedId: record.id })} className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]">
                  Upload confirmation
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {entity.type === "document" && record ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Document</p>
              <p className="mt-1 text-sm text-brand-black/70">{record.label}</p>
              <p className="mt-1 text-xs text-brand-black/60">{record.fileName} · {record.fileType} · Uploaded {formatDateTime(record.uploadedAt)}</p>
              {record.linkedType && record.linkedId ? (
                <button
                  type="button"
                  onClick={() => onOpen({ type: record.linkedType, id: record.linkedId })}
                  className="mt-3 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Open attached record
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {linkedDocs.length ? (
          <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-white p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Attached documents</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-black/80">
              {linkedDocs.map((doc) => (
                <li key={doc.id} className="rounded-xl border border-brand-black/10 bg-brand-linen/50 px-3 py-2">
                  <button type="button" className="font-semibold text-brand-black hover:underline" onClick={() => onOpen({ type: "document", id: doc.id })}>
                    {doc.label}
                  </button>
                  <p className="text-xs text-brand-black/60">{doc.fileType} · {formatDateTime(doc.uploadedAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function SkeletonList({ rows = 3 }) {
  return (
    <div className="mt-4 space-y-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-16 rounded-2xl border border-brand-black/10 bg-brand-linen/40 animate-pulse" />
      ))}
    </div>
  );
}

function SkeletonColumns({ columns = 3, rows = 3 }) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {Array.from({ length: columns }).map((_, cIdx) => (
        <div key={cIdx} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-3">
          <div className="h-4 w-24 rounded bg-brand-black/10 animate-pulse" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <div key={rIdx} className="h-20 rounded-xl border border-brand-black/10 bg-brand-white/60 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonChart() {
  return <div className="h-56 rounded-3xl border border-brand-black/10 bg-brand-linen/40 animate-pulse" />;
}

function FinanceAnalytics({ tab, payouts, invoices, creators }) {
  const cashFlowSeries = useMemo(() => {
    const byMonth = new Map();
    const add = (key, amount, type) => {
      const current = byMonth.get(key) || { month: key, in: 0, out: 0 };
      if (type === "in") current.in += amount;
      else current.out += amount;
      byMonth.set(key, current);
    };
    invoices.forEach((inv) => {
      const date = inv.createdAt || inv.dueDate;
      const month = (date || "").slice(0, 7);
      const { value } = parseMoney(inv.amount);
      if (!month) return;
      if (inv.status === "Paid") add(month, value, "in");
    });
    payouts.forEach((p) => {
      const date = p.createdAt || p.expectedDate;
      const month = (date || "").slice(0, 7);
      const { value } = parseMoney(p.amount);
      if (!month) return;
      if (p.status === "Paid") add(month, value, "out");
    });
    return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [invoices, payouts]);

  const payoutsByCreator = useMemo(() => {
    const rows = creators.map((creator) => {
      const total = payouts
        .filter((p) => p.creator === creator)
        .reduce((sum, p) => sum + parseMoney(p.amount).value, 0);
      return { creator, total };
    });
    return rows.sort((a, b) => b.total - a.total).slice(0, 6);
  }, [payouts, creators]);

  const invoicesByStatus = useMemo(() => {
    const statuses = ["Overdue", "Due", "Paid"];
    const totals = statuses.map((status) => ({
      status,
      total: invoices.filter((i) => i.status === status).reduce((sum, i) => sum + parseMoney(i.amount).value, 0)
    }));
    return totals;
  }, [invoices]);

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      {tab === "cashflow" || tab === "monthly-trend" ? (
        <ChartCard title="Cash in vs cash out" subtitle="Paid invoices vs paid payouts">
          <LineChart
            series={[
              { label: "Cash in", color: "#0f0f10", values: cashFlowSeries.map((p) => ({ x: p.month, y: p.in })) },
              { label: "Cash out", color: "#6b6b6b", values: cashFlowSeries.map((p) => ({ x: p.month, y: p.out })) }
            ]}
          />
        </ChartCard>
      ) : null}

      {tab === "rev-vs-payouts" || tab === "cashflow" ? (
        <ChartCard title="Payouts by creator" subtitle="Distribution across creators">
          <BarChart
            items={payoutsByCreator.map((row) => ({ label: row.creator, value: row.total }))}
            color="#0f0f10"
          />
        </ChartCard>
      ) : null}

      {tab === "outstanding-vs-cleared" ? (
        <>
          <ChartCard title="Invoices by status" subtitle="Overdue / due / paid">
            <StackedBar
              segments={invoicesByStatus.map((row) => ({
                label: row.status,
                value: row.total,
                color: row.status === "Paid" ? "#0f0f10" : "#b9b9b9"
              }))}
            />
          </ChartCard>
          <ChartCard title="Outstanding vs cleared" subtitle="Simple comparison">
            <BarChart
              items={[
                {
                  label: "Outstanding",
                  value: invoices.filter((i) => i.status !== "Paid").reduce((sum, i) => sum + parseMoney(i.amount).value, 0)
                },
                {
                  label: "Cleared",
                  value: invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + parseMoney(i.amount).value, 0)
                }
              ]}
              color="#0f0f10"
            />
          </ChartCard>
        </>
      ) : null}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-4">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{title}</p>
      <p className="text-sm text-brand-black/60">{subtitle}</p>
      <div className="mt-3 rounded-2xl border border-brand-black/10 bg-brand-white/70 p-3">{children}</div>
    </div>
  );
}

function LineChart({ series }) {
  const width = 520;
  const height = 180;
  const padding = 28;
  const allPoints = series.flatMap((s) => s.values.map((v) => v.y));
  const maxY = Math.max(1, ...allPoints);
  const ticks = series[0]?.values?.map((v) => v.x) || [];

  const xForIndex = (idx) => {
    if (ticks.length <= 1) return padding;
    const span = width - padding * 2;
    return padding + (idx / (ticks.length - 1)) * span;
  };
  const yForValue = (val) => {
    const span = height - padding * 2;
    return height - padding - (val / maxY) * span;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e5e5" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e5e5" />

      {series.map((s) => {
        const d = s.values
          .map((point, idx) => {
            const x = xForIndex(idx);
            const y = yForValue(point.y);
            return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ");
        return <path key={s.label} d={d} fill="none" stroke={s.color} strokeWidth="2.5" />;
      })}

      {series.map((s) =>
        s.values.map((point, idx) => {
          const x = xForIndex(idx);
          const y = yForValue(point.y);
          return (
            <circle key={`${s.label}-${point.x}`} cx={x} cy={y} r="3.5" fill={s.color}>
              <title>{`${s.label} · ${point.x}: ${Math.round(point.y)}`}</title>
            </circle>
          );
        })
      )}

      {ticks.map((label, idx) => (
        <text key={label} x={xForIndex(idx)} y={height - 8} textAnchor="middle" fontSize="10" fill="#6b6b6b">
          {label.slice(5)}
        </text>
      ))}
      <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
    </svg>
  );
}

function Legend({ items }) {
  return (
    <foreignObject x="0" y="0" width="520" height="32">
      <div className="flex flex-wrap gap-2 px-2 pt-2 text-xs text-brand-black/60">
        {items.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-white/60 px-3 py-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </foreignObject>
  );
}

function BarChart({ items, color }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-brand-black/60">
            <span>{item.label}</span>
            <span>{Math.round(item.value)}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-brand-black/5">
            <div
              className="h-3 rounded-full"
              style={{ width: `${Math.round((item.value / max) * 100)}%`, backgroundColor: color }}
              title={`${item.label}: ${Math.round(item.value)}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StackedBar({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-brand-black/5">
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${Math.round((seg.value / total) * 100)}%`, backgroundColor: seg.color }}
            title={`${seg.label}: ${Math.round(seg.value)}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-brand-black/60">
        {segments.map((seg) => (
          <span key={seg.label} className="inline-flex items-center gap-2 rounded-full border border-brand-black/10 bg-brand-white/60 px-3 py-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
