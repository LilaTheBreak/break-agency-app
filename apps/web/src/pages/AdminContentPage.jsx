import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell.jsx";
import { ADMIN_NAV_LINKS } from "./adminNavLinks.js";
import { apiFetch } from "../services/apiClient.js";
import { toast } from "react-hot-toast";
import { Plus, Edit2, Eye, EyeOff, Copy, Trash2, GripVertical, Save, X, Upload } from "lucide-react";

const BLOCK_TYPES = [
  { value: "HERO", label: "Hero Block", description: "Image, headline, subheadline, CTA" },
  { value: "TEXT", label: "Text Block", description: "Headline and body text" },
  { value: "IMAGE", label: "Image Block", description: "Image with optional caption" },
  { value: "SPLIT", label: "Split Block", description: "Image + text side by side" },
  { value: "ANNOUNCEMENT", label: "Announcement Banner", description: "Alert-style message" },
  { value: "SPACER", label: "Spacer", description: "Vertical spacing" },
];

const ROLE_SCOPES = [
  { value: "PUBLIC", label: "Public" },
  { value: "CREATOR", label: "Creator" },
  { value: "FOUNDER", label: "Founder" },
  { value: "ADMIN", label: "Admin" },
];

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-brand-black/15 bg-brand-white shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
        <div className="border-b border-brand-black/10 px-6 py-4 flex items-center justify-between">
          <h3 className="font-display text-2xl uppercase text-brand-black">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-black/20 p-2 hover:bg-brand-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * ImageUploadField - handles uploading images to cloud storage and pasting the URL
 */
function ImageUploadField({ value, onChange, label = "Image URL", required = false }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setUploading(true);

      // Step 1: Get signed URL from backend
      const uploadRes = await apiFetch("/api/content/upload-image", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to create upload URL");
      }

      const { uploadUrl, fileKey } = await uploadRes.json();

      // Step 2: Upload file directly to cloud storage
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload image");
      }

      // Step 3: Use the fileKey to get public URL
      const publicUrl = `/api/content/image-url/${fileKey}`;
      onChange(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
        {label} {required && "*"}
      </span>
      <div className="mt-2 flex gap-2">
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
          placeholder="https://... or upload below"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl border border-brand-black/20 bg-brand-linen/40 px-4 py-3 hover:bg-brand-linen/60 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </label>
  );
}


