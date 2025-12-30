import React, { useMemo, useState, useEffect } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { Badge } from "../components/Badge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { 
  getCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent,
  deleteCalendarEvent,
  syncGoogleCalendar 
} from "../services/calendarClient.js";

const CAL_PROVIDERS = [
  { id: "google", label: "Google Calendar" },
  { id: "microsoft", label: "Microsoft 365 / Outlook" },
  { id: "apple", label: "Apple Calendar" },
  { id: "ical", label: "Generic iCal feed" }
];

const STATUS_OPTIONS = ["Awaiting response", "Accepted", "Tentative", "Declined"];

// Import MEETING_SUMMARIES from constants to ensure it's available globally
import { MEETING_SUMMARIES } from "../constants/meetingSummaries.js";

// Ensure MEETING_SUMMARIES is available globally as fallback
if (typeof window !== "undefined" && !window.MEETING_SUMMARIES) {
  window.MEETING_SUMMARIES = MEETING_SUMMARIES;
}
const TYPE_FILTERS = [
  { id: "content", label: "Content calendar" },
  { id: "meeting", label: "Meetings" },
  { id: "event", label: "Events" }
];
const DEFAULT_TYPE_ID = TYPE_FILTERS[0].id;
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCalendarMatrix(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const startDay = (start.getDay() + 6) % 7; // convert Sunday=0 -> 6
  const totalDays = end.getDate();
  const weeks = [];
  let currentWeek = new Array(7).fill(null);
  // Fill leading blanks
  for (let i = 0; i < startDay; i++) currentWeek[i] = null;
  for (let day = 1; day <= totalDays; day++) {
    const index = (startDay + day - 1) % 7;
    currentWeek[index] = {
      day,
      iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    };
    if (index === 6 || day === totalDays) {
      weeks.push(currentWeek);
      currentWeek = new Array(7).fill(null);
    }
  }
  return weeks;
}

