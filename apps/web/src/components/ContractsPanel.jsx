import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "./Badge.jsx";
import {
  listContracts,
  createContractRequest,
  sendContractRequest,
  fetchContractStatus
} from "../services/contractClient.js";

const STATUS_TONES = {
  draft: "neutral",
  sent: "positive",
  signed: "positive",
  cancelled: "neutral"
};

export function ContractsPanel({ session, title = "Contracts", description }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState({ title: "", parties: "", variables: "" });
  const canManage = useMemo(
    () => session?.roles?.some((role) => role === "admin" || role === "agent"),
    [session?.roles]
  );

  const loadContracts = useCallback(async () => {
    if (!session?.email) return;
    setLoading(true);
    setError("");
    try {
      const response = await listContracts(session);
      setContracts(response.contracts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contracts");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleGenerate = async (event) => {
    event.preventDefault();
    const parties = formState.parties
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((email) => ({ email }));
    if (!parties.length) {
      setError("Please provide at least one recipient email");
      return;
    }
    const variables = parseVariables(formState.variables);
    try {
      await createContractRequest(session, {
        title: formState.title || "Untitled contract",
        parties,
        variables
      });
      setModalOpen(false);
      setFormState({ title: "", parties: "", variables: "" });
      await loadContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate contract");
    }
  };

  const handleSend = async (contractId) => {
    try {
      await sendContractRequest(session, { contractId });
      await loadContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send contract");
    }
  };

  const handleRefreshStatus = async (contractId) => {
    try {
      await fetchContractStatus(session, contractId);
      await loadContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh status");
    }
  };

  const activeContract = selected
    ? contracts.find((contract) => contract.id === selected) ?? null
    : contracts[0] ?? null;

  return (
    <section id="contracts-panel" className="space-y-4 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{title}</p>
          {description ? <p className="text-sm text-brand-black/70">{description}</p> : null}
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            Generate contract
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-brand-red">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-brand-black/60">Loading contracts…</p>
      ) : contracts.length ? (
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            {contracts.map((contract) => (
              <article
                key={contract.id}
                className={`rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 ${
                  selected === contract.id ? "ring-2 ring-brand-red" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Contract</p>
                    <h4 className="font-display text-xl uppercase">{contract.title}</h4>
                    <p className="text-xs text-brand-black/60">
                      {Array.isArray(contract.parties)
                        ? contract.parties.map((party) => party.email || party).join(", ")
                        : "—"}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONES[contract.status] || "neutral"}>{contract.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em]">
                  <button
                    type="button"
                    className="rounded-full border border-brand-black px-3 py-1"
                    onClick={() => setSelected(contract.id)}
                  >
                    Preview
                  </button>
                  <a
                    href={contract.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-brand-black px-3 py-1"
                  >
                    View file
                  </a>
                  {canManage ? (
                    <>
                      <button
                        type="button"
                        className="rounded-full border border-brand-black px-3 py-1"
                        onClick={() => handleSend(contract.id)}
                      >
                        {contract.status === "sent" ? "Resend" : "Send"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-brand-black px-3 py-1"
                        onClick={() => handleRefreshStatus(contract.id)}
                      >
                        Refresh status
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
            {activeContract ? (
              <>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Preview</p>
                <h4 className="font-display text-2xl uppercase">{activeContract.title}</h4>
                <p className="text-xs text-brand-black/60">
                  Created {new Date(activeContract.createdAt).toLocaleString()}
                </p>
                <div className="mt-3 space-y-2 text-sm text-brand-black/80">
                  <p className="font-semibold text-brand-black">Parties</p>
                  <ul className="space-y-1 text-xs text-brand-black/70">
                    {(activeContract.parties || []).map((party, index) => (
                      <li key={`${activeContract.id}-party-${index}`}>
                        {typeof party === "string" ? party : party.email}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3">
                  <p className="font-semibold text-sm text-brand-black">Status</p>
                  <Badge tone={STATUS_TONES[activeContract.status] || "neutral"}>{activeContract.status}</Badge>
                </div>
              </>
            ) : (
              <p className="text-sm text-brand-black/60">Select a contract to preview details.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-brand-black/60">No contracts yet.</p>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-brand-black/40 p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-brand-black/15 bg-brand-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl uppercase">Generate contract</h3>
              <button className="text-xs uppercase tracking-[0.35em]" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleGenerate}>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Title
                <input
                  type="text"
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  required
                />
              </label>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Parties (comma separated emails)
                <input
                  type="text"
                  value={formState.parties}
                  onChange={(event) => setFormState((prev) => ({ ...prev, parties: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  placeholder="creator@example.com, brand@example.com"
                />
              </label>
              <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
                Variables (JSON)
                <textarea
                  rows={3}
                  value={formState.variables}
                  onChange={(event) => setFormState((prev) => ({ ...prev, variables: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
                  placeholder='{"project":"Residency"}'
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function parseVariables(input) {
  if (!input?.trim()) return {};
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch {
    const entries = input.split(",").map((entry) => entry.split(":"));
    const result = {};
    entries.forEach(([key, value]) => {
      if (!key || typeof value === "undefined") return;
      result[key.trim()] = value.trim();
    });
    return result;
  }
}
