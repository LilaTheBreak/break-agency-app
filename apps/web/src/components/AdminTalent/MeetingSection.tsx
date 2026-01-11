import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/apiClient.js";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader,
  ExternalLink,
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meetingType: string;
  platform: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  calendarEventId?: string;
  actionItems: ActionItem[];
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: "open" | "completed" | "cancelled";
  linkedTaskId?: string;
}

export function MeetingSection({ talentId }: { talentId: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meetingType: "Internal",
    platform: "In-Person",
    meetingLink: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  // Fetch meetings on mount
  useEffect(() => {
    fetchMeetings();
  }, [talentId]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/talent/${talentId}/meetings`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      } else {
        toast.error("Failed to fetch meetings");
      }
    } catch (err) {
      toast.error("Error fetching meetings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startTime) {
      toast.error("Title and start time are required");
      return;
    }

    try {
      setLoading(true);

      const endpoint = editingMeeting
        ? `/api/meetings/${editingMeeting.id}`
        : `/api/talent/${talentId}/meetings`;

      const method = editingMeeting ? "PUT" : "POST";

      const response = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingMeeting ? "Meeting updated" : "Meeting created");
        setShowForm(false);
        setEditingMeeting(null);
        setFormData({
          title: "",
          description: "",
          meetingType: "Internal",
          platform: "In-Person",
          meetingLink: "",
          startTime: "",
          endTime: "",
          notes: "",
        });
        await fetchMeetings();
      } else {
        toast.error("Failed to save meeting");
      }
    } catch (err) {
      toast.error("Error saving meeting");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!window.confirm("Delete this meeting? This cannot be undone.")) return;

    try {
      const response = await apiFetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Meeting deleted");
        await fetchMeetings();
      } else {
        toast.error("Failed to delete meeting");
      }
    } catch (err) {
      toast.error("Error deleting meeting");
      console.error(err);
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description || "",
      meetingType: meeting.meetingType,
      platform: meeting.platform,
      meetingLink: meeting.meetingLink || "",
      startTime: meeting.startTime,
      endTime: meeting.endTime || "",
      notes: meeting.notes || "",
    });
    setShowForm(true);
  };

  const handleAddActionItem = async (meetingId: string) => {
    const title = window.prompt("Action item title:");
    if (!title) return;

    try {
      const response = await apiFetch(`/api/meetings/${meetingId}/action-items`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        toast.success("Action item added");
        await fetchMeetings();
      } else {
        toast.error("Failed to add action item");
      }
    } catch (err) {
      toast.error("Error adding action item");
      console.error(err);
    }
  };

  const handleAddToTasks = async (actionItemId: string) => {
    try {
      const response = await apiFetch(`/api/action-items/${actionItemId}/add-to-tasks`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Action item added to tasks");
        await fetchMeetings();
      } else {
        toast.error("Failed to add to tasks");
      }
    } catch (err) {
      toast.error("Error adding to tasks");
      console.error(err);
    }
  };

  const now = new Date();
  const upcomingMeetings = meetings.filter((m) => new Date(m.startTime) > now);
  const pastMeetings = meetings.filter((m) => new Date(m.startTime) <= now);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-brand-red" />
          <h3 className="text-lg font-semibold">Meetings</h3>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            {meetings.length}
          </span>
        </div>
        <button
          onClick={() => {
            setEditingMeeting(null);
            setFormData({
              title: "",
              description: "",
              meetingType: "Internal",
              platform: "In-Person",
              meetingLink: "",
              startTime: "",
              endTime: "",
              notes: "",
            });
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white hover:bg-brand-red/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Meeting
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 font-semibold">
            {editingMeeting ? "Edit Meeting" : "Create New Meeting"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="e.g., Q1 Planning Session"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Type
                </label>
                <select
                  value={formData.meetingType}
                  onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                >
                  <option value="Internal">Internal</option>
                  <option value="Talent">Talent Discussion</option>
                  <option value="Brand">Brand Meeting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                >
                  <option value="In-Person">In-Person</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
            </div>

            {formData.platform !== "In-Person" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                  placeholder="https://..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="Meeting details..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                placeholder="Meeting notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving..." : "Save Meeting"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMeeting(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meetings List */}
      {loading && !meetings.length ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-brand-red" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">No meetings yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingMeetings.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Upcoming ({upcomingMeetings.length})
              </h4>
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddActionItem={handleAddActionItem}
                    onAddToTasks={handleAddToTasks}
                  />
                ))}
              </div>
            </div>
          )}

          {pastMeetings.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Past ({pastMeetings.length})
              </h4>
              <div className="space-y-3 opacity-75">
                {pastMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddActionItem={handleAddActionItem}
                    onAddToTasks={handleAddToTasks}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: string) => void;
  onAddActionItem: (id: string) => void;
  onAddToTasks: (id: string) => void;
  isPast?: boolean;
}

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  onAddActionItem,
  onAddToTasks,
  isPast,
}: MeetingCardProps) {
  const startDate = new Date(meeting.startTime);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const openActionItems = meeting.actionItems.filter((a) => a.status === "open");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Title and Date */}
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <h5 className="font-semibold text-gray-900">{meeting.title}</h5>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                {formattedDate} at {formattedTime}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => onEdit(meeting)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(meeting.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Meeting Details */}
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {meeting.meetingType}
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
              {meeting.platform}
            </span>
            {meeting.calendarEventId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3 w-3" />
                Calendar Synced
              </span>
            )}
          </div>

          {/* Description */}
          {meeting.description && (
            <p className="mb-3 text-sm text-gray-600">{meeting.description}</p>
          )}

          {/* Meeting Link */}
          {meeting.meetingLink && (
            <div className="mb-3">
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand-red hover:underline"
              >
                Join Meeting
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Action Items */}
          {meeting.actionItems.length > 0 && (
            <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <h6 className="text-xs font-semibold text-gray-700 uppercase">
                  Action Items ({openActionItems.length}/{meeting.actionItems.length})
                </h6>
                <button
                  onClick={() => onAddActionItem(meeting.id)}
                  className="text-xs font-medium text-brand-red hover:underline"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {meeting.actionItems.map((item) => (
                  <ActionItemRow
                    key={item.id}
                    item={item}
                    onAddToTasks={() => onAddToTasks(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add Action Item Button (if no items) */}
          {meeting.actionItems.length === 0 && !isPast && (
            <button
              onClick={() => onAddActionItem(meeting.id)}
              className="inline-flex items-center gap-2 text-xs font-medium text-brand-red hover:underline mt-2"
            >
              <Plus className="h-3 w-3" />
              Add Action Item
            </button>
          )}
        </div>
      </div>

      {/* Created By */}
      <div className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-500">
        Created by {meeting.createdByUser.name}
      </div>
    </div>
  );
}

interface ActionItemRowProps {
  item: ActionItem;
  onAddToTasks: () => void;
}

function ActionItemRow({ item, onAddToTasks }: ActionItemRowProps) {
  const statusIcon =
    item.status === "completed" ? (
      <CheckCircle2 className="h-3 w-3 text-green-600" />
    ) : item.status === "cancelled" ? (
      <AlertCircle className="h-3 w-3 text-gray-400" />
    ) : (
      <Clock className="h-3 w-3 text-brand-red" />
    );

  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <div className="flex items-start gap-2 flex-1">
        {statusIcon}
        <div>
          <p
            className={`${
              item.status === "completed" ? "line-through text-gray-400" : "text-gray-900"
            }`}
          >
            {item.title}
          </p>
          {item.dueDate && (
            <p className="text-gray-500">
              Due: {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
        </div>
      </div>
      {!item.linkedTaskId && item.status === "open" && (
        <button
          onClick={onAddToTasks}
          className="whitespace-nowrap rounded bg-brand-red/10 px-2 py-0.5 font-semibold text-brand-red hover:bg-brand-red/20"
        >
          Add to Tasks
        </button>
      )}
    </div>
  );
}
