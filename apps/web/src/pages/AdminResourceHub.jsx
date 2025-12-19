import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

const RESOURCE_TYPES = ["TEMPLATE", "GUIDE", "ARTICLE", "WEBINAR", "EVENT"];
const RESOURCE_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const RESOURCE_VISIBILITY = ["PUBLIC", "PROTECTED"];
const USER_ROLES = ["CREATOR", "EXCLUSIVE_TALENT", "BRAND", "AGENT", "FOUNDER", "ADMIN"];

export default function AdminResourceHub() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showRsvps, setShowRsvps] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    longDescription: "",
    resourceType: "GUIDE",
    uploadUrl: "",
    externalUrl: "",
    thumbnailUrl: "",
    status: "DRAFT",
    visibility: "PUBLIC",
    allowedAudiences: [],
    metadata: {},
    eventDate: "",
    eventTime: "",
    hasReplay: false,
    rsvpEnabled: false,
    rsvpOpen: true,
  });

  useEffect(() => {
    fetchResources();
  }, [filterStatus]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      
      const response = await fetch(`${API_BASE}/api/resources?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRsvps = async (resourceId) => {
    try {
      const response = await fetch(`${API_BASE}/api/resources/${resourceId}/rsvps`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch RSVPs");
      }

      const data = await response.json();
      setRsvps(data);
      setShowRsvps(resourceId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingResource
        ? `${API_BASE}/api/resources/${editingResource.id}`
        : `${API_BASE}/api/resources`;

      const method = editingResource ? "PUT" : "POST";

      const payload = {
        ...formData,
        eventDate: formData.eventDate || null,
        metadata: Object.keys(formData.metadata).length > 0 ? formData.metadata : null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save resource");
      }

      await fetchResources();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const response = await fetch(`${API_BASE}/api/resources/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }

      await fetchResources();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (file, fieldName) => {
    try {
      if (fieldName === "uploadUrl") {
        setUploadingFile(true);
      } else {
        setUploadingThumbnail(true);
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(`${API_BASE}/api/resources/upload`, {
        method: "POST",
        credentials: "include",
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        [fieldName]: data.url,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      if (fieldName === "uploadUrl") {
        setUploadingFile(false);
      } else {
        setUploadingThumbnail(false);
      }
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title || "",
      shortDescription: resource.shortDescription || "",
      longDescription: resource.longDescription || "",
      resourceType: resource.resourceType || "GUIDE",
      uploadUrl: resource.uploadUrl || "",
      externalUrl: resource.externalUrl || "",
      thumbnailUrl: resource.thumbnailUrl || "",
      status: resource.status || "DRAFT",
      visibility: resource.visibility || "PUBLIC",
      allowedAudiences: resource.allowedAudiences || [],
      metadata: resource.metadata || {},
      eventDate: resource.eventDate ? resource.eventDate.split("T")[0] : "",
      eventTime: resource.eventTime || "",
      hasReplay: resource.hasReplay || false,
      rsvpEnabled: resource.rsvpEnabled || false,
      rsvpOpen: resource.rsvpOpen !== undefined ? resource.rsvpOpen : true,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingResource(null);
    setFormData({
      title: "",
      shortDescription: "",
      longDescription: "",
      resourceType: "GUIDE",
      uploadUrl: "",
      externalUrl: "",
      thumbnailUrl: "",
      status: "DRAFT",
      visibility: "PUBLIC",
      allowedAudiences: [],
      metadata: {},
      eventDate: "",
      eventTime: "",
      hasReplay: false,
      rsvpEnabled: false,
      rsvpOpen: true,
    });
  };

  const handleAudienceToggle = (role) => {
    setFormData((prev) => ({
      ...prev,
      allowedAudiences: prev.allowedAudiences.includes(role)
        ? prev.allowedAudiences.filter((r) => r !== role)
        : [...prev.allowedAudiences, role],
    }));
  };

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return (
      <div className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="text-brand-red">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-black">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="space-y-6">
          {/* Header */}
          <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
                  Resource hub
                </p>
                <h3 className="font-display text-3xl uppercase">Manage resources</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
                className="rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-brand-red/90"
              >
                {showForm ? "Cancel" : "Add resource"}
              </button>
            </div>
            <div className="mt-6">
              <p className="text-sm text-brand-black/60">
                Resources will appear in the Resource Hub for users to access. Protected resources
                require login.
              </p>
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Resource Form */}
          {showForm && (
            <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
              <h4 className="font-display text-xl uppercase mb-6">
                {editingResource ? "Edit Resource" : "Create New Resource"}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Title <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                    required
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Short Description <span className="text-brand-red">*</span>
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, shortDescription: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                    rows="2"
                    required
                  />
                </div>

                {/* Long Description */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Long Description</label>
                  <textarea
                    value={formData.longDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, longDescription: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                    rows="4"
                  />
                </div>

                {/* Resource Type */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Resource Type <span className="text-brand-red">*</span>
                  </label>
                  <select
                    value={formData.resourceType}
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                    className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                    required
                  >
                    {RESOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload URL */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Upload File (PDF/Document)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "uploadUrl");
                      }}
                      className="w-full px-4 py-2 border border-brand-black/20 rounded-lg text-sm"
                      disabled={uploadingFile}
                    />
                    {uploadingFile && (
                      <p className="text-xs text-brand-red">Uploading...</p>
                    )}
                    {formData.uploadUrl && !uploadingFile && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <span>✓ File uploaded</span>
                        <a
                          href={formData.uploadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                    <p className="text-xs text-brand-black/60">Or enter URL manually:</p>
                    <input
                      type="url"
                      value={formData.uploadUrl}
                      onChange={(e) => setFormData({ ...formData, uploadUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* External URL */}
                <div>
                  <label className="block text-sm font-semibold mb-2">External URL</label>
                  <input
                    type="url"
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                    placeholder="https://..."
                  />
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Thumbnail/Cover Image
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "thumbnailUrl");
                      }}
                      className="w-full px-4 py-2 border border-brand-black/20 rounded-lg text-sm"
                      disabled={uploadingThumbnail}
                    />
                    {uploadingThumbnail && (
                      <p className="text-xs text-brand-red">Uploading...</p>
                    )}
                    {formData.thumbnailUrl && !uploadingThumbnail && (
                      <div className="flex items-center gap-2">
                        <img
                          src={formData.thumbnailUrl}
                          alt="Thumbnail preview"
                          className="h-20 w-20 object-cover rounded border border-brand-black/10"
                        />
                        <span className="text-xs text-green-600">✓ Image uploaded</span>
                      </div>
                    )}
                    <p className="text-xs text-brand-black/60">Or enter URL manually:</p>
                    <input
                      type="url"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Event-specific fields */}
                {(formData.resourceType === "EVENT" || formData.resourceType === "WEBINAR") && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Event Date</label>
                        <input
                          type="date"
                          value={formData.eventDate}
                          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                          className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Event Time</label>
                        <input
                          type="time"
                          value={formData.eventTime}
                          onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                          className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasReplay"
                        checked={formData.hasReplay}
                        onChange={(e) =>
                          setFormData({ ...formData, hasReplay: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <label htmlFor="hasReplay" className="text-sm">
                        Replay Available
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="rsvpEnabled"
                        checked={formData.rsvpEnabled}
                        onChange={(e) =>
                          setFormData({ ...formData, rsvpEnabled: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <label htmlFor="rsvpEnabled" className="text-sm">
                        Enable RSVP
                      </label>
                    </div>

                    {formData.rsvpEnabled && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="rsvpOpen"
                          checked={formData.rsvpOpen}
                          onChange={(e) =>
                            setFormData({ ...formData, rsvpOpen: e.target.checked })
                          }
                          className="h-4 w-4"
                        />
                        <label htmlFor="rsvpOpen" className="text-sm">
                          RSVP Open
                        </label>
                      </div>
                    )}
                  </>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                  >
                    {RESOURCE_STATUS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full px-4 py-2 border border-brand-black/20 rounded-lg"
                  >
                    {RESOURCE_VISIBILITY.map((vis) => (
                      <option key={vis} value={vis}>
                        {vis}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Allowed Audiences */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Allowed Audiences (leave empty for all)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {USER_ROLES.map((role) => (
                      <div key={role} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`audience-${role}`}
                          checked={formData.allowedAudiences.includes(role)}
                          onChange={() => handleAudienceToggle(role)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`audience-${role}`} className="text-sm">
                          {role}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-brand-red/90"
                  >
                    {editingResource ? "Update Resource" : "Create Resource"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="rounded-full border border-brand-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:bg-brand-black/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Filter */}
          <div className="flex gap-2">
            {["all", "DRAFT", "PUBLISHED", "ARCHIVED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                  filterStatus === status
                    ? "bg-brand-red text-white"
                    : "bg-brand-white border border-brand-black/10 text-brand-black hover:bg-brand-black/5"
                }`}
              >
                {status === "all" ? "All" : status}
              </button>
            ))}
          </div>

          {/* Resources List */}
          <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
            <h4 className="font-display text-xl uppercase mb-6">Resources</h4>
            {loading ? (
              <p className="text-sm text-brand-black/60">Loading resources...</p>
            ) : resources.length === 0 ? (
              <p className="text-sm text-brand-black/60">
                No resources found. Create your first resource to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="border border-brand-black/10 rounded-lg p-4 hover:bg-brand-ivory/50 transition"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-semibold">{resource.title}</h5>
                          <span className="px-2 py-1 rounded text-xs bg-brand-red/10 text-brand-red font-semibold">
                            {resource.resourceType}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              resource.status === "PUBLISHED"
                                ? "bg-green-100 text-green-700"
                                : resource.status === "DRAFT"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {resource.status}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-brand-black/5 text-brand-black font-semibold">
                            {resource.visibility}
                          </span>
                        </div>
                        <p className="text-sm text-brand-black/70 mb-2">
                          {resource.shortDescription}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-brand-black/60">
                          <span>Views: {resource.viewCount}</span>
                          {resource.rsvpEnabled && (
                            <span>
                              RSVPs: {resource.rsvpCount}{" "}
                              {resource.rsvpCount > 0 && (
                                <button
                                  onClick={() => fetchRsvps(resource.id)}
                                  className="text-brand-red underline ml-1"
                                >
                                  View
                                </button>
                              )}
                            </span>
                          )}
                          {resource.allowedAudiences.length > 0 && (
                            <span>Audiences: {resource.allowedAudiences.join(", ")}</span>
                          )}
                          {resource.eventDate && (
                            <span>
                              Event: {new Date(resource.eventDate).toLocaleDateString()}
                              {resource.eventTime && ` at ${resource.eventTime}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(resource)}
                          className="px-3 py-1 text-xs font-semibold text-brand-black border border-brand-black/20 rounded hover:bg-brand-black/5 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="px-3 py-1 text-xs font-semibold text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RSVP Modal */}
          {showRsvps && (
            <div className="fixed inset-0 bg-brand-black/50 flex items-center justify-center z-50">
              <div className="bg-brand-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-display text-xl uppercase">RSVPs</h4>
                  <button
                    onClick={() => {
                      setShowRsvps(null);
                      setRsvps([]);
                    }}
                    className="text-brand-black/60 hover:text-brand-black"
                  >
                    ✕
                  </button>
                </div>
                {rsvps.length === 0 ? (
                  <p className="text-sm text-brand-black/60">No RSVPs yet.</p>
                ) : (
                  <div className="space-y-2">
                    {rsvps.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="border border-brand-black/10 rounded p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold">{rsvp.User.name || rsvp.User.email}</p>
                          <p className="text-xs text-brand-black/60">
                            {rsvp.User.role} • {new Date(rsvp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            rsvp.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {rsvp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
