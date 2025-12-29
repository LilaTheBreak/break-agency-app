import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "./Badge.jsx";
import { listContracts, createContractRequest, sendContractRequest, fetchContractStatus } from "../services/contractClient.js";
import { FeatureGate, useFeature, DisabledNotice } from "./FeatureGate.jsx";

const SIGNING_FLAG = "CONTRACT_SIGNING_ENABLED";

const CONTRACT_TYPES = [
  "Creator Representation Agreement",
  "Brand Campaign Agreement",
  "Founder-Led Strategy Agreement",
  "Affiliate / Commission Agreement",
  "One-Off Activation / Event Contract",
  "Custom Contract"
];

const DELIVERY_METHODS = [
  "Send via PandaDoc",
  "Upload external contract (PDF)",
  "Draft only (internal review)"
];

const STATUS_ORDER = ["Draft", "Sent", "Viewed", "Signed", "Expired", "Cancelled"];

// TODO: Fetch contracts from API endpoint /api/contracts
// TODO: Fetch contracts from API endpoint /api/contracts
const SEED_CONTRACTS = [];

const STATUS_TONES = {
  Draft: "neutral",
  Sent: "neutral",
  Viewed: "neutral",
  Signed: "positive",
  Expired: "neutral",
  Cancelled: "neutral"
};

