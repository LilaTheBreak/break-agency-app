import React, { useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { CONTROL_ROOM_PRESETS } from "./controlRoomPresets.js";

export function CreatorMeetingsPage({ session }) {
  const config = CONTROL_ROOM_PRESETS.talent;
  const navLinks = config.tabs || [];
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      title: "Brand Strategy Session",
      brand: "Nike",
      date: "2025-01-28",
      time: "2:00 PM",
      duration: "1 hour",
      attendees: ["Brand Manager", "You"],
      status: "confirmed",
      type: "Strategy"
    },
    {
      id: 2,
      title: "Content Review Call",
      brand: "Adidas",
      date: "2025-01-29",
      time: "10:30 AM",
      duration: "30 minutes",
      attendees: ["Content Lead", "You"],
      status: "confirmed",
      type: "Review"
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-brand-black/10 text-brand-black";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Strategy":
        return "bg-blue-100 text-blue-800";
      case "Review":
        return "bg-purple-100 text-purple-800";
      case "Negotiation":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-brand-black/10 text-brand-black";
    }
  };

  return (
    <DashboardShell
      title="Meetings"
      subtitle="Manage your meetings and calls with brands"
      role={session?.user?.role}
      navLinks={navLinks}
      session={session}
    >
      <div className="space-y-6">
        {/* Upcoming Meetings */}
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-brand-black">Upcoming Meetings</h2>
              <p className="mt-2 text-sm text-brand-black/70">
                Your scheduled calls and strategy sessions with brands
              </p>
            </div>
            <button className="rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-red/90">
              Schedule Meeting
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {meetings.length > 0 ? (
              meetings.map((meeting) => (
                <div key={meeting.id} className="rounded-xl border border-brand-black/10 bg-brand-linen/40 p-4 transition hover:border-brand-black/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-brand-black">{meeting.title}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(meeting.status)}`}>
                          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(meeting.type)}`}>
                          {meeting.type}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-brand-black/70">{meeting.brand}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-brand-black/60">
                        <span>📅 {new Date(meeting.date).toLocaleDateString()}</span>
                        <span>🕐 {meeting.time}</span>
                        <span>⏱ {meeting.duration}</span>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-brand-black/60">Attendees:</p>
                        <p className="text-sm text-brand-black">{meeting.attendees.join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button className="rounded-lg border border-brand-black/20 px-3 py-2 text-sm font-medium text-brand-black transition hover:bg-brand-black/5">
                        Join Call
                      </button>
                      <button className="rounded-lg border border-brand-black/20 px-3 py-2 text-sm font-medium text-brand-black transition hover:bg-brand-black/5">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
                <p className="text-sm font-semibold text-brand-black/70">No upcoming meetings</p>
                <p className="mt-2 text-xs text-brand-black/50">Schedule a meeting to collaborate with brands</p>
              </div>
            )}
          </div>
        </section>

        {/* Meeting Calendar Integration */}
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Calendar Integration</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Connect your calendar to automatically sync meetings with The Break platform
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { name: "Google Calendar", icon: "📅", connected: false },
              { name: "Outlook Calendar", icon: "📆", connected: false }
            ].map((calendar) => (
              <div key={calendar.name} className="rounded-xl border border-brand-black/10 bg-brand-linen/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{calendar.icon}</span>
                    <div>
                      <p className="font-medium text-brand-black">{calendar.name}</p>
                      <p className="text-xs text-brand-black/60">
                        {calendar.connected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <button className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    calendar.connected
                      ? "border border-brand-black/20 text-brand-black hover:bg-brand-black/5"
                      : "bg-brand-red text-white hover:bg-brand-red/90"
                  }`}>
                    {calendar.connected ? "Manage" : "Connect"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Meeting History */}
        <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <h2 className="text-xl font-semibold text-brand-black">Past Meetings</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Review your previous meetings and discussions
          </p>
          <div className="mt-6 rounded-xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
            <p className="text-sm font-semibold text-brand-black/70">No past meetings yet</p>
            <p className="mt-2 text-xs text-brand-black/50">Previous meetings will appear here</p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

export default CreatorMeetingsPage;