export function CalendarBoard({
  headingTitle = "Calendar & Meetings",
  headingSubtitle = "Sync calendars, respond to invites, and review meeting actions."
}) {
  const { user, hasRole } = useAuth();
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true); // Track if user has calendar access
  const [syncing, setSyncing] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState({
    google: false,
    microsoft: false,
    apple: false,
    ical: false
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const [formState, setFormState] = useState({
    title: "",
    date: "",
    time: "",
    brand: "",
    status: STATUS_OPTIONS[0],
    category: DEFAULT_TYPE_ID,
    notes: "",
    confirmed: false
  });
  const [activeTypes, setActiveTypes] = useState(
    TYPE_FILTERS.reduce((acc, filter) => {
      acc[filter.id] = true;
      return acc;
    }, {})
  );
  const [showEmailEvents, setShowEmailEvents] = useState(false);

  // Load calendar events from API
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Role-aware gating: Check if user has calendar access
      // For now, allow all authenticated users (backend will enforce permissions)
      // If specific roles are required, add: if (!hasRole('ADMIN', 'SUPERADMIN', 'CREATOR')) { ... }
      
      const response = await getCalendarEvents();
      
      // Handle different response statuses
      if (response.status === 403) {
        // Expected: User doesn't have calendar access for their role
        setHasAccess(false);
        setEvents([]);
        return;
      }
      
      if (response.status === 404) {
        // Calendar not available yet
        setEvents([]);
        return;
      }
      
      if (!response.success) {
        // Unexpected error (500, etc.) - log it
        console.error("Calendar temporarily unavailable:", response.error);
        setEvents([]);
        return;
      }
      
      // Success: user has access
      setHasAccess(true);
      
      if (response.success && response.data?.events) {
        // Transform API events to match component format
        const transformedEvents = response.data.events.map(event => ({
          id: event.id,
          title: event.title,
          date: event.startAt.split('T')[0], // Extract date from ISO string
          time: event.startAt.split('T')[1]?.substring(0, 5), // Extract HH:mm
          brand: event.metadata?.brand || "",
          status: event.metadata?.status || event.status || "Accepted",
          category: event.type || event.metadata?.category || DEFAULT_TYPE_ID,
          notes: event.description || "",
          confirmed: event.status === "scheduled",
          source: event.source,
          location: event.location,
          isAllDay: event.isAllDay,
          createdBy: event.createdBy,
          relatedBrandIds: event.relatedBrandIds || [],
          relatedCreatorIds: event.relatedCreatorIds || [],
          relatedDealIds: event.relatedDealIds || [],
          relatedCampaignIds: event.relatedCampaignIds || [],
        }));
        setEvents(transformedEvents);
        
        // Check if Google Calendar is connected
        const hasGoogleEvents = transformedEvents.some(e => e.source === 'google');
        if (hasGoogleEvents) {
          setConnectedProviders(prev => ({ ...prev, google: true }));
        }
      }
    } catch (error) {
      // Catch any unexpected errors (network issues, etc.)
      console.error("Unexpected error loading calendar:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    try {
      setSyncing(true);
      const response = await syncGoogleCalendar();
      if (response.success) {
        await loadEvents(); // Reload events after sync
        alert("Google Calendar synced successfully!");
      }
    } catch (error) {
      console.error("Failed to sync Google Calendar:", error);
      alert(error.message || "Failed to sync Google Calendar. Please ensure you've granted calendar permissions.");
    } finally {
      setSyncing(false);
    }
  };

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const typeLabelMap = useMemo(
    () =>
      TYPE_FILTERS.reduce((acc, filter) => {
        acc[filter.id] = filter.label;
        return acc;
      }, {}),
    []
  );

  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const calendarWeeks = useMemo(() => getCalendarMatrix(currentMonth), [currentMonth]);
  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const typeOk = activeTypes[event.category || DEFAULT_TYPE_ID];
        const emailOk = showEmailEvents ? event.source === "email" : true;
        return typeOk && emailOk;
      }),
    [events, activeTypes, showEmailEvents]
  );
  const scheduledEvents = useMemo(
    () => filteredEvents.filter((event) => event.confirmed),
    [filteredEvents]
  );
  const eventsByDate = useMemo(() => {
    return scheduledEvents.reduce((acc, event) => {
      if (!event.date) return acc;
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [scheduledEvents]);
  const sortedFilteredEvents = useMemo(
    () =>
      [...filteredEvents].sort((a, b) => {
        const aDate = new Date(`${a.date}T${a.time || "00:00"}`);
        const bDate = new Date(`${b.date}T${b.time || "00:00"}`);
        return aDate.getTime() - bDate.getTime();
      }),
    [filteredEvents]
  );
  const clashWarnings = useMemo(() => {
    const warnings = [];
    const map = scheduledEvents.reduce((acc, event) => {
      if (!event.date) return acc;
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
    Object.entries(map).forEach(([date, eventsForDay]) => {
      if (eventsForDay.length < 2) return;
      const combos = [];
      const sorted = [...eventsForDay].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      const toMinutes = (time) => {
        if (!time) return null;
        const [h, m] = time.split(":").map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return h * 60 + m;
      };
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const first = sorted[i];
          const second = sorted[j];
          const t1 = toMinutes(first.time);
          const t2 = toMinutes(second.time);
          if (t1 === null || t2 === null || Math.abs(t1 - t2) <= 60) {
            combos.push([first, second]);
          }
        }
      }
      if (combos.length) {
        warnings.push({ date, combos });
      }
    });
    return warnings;
  }, [scheduledEvents]);

  const toggleProvider = (id) => {
    setConnectedProviders((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleRsvp = (eventId, response) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        if (response === "Accept") {
          return {
            ...event,
            status: "Accepted",
            confirmed: true
          };
        }
        if (response === "Decline") {
          return {
            ...event,
            status: "Declined",
            confirmed: false
          };
        }
        return event;
      })
    );
  };

  const formatEventDate = (event) => {
    if (!event.date) return "";
    const composed = `${event.date}${event.time ? `T${event.time}` : ""}`;
    const parsed = new Date(composed);
    if (Number.isNaN(parsed.getTime())) return `${event.date}${event.time ? `, ${event.time}` : ""}`;
    return parsed.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const formatDateLabel = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-").map(Number);
    if ([year, month, day].some((value) => Number.isNaN(value))) return isoDate;
    const parsed = new Date(year, month - 1, day);
    return parsed.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  const openModal = (event = null, defaultDate = "") => {
    if (event) {
      setActiveEventId(event.id);
      setFormState({
        title: event.title,
        date: event.date,
        time: event.time || "",
        brand: event.brand,
        status: event.status,
        category: event.category || DEFAULT_TYPE_ID,
        notes: event.notes || "",
        confirmed: Boolean(event.confirmed)
      });
    } else {
      setActiveEventId(null);
      setFormState({
        title: "",
        date: defaultDate || "",
        time: "",
        brand: "",
        status: STATUS_OPTIONS[0],
        category: DEFAULT_TYPE_ID,
        notes: "",
        confirmed: false
      });
    }
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEvent = async (event) => {
    event.preventDefault();
    if (!formState.title || !formState.date) {
      alert("Title and date are required.");
      return;
    }
    
    try {
      const startTime = `${formState.date}T${formState.time || '00:00'}:00.000Z`;
      const endTime = `${formState.date}T${formState.time ? 
        String(Number(formState.time.split(':')[0]) + 1).padStart(2, '0') + ':' + formState.time.split(':')[1] 
        : '01:00'}:00.000Z`;
      
      const payload = {
        title: formState.title,
        startTime,
        endTime,
        description: formState.notes,
        type: formState.category,
        metadata: {
          brand: formState.brand,
          status: formState.status,
          category: formState.category,
          confirmed: formState.confirmed,
        }
      };

      if (activeEventId) {
        // Update existing event
        await updateCalendarEvent(activeEventId, payload);
      } else {
        // Create new event
        await createCalendarEvent(payload);
      }
      
      // Reload events after creation/update
      await loadEvents();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("Failed to save event. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteCalendarEvent(eventId);
      await loadEvents(); // Reload events after deletion
      if (activeEventId === eventId) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    }
  };

  const handleTypeToggle = (id) => {
    setActiveTypes((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleResetFilters = () => {
    setActiveTypes(
      TYPE_FILTERS.reduce((acc, filter) => {
        acc[filter.id] = true;
        return acc;
      }, {})
    );
  };

  const shiftMonth = (offset) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleMonthSelect = (event) => {
    const newMonth = Number(event.target.value);
    setCurrentMonth((prev) => new Date(prev.getFullYear(), newMonth, 1));
  };

  const handleYearSelect = (event) => {
    const newYear = Number(event.target.value);
    setCurrentMonth((prev) => new Date(newYear, prev.getMonth(), 1));
  };

  const monthOptions = Array.from({ length: 12 }, (_, idx) => ({
    value: idx,
    label: new Date(0, idx, 1).toLocaleString(undefined, { month: "long" })
  }));
  const yearBase = today.getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, idx) => yearBase - 2 + idx);

  return (
    <>
      {/* Show restricted access message if user doesn't have permission */}
      {!loading && !hasAccess && (
        <div className="mb-6 rounded-3xl border border-brand-black/10 bg-brand-linen/30 p-8 text-center">
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red mb-2">Calendar Access</p>
          <h3 className="font-display text-xl uppercase mb-2">Calendar events are not available for your role yet</h3>
          <p className="text-sm text-brand-black/60">
            Your current role ({user?.role || 'Unknown'}) does not have access to calendar events.
          </p>
        </div>
      )}

      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Calendar view</p>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h3 className="font-display text-2xl uppercase">{headingTitle}</h3>
                <p className="text-sm text-brand-black/60">{headingSubtitle}</p>
                <p className="text-xs text-brand-black/40">Viewing {monthLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-brand-black/80">
              <label className="uppercase tracking-[0.35em] text-xs">Month</label>
              <select
                className="rounded-2xl border border-brand-black/10 px-3 py-1 text-sm"
                value={currentMonth.getMonth()}
                onChange={handleMonthSelect}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-brand-black/80">
              <label className="uppercase tracking-[0.35em] text-xs">Year</label>
              <select
                className="rounded-2xl border border-brand-black/10 px-3 py-1 text-sm"
                value={currentMonth.getFullYear()}
                onChange={handleYearSelect}
              >
                {yearOptions.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-base text-brand-black/60">Today • {today.toDateString()}</div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-6">
          <div className="grid grid-cols-7 text-center text-sm font-semibold uppercase tracking-[0.3em] text-brand-black/60">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            {calendarWeeks.map((week, index) => (
              <div key={index} className="grid grid-cols-7 gap-3">
                {week.map((value, idx) => {
                  const isToday = value && value.iso === todayIso;
                  const dayEvents = value ? eventsByDate[value.iso] : null;
                  return (
                    <button
                      type="button"
                      key={`${index}-${idx}`}
                      disabled={!value}
                      onClick={() => value && openModal(null, value.iso)}
                      title={dayEvents && dayEvents.length > 0 ? dayEvents.map((evt) => evt.title).join(", ") : undefined}
                      className={`flex min-h-[120px] flex-col rounded-2xl border bg-white/80 p-4 text-left text-sm transition ${
                        value
                          ? "border-brand-black/10 hover:border-brand-red hover:bg-brand-white"
                          : "border-transparent bg-transparent cursor-default"
                      } ${isToday ? "border-brand-red text-brand-black" : "text-brand-black/70"}`}
                    >
                      <span className="text-xl font-semibold leading-none">{value ? value.day : ""}</span>
                      {dayEvents && dayEvents.length > 0 && (
                        <span className="mt-auto text-xs text-brand-black">
                          {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {clashWarnings.length > 0 && (
        <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Potential clashes</p>
              <h3 className="font-display text-2xl uppercase">Review overlaps</h3>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-black/60">{clashWarnings.length} flagged</p>
          </div>
          <div className="mt-4 space-y-3">
            {clashWarnings.map((warning) => (
              <article key={warning.date} className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <p className="text-sm font-semibold text-brand-black">{formatDateLabel(warning.date)}</p>
                <p className="text-xs text-brand-black/60">Multiple confirmed items detected.</p>
                <ul className="mt-2 space-y-2 text-sm text-brand-black/80">
                  {warning.combos.map((pair, index) => (
                    <li key={`${warning.date}-${index}`} className="flex flex-col rounded-xl border border-brand-black/10 bg-white/70 p-3">
                      <span className="font-semibold">{pair[0].title}</span>
                      <span className="text-xs text-brand-black/60">{formatEventDate(pair[0])}</span>
                      <span className="mt-2 font-semibold">{pair[1].title}</span>
                      <span className="text-xs text-brand-black/60">{formatEventDate(pair[1])}</span>
                      <span className="mt-2 text-xs uppercase tracking-[0.3em] text-brand-red">Requires attention</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Filters</p>
            <h3 className="font-display text-2xl uppercase">Event types</h3>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
          >
            Show all
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-brand-black">
            <input
              type="checkbox"
              checked={showEmailEvents}
              onChange={(e) => setShowEmailEvents(e.target.checked)}
              className="h-4 w-4 rounded border-brand-black/30"
            />
            Show events linked to email
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {TYPE_FILTERS.map((filter) => {
            const active = activeTypes[filter.id];
            return (
              <button
                type="button"
                key={filter.id}
                onClick={() => handleTypeToggle(filter.id)}
                className={`rounded-full border px-4 py-1 text-xs uppercase tracking-[0.3em] ${
                  active
                    ? "border-brand-red bg-brand-red text-brand-white"
                    : "border-brand-black text-brand-black"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Calendar Sync - Google Calendar Available, Others Coming Soon */}
      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Calendar sync</p>
            <h3 className="font-display text-2xl uppercase">External calendars</h3>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {/* Google Calendar - Available */}
          <div className="flex items-center justify-between rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-black">Google Calendar</p>
                <p className="text-xs text-brand-black/60">
                  {connectedProviders.google ? "Connected" : "Available to connect"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSyncGoogleCalendar}
              disabled={syncing || connectedProviders.google}
              className="rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? "Syncing..." : connectedProviders.google ? "Connected" : "Connect"}
            </button>
          </div>
          
          {/* Microsoft/Apple/iCal - Coming Soon */}
          {CAL_PROVIDERS.filter(p => p.id !== 'google').map((provider) => (
            <div key={provider.id} className="flex items-center justify-between rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 opacity-60">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-black">{provider.label}</p>
                  <p className="text-xs text-brand-black/60">Coming soon</p>
                </div>
              </div>
              <span className="rounded-full border border-brand-black/20 bg-brand-white/50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black/50">
                Not available
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-brand-black/50">
          Google Calendar sync is available now. Microsoft 365, Apple Calendar, and iCal feeds are coming soon.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Upcoming events</p>
            <h3 className="font-display text-2xl uppercase">Invites & reviews</h3>
          </div>
          <button
            onClick={() => openModal()}
            className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
          >
            Add event
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="rounded-2xl border border-dashed border-brand-black/20 bg-brand-linen/30 px-4 py-6 text-center text-sm text-brand-black/70">
              Loading calendar events...
            </p>
          ) : sortedFilteredEvents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brand-black/20 bg-brand-linen/30 px-4 py-6 text-center text-sm text-brand-black/70">
              No events match the selected filters yet.
            </p>
          ) : (
            sortedFilteredEvents.map((event) => (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              className="flex flex-col gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 md:flex-row md:items-center md:justify-between"
              onClick={() => openModal(event)}
              onKeyDown={(e) => {
                if (e.key === "Enter") openModal(event);
              }}
            >
              <div>
                <p className="font-semibold text-brand-black">{event.title}</p>
                <p className="text-sm text-brand-black/60">{formatEventDate(event)}</p>
                <p className="text-sm text-brand-black/60">{event.brand}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={event.confirmed ? "positive" : "neutral"}>
                  {event.confirmed ? "Scheduled" : "Invite"}
                </Badge>
                <Badge tone="neutral">{typeLabelMap[event.category] || typeLabelMap[DEFAULT_TYPE_ID]}</Badge>
                <Badge tone={event.status === "Accepted" ? "positive" : "neutral"}>{event.status}</Badge>
                <button
                  className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRsvp(event.id, "Accept");
                  }}
                >
                  Accept
                </button>
                <button
                  className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRsvp(event.id, "Decline");
                  }}
                >
                  Decline
                </button>
                <button
                  className="rounded-full border border-brand-black px-3 py-1 text-xs uppercase tracking-[0.3em]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(event.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </section>

      {/* Meeting Summaries - Coming Soon Notice */}
      <section className="mt-6 rounded-3xl border border-brand-black/10 bg-brand-linen/30 p-6">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Meeting summaries</p>
          <h3 className="font-display text-2xl uppercase">Auto-generated notes & tasks</h3>
          <p className="mt-2 text-sm text-brand-black/60">
            AI-powered meeting transcription and task generation is in development. For now, create tasks manually from the Tasks page.
          </p>
          <p className="mt-1 text-xs text-brand-black/40">
            Coming soon: Upload recordings, get instant transcripts, and auto-generate actionable tasks.
          </p>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-black/30" onClick={handleModalClose} />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-brand-black/10 bg-brand-white p-6">
            <h4 className="font-display text-xl uppercase">
              {activeEventId ? "Edit event" : "Add event"}
            </h4>
            <form className="mt-4 space-y-4" onSubmit={handleSaveEvent}>
              <div>
                <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">Title</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-2xl border border-brand-black/10 px-3 py-2"
                  value={formState.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">Date</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-2xl border border-brand-black/10 px-3 py-2"
                    value={formState.date}
                    onChange={(e) => handleFormChange("date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">Time</label>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-2xl border border-brand-black/10 px-3 py-2"
                    value={formState.time}
                    onChange={(e) => handleFormChange("time", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">Brand</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-2xl border border-brand-black/10 px-3 py-2"
                    value={formState.brand}
                    onChange={(e) => handleFormChange("brand", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">Status</label>
                  <select
                    className="mt-1 w-full rounded-2xl border border-brand-black/10 px-3 py-2"
                    value={formState.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                    </select>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">Event type</label>
                <select
                  className="mt-1 w-full rounded-2xl border border-brand-black/10 px-3 py-2"
                  value={formState.category}
                  onChange={(e) => handleFormChange("category", e.target.value)}
                >
                  {TYPE_FILTERS.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.35em] text-brand-black/60">Notes</label>
                <textarea
                  className="mt-1 w-full rounded-2xl border border-brand-black/10 px-3 py-2"
                  rows={3}
                  value={formState.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-brand-black/60">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-brand-black/40"
                  checked={formState.confirmed}
                  onChange={(e) => handleFormChange("confirmed", e.target.checked)}
                />
                <span className="text-[11px] tracking-[0.3em] text-brand-black">Show on calendar</span>
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {activeEventId ? (
                  <button
                    type="button"
                    className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
                    onClick={() => handleDeleteEvent(activeEventId)}
                  >
                    Delete event
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-brand-black px-4 py-1 text-xs uppercase tracking-[0.3em]"
                    onClick={handleModalClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full border border-brand-red bg-brand-red px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-white"
                  >
                    Save event
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AdminCalendarPage() {
  return (
    <DashboardShell
      title="Calendar & Meetings"
      subtitle="Sync calendars, respond to invites, and review meeting actions."
      navLinks={ADMIN_NAV_LINKS}
    >
      <CalendarBoard />
    </DashboardShell>
  );
}

export default AdminCalendarPage;
