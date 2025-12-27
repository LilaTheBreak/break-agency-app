import React, { useMemo, useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { Badge } from "../components/Badge.jsx";
import { OutreachRecordsPanel } from "../components/OutreachRecordsPanel.jsx";
import { CampaignChip } from "../components/CampaignChip.jsx";
import DeckDrawer from "../components/DeckDrawer.jsx";
import DealAIPanel from "../components/DealAIPanel.jsx";
import GmailThreadLinker from "../components/GmailThreadLinker.jsx";
import { linkDealToCampaign, readCrmCampaigns, unlinkDealFromCampaign } from "../lib/crmCampaigns.js";
import {
  fetchOutreachRecords,
  createOutreachRecord,
  updateOutreachRecord,
  addOutreachNote,
  addOutreachTask,
  updateOutreachTask
} from "../services/outreachClient.js";

const OUTREACH_STAGES = [
  { id: "not-started", label: "Not Started" },
  { id: "researched", label: "Researched" },
  { id: "initial-email", label: "Initial Email Sent" },
  { id: "follow-up", label: "Follow-Up Sent" },
  { id: "conversation", label: "In Conversation" },
  { id: "meeting", label: "Meeting Booked" },
  { id: "closed-won", label: "Closed Won" },
  { id: "closed-lost", label: "Closed Lost" }
];

function IconBubble({ children, tone = "neutral" }) {
  const toneClass =
    tone === "positive"
      ? "bg-brand-red text-white"
      : tone === "muted"
        ? "bg-brand-black/5 text-brand-black"
        : "bg-brand-red text-white";
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[0.8rem] ${toneClass}`} aria-hidden>
      {children}
    </span>
  );
}

function PoundIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} strokeWidth="1.8">
      <path d="M8 9.5a4 4 0 1 1 8 0" />
      <path d="M8 9.5v7.5m0 0h8m-8-3h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 20s-7-4.35-7-10a5 5 0 0 1 9.21-2.76H14a5 5 0 0 1 9 2.76c0 5.65-7 10-7 10z" />
    </svg>
  );
}

function InstagramIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.4">
      <rect x="5" y="5" width="14" height="14" rx="4" />
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="16.5" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M14 4h2.2c.14 1.5 1.13 2.8 2.8 3v2.1a5.48 5.48 0 0 1-3.1-1.04V14a4.5 4.5 0 1 1-4.5-4.5h.5V12a2.5 2.5 0 1 0 1.6 2.33V4Z" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4 8.5c0-1.3 1.05-2.35 2.35-2.35h11.3C18.95 6.15 20 7.2 20 8.5v7c0 1.3-1.05 2.35-2.35 2.35H6.35C5.05 17.85 4 16.8 4 15.5v-7Z" />
      <path d="M10 9.5 15 12l-5 2.5V9.5Z" fill="white" />
    </svg>
  );
}

function LinkedInIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6.5 19h-3V9h3v10Zm-1.5-11.4a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5Zm5.5 11.4h-3V9h2.9v1.4h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.6V19h-3v-4.6c0-1.1-.1-2.4-1.5-2.4-1.5 0-1.7 1.2-1.7 2.3V19Z" />
    </svg>
  );
}

function IconChip({ icon, label, tone = "muted" }) {
  const toneClass =
    tone === "positive"
      ? "border-brand-red/30 bg-brand-red/10 text-brand-red"
      : "border-brand-black/15 bg-brand-linen/50 text-brand-black/80";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] uppercase tracking-[0.25em] ${toneClass}`}>
      <span className="flex items-center justify-center text-brand-black">{icon}</span>
      <span className="max-w-[160px] truncate">{label}</span>
    </span>
  );
}

const PLATFORM_ICON_MAP = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon
};

function PlatformChip({ platform, handle }) {
  const key = platform?.toLowerCase?.() || "";
  const Icon = PLATFORM_ICON_MAP[key] || null;
  const label = handle || platform;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-black/15 bg-brand-white px-3 py-1 text-[0.7rem] uppercase tracking-[0.25em] text-brand-black/80">
      {Icon ? (
        <IconBubble tone="muted">
          <Icon className="h-3.5 w-3.5" />
        </IconBubble>
      ) : (
        <span className="h-2 w-2 rounded-full bg-brand-black/40" aria-hidden />
      )}
      <span className="max-w-[140px] truncate">{label}</span>
    </span>
  );
}

const priorityTone = {
  High: "positive",
  Medium: "neutral",
  Low: "neutral"
};

const statusTone = {
  Responded: "positive",
  "Awaiting reply": "neutral",
  "No response": "neutral",
  "Not started": "neutral"
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

const STORAGE_KEYS = {
  archivedOutreachIds: "break_admin_outreach_archived_outreach_ids_v1",
  outreachProfiles: "break_admin_outreach_profiles_v1",
  outreachDrafts: "break_admin_outreach_drafts_v1",
  opportunities: "break_admin_outreach_opportunities_v1",
  deals: "break_admin_outreach_deals_v1",
  localNotes: "break_admin_outreach_local_notes_v1",
  localTasks: "break_admin_outreach_local_tasks_v1",
  noteEdits: "break_admin_outreach_note_edits_v1"
};

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
    // Ignore storage errors (private mode, quota, etc.)
  }
}

function isWithinRange(dateValue, rangeDays) {
  if (!rangeDays) return true;
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  const diff = Date.now() - date.getTime();
  return diff <= rangeDays * 24 * 60 * 60 * 1000;
}

