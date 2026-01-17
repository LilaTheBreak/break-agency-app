import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../services/apiClient.js";
import { toast } from "react-hot-toast";

/**
 * Hook for managing CMS edit mode on public pages
 * Allows editing blocks directly on the page
 * 
 * @param {string} slug - CMS page slug
 * @param {boolean} initialEditMode - Start in edit mode?
 * @returns {{ 
 *   editMode: boolean, 
 *   setEditMode: Function,
 *   blocks: Array,
 *   draftBlocks: Array,
 *   setDraftBlocks: Function,
 *   loading: boolean,
 *   saving: boolean,
 *   hasUnsavedChanges: boolean,
 *   saveDraft: Function,
 *   publishChanges: Function,
 *   updateBlock: Function,
 *   deleteBlock: Function,
 *   duplicateBlock: Function,
 *   reorderBlocks: Function,
 *   createBlock: Function
 * }}
 */
export function useCmsEditMode(slug, initialEditMode = false) {
  const [editMode, setEditMode] = useState(initialEditMode);
  const [blocks, setBlocks] = useState([]);
  const [draftBlocks, setDraftBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load page blocks
  useEffect(() => {
    const loadBlocks = async () => {
      if (!slug) {
        console.warn(`[CMS Edit] No slug provided to useCmsEditMode`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get admin version with drafts when in edit mode
        const url = editMode ? `/api/content/pages/${slug}?preview=true` : `/api/content/public/${slug}`;
        console.log(`[CMS Edit] Loading ${editMode ? "draft" : "public"} content for slug: ${slug}`);
        
        const response = await apiFetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`[CMS Edit] Page '${slug}' not found in CMS registry (404)`);
            setBlocks([]);
            setDraftBlocks([]);
            setLoading(false);
            return;
          }
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`Failed to fetch page: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const pageBlocks = Array.isArray(data.blocks) ? data.blocks : [];
        console.log(`[CMS Edit] Successfully loaded ${pageBlocks.length} blocks for slug: ${slug}`);
        
        setBlocks(pageBlocks);
        setDraftBlocks(pageBlocks);
      } catch (error) {
        console.error(`[CMS Edit] Failed to load page '${slug}':`, error);
        // Show visible error message to user, not just silent log
        toast.error(`Failed to load page content: ${error.message}`);
        setBlocks([]);
        setDraftBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBlocks();
  }, [slug, editMode]);

  // Detect unsaved changes
  useEffect(() => {
    const blocksChanged = JSON.stringify(blocks) !== JSON.stringify(draftBlocks);
    setHasUnsavedChanges(blocksChanged);
  }, [draftBlocks, blocks]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && editMode) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, editMode]);

  const saveDraft = useCallback(async () => {
    if (!slug) return;

    try {
      setSaving(true);
      const response = await apiFetch(`/api/content/pages/${slug}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: draftBlocks }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save draft");
      }

      // Sync to clear unsaved changes indicator
      setBlocks(draftBlocks);
      toast.success("Draft saved");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error(error.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  }, [slug, draftBlocks]);

  const publishChanges = useCallback(async () => {
    if (!slug || !window.confirm("Publish changes? This will replace the live content.")) return;

    try {
      setSaving(true);
      const response = await apiFetch(`/api/content/pages/${slug}/publish`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to publish");
      }

      // Reload blocks to reflect published state
      const reloadResponse = await apiFetch(`/api/content/pages/${slug}?preview=true`);
      if (reloadResponse.ok) {
        const data = await reloadResponse.json();
        const pageBlocks = Array.isArray(data.blocks) ? data.blocks : [];
        setBlocks(pageBlocks);
        setDraftBlocks(pageBlocks);
      }

      toast.success("Page published successfully");
    } catch (error) {
      console.error("Failed to publish:", error);
      toast.error(error.message || "Failed to publish");
    } finally {
      setSaving(false);
    }
  }, [slug]);

  const updateBlock = useCallback(async (blockId, updatedContent) => {
    try {
      setSaving(true);
      const blockToUpdate = draftBlocks.find((b) => b.id === blockId);
      if (!blockToUpdate) throw new Error("Block not found");

      const response = await apiFetch(`/api/content/blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentJson: updatedContent,
          order: blockToUpdate.order,
          isVisible: blockToUpdate.isVisible,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update block");
      }

      // Update local state
      const updated = draftBlocks.map((b) =>
        b.id === blockId ? { ...b, contentJson: updatedContent } : b
      );
      setDraftBlocks(updated);
      toast.success("Block updated");
    } catch (error) {
      console.error("Failed to update block:", error);
      toast.error(error.message || "Failed to update block");
    } finally {
      setSaving(false);
    }
  }, [draftBlocks]);

  const deleteBlock = useCallback(async (blockId) => {
    if (!window.confirm("Delete this block?")) return;

    try {
      setSaving(true);
      const response = await apiFetch(`/api/content/blocks/${blockId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete block");
      }

      // Update local state
      const filtered = draftBlocks.filter((b) => b.id !== blockId);
      setDraftBlocks(filtered);
      toast.success("Block deleted");
    } catch (error) {
      console.error("Failed to delete block:", error);
      toast.error(error.message || "Failed to delete block");
    } finally {
      setSaving(false);
    }
  }, [draftBlocks]);

  const duplicateBlock = useCallback(async (blockId) => {
    try {
      setSaving(true);
      const response = await apiFetch(`/api/content/blocks/${blockId}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to duplicate block");
      }

      const newBlock = await response.json();
      setDraftBlocks([...draftBlocks, newBlock]);
      toast.success("Block duplicated");
    } catch (error) {
      console.error("Failed to duplicate block:", error);
      toast.error(error.message || "Failed to duplicate block");
    } finally {
      setSaving(false);
    }
  }, [draftBlocks]);

  const reorderBlocks = useCallback((newOrder) => {
    setDraftBlocks(newOrder);
  }, []);

  const createBlock = useCallback(
    async (blockType, defaultContent) => {
      if (!slug) return;

      try {
        setSaving(true);
        const response = await apiFetch(`/api/content/pages/${slug}/blocks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockType,
            contentJson: defaultContent,
            order: draftBlocks.length,
            isVisible: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create block");
        }

        const newBlock = await response.json();
        setDraftBlocks([...draftBlocks, newBlock]);
        toast.success("Block created");
        return newBlock;
      } catch (error) {
        console.error("Failed to create block:", error);
        toast.error(error.message || "Failed to create block");
      } finally {
        setSaving(false);
      }
    },
    [slug, draftBlocks]
  );

  return {
    editMode,
    setEditMode,
    blocks,
    draftBlocks,
    setDraftBlocks,
    loading,
    saving,
    hasUnsavedChanges,
    saveDraft,
    publishChanges,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
    createBlock,
  };
}
