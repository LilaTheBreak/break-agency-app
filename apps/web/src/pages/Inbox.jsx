import React, { useEffect, useMemo, useState } from "react";
import { usePriorityInbox } from "../hooks/usePriorityInbox.js";
import PrioritySummary from "../components/Inbox/PrioritySummary.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import CategoryFilterBar from "../components/Inbox/CategoryFilterBar.jsx";
import ThreadListItem from "../components/Inbox/ThreadListItem.jsx";
import { CATEGORY_WEIGHT } from "../constants/threadCategories.js";
import { apiFetch } from "../services/apiClient.js";
import { useDealThreads } from "../hooks/useDealThreads.js";
import DealThreadViewer from "../components/DealThreadViewer.jsx";
import { useInboxCategories } from "../hooks/useInboxCategories.js";

const TAB_OPTIONS = [
  { id: "priority", label: "Priority" },
  { id: "awaiting", label: "Awaiting Reply" },
  { id: "smart", label: "Smart Categories" },
  { id: "all", label: "All Inbound" }
];

const CHANNEL_FILTERS = [
  { id: "all", label: "All" },
  { id: "email", label: "Email" },
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "tiktok", label: "TikTok" }
];

export default function Inbox() {
  const auth = useAuth();
  const [tab, setTab] = useState("priority");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [classifications, setClassifications] = useState({});
  const { inbox, totals, loading, error } = usePriorityInbox();
  const { rebuild, list } = useDealThreads();
  const { categories: smartCategories, loading: categoriesLoading } = useInboxCategories();
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");

  if (auth.loading) return <LoadingScreen />;
  if (!auth.user) return null;

  const awaiting = useMemo(
    () =>
      inbox.filter(
        (item) => item.parsed?.wasSentByUser === true && item.parsed?.wasOpenedByRecipient === false
      ),
    [inbox]
  );

  const fetchClassification = async (threadId) => {
    try {
      const res = await apiFetch("/ai/classify-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId })
      });
      const payload = await res.json();
      if (res.ok && payload?.category) {
        setClassifications((prev) => ({ ...prev, [threadId]: payload }));
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    inbox.forEach((item) => {
      if (!classifications[item.id] && (item.platform || "email") === "email") {
        fetchClassification(item.id);
      }
    });
  }, [inbox]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadSmartThreads();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyCategoryFilter = (items) => {
    if (categoryFilter === "all") return items;
    const match = {
      deals: "deal",
      events: "event",
      gifting: "gifting",
      pr: "pr",
      scam: "scam",
      spam: "spam",
      other: "other"
    }[categoryFilter];
    if (!match) return items;
    return items.filter((i) => {
      const cat = (classifications[i.id]?.category || "other").toLowerCase();
      return cat.includes(match);
    });
  };

  const applyChannelFilter = (items) => {
    if (channelFilter === "all") return items;
    return items.filter((i) => (i.platform || "email") === channelFilter);
  };

  const sortWithCategory = (items) => {
    return [...items].sort((a, b) => {
      const ca = CATEGORY_WEIGHT[classifications[a.id]?.category] || 0;
      const cb = CATEGORY_WEIGHT[classifications[b.id]?.category] || 0;
      if (ca !== cb) return cb - ca;
      const unreadA = a.unread ? 1 : 0;
      const unreadB = b.unread ? 1 : 0;
      if (unreadA !== unreadB) return unreadB - unreadA;
      const dateA = a.parsed?.date ? new Date(a.parsed.date).getTime() : 0;
      const dateB = b.parsed?.date ? new Date(b.parsed.date).getTime() : 0;
      return dateB - dateA;
    });
  };

  const loadSmartThreads = async () => {
    setThreadsLoading(true);
    setThreadsError("");
    try {
      const payload = await list();
      setThreads(payload?.threads || []);
      if (!selectedThreadId && payload?.threads?.length) {
        setSelectedThreadId(payload.threads[0].id);
      }
    } catch (err) {
      setThreadsError(err instanceof Error ? err.message : "Unable to load smart threads");
    } finally {
      setThreadsLoading(false);
    }
  };

  const handleRebuildThreads = async () => {
    setThreadsLoading(true);
    setThreadsError("");
    try {
      await rebuild();
      await loadSmartThreads();
    } catch (err) {
      setThreadsError(err instanceof Error ? err.message : "Unable to rebuild threads");
      setThreadsLoading(false);
    }
  };

  const renderList = (items) => {
    const filtered = applyCategoryFilter(applyChannelFilter(items));
    const sorted = sortWithCategory(filtered);
    if (!items.length || !filtered.length) {
      return <p className="text-sm text-brand-black/60">No messages found.</p>;
    }
    return (
      <div className="space-y-3">
        {sorted.map((item) => (
          <div key={item.id} className="space-y-2">
            <ThreadListItem thread={item} classification={classifications[item.id]} />
            {item.aiSummary || item.aiCategory ? (
              <div className="rounded-xl border border-brand-black/10 bg-white p-3 text-xs text-brand-black/80">
                <div className="flex justify-between">
                  <span className="uppercase tracking-[0.25em] text-brand-black/60">{item.aiCategory || "untriaged"}</span>
                  <span
                    className={`uppercase tracking-[0.2em] ${
                      item.aiUrgency === "high" ? "text-brand-red" : "text-brand-black/50"
                    }`}
                  >
                    {item.aiUrgency || ""}
                  </span>
                </div>
                <p className="mt-1 text-sm">{item.aiSummary}</p>
                {item.aiRecommendedAction && (
                  <div className="mt-2 rounded-lg bg-brand-linen/60 p-2">
                    <p className="text-xs uppercase tracking-[0.25em] text-brand-red">Recommended Action</p>
                    <p className="mt-1 text-sm text-brand-black">{item.aiRecommendedAction}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Inbox</p>
          <h1 className="font-display text-3xl uppercase text-brand-black">Priority inbox</h1>
        </div>
        <div className="flex items-center gap-2">
          {TAB_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                tab === t.id
                  ? "border-brand-red bg-brand-red text-brand-white"
                  : "border-brand-black/20 bg-brand-linen text-brand-black hover:bg-brand-red/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <CategoryFilterBar value={categoryFilter} onChange={setCategoryFilter} />
        <div className="flex flex-wrap items-center gap-2">
          {CHANNEL_FILTERS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChannelFilter(ch.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                channelFilter === ch.id
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-brand-black/20 bg-white text-brand-black hover:bg-brand-red/10"
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "priority" ? (
        <div className="space-y-6">
          <PrioritySummary totals={totals} />
          {error ? <p className="text-sm text-brand-red">{error}</p> : null}
          {loading ? <LoadingScreen /> : renderList(inbox)}
        </div>
      ) : null}

      {tab === "awaiting" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">Awaiting reply</h2>
          {renderList(awaiting)}
        </div>
      ) : null}

      {tab === "smart" ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-brand-black">Smart Categories</h2>
            <p className="text-sm text-brand-black/60 mt-1">
              AI-categorized inbox items based on content and context
            </p>
          </div>
          {categoriesLoading ? (
            <LoadingScreen />
          ) : (
            <div className="space-y-6">
              {Object.entries(smartCategories).map(([category, items]) => {
                if (!items || items.length === 0) return null;
                const categoryLabels = {
                  deals: "💼 Deal Offers",
                  negotiations: "🤝 Negotiations",
                  gifting: "🎁 Gifting & PR",
                  invites: "📅 Event Invites",
                  vip: "⭐ VIP Contacts",
                  urgent: "🚨 Urgent",
                  spam: "🗑️ Spam"
                };
                return (
                  <div key={category} className="rounded-xl border border-brand-black/10 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-brand-black">
                        {categoryLabels[category] || category}
                      </h3>
                      <span className="text-xs text-brand-black/60">{items.length} items</span>
                    </div>
                    <div className="space-y-2">
                      {items.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-brand-black/5 bg-brand-linen/40 p-3 text-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-brand-black truncate">
                                {item.from || item.sender || "Unknown sender"}
                              </p>
                              <p className="text-xs text-brand-black/60 mt-1 truncate">
                                {item.subject || item.preview || "No subject"}
                              </p>
                              {item.aiSummary && (
                                <p className="text-xs text-brand-black/70 mt-2 line-clamp-2">
                                  {item.aiSummary}
                                </p>
                              )}
                            </div>
                            {item.unread && (
                              <span className="flex-shrink-0 inline-block h-2 w-2 rounded-full bg-brand-red"></span>
                            )}
                          </div>
                        </div>
                      ))}
                      {items.length > 5 && (
                        <p className="text-xs text-brand-black/50 text-center pt-2">
                          +{items.length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {Object.keys(smartCategories).length === 0 && (
                <p className="text-sm text-brand-black/60 text-center py-8">
                  No categorized items yet. AI categorization runs automatically as messages arrive.
                </p>
              )}
            </div>
          )}
        </div>
      ) : null}

      {tab === "all" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-black">All inbound</h2>
          {renderList(inbox)}
        </div>
      ) : null}

      <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Smart threads</p>
            <h2 className="text-lg font-semibold text-brand-black">Deal timeline reconstruction</h2>
            <p className="text-sm text-brand-black/60">Group repeated brand emails into a single deal thread.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadSmartThreads}
              disabled={threadsLoading}
              className="rounded-full border border-brand-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black disabled:opacity-50"
            >
              {threadsLoading ? "Loading..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={handleRebuildThreads}
              disabled={threadsLoading}
              className="rounded-full border border-brand-black bg-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black hover:bg-brand-black/5 disabled:opacity-50"
            >
              Rebuild
            </button>
          </div>
        </div>
        {threadsError ? <p className="text-sm text-brand-red">{threadsError}</p> : null}
        {threadsLoading && !threads.length ? <p className="text-sm text-brand-black/60">Loading threads…</p> : null}
        {!threadsLoading && !threads.length ? (
          <p className="text-sm text-brand-black/60">No deal threads yet. Rebuild to generate from ingested email.</p>
        ) : null}
        {threads.length ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {threads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.25em] ${
                    selectedThreadId === t.id
                      ? "border-brand-red bg-brand-red text-brand-white"
                      : "border-brand-black/20 bg-brand-white text-brand-black hover:bg-brand-red/10"
                  }`}
                >
                  {t.subjectRoot || "Untitled"} · {t.stage || t.status}
                </button>
              ))}
            </div>
            <DealThreadViewer thread={selectedThread} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
