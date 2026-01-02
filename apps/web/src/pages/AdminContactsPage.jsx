import React, { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { ContactChip } from "../components/ContactChip.jsx";
import { BrandChip } from "../components/BrandChip.jsx";
import {
  fetchContacts,
  fetchBrands,
  createContact,
  updateContact,
  deleteContact,
  addContactNote as addContactNoteAPI,
} from "../services/crmClient.js";
import Button, { PrimaryButton, SecondaryButton, DangerButton, TextButton } from "../components/Button.jsx";

// Form field components (reused from AdminBrandsPage pattern)
function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
      >
        {options.map((opt) => (
          <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
            {typeof opt === "string" ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-3 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
      />
    </div>
  );
}

function Drawer({ open, title, onClose, actions, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="fixed inset-0 bg-brand-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-brand-black/10 bg-brand-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-black/10 bg-brand-white px-6 py-4">
          <h2 className="text-xl font-semibold uppercase tracking-[0.3em] text-brand-black">{title}</h2>
          <button onClick={onClose} className="text-brand-black/60 hover:text-brand-black">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-6">{children}</div>
        {actions && <div className="sticky bottom-0 border-t border-brand-black/10 bg-brand-white px-6 py-4">{actions}</div>}
      </div>
    </div>
  );
}

export function AdminContactsPage({ session }) {
  const ownerDefault = session?.name?.split(" ")?.[0] || session?.email?.split("@")?.[0]?.split(".")?.[0] || "Admin";

  const [contacts, setContacts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [editorDraft, setEditorDraft] = useState({
    brandId: "",
    firstName: "",
    lastName: "",
    role: "",
    email: "",
    phone: "",
    linkedInUrl: "",
    relationshipStatus: "New",
    preferredContactMethod: "",
    primaryContact: false,
    owner: ownerDefault,
    notes: "",
  });

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [contactsResult, brandsResult] = await Promise.all([
          fetchContacts().catch((err) => {
            console.warn("[CONTACTS] Failed to load contacts:", err.message);
            return { contacts: [] };
          }),
          fetchBrands().catch((err) => {
            console.warn("[CONTACTS] Failed to load brands:", err.message);
            return { brands: [] };
          }),
        ]);

        const contactsData = Array.isArray(contactsResult) ? contactsResult : contactsResult?.contacts || [];
        const brandsData = Array.isArray(brandsResult) ? brandsResult : brandsResult?.brands || [];

        setContacts(Array.isArray(contactsData) ? contactsData : []);
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (error) {
        console.error("[CONTACTS] Failed to load data:", error);
        setContacts([]);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Safe state
  const safeContacts = useMemo(() => {
    return Array.isArray(contacts) ? contacts : [];
  }, [contacts]);

  const safeBrands = useMemo(() => {
    return Array.isArray(brands) ? brands : [];
  }, [brands]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return safeContacts
      .filter((c) => {
        if (brandFilter !== "All" && c.crmBrandId !== brandFilter) return false;
        if (!q) return true;
        const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
        const email = (c.email || "").toLowerCase();
        const role = (c.title || "").toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q);
      })
      .sort((a, b) => {
        if (Boolean(b.primaryContact) !== Boolean(a.primaryContact)) return b.primaryContact ? 1 : -1;
        return `${a.lastName || ""} ${a.firstName || ""}`.localeCompare(`${b.lastName || ""} ${b.firstName || ""}`);
      });
  }, [safeContacts, query, brandFilter]);

  // Group by brand
  const contactsByBrand = useMemo(() => {
    const grouped = {};
    filteredContacts.forEach((contact) => {
      const brandId = contact.crmBrandId || "unknown";
      if (!grouped[brandId]) {
        const brand = safeBrands.find((b) => b.id === brandId);
        grouped[brandId] = {
          brand: brand || { id: brandId, brandName: "Unknown Brand" },
          contacts: [],
        };
      }
      grouped[brandId].contacts.push(contact);
    });
    return Object.values(grouped);
  }, [filteredContacts, safeBrands]);

  const openCreate = () => {
    setEditorMode("create");
    setSelectedContact(null);
    setEditorDraft({
      brandId: "",
      firstName: "",
      lastName: "",
      role: "",
      email: "",
      phone: "",
      linkedInUrl: "",
      relationshipStatus: "New",
      preferredContactMethod: "",
      primaryContact: false,
      owner: ownerDefault,
      notes: "",
    });
    setEditorOpen(true);
  };

  const openEdit = (contact) => {
    setEditorMode("edit");
    setSelectedContact(contact);
    setEditorDraft({
      brandId: contact.crmBrandId || "",
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      role: contact.title || "",
      email: contact.email || "",
      phone: contact.phone || "",
      linkedInUrl: contact.linkedInUrl || "",
      relationshipStatus: contact.relationshipStatus || "New",
      preferredContactMethod: contact.preferredContactMethod || "",
      primaryContact: Boolean(contact.primaryContact),
      owner: contact.owner || ownerDefault,
      notes: contact.notes || "",
    });
    setEditorOpen(true);
  };

  const openDelete = (contact) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      setLoading(true);
      await deleteContact(contactToDelete.id);
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      setDeleteModalOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error("[CONTACTS] Failed to delete contact:", error);
      alert("Failed to delete contact: " + (error.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const firstName = editorDraft.firstName.trim();
    const lastName = editorDraft.lastName.trim();
    if (!firstName || !lastName) {
      alert("First name and last name are required");
      return;
    }
    if (!editorDraft.brandId) {
      alert("Brand is required");
      return;
    }

    try {
      setLoading(true);
      const contactData = {
        brandId: editorDraft.brandId,
        firstName,
        lastName,
        role: editorDraft.role.trim() || undefined,
        email: editorDraft.email.trim() || undefined,
        phone: editorDraft.phone.trim() || undefined,
        linkedInUrl: editorDraft.linkedInUrl.trim() || undefined,
        relationshipStatus: editorDraft.relationshipStatus,
        preferredContactMethod: editorDraft.preferredContactMethod || undefined,
        primaryContact: Boolean(editorDraft.primaryContact),
        owner: editorDraft.owner || ownerDefault,
      };

      if (editorMode === "create") {
        const newContact = await createContact(contactData);
        const contactArray = Array.isArray(newContact) ? newContact : newContact?.contact ? [newContact.contact] : [];
        setContacts((prev) => [...contactArray, ...prev]);
      } else {
        await updateContact(selectedContact.id, contactData);
        setContacts((prev) =>
          prev.map((c) => (c.id === selectedContact.id ? { ...c, ...contactData } : c))
        );
      }

      setEditorOpen(false);
    } catch (error) {
      console.error("[CONTACTS] Failed to save contact:", error);
      alert("Failed to save contact: " + (error.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Contacts" subtitle="Manage brand contacts and relationships" navLinks={ADMIN_NAV_LINKS}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.3em] text-brand-black">Contacts</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            {safeContacts.length} contact{safeContacts.length !== 1 ? "s" : ""} across {safeBrands.length} brand{safeBrands.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>Add Contact</PrimaryButton>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-4">
        <input
          type="text"
          placeholder="Search contacts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] rounded-2xl border border-brand-black/10 bg-brand-white px-4 py-2 text-sm text-brand-black focus:border-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/10"
        />
        <Select
          label="Brand"
          value={brandFilter}
          onChange={setBrandFilter}
          options={[
            { value: "All", label: "All Brands" },
            ...safeBrands.map((b) => ({ value: b.id, label: b.brandName || b.name || "Unknown" })),
          ]}
        />
      </div>

      {/* Contacts List */}
      {loading && safeContacts.length === 0 ? (
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-12 text-center">
          <p className="text-brand-black/60">Loading contacts...</p>
        </div>
      ) : contactsByBrand.length === 0 ? (
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-12 text-center">
          <p className="text-brand-black/60">No contacts found</p>
          <PrimaryButton onClick={openCreate} className="mt-4">
            Add First Contact
          </PrimaryButton>
        </div>
      ) : (
        <div className="space-y-6">
          {contactsByBrand.map(({ brand, contacts: brandContacts }) => (
            <div key={brand.id} className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <BrandChip name={brand.brandName || brand.name || "Unknown"} />
                <span className="text-sm text-brand-black/60">{brandContacts.length} contact{brandContacts.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-3">
                {brandContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ContactChip
                          firstName={contact.firstName}
                          lastName={contact.lastName}
                          status={contact.relationshipStatus}
                          primary={Boolean(contact.primaryContact)}
                        />
                        {contact.title ? (
                          <span className="rounded-full border border-brand-black/10 bg-brand-white px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70">
                            {contact.title}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-brand-black/60">
                        {contact.email ? <span className="truncate">{contact.email}</span> : <span>Email: —</span>}
                        {contact.phone ? (
                          <>
                            <span className="text-brand-black/30">•</span>
                            <span>{contact.phone}</span>
                          </>
                        ) : null}
                        {contact.preferredContactMethod ? (
                          <>
                            <span className="text-brand-black/30">•</span>
                            <span>Preferred: {contact.preferredContactMethod}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TextButton onClick={() => openEdit(contact)}>Edit</TextButton>
                      <DangerButton onClick={() => openDelete(contact)}>Delete</DangerButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Drawer */}
      <Drawer
        open={editorOpen}
        title={editorMode === "create" ? "Add Contact" : "Edit Contact"}
        onClose={() => setEditorOpen(false)}
        actions={
          <div className="flex items-center justify-end gap-3">
            <SecondaryButton onClick={() => setEditorOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </PrimaryButton>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
            <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Core Details</p>
            <div className="space-y-4">
              <Select
                label="Brand *"
                value={editorDraft.brandId}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, brandId: v }))}
                options={[
                  { value: "", label: "Select a brand" },
                  ...safeBrands.map((b) => ({ value: b.id, label: b.brandName || b.name || "Unknown" })),
                ]}
              />
              <Field
                label="First Name *"
                value={editorDraft.firstName}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, firstName: v }))}
                placeholder="e.g. Sarah"
              />
              <Field
                label="Last Name *"
                value={editorDraft.lastName}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, lastName: v }))}
                placeholder="e.g. Khan"
              />
              <Field
                label="Role / Title (optional)"
                value={editorDraft.role}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, role: v }))}
                placeholder="e.g. Partnerships Lead"
              />
              <Select
                label="Relationship Status"
                value={editorDraft.relationshipStatus}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, relationshipStatus: v }))}
                options={["New", "Warm", "Active", "Dormant"]}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
            <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Contact Information</p>
            <div className="space-y-4">
              <Field
                label="Email (optional)"
                value={editorDraft.email}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, email: v }))}
                placeholder="name@brand.com"
              />
              <Field
                label="Phone (optional)"
                value={editorDraft.phone}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, phone: v }))}
                placeholder="+44…"
              />
              <Field
                label="LinkedIn URL (optional)"
                value={editorDraft.linkedInUrl}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, linkedInUrl: v }))}
                placeholder="https://linkedin.com/in/…"
              />
              <Select
                label="Preferred Contact Method"
                value={editorDraft.preferredContactMethod}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, preferredContactMethod: v }))}
                options={["", "Email", "WhatsApp", "Instagram", "Phone"]}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/40 p-6">
            <p className="mb-5 text-xs uppercase tracking-[0.35em] text-brand-black/60">Settings</p>
            <div className="space-y-4">
              <Field
                label="Owner"
                value={editorDraft.owner}
                onChange={(v) => setEditorDraft((prev) => ({ ...prev, owner: v }))}
                placeholder="Agent/admin name"
              />
              <div className="flex items-center gap-3 rounded-2xl border border-brand-black/10 bg-brand-white/70 px-4 py-3">
                <input
                  id="primaryContact"
                  type="checkbox"
                  checked={Boolean(editorDraft.primaryContact)}
                  onChange={(e) => setEditorDraft((prev) => ({ ...prev, primaryContact: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="primaryContact" className="text-sm text-brand-black/70">
                  Mark as primary contact for this brand
                </label>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-brand-black/40" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-brand-black/10 bg-brand-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold uppercase tracking-[0.3em] text-brand-black">Delete Contact</h3>
            <p className="mb-6 text-sm text-brand-black/70">
              Are you sure you want to delete {contactToDelete?.firstName} {contactToDelete?.lastName}? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <SecondaryButton onClick={() => setDeleteModalOpen(false)}>Cancel</SecondaryButton>
              <DangerButton onClick={handleDelete} disabled={loading}>
                {loading ? "Deleting..." : "Delete"}
              </DangerButton>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default AdminContactsPage;