function BlockEditor({ block, blockType, onSave, onCancel }) {
  const [content, setContent] = useState(block?.contentJson || {});

  const handleSave = () => {
    onSave({ ...block, contentJson: content });
  };

  const renderEditor = () => {
    switch (blockType) {
      case "HERO":
        return (
          <div className="space-y-4">
            <ImageUploadField
              value={content.image || ""}
              onChange={(image) => setContent({ ...content, image })}
              label="Image URL"
            />
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Headline *</span>
              <input
                type="text"
                value={content.headline || ""}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Main headline"
                maxLength={200}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Subheadline</span>
              <input
                type="text"
                value={content.subheadline || ""}
                onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Supporting text"
                maxLength={500}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Primary CTA Text</span>
              <input
                type="text"
                value={content.primaryCtaText || ""}
                onChange={(e) => setContent({ ...content, primaryCtaText: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Get Started"
                maxLength={100}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Primary CTA Link</span>
              <input
                type="url"
                value={content.primaryCtaLink || ""}
                onChange={(e) => setContent({ ...content, primaryCtaLink: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="https://..."
              />
            </label>
          </div>
        );

      case "TEXT":
        return (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Headline</span>
              <input
                type="text"
                value={content.headline || ""}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Section headline"
                maxLength={200}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Body Text *</span>
              <textarea
                value={content.body || ""}
                onChange={(e) => setContent({ ...content, body: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                rows={6}
                placeholder="Body content"
                maxLength={5000}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Link Text</span>
              <input
                type="text"
                value={content.linkText || ""}
                onChange={(e) => setContent({ ...content, linkText: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Learn more"
                maxLength={100}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Link URL</span>
              <input
                type="url"
                value={content.link || ""}
                onChange={(e) => setContent({ ...content, link: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="https://..."
              />
            </label>
          </div>
        );

      case "IMAGE":
        return (
          <div className="space-y-4">
            <ImageUploadField
              value={content.image || ""}
              onChange={(image) => setContent({ ...content, image })}
              label="Image URL"
              required={true}
            />
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Caption</span>
              <input
                type="text"
                value={content.caption || ""}
                onChange={(e) => setContent({ ...content, caption: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Optional caption"
                maxLength={500}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Aspect Ratio</span>
              <select
                value={content.aspectRatio || "16:9"}
                onChange={(e) => setContent({ ...content, aspectRatio: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
              >
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
                <option value="3:2">3:2</option>
              </select>
            </label>
          </div>
        );

      case "SPLIT":
        return (
          <div className="space-y-4">
            <ImageUploadField
              value={content.image || ""}
              onChange={(image) => setContent({ ...content, image })}
              label="Image URL"
              required={true}
            />
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Image Position</span>
              <select
                value={content.imagePosition || "left"}
                onChange={(e) => setContent({ ...content, imagePosition: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Headline *</span>
              <input
                type="text"
                value={content.headline || ""}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Headline"
                maxLength={200}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Body Text *</span>
              <textarea
                value={content.body || ""}
                onChange={(e) => setContent({ ...content, body: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                rows={6}
                placeholder="Body content"
                maxLength={5000}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">CTA Text</span>
              <input
                type="text"
                value={content.ctaText || ""}
                onChange={(e) => setContent({ ...content, ctaText: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Learn more"
                maxLength={100}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">CTA Link</span>
              <input
                type="url"
                value={content.ctaLink || ""}
                onChange={(e) => setContent({ ...content, ctaLink: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="https://..."
              />
            </label>
          </div>
        );

      case "ANNOUNCEMENT":
        return (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Message *</span>
              <textarea
                value={content.message || ""}
                onChange={(e) => setContent({ ...content, message: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                rows={4}
                placeholder="Announcement message"
                maxLength={1000}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Variant</span>
              <select
                value={content.variant || "info"}
                onChange={(e) => setContent({ ...content, variant: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">CTA Text</span>
              <input
                type="text"
                value={content.ctaText || ""}
                onChange={(e) => setContent({ ...content, ctaText: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="Action"
                maxLength={100}
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">CTA Link</span>
              <input
                type="url"
                value={content.ctaLink || ""}
                onChange={(e) => setContent({ ...content, ctaLink: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
                placeholder="https://..."
              />
            </label>
          </div>
        );

      case "SPACER":
        return (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Size</span>
              <select
                value={content.size || "md"}
                onChange={(e) => setContent({ ...content, size: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </label>
          </div>
        );

      default:
        return <p className="text-sm text-brand-black/60">Unknown block type</p>;
    }
  };

  return (
    <div className="space-y-6">
      {renderEditor()}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-black/10">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90"
        >
          Save Block
        </button>
      </div>
    </div>
  );
}

export function AdminContentPage({ session }) {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [draftBlocks, setDraftBlocks] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [newBlockType, setNewBlockType] = useState(null);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      loadPageBlocks(selectedPage.slug);
    }
  }, [selectedPage, previewMode]);

  const seedPages = async () => {
    try {
      const response = await apiFetch("/api/content/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("[CMS] Seeding result:", data);
        toast.success(`Seeded ${data.created} pages successfully`);
        // Refresh pages after seeding
        await loadPages();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[CMS] Seeding failed:", errorData);
        toast.error(errorData.error || "Failed to seed pages");
      }
    } catch (error) {
      console.error("[CMS] Error seeding pages:", error);
      toast.error("Failed to seed pages");
    }
  };

  const hydratePages = async () => {
    try {
      const response = await apiFetch("/api/content/hydrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // Hydrate all pages
      });
      if (response.ok) {
        const data = await response.json();
        console.log("[CMS] Hydration result:", data);
        toast.success(`Hydrated ${data.totalHydrated} pages, created ${data.totalBlocksCreated} blocks`);
        // Refresh pages and blocks after hydration
        await loadPages();
        if (selectedPage) {
          await loadPageBlocks(selectedPage.slug);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[CMS] Hydration failed:", errorData);
        toast.error(errorData.error || "Failed to hydrate pages");
      }
    } catch (error) {
      console.error("[CMS] Error hydrating pages:", error);
      toast.error("Failed to hydrate pages");
    }
  };

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/content/pages");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load pages (${response.status})`);
      }
      
      const data = await response.json();
      const pagesArray = Array.isArray(data.pages) ? data.pages : [];
      
      console.log("[CMS] Loaded pages:", pagesArray.length, pagesArray);
      setPages(pagesArray);
      
      if (pagesArray.length === 0) {
        console.warn("[CMS] No pages found in database. Consider running seed script.");
      }
    } catch (error) {
      console.error("[CMS] Failed to load pages:", error);
      toast.error(error.message || "Failed to load pages");
      setPages([]); // Ensure pages is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadPageBlocks = async (slug) => {
    try {
      setLoading(true);
      const url = previewMode ? `/api/content/pages/${slug}?preview=true` : `/api/content/pages/${slug}`;
      const response = await apiFetch(url);
      if (!response.ok) throw new Error("Failed to load blocks");
      const data = await response.json();
      setBlocks(data.blocks || []);
      if (previewMode && data.blocks) {
        setDraftBlocks(data.blocks);
      }
    } catch (error) {
      console.error("Failed to load blocks:", error);
      toast.error("Failed to load blocks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async (blockType) => {
    if (!selectedPage) return;

    const defaultContent = getDefaultContent(blockType);
    const newBlock = {
      id: `temp_${Date.now()}`,
      blockType,
      contentJson: defaultContent,
      order: blocks.length,
      isVisible: true,
    };

    try {
      const response = await apiFetch(`/api/content/pages/${selectedPage.slug}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockType,
          contentJson: defaultContent,
          order: blocks.length,
          isVisible: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create block");
      }

      const data = await response.json();
      await loadPageBlocks(selectedPage.slug);
      toast.success("Block created");
      setEditorOpen(false);
      setNewBlockType(null);
    } catch (error) {
      console.error("Failed to create block:", error);
      toast.error(error.message || "Failed to create block");
    }
  };

  const handleUpdateBlock = async (block) => {
    try {
      setSaving(true);
      const response = await apiFetch(`/api/content/blocks/${block.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentJson: block.contentJson,
          order: block.order,
          isVisible: block.isVisible,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update block");
      }

      await loadPageBlocks(selectedPage.slug);
      toast.success("Block updated");
      setEditorOpen(false);
      setEditingBlock(null);
    } catch (error) {
      console.error("Failed to update block:", error);
      toast.error(error.message || "Failed to update block");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!confirm("Delete this block?")) return;

    try {
      const response = await apiFetch(`/api/content/blocks/${blockId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete block");

      await loadPageBlocks(selectedPage.slug);
      toast.success("Block deleted");
    } catch (error) {
      console.error("Failed to delete block:", error);
      toast.error("Failed to delete block");
    }
  };

  const handleDuplicateBlock = async (blockId) => {
    try {
      const response = await apiFetch(`/api/content/blocks/${blockId}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to duplicate block");

      await loadPageBlocks(selectedPage.slug);
      toast.success("Block duplicated");
    } catch (error) {
      console.error("Failed to duplicate block:", error);
      toast.error("Failed to duplicate block");
    }
  };

  const handleToggleVisibility = async (block) => {
    try {
      await handleUpdateBlock({ ...block, isVisible: !block.isVisible });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    }
  };

  const handleReorderBlocks = async (newOrder) => {
    try {
      const blockIds = newOrder.map((b) => b.id);
      const response = await apiFetch(`/api/content/pages/${selectedPage.slug}/blocks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockIds }),
      });

      if (!response.ok) throw new Error("Failed to reorder blocks");

      await loadPageBlocks(selectedPage.slug);
      toast.success("Blocks reordered");
    } catch (error) {
      console.error("Failed to reorder blocks:", error);
      toast.error("Failed to reorder blocks");
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPage) return;

    try {
      setSaving(true);
      const response = await apiFetch(`/api/content/pages/${selectedPage.slug}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: draftBlocks }),
      });

      if (!response.ok) throw new Error("Failed to save draft");

      toast.success("Draft saved");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedPage || !confirm("Publish changes? This will replace the live content.")) return;

    try {
      setSaving(true);
      const response = await apiFetch(`/api/content/pages/${selectedPage.slug}/publish`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to publish");

      setPreviewMode(false);
      await loadPageBlocks(selectedPage.slug);
      toast.success("Page published");
    } catch (error) {
      console.error("Failed to publish:", error);
      toast.error("Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const getDefaultContent = (blockType) => {
    switch (blockType) {
      case "HERO":
        return { headline: "", subheadline: "", image: "", primaryCtaText: "", primaryCtaLink: "" };
      case "TEXT":
        return { headline: "", body: "", link: "", linkText: "" };
      case "IMAGE":
        return { image: "", caption: "", aspectRatio: "16:9" };
      case "SPLIT":
        return { image: "", imagePosition: "left", headline: "", body: "", ctaText: "", ctaLink: "" };
      case "ANNOUNCEMENT":
        return { message: "", variant: "info", ctaText: "", ctaLink: "" };
      case "SPACER":
        return { size: "md" };
      default:
        return {};
    }
  };

  const displayBlocks = previewMode ? draftBlocks : blocks;

  return (
    <DashboardShell title="CMS" subtitle="Edit page content without code changes" navLinks={ADMIN_NAV_LINKS} session={session}>
      <div className="space-y-6">
        {/* Page Selector */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          <label className="block mb-3">
            <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Select Page</span>
            {loading ? (
              <div className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black/60">
                Loading pages...
              </div>
            ) : pages.length === 0 ? (
              <div className="mt-2 rounded-2xl border border-brand-black/10 bg-brand-linen/50 px-4 py-6 text-center">
                <p className="text-sm text-brand-black/70 mb-4">
                  No CMS pages available yet. Click below to seed system pages.
                </p>
                <button
                  onClick={seedPages}
                  className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black transition-colors"
                >
                  Seed CMS Pages
                </button>
              </div>
            ) : (
              <select
                value={selectedPage?.id || ""}
                onChange={(e) => {
                  const page = pages.find((p) => p.id === e.target.value);
                  setSelectedPage(page || null);
                  setPreviewMode(false);
                }}
                className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm"
              >
                <option value="">Choose a page...</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title} {page.route ? `(${page.route})` : ""}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>

        {selectedPage && (
          <>
            {/* Preview Mode Toggle */}
            <div className="flex items-center justify-between rounded-3xl border border-brand-black/10 bg-brand-white p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{selectedPage.title}</span>
                {selectedPage.route && (
                  <span className="rounded-full bg-brand-black/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70">
                    {selectedPage.route}
                  </span>
                )}
                <span className="rounded-full bg-brand-black/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-brand-black/70">
                  {selectedPage.roleScope}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={previewMode}
                    onChange={(e) => {
                      setPreviewMode(e.target.checked);
                      if (e.target.checked) {
                        setDraftBlocks([...blocks]);
                      }
                    }}
                    className="rounded border-brand-black/20"
                  />
                  <span className="text-xs uppercase tracking-[0.3em] text-brand-black/70">Preview Mode</span>
                </label>
                {previewMode && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 disabled:opacity-50"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={saving}
                      className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90 disabled:opacity-50"
                    >
                      Publish
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Block List */}
            <div className="space-y-3">
              {displayBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`rounded-2xl border ${
                    block.isVisible ? "border-brand-black/10 bg-brand-white" : "border-brand-black/5 bg-brand-linen/30 opacity-60"
                  } p-4`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-brand-black/30 cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black/70">
                          {BLOCK_TYPES.find((t) => t.value === block.blockType)?.label || block.blockType}
                        </span>
                        {!block.isVisible && (
                          <span className="text-xs text-brand-black/50">(Hidden)</span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-brand-black/60">
                        {getBlockPreview(block)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(block)}
                        className="rounded-full border border-brand-black/20 p-2 hover:bg-brand-black/5"
                        title={block.isVisible ? "Hide" : "Show"}
                      >
                        {block.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBlock(block);
                          setEditorOpen(true);
                        }}
                        className="rounded-full border border-brand-black/20 p-2 hover:bg-brand-black/5"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateBlock(block.id)}
                        className="rounded-full border border-brand-black/20 p-2 hover:bg-brand-black/5"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="rounded-full border border-brand-red/20 p-2 hover:bg-brand-red/10 text-brand-red"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {displayBlocks.length === 0 && (
                <div className="rounded-3xl border border-brand-black/10 bg-brand-linen/50 p-12 text-center">
                  <p className="text-sm text-brand-black/60 mb-4">No blocks yet. Click below to hydrate with default content.</p>
                  <button
                    onClick={hydratePages}
                    className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-black transition-colors"
                  >
                    Hydrate with Default Content
                  </button>
                </div>
              )}
            </div>

            {/* Add Block Button */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="flex items-center gap-2 rounded-full border border-brand-black/20 bg-brand-white px-6 py-3 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5"
              >
                <Plus className="h-4 w-4" />
                Add Block
              </button>
            </div>
          </>
        )}

        {/* Block Type Selector / Editor Modal */}
        <Modal
          open={editorOpen}
          title={editingBlock ? `Edit ${BLOCK_TYPES.find((t) => t.value === editingBlock.blockType)?.label}` : "Add New Block"}
          onClose={() => {
            setEditorOpen(false);
            setEditingBlock(null);
            setNewBlockType(null);
          }}
        >
          {!editingBlock && !newBlockType ? (
            <div className="space-y-3">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setNewBlockType(type.value)}
                  className="w-full text-left rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4 hover:bg-brand-linen/60 transition-colors"
                >
                  <div className="font-semibold text-sm">{type.label}</div>
                  <div className="text-xs text-brand-black/60 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <BlockEditor
              block={editingBlock || { contentJson: getDefaultContent(newBlockType || "TEXT") }}
              blockType={editingBlock?.blockType || newBlockType}
              onSave={(updatedBlock) => {
                if (editingBlock) {
                  handleUpdateBlock(updatedBlock);
                } else {
                  handleCreateBlock(newBlockType);
                }
              }}
              onCancel={() => {
                setEditorOpen(false);
                setEditingBlock(null);
                setNewBlockType(null);
              }}
            />
          )}
        </Modal>
      </div>
    </DashboardShell>
  );
}

function getBlockPreview(block) {
  const content = block.contentJson || {};
  switch (block.blockType) {
    case "HERO":
      return content.headline || "No headline";
    case "TEXT":
      return content.headline || content.body?.substring(0, 50) || "No content";
    case "IMAGE":
      return content.caption || "Image block";
    case "SPLIT":
      return content.headline || "Split block";
    case "ANNOUNCEMENT":
      return content.message?.substring(0, 50) || "No message";
    case "SPACER":
      return `Spacer (${content.size || "md"})`;
    default:
      return "Block";
  }
}

