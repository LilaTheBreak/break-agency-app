import { useState, useEffect } from "react";
import { apiFetch } from "../services/apiClient.js";

function readLocalExclusiveGoals() {
  try {
    const raw = localStorage.getItem("break_exclusive_goals_v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version === 1 && parsed?.current) return parsed.current;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Hook for managing exclusive talent overview data
 * Handles loading, error states, and data freshness
 */
export function useExclusiveTalentData(session) {
  const [data, setData] = useState({
    projects: [],
    opportunities: [],
    tasks: [],
    events: [],
    calendar: [],
    insights: [],
    revenue: null,
    goals: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    if (!session?.id) return;
    
    let mounted = true;
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Check if user has completed initial setup
        const setupResponse = await apiFetch(`/exclusive/onboarding-status`, {
          signal: controller.signal,
        });
        
        if (setupResponse.ok) {
          const setupData = await setupResponse.json();
          if (mounted) {
            setIsFirstTime(!setupData.completed);
          }
        }

        // Fetch all data in parallel (non-blocking)
        const [
          projectsRes,
          opportunitiesRes,
          tasksRes,
          eventsRes,
          calendarRes,
          insightsRes,
          revenueRes,
          goalsRes,
        ] = await Promise.allSettled([
          apiFetch("/exclusive/projects", { signal: controller.signal }),
          apiFetch("/exclusive/opportunities", { signal: controller.signal }),
          apiFetch("/exclusive/tasks", { signal: controller.signal }),
          apiFetch("/exclusive/events", { signal: controller.signal }),
          apiFetch("/exclusive/calendar/preview", { signal: controller.signal }),
          apiFetch("/exclusive/insights", { signal: controller.signal }),
          apiFetch("/exclusive/revenue/summary", { signal: controller.signal }),
          apiFetch("/exclusive/goals", { signal: controller.signal }),
        ]);

        if (!mounted) return;

        // Process results with safe defaults
        const localGoals = readLocalExclusiveGoals();
        const newData = {
          projects: projectsRes.status === "fulfilled" && projectsRes.value.ok 
            ? await projectsRes.value.json() 
            : [],
          opportunities: opportunitiesRes.status === "fulfilled" && opportunitiesRes.value.ok 
            ? await opportunitiesRes.value.json() 
            : [],
          tasks: tasksRes.status === "fulfilled" && tasksRes.value.ok 
            ? await tasksRes.value.json() 
            : [],
          events: eventsRes.status === "fulfilled" && eventsRes.value.ok 
            ? await eventsRes.value.json() 
            : [],
          calendar: calendarRes.status === "fulfilled" && calendarRes.value.ok 
            ? await calendarRes.value.json() 
            : [],
          insights: insightsRes.status === "fulfilled" && insightsRes.value.ok 
            ? await insightsRes.value.json() 
            : [],
          revenue: revenueRes.status === "fulfilled" && revenueRes.value.ok 
            ? await revenueRes.value.json() 
            : null,
          goals: goalsRes.status === "fulfilled" && goalsRes.value.ok 
            ? await goalsRes.value.json() 
            : localGoals,
        };

        setData(newData);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error fetching exclusive talent data:", err);
        if (mounted) {
          setError("We're refreshing your data — check back shortly.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    // Refresh data every 2 minutes
    const interval = setInterval(fetchData, 120000);

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [session?.id]);

  return { data, loading, error, isFirstTime, refresh: () => setLoading(true) };
}

/**
 * Hook for managing event responses (accept/decline)
 */
export function useEventActions() {
  const [processing, setProcessing] = useState(null);

  const acceptEvent = async (eventId, agentNote = "") => {
    setProcessing(eventId);
    try {
      const response = await apiFetch(`/exclusive/events/${eventId}/accept`, {
        method: "POST",
        body: JSON.stringify({ agentNote }),
      });

      if (!response.ok) throw new Error("Failed to accept event");
      
      return { success: true, message: "We've let your agent know" };
    } catch (error) {
      console.error("Error accepting event:", error);
      return { success: false, message: "Please try again" };
    } finally {
      setProcessing(null);
    }
  };

  const declineEvent = async (eventId, reason = "") => {
    setProcessing(eventId);
    try {
      const response = await apiFetch(`/exclusive/events/${eventId}/decline`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error("Failed to decline event");
      
      return { success: true, message: "We've let your agent know" };
    } catch (error) {
      console.error("Error declining event:", error);
      return { success: false, message: "Please try again" };
    } finally {
      setProcessing(null);
    }
  };

  return { acceptEvent, declineEvent, processing };
}

/**
 * Hook for managing wellness check-ins
 */
export function useWellnessCheckin() {
  const [lastCheckin, setLastCheckin] = useState(null);
  const [snoozedUntil, setSnoozedUntil] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("wellness_checkin");
    if (stored) {
      const data = JSON.parse(stored);
      setLastCheckin(data.lastCheckin);
      setSnoozedUntil(data.snoozedUntil);
    }
  }, []);

  const submitCheckin = (data) => {
    const now = new Date().toISOString();
    setLastCheckin(now);
    localStorage.setItem("wellness_checkin", JSON.stringify({
      lastCheckin: now,
      snoozedUntil: null,
      data,
    }));
  };

  const snooze = (days = 7) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    setSnoozedUntil(until.toISOString());
    localStorage.setItem("wellness_checkin", JSON.stringify({
      lastCheckin,
      snoozedUntil: until.toISOString(),
    }));
  };

  const shouldShow = () => {
    if (snoozedUntil && new Date(snoozedUntil) > new Date()) {
      return false;
    }
    if (!lastCheckin) return true;
    const daysSinceLastCheckin = (new Date() - new Date(lastCheckin)) / (1000 * 60 * 60 * 24);
    return daysSinceLastCheckin >= 7;
  };

  return { submitCheckin, snooze, shouldShow: shouldShow() };
}

/**
 * Hook for managing AI assistant interactions
 */
export function useAIAssistant() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendPrompt = async (prompt, context = {}) => {
    setLoading(true);
    try {
      const response = await apiFetch("/exclusive/ai/prompt", {
        method: "POST",
        body: JSON.stringify({ prompt, context, role: "exclusive" }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const data = await response.json();
      
      setHistory(prev => [...prev, {
        prompt,
        response: data.response,
        timestamp: new Date().toISOString(),
      }]);

      return data.response;
    } catch (error) {
      console.error("Error with AI assistant:", error);
      return "I'm having trouble right now. Please try again in a moment.";
    } finally {
      setLoading(false);
    }
  };

  return { sendPrompt, history, loading };
}
