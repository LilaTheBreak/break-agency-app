/**
 * Utility functions for Exclusive Talent Overview page
 * Handles dynamic ordering, priority logic, and intelligent presentation
 */

/**
 * Determines section priority based on context and upcoming events
 * Returns sections in order of importance for "today"
 */
export function calculateSectionPriority(data) {
  const sections = [];
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Check for urgent events (within 24 hours)
  const urgentEvents = (data.events || []).filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= now && eventDate <= tomorrow && event.status !== "declined";
  });

  // Check for overdue or due-today tasks
  const urgentTasks = (data.tasks || []).filter(task => {
    if (task.completed) return false;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    return dueDate && dueDate <= tomorrow;
  });

  // Check for pending decisions on opportunities
  const pendingDecisions = (data.opportunities || []).filter(
    opp => opp.status === "pending_response" || opp.awaitingYourInput
  );

  // Check for events needing response
  const eventsNeedingResponse = (data.events || []).filter(
    event => event.status === "pending_invite" || event.status === "suggested"
  );

  // Priority 1: Urgent events (happening tomorrow)
  if (urgentEvents.length > 0) {
    sections.push({
      id: "events",
      priority: 1,
      reason: `Event${urgentEvents.length > 1 ? "s" : ""} tomorrow`,
      highlight: true
    });
  }

  // Priority 2: Tasks due today/overdue
  if (urgentTasks.length > 0) {
    sections.push({
      id: "tasks",
      priority: 2,
      reason: `${urgentTasks.length} task${urgentTasks.length > 1 ? "s" : ""} due`,
      highlight: true
    });
  }

  // Priority 3: Pending decisions
  if (pendingDecisions.length > 0) {
    sections.push({
      id: "opportunities",
      priority: 3,
      reason: "Awaiting your input",
      highlight: true
    });
  }

  // Priority 4: Events needing response
  if (eventsNeedingResponse.length > 0) {
    sections.push({
      id: "events",
      priority: 4,
      reason: "Invites to review"
    });
  }

  // Priority 5: Active projects (always show)
  if ((data.projects || []).length > 0) {
    sections.push({
      id: "projects",
      priority: 5,
      reason: "In progress"
    });
  }

  // Priority 6: Calendar preview (if events within 7 days)
  const upcomingEvents = (data.calendar || []).filter(item => {
    const date = new Date(item.date);
    return date >= now && date <= nextWeek;
  });
  if (upcomingEvents.length > 0) {
    sections.push({
      id: "calendar",
      priority: 6,
      reason: "This week"
    });
  }

  // Priority 7: Insights (always show if available)
  if ((data.insights || []).length > 0) {
    sections.push({
      id: "insights",
      priority: 7,
      reason: "Performance themes"
    });
  }

  // Priority 8: Revenue (always show but low priority)
  if (data.revenue) {
    sections.push({
      id: "revenue",
      priority: 8,
      reason: "Overview"
    });
  }

  // Priority 9: AI Assistant (always show)
  sections.push({
    id: "ai-assistant",
    priority: 9,
    reason: "Creative support"
  });

  // Priority 10: Goals (show if set)
  if (data.goals) {
    sections.push({
      id: "goals",
      priority: 10,
      reason: "Progress"
    });
  }

  return sections.sort((a, b) => a.priority - b.priority);
}

/**
 * Determines what to show in "What matters today" section
 */
export function getTodaysFocus(data) {
  const focus = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Events today
  const todayEvents = (data.events || []).filter(event => {
    const eventDate = new Date(event.date);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    return eventDay.getTime() === today.getTime();
  });

  if (todayEvents.length > 0) {
    focus.push({
      type: "event",
      label: todayEvents.length === 1 ? todayEvents[0].title : `${todayEvents.length} events today`,
      action: "Prepare",
      priority: "high"
    });
  }

  // Tasks due today
  const dueTasks = (data.tasks || []).filter(task => {
    if (task.completed) return false;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    if (!dueDate) return false;
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    return dueDay.getTime() === today.getTime();
  });

  if (dueTasks.length > 0) {
    focus.push({
      type: "task",
      label: dueTasks.length === 1 ? dueTasks[0].title : `${dueTasks.length} tasks due`,
      action: "Complete",
      priority: "high"
    });
  }

  // Pending responses
  const pendingResponses = (data.opportunities || []).filter(
    opp => opp.awaitingYourInput
  );

  if (pendingResponses.length > 0 && focus.length < 3) {
    focus.push({
      type: "decision",
      label: `${pendingResponses.length} decision${pendingResponses.length > 1 ? "s" : ""} needed`,
      action: "Review",
      priority: "medium"
    });
  }

  // If nothing urgent, suggest creative focus
  if (focus.length === 0) {
    focus.push({
      type: "suggestion",
      label: "Pick one piece of content to ship",
      action: "Create",
      priority: "low"
    });
    focus.push({
      type: "wellness",
      label: "Protect your recovery window",
      action: "Rest",
      priority: "low"
    });
  }

  return focus.slice(0, 3); // Max 3 items
}