export function ContractsPanel({ session, title = "Contracts", description }) {
  // UNLOCK WHEN: CONTRACT_SIGNING_ENABLED flag + PandaDoc/DocuSign integration configured + /api/contracts endpoints functional
  const isContractSigningEnabled = useFeature(SIGNING_FLAG);
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterOwner, setFilterOwner] = useState("All");
  const [alertMessage, setAlertMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    type: CONTRACT_TYPES[0],
    creator: "",
    brand: "",
    founder: "",
    owner: session?.name || "Admin",
    value: "",
    currency: "USD",
    startDate: "",
    endDate: "",
    commission: "",
    territory: "",
    deliveryMethod: DELIVERY_METHODS[0]
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await listContracts();
        if (response?.contracts?.length) {
          setContracts(response.contracts);
        } else {
          setAlertMessage("Using workspace mode. You can upload and track contracts manually.");
        }
      } catch {
        setAlertMessage("Document sending is currently unavailable. You can still upload and track contracts manually.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        !search ||
        contract.name.toLowerCase().includes(search.toLowerCase()) ||
        (contract.creator || "").toLowerCase().includes(search.toLowerCase()) ||
        (contract.brand || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "All" || contract.status === filterStatus;
      const matchesType = filterType === "All" || contract.type === filterType;
      const matchesOwner = filterOwner === "All" || contract.owner === filterOwner;
      return matchesSearch && matchesStatus && matchesType && matchesOwner;
    });
  }, [contracts, search, filterStatus, filterType, filterOwner]);

  const activeContract = filteredContracts.find((c) => c.id === selectedId) || filteredContracts[0] || null;

  const owners = useMemo(() => Array.from(new Set(contracts.map((c) => c.owner))).filter(Boolean), [contracts]);

  const complianceAlerts = useMemo(() => {
    return filteredContracts.flatMap((contract) => {
      const alerts = [];
      if (contract.status !== "Signed" && contract.signatureStatus !== "Signed") {
        alerts.push({ contractId: contract.id, label: "Missing signatures" });
      }
      if (contract.status === "Expired") {
        alerts.push({ contractId: contract.id, label: "Expired contract" });
      }
      if (contract.value && Number.parseFloat(contract.value.replace(/[,]/g, "")) > 50000) {
        alerts.push({ contractId: contract.id, label: "High-value contract" });
      }
      if (!contract.linkedDeal) {
        alerts.push({ contractId: contract.id, label: "No linked deal" });
      }
      return alerts;
    });
  }, [filteredContracts]);

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!isContractSigningEnabled) return; // Gate action
    
    const newContract = {
      id: `ctr-${Date.now()}`,
      name: formState.name || "Untitled contract",
      type: formState.type,
      creator: formState.creator || null,
      brand: formState.brand || null,
      founder: formState.founder || null,
      owner: formState.owner || "Admin",
      value: formState.value,
      currency: formState.currency,
      status: "Draft",
      signatureStatus: "Not sent",
      lastUpdated: new Date().toISOString(),
      startDate: formState.startDate,
      endDate: formState.endDate,
      commission: formState.commission,
      territory: formState.territory,
      deliveryMethod: formState.deliveryMethod,
      timeline: [{ label: "Draft", timestamp: new Date().toISOString() }],
      parties: [
        { name: formState.owner || "Admin owner", role: "Admin Owner", email: session?.email || "admin@thebreak.co" }
      ],
      documents: [],
      notes: "Draft created for internal review.",
      risk: []
    };
    setContracts((prev) => [newContract, ...prev]);
    setSelectedId(newContract.id);
    setModalOpen(false);
    try {
      await createContractRequest({ title: newContract.name, parties: [], variables: {} });
    } catch {
      // Silently ignore; admin-only workspace mode.
    }
  };

  const handleSend = async (contractId) => {
    if (!isContractSigningEnabled) return; // Gate action
    
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: "Sent",
              signatureStatus: "Awaiting signature",
              timeline: upsertTimeline(c.timeline, "Sent")
            }
          : c
      )
    );
    try {
      await sendContractRequest({ contractId });
    } catch {
      setAlertMessage("Could not send via provider. Track manually or upload signed copy.");
    }
  };

  const handleMarkCancelled = (contractId) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? { ...c, status: "Cancelled", signatureStatus: "Cancelled", timeline: upsertTimeline(c.timeline, "Cancelled") }
          : c
      )
    );
  };

  const handleUploadSigned = (contractId) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: "Signed",
              signatureStatus: "Signed",
              documents: [...(c.documents || []), { label: "Signed copy", url: "#", updatedAt: new Date().toISOString() }],
              timeline: upsertTimeline(c.timeline, "Signed")
            }
          : c
      )
    );
  };

  const handleRefreshStatus = async (contractId) => {
    try {
      await fetchContractStatus(contractId);
      setAlertMessage("Status refreshed. Provider sync may be delayed; workspace remains available.");
    } catch {
      setAlertMessage("Status refresh unavailable. Continue tracking manually.");
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
          <p className="text-sm text-brand-black/70">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FeatureGate feature={SIGNING_FLAG} mode="button">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              Generate contract
            </button>
          </FeatureGate>
          <button
            type="button"
            onClick={() => setAlertMessage("Document sending is currently unavailable. You can still upload and track contracts manually.")}
            className="rounded-full border border-brand-black/30 px-4 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black"
          >
            Workspace mode
          </button>
        </div>
      </div>

      {!isContractSigningEnabled && <DisabledNotice feature={SIGNING_FLAG} />}

      {alertMessage ? (
        <p className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 px-4 py-3 text-sm text-brand-black/80">
          {alertMessage}
        </p>
      ) : null}

      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search contracts, creators, or brands"
            className="flex-1 min-w-[180px] rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            {["All", ...STATUS_ORDER].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            {["All", ...CONTRACT_TYPES].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={filterOwner}
            onChange={(event) => setFilterOwner(event.target.value)}
            className="rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option value="All">All owners</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.3em]">
            <button
              type="button"
              className="rounded-full border border-brand-black/20 px-3 py-1"
              onClick={() => {
                setFilterStatus("Sent");
                setFilterType("All");
                setFilterOwner("All");
              }}
            >
              Awaiting signature
            </button>
            <button
              type="button"
              className="rounded-full border border-brand-black/20 px-3 py-1"
              onClick={() => setFilterStatus("Signed")}
            >
              Signed this month
            </button>
          </div>
        </div>
      </div>

      {complianceAlerts.length ? (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white/80 p-3">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Compliance watch</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {complianceAlerts.map((alert) => (
              <Badge key={`${alert.contractId}-${alert.label}`} tone="neutral">
                {alert.label}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-3">
          {loading ? (
            <p className="text-sm text-brand-black/60">Loading contracts…</p>
          ) : filteredContracts.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-brand-black/80">
                <thead>
                  <tr className="border-b border-brand-black/10 text-[0.75rem] uppercase tracking-[0.25em] text-brand-black/60">
                    <th className="px-3 py-2">Contract</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Linked</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Updated</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-brand-black/5 hover:bg-brand-linen/40"
                    >
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setSelectedId(contract.id)}
                          className="text-left font-semibold text-brand-black hover:underline"
                        >
                          {contract.name}
                        </button>
                      </td>
                      <td className="px-3 py-2">{contract.type}</td>
                      <td className="px-3 py-2 text-xs text-brand-black/70">
                        {contract.creator || contract.brand || contract.founder || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {contract.value ? `${contract.currency} ${contract.value}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={STATUS_TONES[contract.status] || "neutral"}>{contract.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs">{contract.owner || "Admin"}</td>
                      <td className="px-3 py-2 text-xs text-brand-black/60">
                        {contract.lastUpdated ? new Date(contract.lastUpdated).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.25em]">
                          <button
                            type="button"
                            className="rounded-full border border-brand-black px-2 py-1"
                            onClick={() => setSelectedId(contract.id)}
                          >
                            View
                          </button>
                        <FeatureGate feature={SIGNING_FLAG} mode="button">
                            <button
                              type="button"
                              className="rounded-full border border-brand-black/30 px-2 py-1"
                              onClick={() => handleSend(contract.id)}
                            >
                              {contract.status === "Sent" ? "Resend" : "Send"}
                            </button>
                          </FeatureGate>
                          <button
                            type="button"
                            className="rounded-full border border-brand-black/30 px-2 py-1"
                            onClick={() => handleRefreshStatus(contract.id)}
                          >
                            Refresh
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-brand-black/30 px-2 py-1"
                            onClick={() => handleMarkCancelled(contract.id)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-brand-red/40 bg-brand-red/10 px-2 py-1 text-brand-red"
                            onClick={() => handleUploadSigned(contract.id)}
                          >
                            Upload signed
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-6 text-sm text-brand-black/70">
              <p className="font-semibold text-brand-black">No contracts yet</p>
              <p className="mt-1">You haven’t created any contracts yet. Generate your first contract to get started.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
          {activeContract ? (
            <ContractDetail contract={activeContract} />
          ) : (
            <p className="text-sm text-brand-black/60">Select a contract to view details.</p>
          )}
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-black/40 p-4">
          <div className="mx-auto my-6 w-full max-w-3xl space-y-4 rounded-[32px] border border-brand-black/15 bg-white p-6 text-brand-black shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-3xl uppercase">Generate contract</h3>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
                  Draft → send → upload signed copies
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
            <form className="grid max-h-[70vh] gap-3 overflow-y-auto md:grid-cols-2" onSubmit={handleGenerate}>
              <label className="text-xs uppercase tracking-[0.35em]">
                Contract name
                <input
                  required
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  placeholder="Creator Representation Agreement"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.35em]">
                Contract type
                <select
                  value={formState.type}
                  onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                >
                  {CONTRACT_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.35em]">
                Creator (optional)
                <input
                  value={formState.creator}
                  onChange={(event) => setFormState((prev) => ({ ...prev, creator: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  placeholder="Creator name"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.35em]">
                Brand
                <input
                  value={formState.brand}
                  onChange={(event) => setFormState((prev) => ({ ...prev, brand: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  placeholder="Brand name"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.35em]">
                Founder client (optional)
                <input
                  value={formState.founder}
                  onChange={(event) => setFormState((prev) => ({ ...prev, founder: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  placeholder="Founder name"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.35em]">
                Admin owner
                <input
                  value={formState.owner}
                  onChange={(event) => setFormState((prev) => ({ ...prev, owner: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  placeholder="Admin owner"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs uppercase tracking-[0.35em]">
                  Value
                  <input
                    value={formState.value}
                    onChange={(event) => setFormState((prev) => ({ ...prev, value: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                    placeholder="Amount"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.35em]">
                  Currency
                  <input
                    value={formState.currency}
                    onChange={(event) => setFormState((prev) => ({ ...prev, currency: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                    placeholder="USD"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs uppercase tracking-[0.35em]">
                  Start date
                  <input
                    type="date"
                    value={formState.startDate}
                    onChange={(event) => setFormState((prev) => ({ ...prev, startDate: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.35em]">
                  End date / term
                  <input
                    type="date"
                    value={formState.endDate}
                    onChange={(event) => setFormState((prev) => ({ ...prev, endDate: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.35em]">
                Commission %
                <input
                  value={formState.commission}
                  onChange={(event) => setFormState((prev) => ({ ...prev, commission: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  placeholder="e.g., 15%"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.35em]">
                Territory / usage rights
                <input
                  value={formState.territory}
                  onChange={(event) => setFormState((prev) => ({ ...prev, territory: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.35em] md:col-span-2">
                Delivery method
                <select
                  value={formState.deliveryMethod}
                  onChange={(event) => setFormState((prev) => ({ ...prev, deliveryMethod: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                >
                  {DELIVERY_METHODS.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Create
                </button>
              </div>
            </form>
            <p className="text-xs text-brand-black/60">
              Document sending is optional. If PandaDoc is disconnected, upload or track manually.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ContractDetail({ contract }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Overview</p>
          <h4 className="font-display text-2xl uppercase text-brand-black">{contract.name}</h4>
          <p className="text-xs text-brand-black/60">{contract.type}</p>
          <p className="text-xs text-brand-black/60">
            Last updated {contract.lastUpdated ? new Date(contract.lastUpdated).toLocaleString() : "—"}
          </p>
        </div>
        <Badge tone={STATUS_TONES[contract.status] || "neutral"}>{contract.status}</Badge>
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-3">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Status timeline</p>
        <div className="mt-2 flex flex-col gap-1 text-sm text-brand-black/80">
          {STATUS_ORDER.map((step) => {
            const match = (contract.timeline || []).find((item) => item.label === step);
            return (
              <div key={step} className="flex items-center justify-between">
                <span>{step}</span>
                <span className="text-xs text-brand-black/60">
                  {match ? new Date(match.timestamp).toLocaleString() : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-3">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Parties</p>
        <ul className="mt-2 space-y-2 text-sm text-brand-black/80">
          {(contract.parties || []).map((party, index) => (
            <li key={`${contract.id}-party-${index}`} className="rounded-xl border border-brand-black/10 bg-brand-linen/50 p-2">
              <p className="font-semibold text-brand-black">{party.name}</p>
              <p className="text-xs text-brand-black/60">{party.role}</p>
              <p className="text-xs text-brand-black/60">{party.email}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-3">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Commercial terms</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-brand-black/80">
          <span>Value: {contract.value ? `${contract.currency} ${contract.value}` : "—"}</span>
          <span>Commission: {contract.commission || "—"}</span>
          <span>Start: {contract.startDate || "—"}</span>
          <span>End: {contract.endDate || "—"}</span>
          <span className="col-span-2">Territory / usage: {contract.territory || "—"}</span>
          <span className="col-span-2">Delivery: {contract.deliveryMethod || "—"}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-3">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Documents</p>
        {contract.documents?.length ? (
          <ul className="mt-2 space-y-2 text-sm">
            {contract.documents.map((doc, index) => (
              <li key={`${contract.id}-doc-${index}`} className="flex items-center justify-between rounded-xl border border-brand-black/10 bg-brand-linen/50 px-3 py-2">
                <span className="text-brand-black">{doc.label}</span>
                <span className="text-xs text-brand-black/60">
                  {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-brand-black/60">No documents uploaded yet.</p>
        )}
      </div>

      <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-3">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Internal notes</p>
        <p className="mt-2 text-sm text-brand-black/80">{contract.notes || "Add internal notes"}</p>
        {contract.risk?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {contract.risk.map((flag) => (
              <Badge key={flag} tone="neutral">
                {flag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function upsertTimeline(timeline = [], step) {
  const existing = timeline.find((item) => item.label === step);
  if (existing) {
    return timeline.map((item) => (item.label === step ? { ...item, timestamp: new Date().toISOString() } : item));
  }
  return [...timeline, { label: step, timestamp: new Date().toISOString() }];
}