export function AdminOutreachPage({ session }) {
  const [records, setRecords] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState(30); // days, null = all
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [activeView, setActiveView] = useState("pipeline"); // pipeline | records

  const [archivedOutreachIds, setArchivedOutreachIds] = useState(() =>
    readStorage(STORAGE_KEYS.archivedOutreachIds, [])
  );
  const [profilesByOutreachId, setProfilesByOutreachId] = useState(() =>
    readStorage(STORAGE_KEYS.outreachProfiles, {})
  );
  const [draftsByOutreachId, setDraftsByOutreachId] = useState(() =>
    readStorage(STORAGE_KEYS.outreachDrafts, {})
  );

  const [opportunities, setOpportunities] = useState(() => readStorage(STORAGE_KEYS.opportunities, []));
  const [deals, setDeals] = useState(() => readStorage(STORAGE_KEYS.deals, []));
  const [localNotes, setLocalNotes] = useState(() => readStorage(STORAGE_KEYS.localNotes, []));
  const [localTasks, setLocalTasks] = useState(() => readStorage(STORAGE_KEYS.localTasks, []));
  const [noteEdits, setNoteEdits] = useState(() => readStorage(STORAGE_KEYS.noteEdits, {}));
  const [crmCampaigns, setCrmCampaigns] = useState(() => readCrmCampaigns());

  const [outreachModalOpen, setOutreachModalOpen] = useState(false);
  const [editingOutreach, setEditingOutreach] = useState(null);
  const [outreachForm, setOutreachForm] = useState({
    type: "Brand",
    target: "",
    isDraft: false,
    contactName: "",
    contactRole: "",
    contactEmail: "",
    link: "",
    owner: "Admin",
    source: "Manual",
    stage: "not-started",
    status: "Not started",
    summary: "",
    threadUrl: "",
    emailsSent: 0,
    emailsReplies: 0,
    lastContact: "",
    nextFollowUp: "",
    reminder: ""
  });

  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [opportunityForm, setOpportunityForm] = useState({
    outreachId: "",
    name: "",
    value: "",
    expectedClose: "",
    status: "Open",
    notes: "",
    threadUrl: "",
    commsStatus: "Awaiting reply",
    lastContact: ""
  });

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealContext, setDealContext] = useState({ outreachId: "", opportunityId: "" });
  const [dealForm, setDealForm] = useState({
    outreachId: "",
    opportunityId: "",
    campaignId: "",
    name: "",
    value: "",
    status: "Open",
    notes: "",
    threadUrl: "",
    commsStatus: "Awaiting reply",
    lastContact: ""
  });

  const [drawer, setDrawer] = useState({ open: false, entityType: "outreach", entityId: "" });
  const [deckDrawerOpen, setDeckDrawerOpen] = useState(false);
  const [taskEditor, setTaskEditor] = useState({ open: false, task: null });
  const [noteEditor, setNoteEditor] = useState({ open: false, note: null, body: "" });
  
  const [noteForm, setNoteForm] = useState({
    entityType: "outreach",
    entityId: "",
    body: ""
  });
  const [taskForm, setTaskForm] = useState({
    entityType: "outreach",
    entityId: "",
    title: "",
    dueDate: new Date().toISOString().slice(0, 16),
    owner: "Admin",
    priority: "Medium"
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!dealModalOpen && !drawer.open) return;
    setCrmCampaigns(readCrmCampaigns());
  }, [dealModalOpen, drawer.open, drawer.entityType, drawer.entityId]);

  useEffect(() => writeStorage(STORAGE_KEYS.archivedOutreachIds, archivedOutreachIds), [archivedOutreachIds]);
  useEffect(() => writeStorage(STORAGE_KEYS.outreachProfiles, profilesByOutreachId), [profilesByOutreachId]);
  useEffect(() => writeStorage(STORAGE_KEYS.outreachDrafts, draftsByOutreachId), [draftsByOutreachId]);
  useEffect(() => writeStorage(STORAGE_KEYS.opportunities, opportunities), [opportunities]);
  useEffect(() => writeStorage(STORAGE_KEYS.deals, deals), [deals]);
  useEffect(() => writeStorage(STORAGE_KEYS.localNotes, localNotes), [localNotes]);
  useEffect(() => writeStorage(STORAGE_KEYS.localTasks, localTasks), [localTasks]);
  useEffect(() => writeStorage(STORAGE_KEYS.noteEdits, noteEdits), [noteEdits]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchOutreachRecords();
      setRecords(data.records || []);
      
      // Extract notes and tasks from records
      const allNotes = [];
      const allTasks = [];
      data.records?.forEach(record => {
        if (record.OutreachNote) {
          allNotes.push(...record.OutreachNote.map(n => ({ ...n, outreachId: record.id })));
        }
        if (record.OutreachTask) {
          allTasks.push(...record.OutreachTask.map(t => ({ ...t, outreachId: record.id })));
        }
      });
      setNotes(allNotes);
      setTasks(allTasks);
      
      // Set first record as default for forms
      if (data.records?.length > 0) {
        setNoteForm((prev) => ({ ...prev, entityType: "outreach", entityId: data.records[0].id }));
        setTaskForm((prev) => ({ ...prev, entityType: "outreach", entityId: data.records[0].id }));
      }
    } catch (err) {
      setError(err.message);
      console.error("Failed to load outreach data:", err);
    } finally {
      setLoading(false);
    }
  };

  const visibleRecords = useMemo(() => {
    const normalizedOwnerFilter = (ownerFilter || "").trim();
    return records
      .filter((record) => {
        const isArchived = archivedOutreachIds.includes(record.id);
        if (!showArchived && isArchived) return false;
        const owner = record.owner || "Unassigned";
        if (normalizedOwnerFilter !== "All" && owner !== normalizedOwnerFilter) return false;
        const activityAnchor = record.lastContact || record.updatedAt || record.createdAt;
        return isWithinRange(activityAnchor, dateRange);
      })
      .map((record) => ({
        ...record,
        emailStats: {
          sent: record.emailsSent ?? record.emailStats?.sent ?? 0,
          replies: record.emailsReplies ?? record.emailStats?.replies ?? 0
        },
        profile: profilesByOutreachId[record.id] || record.profile || null,
        isDraft: Boolean(draftsByOutreachId?.[record.id])
      }));
  }, [records, archivedOutreachIds, showArchived, ownerFilter, dateRange, profilesByOutreachId, draftsByOutreachId]);

  const visibleOpportunities = useMemo(() => {
    return (opportunities || [])
      .filter((opp) => (showArchived ? true : !opp.archivedAt))
      .filter((opp) => {
        if (!ownerFilter || ownerFilter === "All") return true;
        const linkedRecord = records.find((r) => r.id === opp.outreachId);
        return (linkedRecord?.owner || "Unassigned") === ownerFilter;
      })
      .filter((opp) => isWithinRange(opp.updatedAt || opp.createdAt || opp.expectedClose, dateRange));
  }, [opportunities, showArchived, ownerFilter, records, dateRange]);

  const visibleDeals = useMemo(() => {
    return (deals || [])
      .filter((deal) => (showArchived ? true : !deal.archivedAt))
      .filter((deal) => {
        if (!ownerFilter || ownerFilter === "All") return true;
        const linkedRecord = records.find((r) => r.id === deal.outreachId);
        return (linkedRecord?.owner || "Unassigned") === ownerFilter;
      })
      .filter((deal) => isWithinRange(deal.updatedAt || deal.createdAt, dateRange));
  }, [deals, showArchived, ownerFilter, records, dateRange]);

  const ownerOptions = useMemo(() => {
    const owners = new Set();
    records.forEach((record) => owners.add(record.owner || "Unassigned"));
    return Array.from(owners).sort((a, b) => String(a).localeCompare(String(b)));
  }, [records]);

  const normalizedTasks = useMemo(() => {
    const apiTasks = (tasks || []).map((task) => ({
      ...task,
      entityType: "outreach",
      entityId: task.outreachId,
      source: "api",
      dueDate: task.dueDate || null
    }));
    const locals = (localTasks || []).map((task) => ({ ...task, source: "local" }));
    const merged = [...locals, ...apiTasks];
    return merged.sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    });
  }, [tasks, localTasks]);

  const normalizedNotes = useMemo(() => {
    const apiNotes = (notes || []).map((note) => ({
      ...note,
      entityType: "outreach",
      entityId: note.outreachId,
      source: "api",
      createdAt: note.createdAt || note.timestamp || new Date().toISOString()
    }));
    const locals = (localNotes || []).map((note) => ({ ...note, source: "local" }));
    return [...locals, ...apiNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notes, localNotes]);

  const totals = useMemo(() => {
    const sends = visibleRecords.reduce((sum, record) => sum + (record.emailStats?.sent || 0), 0);
    const replies = visibleRecords.reduce((sum, record) => sum + (record.emailStats?.replies || 0), 0);
    const outreachWithEmailActivity = visibleRecords.filter((record) => (record.emailStats?.sent || 0) > 0).length;
    const meetings = visibleRecords.filter((record) => record.stage === "meeting").length;
    const closedWon = visibleOpportunities.filter((opp) => opp.status === "Closed Won").length;
    const closedLost = visibleOpportunities.filter((opp) => opp.status === "Closed Lost").length;
    const responseRate = sends ? Math.round((replies / sends) * 100) : 0;
    const meetingConversion = outreachWithEmailActivity
      ? Math.round((meetings / outreachWithEmailActivity) * 100)
      : 0;
    return {
      totalOutreach: outreachWithEmailActivity,
      responseRate,
      meetingConversion,
      closedWon,
      closedLost
    };
  }, [visibleRecords, visibleOpportunities]);

  const pipelineByStage = useMemo(() => {
    return OUTREACH_STAGES.map((stage) => ({
      ...stage,
      items: visibleRecords.filter((record) => record.stage === stage.id)
    }));
  }, [visibleRecords]);

  const handleStageSet = async (recordId, stageId) => {
    const record = records.find((r) => r.id === recordId);
    if (!record) return;
    const dealExists = deals.some((deal) => !deal.archivedAt && deal.outreachId === recordId);
    if (dealExists) {
      alert("This outreach has been converted to a deal. Stage is now read-only.");
      return;
    }
    try {
      await updateOutreachRecord(recordId, { stage: stageId, lastContact: new Date().toISOString() });
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, stage: stageId, lastContact: new Date().toISOString() } : r))
      );
    } catch (err) {
      console.error("Failed to set stage:", err);
      setRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, stage: stageId } : r)));
    }
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    if (!noteForm.body.trim()) return;

    const body = noteForm.body.trim();
    const entityType = noteForm.entityType;
    const entityId = noteForm.entityId;
    if (!entityId) return;

    if (entityType === "outreach") {
      try {
        const { note } = await addOutreachNote(entityId, body);
        setNotes((prev) => [{ ...note, outreachId: entityId }, ...prev]);
        setNoteForm((prev) => ({ ...prev, body: "" }));
      } catch (err) {
        console.error("Failed to add note:", err);
      }
      return;
    }

    const created = {
      id: `note-${Date.now()}`,
      entityType,
      entityId,
      author: "Admin",
      body,
      createdAt: new Date().toISOString(),
      editedAt: null,
      history: []
    };
    setLocalNotes((prev) => [created, ...prev]);
    setNoteForm((prev) => ({ ...prev, body: "" }));
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    if (!taskForm.title.trim()) return;

    const title = taskForm.title.trim();
    const entityType = taskForm.entityType;
    const entityId = taskForm.entityId;
    if (!entityId) return;

    if (entityType === "outreach") {
      try {
        const { task } = await addOutreachTask(entityId, {
          title,
          dueDate: taskForm.dueDate,
          owner: taskForm.owner || "Admin",
          priority: taskForm.priority
        });
        setTasks((prev) => [{ ...task, outreachId: entityId }, ...prev]);
        setTaskForm((prev) => ({ ...prev, title: "" }));
      } catch (err) {
        console.error("Failed to add task:", err);
      }
      return;
    }

    const created = {
      id: `task-${Date.now()}`,
      entityType,
      entityId,
      title,
      dueDate: taskForm.dueDate,
      owner: taskForm.owner || "Admin",
      priority: taskForm.priority,
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLocalTasks((prev) => [created, ...prev]);
    setTaskForm((prev) => ({ ...prev, title: "" }));
  };

  const toggleTaskStatus = async (taskId) => {
    const apiTask = tasks.find((t) => t.id === taskId);
    const localTask = localTasks.find((t) => t.id === taskId);
    const task = apiTask || localTask;
    if (!task) return;

    const newStatus = task.status === "Done" ? "Open" : "Done";

    if (apiTask) {
      try {
        await updateOutreachTask(taskId, { status: newStatus });
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      } catch (err) {
        console.error("Failed to update task:", err);
      }
      return;
    }

    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );
  };

  const openTaskEdit = (task) => {
    setTaskEditor({ open: true, task: { ...task } });
  };

  const saveTaskEdit = async () => {
    const task = taskEditor.task;
    if (!task) return;
    if (!task.title?.trim()) return;
    const updates = {
      title: task.title.trim(),
      dueDate: task.dueDate || null,
      owner: task.owner || "Admin",
      priority: task.priority || "Medium",
      status: task.status || "Open"
    };
    if (task.source === "api") {
      try {
        const { task: updated } = await updateOutreachTask(task.id, updates);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      } catch (err) {
        console.error("Failed to update task:", err);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
      } finally {
        setTaskEditor({ open: false, task: null });
      }
      return;
    }

    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    );
    setTaskEditor({ open: false, task: null });
  };

  const openNoteEdit = (note) => {
    const effectiveBody = noteEdits?.[note.id]?.currentBody || note.body;
    setNoteEditor({ open: true, note, body: effectiveBody || "" });
  };

  const saveNoteEdit = () => {
    const note = noteEditor.note;
    if (!note) return;
    const nextBody = (noteEditor.body || "").trim();
    if (!nextBody) return;

    if (note.source === "api") {
      const previous = noteEdits?.[note.id]?.currentBody || note.body || "";
      const history = noteEdits?.[note.id]?.history || [];
      const next = {
        currentBody: nextBody,
        editedAt: new Date().toISOString(),
        history: [{ body: previous, editedAt: new Date().toISOString() }, ...history]
      };
      setNoteEdits((prev) => ({ ...(prev || {}), [note.id]: next }));
      setNoteEditor({ open: false, note: null, body: "" });
      return;
    }

    setLocalNotes((prev) =>
      prev.map((n) => {
        if (n.id !== note.id) return n;
        const history = Array.isArray(n.history) ? n.history : [];
        return {
          ...n,
          body: nextBody,
          editedAt: new Date().toISOString(),
          history: [{ body: n.body, editedAt: new Date().toISOString() }, ...history]
        };
      })
    );
    setNoteEditor({ open: false, note: null, body: "" });
  };

  const logTouchpoint = async (recordId, summary) => {
    if (!summary) return;
    
    try {
      const { note } = await addOutreachNote(recordId, summary);
      setNotes((prev) => [{ ...note, outreachId: recordId }, ...prev]);
      
      // Update last contact time
      await updateOutreachRecord(recordId, {
        lastContact: new Date().toISOString()
      });
      setRecords(prev => prev.map(r => 
        r.id === recordId ? { ...r, lastContact: new Date().toISOString() } : r
      ));
    } catch (err) {
      console.error("Failed to log touchpoint:", err);
    }
  };

  const openNewOutreach = () => {
    setEditingOutreach(null);
    setOutreachForm({
      type: "Brand",
      target: "",
      isDraft: false,
      contactName: "",
      contactRole: "",
      contactEmail: "",
      link: "",
      owner: "Admin",
      source: "Manual",
      stage: "not-started",
      status: "Not started",
      summary: "",
      threadUrl: "",
      emailsSent: 0,
      emailsReplies: 0,
      lastContact: "",
      nextFollowUp: "",
      reminder: ""
    });
    setOutreachModalOpen(true);
  };

  const openEditOutreach = (record) => {
    setEditingOutreach(record);
    const [contactName, contactRole] = String(record?.contact || "").split("·").map((s) => s.trim());
    setOutreachForm({
      type: record?.type || "Brand",
      target: record?.target || "",
      isDraft: Boolean(draftsByOutreachId?.[record?.id]),
      contactName: contactName || "",
      contactRole: contactRole || "",
      contactEmail: record?.contactEmail || "",
      link: record?.link || "",
      owner: record?.owner || "Admin",
      source: record?.source || "Manual",
      stage: record?.stage || "not-started",
      status: record?.status || "Not started",
      summary: record?.summary || "",
      threadUrl: record?.threadUrl || "",
      emailsSent: record?.emailsSent ?? 0,
      emailsReplies: record?.emailsReplies ?? 0,
      lastContact: record?.lastContact ? new Date(record.lastContact).toISOString().slice(0, 16) : "",
      nextFollowUp: record?.nextFollowUp ? new Date(record.nextFollowUp).toISOString().slice(0, 16) : "",
      reminder: record?.reminder || ""
    });
    setOutreachModalOpen(true);
  };

  const saveOutreach = async () => {
    const contact = [outreachForm.contactName, outreachForm.contactRole].filter(Boolean).join(" · ");
    const payload = {
      target: outreachForm.target.trim(),
      type: outreachForm.type,
      contact: contact || null,
      contactEmail: outreachForm.contactEmail || null,
      link: outreachForm.link || null,
      owner: outreachForm.owner || "Admin",
      source: outreachForm.source || "Manual",
      stage: outreachForm.stage || "not-started",
      status: outreachForm.status || "Not started",
      summary: outreachForm.summary || null,
      threadUrl: outreachForm.threadUrl || null,
      emailsSent: Number(outreachForm.emailsSent || 0),
      emailsReplies: Number(outreachForm.emailsReplies || 0),
      lastContact: outreachForm.lastContact || null,
      nextFollowUp: outreachForm.nextFollowUp || null,
      reminder: outreachForm.reminder || null
    };

    if (!payload.target) return;

    if (editingOutreach) {
      try {
        const { record } = await updateOutreachRecord(editingOutreach.id, payload);
        setRecords((prev) => prev.map((r) => (r.id === editingOutreach.id ? { ...r, ...record } : r)));
        setDraftsByOutreachId((prev) => ({ ...(prev || {}), [editingOutreach.id]: Boolean(outreachForm.isDraft) }));
      } catch (err) {
        console.error("Failed to update outreach record:", err);
        setRecords((prev) => prev.map((r) => (r.id === editingOutreach.id ? { ...r, ...payload } : r)));
        setDraftsByOutreachId((prev) => ({ ...(prev || {}), [editingOutreach.id]: Boolean(outreachForm.isDraft) }));
      } finally {
        setOutreachModalOpen(false);
      }
      return;
    }

    try {
      const { record } = await createOutreachRecord(payload);
      setRecords((prev) => [record, ...prev]);
      setDraftsByOutreachId((prev) => ({ ...(prev || {}), [record.id]: Boolean(outreachForm.isDraft) }));
      setNoteForm((prev) => ({ ...prev, entityType: "outreach", entityId: record.id }));
      setTaskForm((prev) => ({ ...prev, entityType: "outreach", entityId: record.id }));
      setOutreachModalOpen(false);
    } catch (err) {
      console.error("Failed to create outreach record:", err);
      setError("Outreach record could not be saved to the server. You can still track it locally in this browser.");
      const localRecord = {
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailsSent: 0,
        emailsReplies: 0,
        ...payload
      };
      setRecords((prev) => [localRecord, ...prev]);
      setDraftsByOutreachId((prev) => ({ ...(prev || {}), [localRecord.id]: Boolean(outreachForm.isDraft) }));
      setOutreachModalOpen(false);
    }
  };

  const archiveOutreach = (recordId) => {
    if (!confirm("Archive this outreach record? You can restore it later.")) return;
    setArchivedOutreachIds((prev) => (prev.includes(recordId) ? prev : [recordId, ...prev]));
    if (drawer.entityType === "outreach" && drawer.entityId === recordId) {
      setDrawer({ open: false, entityType: "outreach", entityId: "" });
    }
  };

  const restoreOutreach = (recordId) => {
    setArchivedOutreachIds((prev) => prev.filter((id) => id !== recordId));
  };

  const convertToOpportunity = (record) => {
    const existing = opportunities.find((opp) => opp.outreachId === record.id && !opp.archivedAt);
    if (existing) {
      setDrawer({ open: true, entityType: "opportunity", entityId: existing.id });
      return;
    }
    const created = {
      id: `opp-${Date.now()}`,
      outreachId: record.id,
      name: `${record.target} opportunity`,
      value: "",
      expectedClose: "",
      status: "Open",
      notes: "",
      threadUrl: record.threadUrl || "",
      commsStatus: record.status === "Responded" ? "Responded" : "Awaiting reply",
      lastContact: record.lastContact ? new Date(record.lastContact).toISOString() : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null
    };
    setOpportunities((prev) => [created, ...prev]);
    try {
      updateOutreachRecord(record.id, { opportunityRef: created.id }).catch(() => {});
    } catch {
      // ignore
    }
    setDrawer({ open: true, entityType: "opportunity", entityId: created.id });
  };

  const openNewOpportunity = () => {
    setEditingOpportunity(null);
    const defaultOutreachId = visibleRecords.find((r) => !archivedOutreachIds.includes(r.id))?.id || "";
    setOpportunityForm({
      outreachId: defaultOutreachId,
      name: "",
      value: "",
      expectedClose: "",
      status: "Open",
      notes: "",
      threadUrl: "",
      commsStatus: "Awaiting reply",
      lastContact: ""
    });
    setOpportunityModalOpen(true);
  };

  const openEditOpportunity = (opp) => {
    setEditingOpportunity(opp);
    setOpportunityForm({
      outreachId: opp.outreachId,
      name: opp.name || "",
      value: opp.value || "",
      expectedClose: opp.expectedClose || "",
      status: opp.status || "Open",
      notes: opp.notes || "",
      threadUrl: opp.threadUrl || "",
      commsStatus: opp.commsStatus || "Awaiting reply",
      lastContact: opp.lastContact ? new Date(opp.lastContact).toISOString().slice(0, 16) : ""
    });
    setOpportunityModalOpen(true);
  };

  const saveOpportunity = () => {
    if (!opportunityForm.outreachId) {
      alert("Opportunities must be linked to an outreach record.");
      return;
    }
    const payload = {
      outreachId: opportunityForm.outreachId,
      name: opportunityForm.name.trim() || "Untitled opportunity",
      value: opportunityForm.value || "",
      expectedClose: opportunityForm.expectedClose || "",
      status: opportunityForm.status || "Open",
      notes: opportunityForm.notes || "",
      threadUrl: opportunityForm.threadUrl || "",
      commsStatus: opportunityForm.commsStatus || "Awaiting reply",
      lastContact: opportunityForm.lastContact || ""
    };

    if (editingOpportunity) {
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === editingOpportunity.id ? { ...opp, ...payload, updatedAt: new Date().toISOString() } : opp
        )
      );
      setOpportunityModalOpen(false);
      return;
    }

    const created = {
      id: `opp-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null
    };
    setOpportunities((prev) => [created, ...prev]);
    setOpportunityModalOpen(false);
  };

  const updateOpportunityStatus = (opportunityId, status) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === opportunityId ? { ...opp, status, updatedAt: new Date().toISOString() } : opp))
    );
  };

  const archiveOpportunity = (opportunityId) => {
    if (!confirm("Archive this opportunity? You can restore it later.")) return;
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === opportunityId ? { ...opp, archivedAt: new Date().toISOString() } : opp))
    );
  };

  const restoreOpportunity = (opportunityId) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === opportunityId ? { ...opp, archivedAt: null } : opp))
    );
  };

  const openConvertToDeal = ({ outreachId, opportunityId }) => {
    setDealContext({ outreachId: outreachId || "", opportunityId: opportunityId || "" });
    const linkedRecord = outreachId ? records.find((r) => r.id === outreachId) : null;
    const linkedOpportunity = opportunityId ? opportunities.find((o) => o.id === opportunityId) : null;
    setDealForm({
      outreachId: outreachId || "",
      opportunityId: opportunityId || "",
      campaignId: "",
      name:
        linkedOpportunity?.name ||
        (linkedRecord ? `${linkedRecord.target} deal` : "New deal"),
      value: linkedOpportunity?.value || "",
      status: "Open",
      notes: "",
      threadUrl: linkedOpportunity?.threadUrl || linkedRecord?.threadUrl || "",
      commsStatus: linkedOpportunity?.commsStatus || (linkedRecord?.status === "Responded" ? "Responded" : "Awaiting reply"),
      lastContact: linkedOpportunity?.lastContact || linkedRecord?.lastContact || ""
    });
    setDealModalOpen(true);
  };

  const saveDeal = () => {
    const payload = {
      outreachId: dealForm.outreachId || null,
      opportunityId: dealForm.opportunityId || null,
      campaignId: dealForm.campaignId || null,
      name: dealForm.name.trim() || "Untitled deal",
      value: dealForm.value || "",
      status: dealForm.status || "Open",
      notes: dealForm.notes || "",
      threadUrl: dealForm.threadUrl || "",
      commsStatus: dealForm.commsStatus || "Awaiting reply",
      lastContact: dealForm.lastContact || ""
    };
    if (!payload.outreachId && !confirm("This deal is not linked to outreach. Continue?")) {
      return;
    }

    const created = {
      id: `deal-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null
    };
    setDeals((prev) => [created, ...prev]);
    if (payload.campaignId) {
      setCrmCampaigns(
        linkDealToCampaign({ campaignId: payload.campaignId, dealId: created.id, dealLabel: created.name })
      );
    }

    if (payload.opportunityId) {
      updateOpportunityStatus(payload.opportunityId, "Closed Won");
    }

    // Lock outreach movement once a deal exists.
    setDealModalOpen(false);
    setDrawer({ open: true, entityType: "deal", entityId: created.id });
  };

  const archiveDeal = (dealId) => {
    if (!confirm("Archive this deal? You can restore it later.")) return;
    setDeals((prev) => prev.map((deal) => (deal.id === dealId ? { ...deal, archivedAt: new Date().toISOString() } : deal)));
  };

  const restoreDeal = (dealId) => {
    setDeals((prev) => prev.map((deal) => (deal.id === dealId ? { ...deal, archivedAt: null } : deal)));
  };

  const setDealCampaign = ({ dealId, campaignId }) => {
    const targetDeal = deals.find((d) => d.id === dealId);
    const previous = targetDeal?.campaignId || null;
    const next = campaignId || null;
    if (previous === next) return;

    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId ? { ...deal, campaignId: next, updatedAt: new Date().toISOString() } : deal
      )
    );

    if (previous) {
      unlinkDealFromCampaign({ campaignId: previous, dealId });
    }
    if (next) {
      linkDealToCampaign({ campaignId: next, dealId, dealLabel: targetDeal?.name || "" });
    }
    setCrmCampaigns(readCrmCampaigns());
  };

  const openDrawer = (entityType, entityId) => {
    setDrawer({ open: true, entityType, entityId });
  };

  return (
    <DashboardShell
      title="Outreach"
      subtitle="Full outreach CRM for brands and creators. Track pipeline, email threads, and follow-ups in one view."
      navLinks={ADMIN_NAV_LINKS}
    >
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-brand-black/10 bg-brand-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-2 flex items-center gap-2 rounded-full border border-brand-black/20 bg-brand-white p-1">
            <button
              type="button"
              onClick={() => setActiveView("pipeline")}
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]",
                activeView === "pipeline" ? "bg-brand-red text-white" : "text-brand-black/70 hover:bg-brand-black/5"
              ].join(" ")}
            >
              Pipeline
            </button>
            <button
              type="button"
              onClick={() => setActiveView("records")}
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]",
                activeView === "records" ? "bg-brand-red text-white" : "text-brand-black/70 hover:bg-brand-black/5"
              ].join(" ")}
            >
              Records
            </button>
          </div>
          <select
            value={dateRange === null ? "all" : String(dateRange)}
            onChange={(event) => {
              const value = event.target.value;
              setDateRange(value === "all" ? null : Number(value));
            }}
            className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <select
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            className="rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
          >
            <option value="All">All owners</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            Show archived
          </label>
        </div>
        {activeView === "pipeline" ? (
          <button
            type="button"
            onClick={openNewOutreach}
            className="rounded-full bg-brand-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white"
          >
            New Outreach
          </button>
        ) : null}
      </section>

      {activeView === "pipeline" ? (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total outreach sent" value={totals.totalOutreach} sub="Initial + follow-ups" />
          <MetricCard label="Response rate" value={`${totals.responseRate}%`} sub="Replies / sends" />
          <MetricCard label="Conversion to meetings" value={`${totals.meetingConversion}%`} sub="Meetings booked" />
          <MetricCard
            label="Closed Won vs Lost"
            value={`${totals.closedWon} / ${totals.closedLost}`}
            sub="Opportunities outcome"
          />
        </section>
      ) : null}

      {activeView === "pipeline" ? (
        <>
          {loading ? (
            <p className="mt-4 rounded-3xl border border-brand-black/10 bg-brand-white/70 p-4 text-sm text-brand-black/70">
              Loading outreach…
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-4 text-sm text-brand-black/80">
              {error}
            </p>
          ) : null}
        </>
      ) : null}

      {activeView === "records" ? (
        <section className="mt-6">
          <OutreachRecordsPanel session={session} mode="page" />
        </section>
      ) : (
      <section className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Outreach pipeline</p>
            <h3 className="font-display text-3xl uppercase text-brand-black">Stages and live threads</h3>
          </div>
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
            Gmail linked · owner + source visible
          </p>
        </div>
        {!loading && visibleRecords.length === 0 ? (
          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/60 p-6">
            <p className="font-semibold text-brand-black">No outreach yet</p>
            <p className="mt-1 text-sm text-brand-black/70">
              You haven’t created any outreach records yet. Add your first outreach to start tracking progress.
            </p>
            <button
              type="button"
              onClick={openNewOutreach}
              className="mt-4 rounded-full bg-brand-red px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white"
            >
              New Outreach
            </button>
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {pipelineByStage.map((stage) => (
            <div
              key={stage.id}
              className="flex min-h-[320px] flex-col gap-3 rounded-3xl border border-brand-black/10 bg-brand-white/90 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{stage.label}</p>
                  <p className="text-sm text-brand-black/50">{stage.items.length} records</p>
                </div>
                <span className="h-2 w-2 rounded-full bg-brand-black/30" />
              </div>
              <div className="space-y-3">
                {stage.items.length ? (
                  stage.items.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-brand-black"
                    >
                      {record.isDraft ? (
                        <p className="mb-2 inline-flex rounded-full border border-brand-black/15 bg-white/70 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70">
                          Draft
                        </p>
                      ) : null}
                      {visibleDeals.some((deal) => !deal.archivedAt && deal.outreachId === record.id) ? (
                        <p className="mb-2 inline-flex rounded-full border border-brand-black/15 bg-white/70 px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-brand-black/70">
                          Deal active · Outreach locked
                        </p>
                      ) : null}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{record.type}</p>
                          <h4 className="text-lg font-semibold">{record.target}</h4>
                          <a
                            href={record.link}
                            className="text-xs text-brand-black/60 underline underline-offset-4"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Company/profile link
                          </a>
                        </div>
                        <Badge tone={statusTone[record.status] || "neutral"}>{record.status}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-brand-black/70">{record.summary}</p>
                      <div className="mt-3 space-y-1 text-[0.75rem] text-brand-black/70">
                        <p>Contact: {record.contact}</p>
                        <p>Owner: {record.owner} · Source: {record.source}</p>
                        <p>Emails: {record.emailStats.sent} sent · {record.emailStats.replies} replies</p>
                        <p>
                          Last contact: {formatDate(record.lastContact)} · Next follow-up: {formatDate(record.nextFollowUp)}
                        </p>
                        <p>
                          Gmail thread:{" "}
                          {record.threadUrl ? (
                            <a
                              href={record.threadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4"
                            >
                              Open thread
                            </a>
                          ) : (
                            "Not linked"
                          )}
                        </p>
                      </div>
                      <ProfileDetails record={record} />
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                          onClick={() => openDrawer("outreach", record.id)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                          onClick={() => openEditOutreach(record)}
                          disabled={visibleDeals.some((deal) => !deal.archivedAt && deal.outreachId === record.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                          onClick={() => {
                            const next = prompt("Log touchpoint summary");
                            if (next) logTouchpoint(record.id, next);
                          }}
                        >
                          Log
                        </button>
                        <select
                          value={record.stage}
                          onChange={(event) => handleStageSet(record.id, event.target.value)}
                          disabled={visibleDeals.some((deal) => !deal.archivedAt && deal.outreachId === record.id)}
                          className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em]"
                        >
                          {OUTREACH_STAGES.map((stageOption) => (
                            <option key={stageOption.id} value={stageOption.id}>
                              {stageOption.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                          onClick={() => convertToOpportunity(record)}
                        >
                          Convert → Opportunity
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-brand-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(167,15,12,0.25)]"
                          onClick={() => openConvertToDeal({ outreachId: record.id, opportunityId: record.opportunityRef || "" })}
                        >
                          Convert → Deal
                        </button>
                        {archivedOutreachIds.includes(record.id) ? (
                          <button
                            type="button"
                            className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                            onClick={() => restoreOutreach(record.id)}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-red transition hover:-translate-y-0.5 hover:bg-brand-red/20"
                            onClick={() => archiveOutreach(record.id)}
                          >
                            Archive
                          </button>
                        )}
                      </div>
                      <ReminderPill record={record} />
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-brand-black/5 bg-brand-linen/40 px-3 py-4 text-sm text-brand-black/50">
                    No records in this stage yet.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      <section className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Outreach opportunities</p>
            <h3 className="font-display text-3xl uppercase text-brand-black">Progression beyond cold outreach</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
              Linked back to originating outreach
            </p>
            <button
              type="button"
              onClick={() => setDeckDrawerOpen(true)}
              className="rounded-full border border-brand-red px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-red hover:bg-brand-red hover:text-brand-white transition-colors"
            >
              Create Deck
            </button>
            <button
              type="button"
              onClick={openNewOpportunity}
              className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
              disabled={visibleRecords.length === 0}
              title={visibleRecords.length === 0 ? "Create outreach first" : "New opportunity"}
            >
              New Opportunity
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleOpportunities.map((opp) => {
            const linkedRecord = records.find((record) => record.id === opp.outreachId);
            const tone = opp.status === "Closed Won" ? "positive" : "neutral";
            return (
              <article
                key={opp.id}
                className="rounded-3xl border border-brand-black/10 bg-brand-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Opportunity</p>
                    <h4 className="text-xl font-semibold text-brand-black">{opp.name}</h4>
                    <p className="text-sm text-brand-black/60">Linked outreach: {linkedRecord?.target || "—"}</p>
                  </div>
                  <Badge tone={tone}>{opp.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-brand-black/70">
                  Value: {opp.value} · Expected close: {formatDate(opp.expectedClose)}
                </p>
                {linkedRecord ? (
                  <p className="mt-1 text-[0.75rem] text-brand-black/60">
                    Owner: {linkedRecord.owner} · Contact: {linkedRecord.contact}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                    onClick={() => openDrawer("opportunity", opp.id)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                    onClick={() => openEditOpportunity(opp)}
                  >
                    Edit
                  </button>
                  <select
                    value={opp.status}
                    onChange={(event) => updateOpportunityStatus(opp.id, event.target.value)}
                    className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em]"
                  >
                    {["Open", "Closed Won", "Closed Lost"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-full bg-brand-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white"
                    onClick={() => openConvertToDeal({ outreachId: opp.outreachId, opportunityId: opp.id })}
                  >
                    Convert → Deal
                  </button>
                  {opp.archivedAt ? (
                    <button
                      type="button"
                      className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
                      onClick={() => restoreOpportunity(opp.id)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-red transition hover:bg-brand-red/20"
                      onClick={() => archiveOpportunity(opp.id)}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Deals</p>
            <h3 className="font-display text-2xl uppercase text-brand-black">Continuity into deals</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
              Outreach → Opportunity → Deal keeps notes + threads
            </p>
            <button
              type="button"
              onClick={() => openConvertToDeal({ outreachId: "", opportunityId: "" })}
              className="rounded-full border border-brand-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              New Deal
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {visibleDeals.map((deal) => {
            const linkedRecord = records.find((record) => record.id === deal.outreachId);
            const linkedOpp = visibleOpportunities.find((opp) => opp.outreachId === deal.outreachId || opp.id === deal.opportunityId);
            return (
              <article
                key={deal.id}
                className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Deal</p>
                    <h4 className="text-xl font-semibold text-brand-black">{deal.name}</h4>
                    <p className="text-sm text-brand-black/60">
                      Outreach: {linkedRecord?.target || "—"} · Opportunity: {linkedOpp?.name || "—"}
                    </p>
                  </div>
                  <Badge tone="neutral">{deal.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-brand-black/70">Value: {deal.value}</p>
                <p className="text-[0.85rem] text-brand-black/60">{deal.notes}</p>
                {linkedRecord ? (
                  <p className="mt-2 text-[0.75rem] text-brand-black/60">
                    Owner: {linkedRecord.owner} · Gmail thread(s) remain linked
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
                    onClick={() => openDrawer("deal", deal.id)}
                  >
                    View
                  </button>
                  {deal.archivedAt ? (
                    <button
                      type="button"
                      className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
                      onClick={() => restoreDeal(deal.id)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-red transition hover:bg-brand-red/20"
                      onClick={() => archiveDeal(deal.id)}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Email + comms tracking</p>
            <h3 className="font-display text-2xl uppercase text-brand-black">Inbox health with Gmail threads</h3>
          </div>
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
            Awaiting reply · Responded · No response · Per-contact visibility
          </p>
        </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleRecords.map((record) => {
            const reminderDays = daysUntil(record.nextFollowUp);
            const followUpCopy =
              reminderDays === null
                ? "No reminder set"
                : reminderDays < 0
                  ? `Follow-up overdue by ${Math.abs(reminderDays)}d`
                  : `Follow-up in ${reminderDays}d`;
            const socials = record.profile?.socials || {};
            const platformChips = [
              socials.instagram ? { platform: "Instagram", handle: socials.instagram.handle } : null,
              socials.tiktok ? { platform: "TikTok", handle: socials.tiktok.handle } : null,
              socials.youtube ? { platform: "YouTube", handle: socials.youtube.handle } : null,
              socials.linkedin ? { platform: "LinkedIn", handle: socials.linkedin.handle } : null
            ].filter(Boolean);
            return (
              <div
                key={record.id}
                className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
                      {record.type} · {record.source}
                    </p>
                    <h4 className="text-lg font-semibold text-brand-black">{record.target}</h4>
                    <p className="text-[0.8rem] text-brand-black/60">{record.contact}</p>
                  </div>
                  <Badge tone={statusTone[record.status] || "neutral"}>{record.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-brand-black/70">{record.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {record.value ? <IconChip icon={<PoundIcon className="h-3.5 w-3.5" />} label={record.value} /> : null}
                  <IconChip icon={<HeartIcon className="h-3.5 w-3.5" />} label={record.status || "Relationship"} tone="positive" />
                  {platformChips.map((platform) => (
                    <PlatformChip key={`${record.id}-${platform.platform}`} platform={platform.platform} handle={platform.handle} />
                  ))}
                </div>
                <div className="mt-3 text-[0.8rem] text-brand-black/70">
                  <p>Emails sent: {record.emailStats.sent} · Replies: {record.emailStats.replies}</p>
                  <p>Last contact: {formatDate(record.lastContact)}</p>
                  <p>{followUpCopy}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={record.threadUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-brand-black px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                  >
                    View Gmail thread
                  </a>
                  {record.profile?.contacts?.length ? (
                    <button
                      type="button"
                      className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                      onClick={() =>
                        logTouchpoint(
                          record.id,
                          `Synced contact map for ${record.target}: ${record.profile.contacts.map((c) => c.email).join(", ")}`
                        )
                      }
                    >
                      Map contacts
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-full border border-brand-red/40 bg-brand-red/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-red transition hover:-translate-y-0.5 hover:bg-brand-red/20"
                    onClick={() =>
                      logTouchpoint(record.id, `Reminder set: ${record.reminder || "Follow up"}`)
                    }
                  >
                    Add reminder note
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Follow-up tasks</p>
              <h3 className="font-display text-2xl uppercase text-brand-black">Tasks + reminders</h3>
            </div>
            <span className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
              Next actions
            </span>
          </div>
          <form onSubmit={handleAddTask} className="mt-3 grid gap-2 md:grid-cols-2">
            <input
              required
              value={taskForm.title}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Task title"
              className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
            />
            <select
              value={taskForm.entityType}
              onChange={(event) => {
                const entityType = event.target.value;
                const defaultEntityId =
                  entityType === "outreach"
                    ? visibleRecords[0]?.id || ""
                    : entityType === "opportunity"
                      ? visibleOpportunities[0]?.id || ""
                      : visibleDeals[0]?.id || "";
                setTaskForm((prev) => ({ ...prev, entityType, entityId: defaultEntityId }));
              }}
              className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
            >
              <option value="outreach">Outreach</option>
              <option value="opportunity">Opportunity</option>
              <option value="deal">Deal</option>
            </select>
            <select
              value={taskForm.entityId}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, entityId: event.target.value }))}
              className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
            >
              {(taskForm.entityType === "outreach" ? visibleRecords : taskForm.entityType === "opportunity" ? visibleOpportunities : visibleDeals).map(
                (item) => (
                  <option key={item.id} value={item.id}>
                    {"target" in item ? item.target : item.name}
                  </option>
                )
              )}
            </select>
            <input
              type="datetime-local"
              value={taskForm.dueDate}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                value={taskForm.owner}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, owner: event.target.value }))}
                placeholder="Owner"
                className="w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
              />
              <select
                value={taskForm.priority}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
                className="w-32 rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black transition hover:bg-brand-black hover:text-brand-white md:col-span-2"
            >
              Add task
            </button>
          </form>
          <ul className="mt-4 space-y-3">
            {normalizedTasks.map((task) => {
              const due = task.dueDate ? new Date(task.dueDate) : null;
              const overdue = due && !Number.isNaN(due.getTime()) && due.getTime() < Date.now() && task.status !== "Done";
              const linkedLabel =
                task.entityType === "outreach"
                  ? records.find((r) => r.id === task.entityId)?.target
                  : task.entityType === "opportunity"
                    ? opportunities.find((o) => o.id === task.entityId)?.name
                    : deals.find((d) => d.id === task.entityId)?.name;
              return (
                <li
                  key={task.id}
                  className={`flex flex-col gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 md:flex-row md:items-center md:justify-between ${
                    overdue ? "ring-2 ring-brand-red" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold text-brand-black">{task.title}</p>
                    <p className="text-sm text-brand-black/60">
                      {(linkedLabel || "Record")} · Owner: {task.owner || "Admin"} · Due: {formatDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={priorityTone[task.priority] || "neutral"}>{task.priority}</Badge>
                    <Badge tone="neutral">{task.status}</Badge>
                    <button
                      type="button"
                      onClick={() => openDrawer(task.entityType, task.entityId)}
                      className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => openTaskEdit(task)}
                      className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:-translate-y-0.5 hover:bg-brand-black/5"
                    >
                      {task.status === "Done" ? "Reopen" : "Mark done"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Notes & context</p>
              <h3 className="font-display text-2xl uppercase text-brand-black">Internal notes</h3>
            </div>
            <span className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60">
              Shared with admins only
            </span>
          </div>
          <form onSubmit={handleAddNote} className="mt-3 space-y-2">
            <textarea
              required
              value={noteForm.body}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, body: event.target.value }))}
              placeholder="Add internal note or call summary"
              className="h-24 w-full rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={noteForm.entityType}
                onChange={(event) => {
                  const entityType = event.target.value;
                  const defaultEntityId =
                    entityType === "outreach"
                      ? visibleRecords[0]?.id || ""
                      : entityType === "opportunity"
                        ? visibleOpportunities[0]?.id || ""
                        : visibleDeals[0]?.id || "";
                  setNoteForm((prev) => ({ ...prev, entityType, entityId: defaultEntityId }));
                }}
                className="rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
              >
                <option value="outreach">Outreach</option>
                <option value="opportunity">Opportunity</option>
                <option value="deal">Deal</option>
              </select>
              <select
                value={noteForm.entityId}
                onChange={(event) => setNoteForm((prev) => ({ ...prev, entityId: event.target.value }))}
                className="rounded-xl border border-brand-black/20 px-3 py-2 text-sm"
              >
                {(noteForm.entityType === "outreach" ? visibleRecords : noteForm.entityType === "opportunity" ? visibleOpportunities : visibleDeals).map(
                  (item) => (
                    <option key={item.id} value={item.id}>
                      {"target" in item ? item.target : item.name}
                    </option>
                  )
                )}
              </select>
              <button
                type="submit"
                className="rounded-full border border-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black transition hover:bg-brand-black hover:text-brand-white"
              >
                Save note
              </button>
            </div>
          </form>
          <div className="mt-4 space-y-3">
            {normalizedNotes.map((note) => {
              const linkedLabel =
                note.entityType === "outreach"
                  ? records.find((r) => r.id === note.entityId)?.target
                  : note.entityType === "opportunity"
                    ? opportunities.find((o) => o.id === note.entityId)?.name
                    : deals.find((d) => d.id === note.entityId)?.name;
              const effectiveBody = note.source === "api" && noteEdits?.[note.id]?.currentBody ? noteEdits[note.id].currentBody : note.body;
              return (
                <article
                  key={note.id}
                  className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-brand-black"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
                        {linkedLabel || "Record"}
                      </p>
                      <p className="text-[0.8rem] text-brand-black/60">{formatDate(note.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{note.author || "Admin"}</Badge>
                      <button
                        type="button"
                        className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
                        onClick={() => openDrawer(note.entityType, note.entityId)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-brand-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-brand-black transition hover:bg-brand-black/5"
                        onClick={() => openNoteEdit(note)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-brand-black/80">{effectiveBody}</p>
                  {note.source === "api" && noteEdits?.[note.id]?.history?.length ? (
                    <p className="mt-2 text-[0.75rem] text-brand-black/60">
                      Edited {noteEdits[note.id].history.length} time(s) (local)
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {outreachModalOpen ? (
        <OutreachModal
          editing={editingOutreach}
          form={outreachForm}
          setForm={setOutreachForm}
          onClose={() => setOutreachModalOpen(false)}
          onSave={saveOutreach}
        />
      ) : null}

      {opportunityModalOpen ? (
        <OpportunityModal
          editing={editingOpportunity}
          form={opportunityForm}
          setForm={setOpportunityForm}
          outreachOptions={visibleRecords.filter((r) => !archivedOutreachIds.includes(r.id))}
          onClose={() => setOpportunityModalOpen(false)}
          onSave={saveOpportunity}
        />
      ) : null}

      {dealModalOpen ? (
        <DealModal
          form={dealForm}
          setForm={setDealForm}
          outreachOptions={visibleRecords.filter((r) => !archivedOutreachIds.includes(r.id))}
          opportunityOptions={visibleOpportunities}
          campaignOptions={crmCampaigns}
          context={dealContext}
          onClose={() => setDealModalOpen(false)}
          onSave={saveDeal}
        />
      ) : null}

      {taskEditor.open ? (
        <TaskEditModal
          task={taskEditor.task}
          setTask={(updater) =>
            setTaskEditor((prev) => ({ ...prev, task: typeof updater === "function" ? updater(prev.task) : updater }))
          }
          onClose={() => setTaskEditor({ open: false, task: null })}
          onSave={saveTaskEdit}
        />
      ) : null}

      {noteEditor.open ? (
        <NoteEditModal
          body={noteEditor.body}
          setBody={(body) => setNoteEditor((prev) => ({ ...prev, body }))}
          onClose={() => setNoteEditor({ open: false, note: null, body: "" })}
          onSave={saveNoteEdit}
        />
      ) : null}

      {drawer.open ? (
        <RecordDrawer
          drawer={drawer}
          onClose={() => setDrawer({ open: false, entityType: "outreach", entityId: "" })}
          records={records}
          archivedOutreachIds={archivedOutreachIds}
          profilesByOutreachId={profilesByOutreachId}
          setProfilesByOutreachId={setProfilesByOutreachId}
          opportunities={opportunities}
          deals={deals}
          notes={normalizedNotes}
          noteEdits={noteEdits}
          tasks={normalizedTasks}
          crmCampaigns={crmCampaigns}
          onSetDealCampaign={setDealCampaign}
          onArchiveOutreach={archiveOutreach}
          onRestoreOutreach={restoreOutreach}
          onArchiveOpportunity={archiveOpportunity}
          onRestoreOpportunity={restoreOpportunity}
          onArchiveDeal={archiveDeal}
          onRestoreDeal={restoreDeal}
          onEditOutreach={(id) => {
            const record = records.find((r) => r.id === id);
            if (record) openEditOutreach(record);
          }}
          onEditOpportunity={(id) => {
            const opp = opportunities.find((o) => o.id === id);
            if (opp) openEditOpportunity(opp);
          }}
          onConvertToOpportunity={(id) => {
            const record = records.find((r) => r.id === id);
            if (record) convertToOpportunity(record);
          }}
          onConvertToDeal={(ctx) => openConvertToDeal(ctx)}
          onStageSet={handleStageSet}
          onStatusSet={async (outreachId, status) => {
            try {
              const { record } = await updateOutreachRecord(outreachId, { status });
              setRecords((prev) => prev.map((r) => (r.id === outreachId ? { ...r, ...record } : r)));
            } catch {
              setRecords((prev) => prev.map((r) => (r.id === outreachId ? { ...r, status } : r)));
            }
          }}
          onThreadLink={async (outreachId, threadUrl) => {
            try {
              const { record } = await updateOutreachRecord(outreachId, { threadUrl });
              setRecords((prev) => prev.map((r) => (r.id === outreachId ? { ...r, ...record } : r)));
            } catch {
              setRecords((prev) => prev.map((r) => (r.id === outreachId ? { ...r, threadUrl } : r)));
            }
          }}
          onUpdateOpportunity={(opportunityId, updates) => {
            setOpportunities((prev) =>
              prev.map((opp) =>
                opp.id === opportunityId ? { ...opp, ...updates, updatedAt: new Date().toISOString() } : opp
              )
            );
          }}
          onUpdateDeal={(dealId, updates) => {
            setDeals((prev) =>
              prev.map((deal) =>
                deal.id === dealId ? { ...deal, ...updates, updatedAt: new Date().toISOString() } : deal
              )
            );
          }}
        />
      ) : null}

      {/* Deck Drawer */}
      <DeckDrawer
        open={deckDrawerOpen}
        onClose={() => setDeckDrawerOpen(false)}
        records={records}
        opportunities={opportunities}
        deals={deals}
        campaigns={crmCampaigns}
      />
    </DashboardShell>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/80 p-5">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{label}</p>
      <p className="mt-2 font-display text-4xl uppercase text-brand-black">{value}</p>
      <p className="text-sm text-brand-black/60">{sub}</p>
    </div>
  );
}

function ReminderPill({ record }) {
  const followUp = daysUntil(record.nextFollowUp);
  if (followUp === null) {
    return (
      <p className="mt-3 text-[0.75rem] text-brand-black/60">
        No reminder set
      </p>
    );
  }
  const tone = followUp < 0 ? "bg-brand-red/10 text-brand-red" : "bg-brand-black/5 text-brand-black";
  const label =
    followUp < 0
      ? `Overdue by ${Math.abs(followUp)}d · ${record.reminder || "Follow up now"}`
      : `Follow-up in ${followUp}d · ${record.reminder || "Reminder set"}`;
  return (
    <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.25em] ${tone}`}>
      {label}
    </p>
  );
}

function ProfileDetails({ record }) {
  const profile = record.profile;
  if (!profile) return null;

  if (record.type === "Creator") {
    return (
      <div className="mt-3 rounded-2xl border border-brand-black/10 bg-white/80 p-3 text-[0.8rem] text-brand-black/75">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">Creator profile</p>
        <p>Primary platform: {profile.primaryPlatform || "—"}</p>
        <p>Followers: {profile.followers || "Manual input"}</p>
        <p>Niche: {profile.niche || "—"}</p>
        {profile.location ? <p>Location: {profile.location}</p> : null}
        <p>Reason: {profile.reason || "—"}</p>
        <p>Representation: {profile.representation || "Unknown"}</p>
        <p>Inbound brand activity: {profile.inbound || "Unknown"}</p>
        <p className="mt-2 text-[0.75rem] text-brand-black/60">
          Fit: {profile.fitNotes || "Add brand fit notes"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[0.75rem]">
          {profile.socials?.instagram ? (
            <a
              href={profile.socials.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-brand-black/20 px-2 py-1 underline"
            >
              IG {profile.socials.instagram.handle}
            </a>
          ) : null}
          {profile.socials?.tiktok ? (
            <a
              href={profile.socials.tiktok.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-brand-black/20 px-2 py-1 underline"
            >
              TikTok {profile.socials.tiktok.handle}
            </a>
          ) : null}
          {profile.socials?.youtube ? (
            <a
              href={profile.socials.youtube.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-brand-black/20 px-2 py-1 underline"
            >
              YouTube {profile.socials.youtube.handle}
            </a>
          ) : null}
          {profile.socials?.other ? (
            <span className="rounded-full border border-brand-black/20 px-2 py-1">
              {profile.socials.other}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-brand-black/10 bg-white/80 p-3 text-[0.8rem] text-brand-black/75">
      <p className="text-xs uppercase tracking-[0.35em] text-brand-black/50">Brand profile</p>
      <p>Website: {profile.website ? <a className="underline" href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a> : "—"}</p>
      <p>Industry: {profile.industry || "—"}</p>
      <p>Size: {profile.size || "Optional"}</p>
      {profile.emails?.length ? (
        <div className="mt-2 space-y-1">
          {profile.emails.map((email) => (
            <div key={email.email} className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-black/15 px-2 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-brand-black/70">
                {email.label}
              </span>
              <span className="text-[0.8rem]">{email.email}</span>
              <span className="text-[0.7rem] text-brand-black/50">
                Last: {email.lastContact ? formatDate(email.lastContact) : "—"}
              </span>
              <Badge tone={statusTone[email.status] || "neutral"}>{email.status}</Badge>
              {email.threadUrl ? (
                <a
                  href={email.threadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[0.7rem] underline"
                >
                  Gmail
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {profile.contacts?.length ? (
        <div className="mt-2 space-y-1">
          {profile.contacts.map((contact) => (
            <div key={contact.email} className="rounded-xl border border-brand-black/10 bg-brand-linen/50 p-2 text-[0.75rem]">
              <p className="font-semibold text-brand-black">{contact.name}</p>
              <p className="text-brand-black/70">{contact.role}</p>
              <p className="text-brand-black/70">{contact.email}</p>
              <p className="text-brand-black/60">Last contact: {formatDate(contact.lastContact)}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge tone={statusTone[contact.status] || "neutral"}>{contact.status}</Badge>
                {contact.threadUrl ? (
                  <a
                    href={contact.threadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[0.7rem] underline"
                  >
                    View thread
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ModalFrame({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brand-black/40 p-4">
      <div className="w-full max-w-3xl rounded-[36px] border border-brand-black/15 bg-brand-white p-6 text-left text-brand-black shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-3xl uppercase">{title}</h3>
            {subtitle ? <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{subtitle}</p> : null}
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

function OutreachModal({ editing, form, setForm, onClose, onSave }) {
  return (
    <ModalFrame
      title={editing ? "Edit outreach" : "New outreach"}
      subtitle="Add info progressively. Nothing is auto-scraped."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Target type
          <select
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option>Brand</option>
            <option>Creator</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Name
          <input
            value={form.target}
            onChange={(event) => setForm((prev) => ({ ...prev, target: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Brand or creator name"
          />
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-black/70 md:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(form.isDraft)}
            onChange={(event) => setForm((prev) => ({ ...prev, isDraft: event.target.checked }))}
          />
          Save as draft (still visible in pipeline)
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Contact name
          <input
            value={form.contactName}
            onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Contact role
          <input
            value={form.contactRole}
            onChange={(event) => setForm((prev) => ({ ...prev, contactRole: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Contact email
          <input
            value={form.contactEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Link (website/profile)
          <input
            value={form.link}
            onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Owner
          <input
            value={form.owner}
            onChange={(event) => setForm((prev) => ({ ...prev, owner: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Source
          <input
            value={form.source}
            onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Manual / referral / inbound / event"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Stage
          <select
            value={form.stage}
            onChange={(event) => setForm((prev) => ({ ...prev, stage: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            {OUTREACH_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Comms status
          <select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option>Not started</option>
            <option>Awaiting reply</option>
            <option>Responded</option>
            <option>No response</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Gmail thread link (optional)
          <input
            value={form.threadUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, threadUrl: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="https://mail.google.com/..."
          />
        </label>
        <div className="grid grid-cols-2 gap-2 md:col-span-2">
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Emails sent
            <input
              type="number"
              min="0"
              value={form.emailsSent}
              onChange={(event) => setForm((prev) => ({ ...prev, emailsSent: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Replies received
            <input
              type="number"
              min="0"
              value={form.emailsReplies}
              onChange={(event) => setForm((prev) => ({ ...prev, emailsReplies: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Last contact (optional)
          <input
            type="datetime-local"
            value={form.lastContact}
            onChange={(event) => setForm((prev) => ({ ...prev, lastContact: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Next follow-up (optional)
          <input
            type="datetime-local"
            value={form.nextFollowUp}
            onChange={(event) => setForm((prev) => ({ ...prev, nextFollowUp: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Reminder
          <input
            value={form.reminder}
            onChange={(event) => setForm((prev) => ({ ...prev, reminder: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Optional next action"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Summary
          <textarea
            rows={3}
            value={form.summary}
            onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Optional context"
          />
        </label>
      </div>
    </ModalFrame>
  );
}

function OpportunityModal({ editing, form, setForm, outreachOptions, onClose, onSave }) {
  return (
    <ModalFrame
      title={editing ? "Edit opportunity" : "New opportunity"}
      subtitle="Must be linked to an outreach record."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            Save
          </button>
        </div>
      }
    >
      {outreachOptions.length === 0 ? (
        <p className="rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-sm text-brand-black/80">
          Create an outreach record first, then add an opportunity.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
            Linked outreach (required)
            <select
              value={form.outreachId}
              onChange={(event) => setForm((prev) => ({ ...prev, outreachId: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            >
              {outreachOptions.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.target}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
            Opportunity name
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Estimated value
            <input
              value={form.value}
              onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Expected close date
            <input
              type="date"
              value={form.expectedClose}
              onChange={(event) => setForm((prev) => ({ ...prev, expectedClose: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            >
              {["Open", "Closed Won", "Closed Lost"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Comms status
            <select
              value={form.commsStatus}
              onChange={(event) => setForm((prev) => ({ ...prev, commsStatus: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            >
              <option>Awaiting reply</option>
              <option>Responded</option>
              <option>No response</option>
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
            Gmail thread link
            <input
              value={form.threadUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, threadUrl: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
            Last contact (optional)
            <input
              type="datetime-local"
              value={form.lastContact}
              onChange={(event) => setForm((prev) => ({ ...prev, lastContact: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
            Notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </label>
        </div>
      )}
    </ModalFrame>
  );
}

function DealModal({ form, setForm, outreachOptions, opportunityOptions, campaignOptions, context, onClose, onSave }) {
  const warning = !form.outreachId ? "Deal created without linked outreach. You can still proceed, but traceability will be limited." : "";
  return (
    <ModalFrame
      title={context?.opportunityId || context?.outreachId ? "Convert to deal" : "New deal"}
      subtitle="Deals lock outreach and close opportunities."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            Create deal
          </button>
        </div>
      }
    >
      {warning ? (
        <p className="mb-3 rounded-2xl border border-brand-black/10 bg-brand-linen/60 p-4 text-sm text-brand-black/80">
          {warning}
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Linked outreach (optional)
          <select
            value={form.outreachId}
            onChange={(event) => setForm((prev) => ({ ...prev, outreachId: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {outreachOptions.map((record) => (
              <option key={record.id} value={record.id}>
                {record.target}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Linked opportunity (optional)
          <select
            value={form.opportunityId}
            onChange={(event) => setForm((prev) => ({ ...prev, opportunityId: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {opportunityOptions.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Campaign (optional)
          <select
            value={form.campaignId || ""}
            onChange={(event) => setForm((prev) => ({ ...prev, campaignId: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option value="">None</option>
            {(campaignOptions || []).map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.campaignName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Deal name
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Value
          <input
            value={form.value}
            onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Status
          <input
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Open / Contracting / Live"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Gmail thread link
          <input
            value={form.threadUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, threadUrl: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Comms status
          <select
            value={form.commsStatus}
            onChange={(event) => setForm((prev) => ({ ...prev, commsStatus: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option>Awaiting reply</option>
            <option>Responded</option>
            <option>No response</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Last contact (optional)
          <input
            type="datetime-local"
            value={form.lastContact || ""}
            onChange={(event) => setForm((prev) => ({ ...prev, lastContact: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Notes
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </label>
      </div>
    </ModalFrame>
  );
}

function TaskEditModal({ task, setTask, onClose, onSave }) {
  if (!task) return null;
  return (
    <ModalFrame
      title="Edit task"
      subtitle="Tasks are linked to outreach, opportunities, or deals."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60 md:col-span-2">
          Title
          <input
            value={task.title || ""}
            onChange={(event) => setTask((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Due date
          <input
            type="datetime-local"
            value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ""}
            onChange={(event) => setTask((prev) => ({ ...prev, dueDate: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Owner
          <input
            value={task.owner || ""}
            onChange={(event) => setTask((prev) => ({ ...prev, owner: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Priority
          <select
            value={task.priority || "Medium"}
            onChange={(event) => setTask((prev) => ({ ...prev, priority: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
          Status
          <select
            value={task.status || "Open"}
            onChange={(event) => setTask((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
          >
            <option>Open</option>
            <option>Queued</option>
            <option>In progress</option>
            <option>Done</option>
          </select>
        </label>
      </div>
    </ModalFrame>
  );
}

function NoteEditModal({ body, setBody, onClose, onSave }) {
  return (
    <ModalFrame
      title="Edit note"
      subtitle="Edits are tracked locally for admin audit."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
          >
            Save
          </button>
        </div>
      }
    >
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="h-40 w-full rounded-2xl border border-brand-black/20 px-4 py-3 text-sm"
      />
    </ModalFrame>
  );
}

function RecordDrawer({
  drawer,
  onClose,
  records,
  archivedOutreachIds,
  profilesByOutreachId,
  setProfilesByOutreachId,
  opportunities,
  deals,
  notes,
  noteEdits,
  tasks,
  crmCampaigns,
  onSetDealCampaign,
  onArchiveOutreach,
  onRestoreOutreach,
  onArchiveOpportunity,
  onRestoreOpportunity,
  onArchiveDeal,
  onRestoreDeal,
  onEditOutreach,
  onEditOpportunity,
  onConvertToOpportunity,
  onConvertToDeal,
  onStageSet,
  onStatusSet,
  onThreadLink,
  onUpdateOpportunity,
  onUpdateDeal
}) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const entityType = drawer.entityType;
  const entityId = drawer.entityId;
  const outreach = entityType === "outreach" ? records.find((r) => r.id === entityId) : null;
  const opportunity = entityType === "opportunity" ? opportunities.find((o) => o.id === entityId) : null;
  const deal = entityType === "deal" ? deals.find((d) => d.id === entityId) : null;
  const selectedCampaign = useMemo(() => {
    if (!deal?.campaignId) return null;
    return (crmCampaigns || []).find((c) => c.id === deal.campaignId) || null;
  }, [crmCampaigns, deal?.campaignId]);

  const chain = (() => {
    if (entityType === "outreach") {
      const oppIds = opportunities.filter((o) => o.outreachId === entityId && !o.archivedAt).map((o) => o.id);
      const dealIds = deals.filter((d) => d.outreachId === entityId && !d.archivedAt).map((d) => d.id);
      return { outreachId: entityId, opportunityIds: oppIds, dealIds };
    }
    if (entityType === "opportunity") {
      const outreachId = opportunity?.outreachId || "";
      const dealIds = deals
        .filter((d) => (d.opportunityId === entityId || d.outreachId === outreachId) && !d.archivedAt)
        .map((d) => d.id);
      return { outreachId, opportunityIds: [entityId], dealIds };
    }
    const outreachId = deal?.outreachId || "";
    const opportunityIds = deal?.opportunityId ? [deal.opportunityId] : [];
    return { outreachId, opportunityIds, dealIds: [entityId] };
  })();

  const chainTasks = tasks.filter((task) => {
    if (task.entityType === "outreach") return task.entityId === chain.outreachId;
    if (task.entityType === "opportunity") return chain.opportunityIds.includes(task.entityId);
    if (task.entityType === "deal") return chain.dealIds.includes(task.entityId);
    return false;
  });

  const chainNotes = notes.filter((note) => {
    if (note.entityType === "outreach") return note.entityId === chain.outreachId;
    if (note.entityType === "opportunity") return chain.opportunityIds.includes(note.entityId);
    if (note.entityType === "deal") return chain.dealIds.includes(note.entityId);
    return false;
  });

  const title =
    entityType === "outreach"
      ? outreach?.target || "Outreach"
      : entityType === "opportunity"
        ? opportunity?.name || "Opportunity"
        : deal?.name || "Deal";

  const isArchivedOutreach = entityType === "outreach" && archivedOutreachIds.includes(entityId);

  const [threadDraft, setThreadDraft] = React.useState(() => {
    if (entityType === "outreach") return outreach?.threadUrl || "";
    if (entityType === "opportunity") return opportunity?.threadUrl || "";
    return deal?.threadUrl || "";
  });

  useEffect(() => {
    if (entityType === "outreach") setThreadDraft(outreach?.threadUrl || "");
    if (entityType === "opportunity") setThreadDraft(opportunity?.threadUrl || "");
    if (entityType === "deal") setThreadDraft(deal?.threadUrl || "");
  }, [entityType, entityId]);

  const [profileDraft, setProfileDraft] = React.useState(() => {
    if (chain.outreachId && profilesByOutreachId?.[chain.outreachId]) return profilesByOutreachId[chain.outreachId];
    return outreach?.profile || null;
  });

  useEffect(() => {
    if (!chain.outreachId) return;
    setProfileDraft(profilesByOutreachId?.[chain.outreachId] || outreach?.profile || null);
  }, [chain.outreachId, profilesByOutreachId, outreach?.profile]);

  const saveThread = async () => {
    if (entityType === "outreach") {
      await onThreadLink(entityId, threadDraft);
      return;
    }
    if (entityType === "opportunity") {
      onUpdateOpportunity(entityId, { threadUrl: threadDraft });
      return;
    }
    onUpdateDeal(entityId, { threadUrl: threadDraft });
  };

  const renderHeaderActions = () => {
    if (entityType === "outreach") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
            onClick={() => onEditOutreach(entityId)}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
            onClick={() => onConvertToOpportunity(entityId)}
          >
            Convert → Opportunity
          </button>
          <button
            type="button"
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            onClick={() => onConvertToDeal({ outreachId: entityId, opportunityId: outreach?.opportunityRef || "" })}
          >
            Convert → Deal
          </button>
          {isArchivedOutreach ? (
            <button
              type="button"
              className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
              onClick={() => onRestoreOutreach(entityId)}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              className="rounded-full border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-red"
              onClick={() => onArchiveOutreach(entityId)}
            >
              Archive
            </button>
          )}
        </div>
      );
    }
    if (entityType === "opportunity") {
      const archived = Boolean(opportunity?.archivedAt);
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
            onClick={() => onEditOpportunity(entityId)}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            onClick={() => onConvertToDeal({ outreachId: opportunity?.outreachId, opportunityId: entityId })}
          >
            Convert → Deal
          </button>
          {archived ? (
            <button
              type="button"
              className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
              onClick={() => onRestoreOpportunity(entityId)}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              className="rounded-full border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-red"
              onClick={() => onArchiveOpportunity(entityId)}
            >
              Archive
            </button>
          )}
        </div>
      );
    }
    const archived = Boolean(deal?.archivedAt);
    return (
      <div className="flex flex-wrap gap-2">
        {archived ? (
          <button
            type="button"
            className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
            onClick={() => onRestoreDeal(entityId)}
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            className="rounded-full border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-red"
            onClick={() => onArchiveDeal(entityId)}
          >
            Archive
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-brand-black/30" onClick={onClose} />
      <aside className={`absolute right-0 top-0 h-full overflow-y-auto border-l border-brand-black/10 bg-brand-white p-6 text-brand-black shadow-[0_30px_120px_rgba(0,0,0,0.35)] transition-all duration-300 ${
        isFullscreen ? "w-full" : "w-full max-w-xl"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{entityType}</p>
            <h3 className="font-display text-3xl uppercase">{title}</h3>
            {chain.outreachId ? (
              <p className="mt-1 text-xs text-brand-black/60">
                Chain: outreach {chain.outreachId}
                {chain.opportunityIds.length ? ` · ${chain.opportunityIds.length} opportunity` : ""}
                {chain.dealIds.length ? ` · ${chain.dealIds.length} deal` : ""}
              </p>
            ) : null}
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
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4">{renderHeaderActions()}</div>

        {entityType === "outreach" && outreach ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Pipeline</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={outreach.stage || "not-started"}
                  onChange={(event) => onStageSet(outreach.id, event.target.value)}
                  className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]"
                >
                  {OUTREACH_STAGES.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <select
                  value={outreach.status || "Not started"}
                  onChange={(event) => onStatusSet(outreach.id, event.target.value)}
                  className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]"
                >
                  <option>Not started</option>
                  <option>Awaiting reply</option>
                  <option>Responded</option>
                  <option>No response</option>
                </select>
                <Badge tone="neutral">{outreach.owner || "Unassigned"}</Badge>
              </div>
              <p className="mt-3 text-sm text-brand-black/70">{outreach.summary || "No summary yet"}</p>
              <p className="mt-2 text-xs text-brand-black/60">
                Emails: {outreach.emailsSent || 0} sent · {outreach.emailsReplies || 0} replies · Last contact:{" "}
                {formatDate(outreach.lastContact)}
              </p>
            </div>

            {/* Gmail Thread Linker Component */}
            <GmailThreadLinker
              outreachId={outreach.id}
              currentThreadId={outreach.gmailThreadId || null}
              onLinked={(threadId) => {
                onThreadLink(outreach.id, threadId);
              }}
            />

            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Gmail thread</p>
              <input
                value={threadDraft}
                onChange={(event) => setThreadDraft(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                placeholder="Paste Gmail thread URL"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveThread}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Save link
                </button>
                {threadDraft ? (
                  <a
                    href={threadDraft}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
                  >
                    Open
                  </a>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-brand-black/60">
                Manual linking only. Provider sync can be added later.
              </p>
            </div>

            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Profile (admin-only)</p>
              <p className="mt-2 text-xs text-brand-black/60">
                This data stays inside the outreach record until the target joins the platform.
              </p>
              <textarea
                rows={4}
                value={profileDraft ? JSON.stringify(profileDraft, null, 2) : ""}
                onChange={(event) => {
                  try {
                    const parsed = event.target.value ? JSON.parse(event.target.value) : null;
                    setProfileDraft(parsed);
                  } catch {
                    // ignore invalid json while typing
                  }
                }}
                className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 font-mono text-[0.75rem]"
                placeholder='{"primaryPlatform":"Instagram", "followers":"200k"}'
              />
              <button
                type="button"
                onClick={() => {
                  if (!chain.outreachId) return;
                  setProfilesByOutreachId((prev) => ({ ...(prev || {}), [chain.outreachId]: profileDraft }));
                }}
                className="mt-2 rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
              >
                Save profile
              </button>
            </div>
          </div>
        ) : null}

        {entityType === "opportunity" && opportunity ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Opportunity</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={opportunity.status}
                  onChange={(event) => onUpdateOpportunity(opportunity.id, { status: event.target.value })}
                  className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]"
                >
                  {["Open", "Closed Won", "Closed Lost"].map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={opportunity.commsStatus || "Awaiting reply"}
                  onChange={(event) => onUpdateOpportunity(opportunity.id, { commsStatus: event.target.value })}
                  className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]"
                >
                  <option>Awaiting reply</option>
                  <option>Responded</option>
                  <option>No response</option>
                </select>
                <Badge tone="neutral">Value: {opportunity.value || "—"}</Badge>
              </div>
              <p className="mt-2 text-sm text-brand-black/70">{opportunity.notes || "No notes yet"}</p>
              <p className="mt-2 text-xs text-brand-black/60">
                Last contact: {formatDate(opportunity.lastContact)}
              </p>
            </div>

            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Gmail thread</p>
              <input
                value={threadDraft}
                onChange={(event) => setThreadDraft(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                placeholder="Paste Gmail thread URL"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveThread}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Save link
                </button>
                {threadDraft ? (
                  <a
                    href={threadDraft}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
                  >
                    Open
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {entityType === "deal" && deal ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Deal</p>
              <p className="mt-2 text-sm text-brand-black/70">{deal.notes || "No notes yet"}</p>
              <p className="mt-2 text-xs text-brand-black/60">Status: {deal.status || "Open"} · Value: {deal.value || "—"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={deal.commsStatus || "Awaiting reply"}
                  onChange={(event) => onUpdateDeal(deal.id, { commsStatus: event.target.value })}
                  className="rounded-full border border-brand-black/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]"
                >
                  <option>Awaiting reply</option>
                  <option>Responded</option>
                  <option>No response</option>
                </select>
                <Badge tone="neutral">Last contact: {formatDate(deal.lastContact)}</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Campaign</p>
                  <p className="mt-1 text-xs text-brand-black/60">Optional. Deals can exist with or without a campaign.</p>
                </div>
                {selectedCampaign ? (
                  <CampaignChip name={selectedCampaign.campaignName} status={selectedCampaign.status} size="sm" />
                ) : (
                  <Badge tone="neutral">No campaign</Badge>
                )}
              </div>
              <select
                value={deal.campaignId || ""}
                onChange={(event) => {
                  const next = event.target.value;
                  onSetDealCampaign?.({ dealId: deal.id, campaignId: next });
                }}
                className="mt-3 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {(crmCampaigns || []).map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.campaignName}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href="/admin/campaigns"
                  className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black"
                >
                  Manage campaigns
                </a>
                {deal.campaignId ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSetDealCampaign?.({ dealId: deal.id, campaignId: "" });
                    }}
                    className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black"
                  >
                    Unlink
                  </button>
                ) : null}
              </div>
            </div>

            {/* AI Intelligence Panel for Deal Analysis */}
            <DealAIPanel 
              emailId={deal.emailId || null}
              dealId={deal.id}
            />

            {/* Gmail Thread Linker */}
            <GmailThreadLinker
              outreachId={deal.id}
              currentThreadId={deal.gmailThreadId || null}
              onLinked={(threadId) => {
                onUpdateDeal(deal.id, { gmailThreadId: threadId });
              }}
            />

            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Gmail thread</p>
              <input
                value={threadDraft}
                onChange={(event) => setThreadDraft(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-brand-black/20 px-3 py-2 text-sm"
                placeholder="Paste Gmail thread URL"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveThread}
                  className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em]"
                >
                  Save link
                </button>
                {threadDraft ? (
                  <a
                    href={threadDraft}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
                  >
                    Open
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Tasks</p>
            {chainTasks.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {chainTasks.map((task) => {
                  const due = task.dueDate ? new Date(task.dueDate) : null;
                  const overdue = due && !Number.isNaN(due.getTime()) && due.getTime() < Date.now() && task.status !== "Done";
                  return (
                    <li
                      key={task.id}
                      className={`rounded-xl border border-brand-black/10 bg-brand-linen/50 p-3 ${overdue ? "ring-2 ring-brand-red" : ""}`}
                    >
                      <p className="font-semibold text-brand-black">{task.title}</p>
                      <p className="text-xs text-brand-black/60">
                        Due: {formatDate(task.dueDate)} · Owner: {task.owner || "Admin"} · Status: {task.status}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-brand-black/60">No tasks linked yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Notes</p>
            {chainNotes.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {chainNotes.map((note) => {
                  const effectiveBody = note.source === "api" && noteEdits?.[note.id]?.currentBody ? noteEdits[note.id].currentBody : note.body;
                  return (
                    <li key={note.id} className="rounded-xl border border-brand-black/10 bg-brand-linen/50 p-3">
                      <p className="text-xs text-brand-black/60">{formatDate(note.createdAt)} · {note.author || "Admin"}</p>
                      <p className="mt-1 text-sm text-brand-black/80">{effectiveBody}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-brand-black/60">No notes linked yet.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AdminOutreachPage;