/**
 * Gets appropriate empty state message for a section
 */
export function getEmptyStateMessage(sectionId, context = {}) {
  const messages = {
    projects: {
      title: "No active projects right now",
      description: "Your agent will add you to projects as they come in.",
      action: null
    },
    opportunities: {
      title: "No opportunities pending",
      description: "New briefs and invites will appear here when available.",
      action: null
    },
    tasks: {
      title: "Nothing on your plate",
      description: "Enjoy the clear space — we'll notify you when something needs attention.",
      action: null
    },
    events: {
      title: "No upcoming events",
      description: "Event invites and calendar items will show here.",
      action: null
    },
    insights: {
      title: "Building insights",
      description: "We're analyzing your performance. Check back soon for themes and patterns.",
      action: null
    },
    socials: {
      title: "Connect your accounts",
      description: "Link Instagram, TikTok, and YouTube to see performance insights.",
      action: { label: "Connect socials", to: "/exclusive/socials" }
    },
    goals: {
      title: "Set your goals",
      description: "Define what success looks like for you — creative, commercial, or both.",
      action: { label: "Set goals", to: "/exclusive/goals" }
    }
  };

  const message =
    messages[sectionId] || {
    title: "Nothing here yet",
    description: "This section will populate as you use the platform.",
    action: null
  };

  if (context?.basePath && message?.action?.to?.startsWith("/exclusive")) {
    const suffix = message.action.to.slice("/exclusive".length);
    return {
      ...message,
      action: {
        ...message.action,
        to: `${context.basePath}${suffix}`
      }
    };
  }

  return message;
}

/**
 * Formats revenue numbers for display (rounded, no anxiety)
 */
export function formatRevenue(value, currency = "GBP") {
  if (!value) return "—";
  
  const symbols = { GBP: "£", USD: "$", EUR: "€" };
  const symbol = symbols[currency] || currency;
  
  // Round to nearest 1K for amounts over 10K
  if (value >= 10000) {
    const rounded = Math.round(value / 1000) * 1000;
    return `${symbol}${(rounded / 1000).toFixed(0)}K`;
  }
  
  // Round to nearest 100 for amounts under 10K
  const rounded = Math.round(value / 100) * 100;
  return `${symbol}${(rounded / 1000).toFixed(1)}K`;
}

/**
 * Determines if a section should be collapsed (no data, no action needed)
 */
export function shouldCollapseSection(sectionId, data) {
  const collapsible = {
    tasks: () => (data.tasks || []).filter(t => !t.completed).length === 0,
    opportunities: () => (data.opportunities || []).filter(o => o.awaitingYourInput).length === 0,
    events: () => {
      const pending = (data.events || []).filter(
        e => e.status === "pending_invite" || e.status === "suggested"
      );
      return pending.length === 0;
    }
  };

  return collapsible[sectionId] ? collapsible[sectionId]() : false;
}

/**
 * Gets the current focus cycle label (time-of-day based)
 */
export function getFocusCycleLabel() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return "Morning focus";
  if (hour >= 12 && hour < 17) return "Afternoon momentum";
  if (hour >= 17 && hour < 22) return "Evening wind-down";
  return "Rest window";
}

/**
 * Formats dates for display in a creator-friendly way
 */
export function formatCreatorDate(date) {
  if (!date) return "";
  
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  if (dateDay.getTime() === today.getTime()) return "Today";
  if (dateDay.getTime() === tomorrow.getTime()) return "Tomorrow";
  
  const daysUntil = Math.round((dateDay - today) / (1000 * 60 * 60 * 24));
  if (daysUntil > 0 && daysUntil <= 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Determines action signal (primary, secondary, info-only)
 */
export function getActionSignal(item, type) {
  const signals = {
    event: {
      pending_invite: "primary", // Accept/Decline needed
      suggested: "primary", // Accept/Decline needed
      confirmed: "info", // Just information
      declined: "hidden" // Don't show
    },
    opportunity: {
      pending_response: "primary", // Your input needed
      in_progress: "secondary", // Optional actions
      completed: "info" // Just information
    },
    task: {
      pending: "primary", // Needs completion
      in_progress: "secondary", // Optional updates
      completed: "info" // Just information
    }
  };

  return signals[type]?.[item.status] || "secondary";
}
