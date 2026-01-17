import React, { useState } from "react";
import { Edit2, Copy, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * EditableBlockRenderer - Renders blocks with inline editing capabilities
 * Shows edit controls when editMode is true
 */
export function EditableBlockRenderer({ 
  blocks = [], 
  editMode = false,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onReorderBlocks,
  onCreateBlock,
  saving = false
}) {
  const [editingBlockId, setEditingBlockId] = useState(null);

  if (!Array.isArray(blocks) || blocks.length === 0) {
    if (editMode) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-sm text-brand-black/60">No blocks yet</p>
            <button
              onClick={() => onCreateBlock("HERO", { headline: "", image: "" })}
              disabled={saving}
              className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90 disabled:opacity-50"
            >
              Create First Block
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const displayBlocks = blocks.filter((block) => block && block.isVisible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

  const moveBlock = (index, direction) => {
    const newBlocks = [...displayBlocks];
    if (direction === "up" && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      const reordered = newBlocks.map((b, i) => ({ ...b, order: i }));
      onReorderBlocks(reordered);
    } else if (direction === "down" && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      const reordered = newBlocks.map((b, i) => ({ ...b, order: i }));
      onReorderBlocks(reordered);
    }
  };

  return (
    <div className="space-y-4">
      {displayBlocks.map((block, index) => (
        <div
          key={block.id}
          className={`relative rounded-2xl border-2 transition-colors ${
            editMode && editingBlockId === block.id
              ? "border-brand-red bg-brand-linen/30"
              : editMode
              ? "border-brand-black/10 hover:border-brand-red/30"
              : "border-transparent"
          }`}
        >
          {/* Edit Mode Controls */}
          {editMode && (
            <div className="absolute right-4 top-4 flex items-center gap-2 z-10">
              {index > 0 && (
                <button
                  onClick={() => moveBlock(index, "up")}
                  disabled={saving}
                  className="rounded-full border border-brand-black/20 p-2 hover:bg-brand-black/5 disabled:opacity-50"
                  title="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              )}
              {index < displayBlocks.length - 1 && (
                <button
                  onClick={() => moveBlock(index, "down")}
                  disabled={saving}
                  className="rounded-full border border-brand-black/20 p-2 hover:bg-brand-black/5 disabled:opacity-50"
                  title="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                disabled={saving}
                className="rounded-full border border-brand-black/20 p-2 hover:bg-brand-black/5 disabled:opacity-50"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDuplicateBlock(block.id)}
                disabled={saving}
                className="rounded-full border border-brand-black/20 p-2 hover:bg-brand-black/5 disabled:opacity-50"
                title="Duplicate"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteBlock(block.id)}
                disabled={saving}
                className="rounded-full border border-brand-red/20 p-2 hover:bg-brand-red/10 text-brand-red disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Block Content with Edit Form */}
          {editingBlockId === block.id && editMode ? (
            <BlockEditForm
              block={block}
              onSave={(content) => {
                onUpdateBlock(block.id, content);
                setEditingBlockId(null);
              }}
              onCancel={() => setEditingBlockId(null)}
              saving={saving}
            />
          ) : (
            <BlockPreviewRenderer block={block} />
          )}
        </div>
      ))}

      {/* Add Block Button */}
      {editMode && (
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 h-px bg-brand-black/10" />
            <button
              onClick={() => {
                const types = ["HERO", "TEXT", "IMAGE", "SPLIT", "ANNOUNCEMENT", "SPACER"];
                const selected = types[Math.floor(Math.random() * types.length)];
                const defaults = getDefaultContent(selected);
                onCreateBlock(selected, defaults);
              }}
              disabled={saving}
              className="relative bg-white px-4 py-2 rounded-full border border-brand-black/10 hover:border-brand-red hover:text-brand-red transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs uppercase font-semibold tracking-[0.3em]">Add Block</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockPreviewRenderer({ block }) {
  try {
    switch (block.blockType) {
      case "HERO":
        return <HeroBlock content={block.contentJson} />;
      case "TEXT":
        return <TextBlock content={block.contentJson} />;
      case "IMAGE":
        return <ImageBlock content={block.contentJson} />;
      case "SPLIT":
        return <SplitBlock content={block.contentJson} />;
      case "ANNOUNCEMENT":
        return <AnnouncementBlock content={block.contentJson} />;
      case "SPACER":
        return <SpacerBlock content={block.contentJson} />;
      default:
        return null;
    }
  } catch (error) {
    console.error("Error rendering block:", error);
    return null;
  }
}

function BlockEditForm({ block, onSave, onCancel, saving }) {
  const [content, setContent] = useState(block.contentJson || {});

  const handleSave = () => {
    onSave(content);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-black/60">
        Editing: {block.blockType}
      </div>

      {block.blockType === "HERO" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Headline"
            value={content.headline || ""}
            onChange={(e) => setContent({ ...content, headline: e.target.value })}
            maxLength={200}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Subheadline"
            value={content.subheadline || ""}
            onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
            maxLength={500}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Image URL"
            value={content.image || ""}
            onChange={(e) => setContent({ ...content, image: e.target.value })}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="CTA Text"
            value={content.primaryCtaText || ""}
            onChange={(e) => setContent({ ...content, primaryCtaText: e.target.value })}
            maxLength={100}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
        </div>
      )}

      {block.blockType === "TEXT" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Headline"
            value={content.headline || ""}
            onChange={(e) => setContent({ ...content, headline: e.target.value })}
            maxLength={200}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
          <textarea
            placeholder="Body text"
            value={content.body || ""}
            onChange={(e) => setContent({ ...content, body: e.target.value })}
            maxLength={5000}
            rows={4}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
        </div>
      )}

      {block.blockType === "IMAGE" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Image URL"
            value={content.image || ""}
            onChange={(e) => setContent({ ...content, image: e.target.value })}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Caption"
            value={content.caption || ""}
            onChange={(e) => setContent({ ...content, caption: e.target.value })}
            maxLength={500}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
        </div>
      )}

      {block.blockType === "SPLIT" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Image URL"
            value={content.image || ""}
            onChange={(e) => setContent({ ...content, image: e.target.value })}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
          <select
            value={content.imagePosition || "left"}
            onChange={(e) => setContent({ ...content, imagePosition: e.target.value })}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          >
            <option value="left">Image Left</option>
            <option value="right">Image Right</option>
          </select>
          <input
            type="text"
            placeholder="Headline"
            value={content.headline || ""}
            onChange={(e) => setContent({ ...content, headline: e.target.value })}
            maxLength={200}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
          <textarea
            placeholder="Body text"
            value={content.body || ""}
            onChange={(e) => setContent({ ...content, body: e.target.value })}
            maxLength={5000}
            rows={3}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
        </div>
      )}

      {block.blockType === "ANNOUNCEMENT" && (
        <div className="space-y-3">
          <textarea
            placeholder="Message"
            value={content.message || ""}
            onChange={(e) => setContent({ ...content, message: e.target.value })}
            maxLength={500}
            rows={3}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          />
          <select
            value={content.variant || "info"}
            onChange={(e) => setContent({ ...content, variant: e.target.value })}
            className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
          </select>
        </div>
      )}

      {block.blockType === "SPACER" && (
        <select
          value={content.size || "md"}
          onChange={(e) => setContent({ ...content, size: e.target.value })}
          className="w-full rounded-xl border border-brand-black/10 px-4 py-2 text-sm"
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-brand-black/10">
        <button
          onClick={onCancel}
          disabled={saving}
          className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] border border-brand-black/10 hover:bg-brand-black/5 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// ============================================
// BLOCK COMPONENTS (Same as BlockRenderer)
// ============================================

function HeroBlock({ content }) {
  if (!content?.headline) return null;
  return (
    <section className="space-y-6 px-6 py-12">
      {content.image && (
        <img src={content.image} alt="Hero" className="w-full h-auto rounded-xl object-cover aspect-video" onError={(e) => (e.target.style.display = "none")} />
      )}
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">{content.headline}</h1>
        {content.subheadline && <p className="text-lg text-black/70">{content.subheadline}</p>}
      </div>
    </section>
  );
}

function TextBlock({ content }) {
  if (!content?.body && !content?.headline) return null;
  return (
    <section className="space-y-3 px-6 py-8">
      {content.headline && <h2 className="text-2xl font-semibold">{content.headline}</h2>}
      {content.body && <p className="text-base text-black/70 whitespace-pre-wrap">{content.body}</p>}
    </section>
  );
}

function ImageBlock({ content }) {
  if (!content?.image) return null;
  return (
    <section className="px-6 py-8">
      <img src={content.image} alt={content.caption || ""} className="w-full h-auto rounded-xl object-cover" onError={(e) => (e.target.style.display = "none")} />
      {content.caption && <p className="text-sm text-black/60 mt-3">{content.caption}</p>}
    </section>
  );
}

function SplitBlock({ content }) {
  if (!content?.image || !content?.headline) return null;
  const imageLeft = content.imagePosition !== "right";
  return (
    <section className="px-6 py-8">
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${imageLeft ? "" : "md:grid-cols-2"}`}>
        {imageLeft && (
          <img src={content.image} alt="" className="w-full h-auto rounded-xl object-cover aspect-video" onError={(e) => (e.target.style.display = "none")} />
        )}
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">{content.headline}</h2>
          {content.body && <p className="text-base text-black/70">{content.body}</p>}
        </div>
        {!imageLeft && (
          <img src={content.image} alt="" className="w-full h-auto rounded-xl object-cover aspect-video md:order-last" onError={(e) => (e.target.style.display = "none")} />
        )}
      </div>
    </section>
  );
}

function AnnouncementBlock({ content }) {
  if (!content?.message) return null;
  const variant = content.variant || "info";
  const bgColor = variant === "success" ? "bg-green-50 border-green-200" : variant === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200";
  return (
    <section className="px-6 py-8">
      <div className={`rounded-xl border ${bgColor} p-6`}>
        <p className="text-sm text-black/70">{content.message}</p>
      </div>
    </section>
  );
}

function SpacerBlock({ content }) {
  const size = content?.size || "md";
  const heights = { sm: "h-6", md: "h-12", lg: "h-24" };
  return <div className={heights[size]} />;
}

function getDefaultContent(blockType) {
  switch (blockType) {
    case "HERO":
      return { headline: "", subheadline: "", image: "", primaryCtaText: "" };
    case "TEXT":
      return { headline: "", body: "" };
    case "IMAGE":
      return { image: "", caption: "" };
    case "SPLIT":
      return { image: "", headline: "", body: "", imagePosition: "left" };
    case "ANNOUNCEMENT":
      return { message: "", variant: "info" };
    case "SPACER":
      return { size: "md" };
    default:
      return {};
  }
}
