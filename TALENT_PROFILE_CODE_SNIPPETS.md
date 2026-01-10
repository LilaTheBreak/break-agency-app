# Admin Talent Profile — Code Snippets & Component Templates

**Purpose:** Ready-to-use code for implementation phases.

These are starting points; adapt to project structure as needed.

---

## Component 1: TalentCommandHeader.jsx

**Location:** `apps/web/src/components/TalentCommandHeader.jsx`

```jsx
import React from "react";
import { ArrowLeft, Edit2, MoreVertical } from "lucide-react";
import { ViewAsTalentButton } from "./ViewAsTalentButton";
import { QuickActionsDropdown } from "./QuickActionsDropdown";

export function TalentCommandHeader({
  talent,
  onBack,
  onEdit,
  onQuickAction,
}) {
  // Derive one-liner from talent data
  // Example: "Exclusive | Finance & Lifestyle | UK"
  const representationType = talent.representationType || "NON_EXCLUSIVE";
  const typeLabel = {
    EXCLUSIVE: "Exclusive",
    NON_EXCLUSIVE: "Non-Exclusive",
    FRIEND_OF_HOUSE: "Friends of House",
    UGC: "UGC",
    FOUNDER: "Founder",
  }[representationType] || representationType;

  // For MVP: Hardcode markets and regions
  // TODO: Add to Talent model and populate from form
  const oneLiner = `${typeLabel} | Finance & Lifestyle | UK / Global`;

  return (
    <header className="mb-12">
      {/* Back button row */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Main header: Avatar + Identity */}
      <div className="flex items-start gap-8 mb-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {talent.linkedUser?.avatarUrl ? (
            <img
              src={talent.linkedUser.avatarUrl}
              alt={talent.displayName || talent.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-brand-black/10"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand-red/15 flex items-center justify-center border-2 border-brand-black/10">
              <span className="text-4xl font-semibold text-brand-red">
                {(talent.displayName || talent.name || "?")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Name */}
          <div className="mb-6">
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-3">
              Talent Profile
            </p>
            <h1 className="font-display text-4xl uppercase text-brand-black leading-none mb-4">
              {talent.displayName || talent.name}
            </h1>
            <p className="text-sm uppercase tracking-[0.35em] text-brand-black/70">
              {oneLiner}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <ViewAsTalentButton
              talentId={talent.id}
              talentName={talent.displayName || talent.name}
            />
            <button
              onClick={onEdit}
              className="flex items-center gap-2 rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            <QuickActionsDropdown onAction={onQuickAction} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-brand-black/10" />
    </header>
  );
}
```

---

## Component 2: HealthSnapshotCards.jsx

**Location:** `apps/web/src/components/HealthSnapshotCards.jsx`

```jsx
import React from "react";
import {
  TrendingUp,
  Briefcase,
  FileText,
  DollarSign,
} from "lucide-react";

function SnapshotCard({ label, value, subtext, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-6 hover:bg-brand-black/2 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-red font-semibold">
          {label}
        </p>
        {Icon && <Icon className="h-5 w-5 text-brand-black/30" />}
      </div>
      <p className="text-4xl font-bold text-brand-black mb-3">{value}</p>
      {subtext && (
        <p className="text-xs text-brand-black/60 italic">{subtext}</p>
      )}
    </div>
  );
}

export function HealthSnapshotCards({
  openOpportunities = 0,
  activeDeals = 0,
  activeCampaigns = 0,
  totalRevenue = 0,
  paidRevenue = 0,
  outstandingRevenue = 0,
  isExclusive = false,
}) {
  return (
    <div className="mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SnapshotCard
          label="Open Opportunities"
          value={openOpportunities}
          subtext="awaiting decision"
          icon={TrendingUp}
        />
        <SnapshotCard
          label="Active Deals"
          value={activeDeals}
          subtext={
            totalRevenue > 0
              ? `£${(totalRevenue / 1000).toFixed(1)}k pipeline`
              : "—"
          }
          icon={Briefcase}
        />
        <SnapshotCard
          label="Active Campaigns"
          value={activeCampaigns}
          subtext="deliverables pending"
          icon={FileText}
        />
        {isExclusive && (
          <SnapshotCard
            label="Total Revenue"
            value={`£${(totalRevenue / 1000).toFixed(1)}k`}
            subtext={`£${(paidRevenue / 1000).toFixed(1)}k paid | £${(
              outstandingRevenue / 1000
            ).toFixed(1)}k outstanding`}
            icon={DollarSign}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Component 3: QuickActionsDropdown.jsx

**Location:** `apps/web/src/components/QuickActionsDropdown.jsx`

```jsx
import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Plus,
  CheckSquare,
  MessageSquare,
  Link2,
  LogOut,
} from "lucide-react";

