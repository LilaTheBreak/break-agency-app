import React, { useState } from "react";

export function ResourceManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Template",
    audience: "Brands",
    protected: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create resource");
      }

      // Reset form and close
      setFormData({
        title: "",
        description: "",
        type: "Template",
        audience: "Brands",
        protected: false,
      });
      setIsFormOpen(false);
      
      alert("Resource created successfully!");
    } catch (error) {
      console.error("Error creating resource:", error);
      alert("Failed to create resource. Please try again.");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <section className="section-wrapper elevation-1 p-6 transition-elevation hover:elevation-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Resource hub</p>
          <h3 className="font-display text-3xl uppercase">Manage resources</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-brand-red/90"
        >
          {isFormOpen ? "Cancel" : "Add resource"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 card p-6 transition-elevation">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-brand-black">
              Resource title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-brand-black/20 bg-white px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              placeholder="e.g., AI-Native Brief Builder"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-semibold text-brand-black">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-brand-black/20 bg-white px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              placeholder="Brief description of the resource..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="type" className="mb-2 block text-sm font-semibold text-brand-black">
                Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-brand-black/20 bg-white px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              >
                <option value="Template">Template</option>
                <option value="Guide">Guide</option>
                <option value="Playbook">Playbook</option>
                <option value="Legal">Legal</option>
                <option value="Brief">Brief</option>
              </select>
            </div>

            <div>
              <label htmlFor="audience" className="mb-2 block text-sm font-semibold text-brand-black">
                Audience *
              </label>
              <select
                id="audience"
                name="audience"
                required
                value={formData.audience}
                onChange={handleChange}
                className="w-full rounded-lg border border-brand-black/20 bg-white px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              >
                <option value="Brands">Brands</option>
                <option value="Creators">Creators</option>
                <option value="Admins">Admins</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="protected"
              name="protected"
              checked={formData.protected}
              onChange={handleChange}
              className="h-4 w-4 rounded border-brand-black/20 text-brand-red focus:ring-brand-red"
            />
            <label htmlFor="protected" className="text-sm text-brand-black">
              Require login to access (protected resource)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-brand-red/90"
            >
              Create resource
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-full border border-brand-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:bg-brand-black/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <p className="text-sm text-brand-black/60">
          Resources will appear in the Resource Hub for users to access. Protected resources require login.
        </p>
      </div>
    </section>
  );
}