export function QuickActionsDropdown({ onAction, isLinked = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action) => {
    onAction(action);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 transition-colors flex items-center gap-2"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-brand-black/10 bg-brand-white shadow-lg z-50">
          <div className="p-2">
            {/* Add Deal */}
            <button
              onClick={() => handleAction("addDeal")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-[0.2em] text-brand-black hover:bg-brand-black/5 transition-colors text-left"
            >
              <Plus className="h-4 w-4 text-brand-red" />
              Add Deal
            </button>

            {/* Add Task */}
            <button
              onClick={() => handleAction("addTask")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-[0.2em] text-brand-black hover:bg-brand-black/5 transition-colors text-left"
            >
              <CheckSquare className="h-4 w-4 text-brand-red" />
              Add Task
            </button>

            {/* Add Note */}
            <button
              onClick={() => handleAction("addNote")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-[0.2em] text-brand-black hover:bg-brand-black/5 transition-colors text-left"
            >
              <MessageSquare className="h-4 w-4 text-brand-red" />
              Add Note
            </button>

            {/* Divider */}
            <div className="border-t border-brand-black/10 my-2" />

            {/* Link/Unlink User */}
            {!isLinked && (
              <button
                onClick={() => handleAction("linkUser")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-[0.2em] text-brand-black hover:bg-brand-black/5 transition-colors text-left"
              >
                <Link2 className="h-4 w-4 text-brand-red" />
                Link User Account
              </button>
            )}

            {isLinked && (
              <button
                onClick={() => handleAction("unlinkUser")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-[0.2em] text-brand-red hover:bg-brand-red/5 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Unlink User Account
              </button>
            )}

            {/* View Activity */}
            <button
              onClick={() => handleAction("viewActivity")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs uppercase tracking-[0.2em] text-brand-black hover:bg-brand-black/5 transition-colors text-left"
            >
              <MessageSquare className="h-4 w-4 text-brand-black/40" />
              View Activity Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Component 4: TalentTasksOperationsPanel.jsx

**Location:** `apps/web/src/components/TalentTasksOperationsPanel.jsx`

```jsx
import React, { useState, useEffect } from "react";
import { CheckSquare, Plus, MoreVertical } from "lucide-react";
import { toast } from "react-hot-toast";

function TaskRow({ task, onToggle, onDelete, style = "default" }) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border border-brand-black/10 hover:bg-brand-black/3 transition-colors ${
        style === "error" ? "bg-brand-red/5" : "bg-brand-white"
      }`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.status === "DONE"}
        onChange={() => onToggle(task.id, task.status === "DONE" ? "TODO" : "DONE")}
        className="h-4 w-4 rounded accent-brand-red cursor-pointer"
      />

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium text-sm ${
            task.status === "DONE"
              ? "text-brand-black/50 line-through"
              : "text-brand-black"
          }`}
        >
          {task.title}
        </p>
        {task.dueDate && (
          <p className={`text-xs mt-1 ${
            isOverdue ? "text-brand-red font-semibold" : "text-brand-black/60"
          }`}>
            Due: {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && ` (Overdue ${Math.floor(
              (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)
            )}d)`}
          </p>
        )}
      </div>

      {/* Priority Badge */}
      {task.priority && (
        <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-[0.2em] ${
          task.priority === "HIGH"
            ? "bg-brand-red/15 text-brand-red"
            : task.priority === "MEDIUM"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-brand-black/10 text-brand-black/60"
        }`}>
          {task.priority}
        </span>
      )}

      {/* Actions Menu */}
      <button
        onClick={() => onDelete(task.id)}
        className="p-2 rounded-lg text-brand-black/40 hover:bg-brand-black/5 hover:text-brand-red transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TalentTasksOperationsPanel({ tasks = [], onTaskToggle, onTaskDelete, onAddTask }) {
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Group tasks by status
  const upcoming = tasks.filter(
    (t) =>
      t.status === "TODO" &&
      (!t.dueDate || new Date(t.dueDate) >= new Date())
  );

  const overdue = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== "DONE"
  );

  const completed = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-8">
      {/* Header with filter and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${
              selectedStatus === "all"
                ? "bg-brand-red text-white border-brand-red"
                : "border-brand-black/10 text-brand-black/60 hover:bg-brand-black/5"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus("upcoming")}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${
              selectedStatus === "upcoming"
                ? "bg-brand-red text-white border-brand-red"
                : "border-brand-black/10 text-brand-black/60 hover:bg-brand-black/5"
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          {overdue.length > 0 && (
            <button
              onClick={() => setSelectedStatus("overdue")}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.2em] border transition-colors ${
                selectedStatus === "overdue"
                  ? "bg-brand-red text-white border-brand-red"
                  : "border-brand-red bg-brand-red/10 text-brand-red hover:bg-brand-red/20"
              }`}
            >
              ⚠️ Overdue ({overdue.length})
            </button>
          )}
        </div>
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Upcoming */}
      {(selectedStatus === "all" || selectedStatus === "upcoming") && upcoming.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-[0.35em] text-brand-red font-semibold mb-4">
            Upcoming ({upcoming.length})
          </h3>
          <div className="space-y-2">
            {upcoming.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Overdue */}
      {(selectedStatus === "all" || selectedStatus === "overdue") && overdue.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-[0.35em] text-brand-red font-semibold mb-4">
            ⚠️ Overdue ({overdue.length})
          </h3>
          <div className="space-y-2">
            {overdue.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
                style="error"
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {(selectedStatus === "all" || selectedStatus === "completed") && completed.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-[0.35em] text-brand-black/60 font-semibold mb-4">
            Completed This Month ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.slice(0, 5).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onTaskToggle}
                onDelete={onTaskDelete}
                style="completed"
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-12 text-center">
          <CheckSquare className="h-12 w-12 text-brand-black/20 mx-auto mb-4" />
          <p className="text-brand-black/60 mb-2">No tasks yet.</p>
          <p className="text-xs text-brand-black/50 mb-6">
            Create your first task to stay on top of deliverables and deadlines.
          </p>
          <button
            onClick={onAddTask}
            className="rounded-full bg-brand-red px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-brand-black transition-colors"
          >
            Create Task
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Component 5: DealTrackerTableView.jsx

**Location:** `apps/web/src/components/DealTrackerTableView.jsx`

```jsx
import React, { useState } from "react";
import { Edit2, Trash2, MoreVertical } from "lucide-react";

const STAGE_LABELS = {
  NEW_LEAD: "New Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  CONTRACT_SIGNED: "Contract Signed",
  DELIVERABLES_IN_PROGRESS: "Deliverables In Progress",
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_RECEIVED: "Payment Received",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

const STAGE_COLORS = {
  NEW_LEAD: "bg-blue-100 text-blue-700",
  QUALIFIED: "bg-cyan-100 text-cyan-700",
  PROPOSAL: "bg-purple-100 text-purple-700",
  CONTRACT_SIGNED: "bg-yellow-100 text-yellow-700",
  DELIVERABLES_IN_PROGRESS: "bg-orange-100 text-orange-700",
  PAYMENT_PENDING: "bg-red-100 text-red-700",
  PAYMENT_RECEIVED: "bg-green-100 text-green-700",
  COMPLETED: "bg-green-200 text-green-800",
  CLOSED: "bg-gray-100 text-gray-700",
};

function InlineStageEdit({ deal, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(deal.stage);

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            STAGE_COLORS[deal.stage] || "bg-gray-100 text-gray-700"
          }`}
        >
          {STAGE_LABELS[deal.stage] || deal.stage}
        </span>
        <Edit2 className="h-3 w-3 text-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== deal.stage) {
          onSave(deal.id, "stage", value);
        }
        setIsEditing(false);
      }}
      autoFocus
      className="px-3 py-1 border border-brand-black/20 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
    >
      {Object.entries(STAGE_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function DealTrackerTableView({
  deals = [],
  onEditDeal,
  onDeleteDeal,
  onSaveField,
}) {
  const [stageFilter, setStageFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const filteredDeals = deals.filter((deal) => {
    if (stageFilter !== "ALL" && deal.stage !== stageFilter) return false;
    if (paymentFilter !== "ALL") {
      // Infer payment status from stage
      const paymentStatus =
        deal.stage === "PAYMENT_RECEIVED" || deal.stage === "COMPLETED"
          ? "Paid"
          : deal.stage === "PAYMENT_PENDING"
          ? "Awaiting"
          : "Pending";
      if (paymentFilter !== paymentStatus) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-brand-black/60 block mb-2">
            Stage
          </label>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-lg border border-brand-black/10 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="ALL">All Stages</option>
            {Object.entries(STAGE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-brand-black/60 block mb-2">
            Payment Status
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-brand-black/10 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Awaiting">Awaiting</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredDeals.length === 0 ? (
        <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-12 text-center">
          <p className="text-brand-black/60">No deals found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-black/10">
          <table className="w-full text-sm">
            <thead className="bg-brand-linen/50 border-b border-brand-black/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.3em] font-semibold text-brand-red">
                  Brand
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.3em] font-semibold text-brand-red">
                  Stage
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.3em] font-semibold text-brand-red">
                  Value
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.3em] font-semibold text-brand-red">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.3em] font-semibold text-brand-red">
                  Payment Status
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.3em] font-semibold text-brand-red">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-brand-black/5 hover:bg-brand-black/3 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-brand-black">
                      {deal.brand?.name || deal.brandName || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <InlineStageEdit deal={deal} onSave={onSaveField} />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-brand-black/80">
                      {deal.value ? `£${deal.value.toLocaleString()}` : "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-brand-black/60">
                      {deal.expectedCloseDate
                        ? new Date(deal.expectedCloseDate).toLocaleDateString()
                        : "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      deal.stage === "PAYMENT_RECEIVED" || deal.stage === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : deal.stage === "PAYMENT_PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {deal.stage === "PAYMENT_RECEIVED" || deal.stage === "COMPLETED"
                        ? "Paid"
                        : deal.stage === "PAYMENT_PENDING"
                        ? "Awaiting"
                        : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditDeal(deal.id)}
                        className="p-2 rounded-lg text-brand-black/40 hover:bg-brand-black/5 hover:text-brand-black transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteDeal(deal.id)}
                        className="p-2 rounded-lg text-brand-black/40 hover:bg-brand-red/10 hover:text-brand-red transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## Integration Guide: Updating AdminTalentDetailPage.jsx

### Step 1: Import New Components

```jsx
import { TalentCommandHeader } from "../components/TalentCommandHeader";
import { HealthSnapshotCards } from "../components/HealthSnapshotCards";
import { TalentTasksOperationsPanel } from "../components/TalentTasksOperationsPanel";
import { DealTrackerTableView } from "../components/DealTrackerTableView";
```

### Step 2: Update Main Render (Simplified Structure)

```jsx
return (
  <DashboardShell
    title="Talent Management"
    navLinks={ADMIN_NAV_LINKS}
  >
    {/* TIER 1: Command Header */}
    <TalentCommandHeader
      talent={talent}
      onBack={() => navigate("/admin/talent")}
      onEdit={() => setEditModalOpen(true)}
      onQuickAction={handleQuickAction}
    />

    {/* TIER 2: Business Health Snapshot */}
    <HealthSnapshotCards
      openOpportunities={talent.snapshot?.openOpportunities || 0}
      activeDeals={(talent.deals || []).filter(d => d.stage !== "CLOSED").length}
      activeCampaigns={talent.snapshot?.activeCampaigns || 0}
      totalRevenue={talent.snapshot?.totalRevenue || 0}
      paidRevenue={talent.snapshot?.paidRevenue || 0}
      outstandingRevenue={talent.snapshot?.outstandingRevenue || 0}
      isExclusive={isExclusive}
    />

    {/* TIER 3: Functional Workspaces (Tabs) */}
    <div className="mb-6 flex flex-wrap gap-2 border-b border-brand-black/10">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.3em] transition border-t-2 ${
              isActive
                ? "border-brand-red text-brand-red"
                : "border-transparent text-brand-black/60 hover:text-brand-black"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>

    {/* Tab Content */}
    <div className="space-y-6">
      {activeTab === "overview" && (
        <OverviewTab talent={talent} isExclusive={isExclusive} />
      )}
      {activeTab === "deals" && (
        <DealTrackerTableView
          deals={talent.deals || []}
          onEditDeal={(dealId) => {/* open edit modal */}}
          onDeleteDeal={(dealId) => {/* delete deal */}}
          onSaveField={handleEditField}
        />
      )}
      {/* ... other tabs */}
      {activeTab === "tasks" && (
        <TalentTasksOperationsPanel
          tasks={talent.tasks || []}
          onTaskToggle={(taskId, status) => {/* toggle task */}}
          onTaskDelete={(taskId) => {/* delete task */}}
          onAddTask={() => {/* open add task modal */}}
        />
      )}
    </div>

    {/* Modals */}
    <LinkUserModal ... />
    <EditTalentModal ... />
  </DashboardShell>
);
```

---

## CSS Classes Reference

**Spacing:**
```css
/* Sections */
mb-12 /* 32px margin-bottom (breathing room) */
mb-8  /* 24px margin-bottom */
mb-6  /* 16px margin-bottom */

/* Padding */
p-6  /* 24px internal padding (cards) */
p-4  /* 16px internal padding */

/* Gaps */
gap-6 /* 16px gap in grids/flex */
gap-4 /* 12px gap */
```

**Typography:**
```css
font-display    /* Large headers (24px+) */
text-4xl        /* 36px (talent name) */
text-3xl        /* 30px (card values) */
text-xs         /* 12px (labels, badges) */
uppercase       /* All caps */
tracking-[0.35em] /* Stretched letter-spacing */
```

**Colors:**
```css
text-brand-red          /* Accent color */
text-brand-black        /* Primary text */
text-brand-black/60     /* Secondary text */
text-brand-black/50     /* Tertiary text */
bg-brand-white          /* Card background */
bg-brand-linen/50       /* Subtle background */
border-brand-black/10   /* Subtle borders */
bg-brand-red/5          /* Error state background */
```

**Interactions:**
```css
hover:bg-brand-black/5  /* Subtle hover highlight */
hover:text-brand-red    /* Hover text change */
transition-colors       /* Smooth color transition */
transition-all          /* Smooth all transitions */
rounded-full            /* Pill buttons */
rounded-2xl             /* Card corners */
```

---

**Status:** Code ready for implementation  
**Last updated:** January 10, 2026  
**Ready for:** Frontend engineers to integrate into main page
