import React, { useEffect } from "react";
import { EditableBlockRenderer } from "../components/EditableBlockRenderer.jsx";
import { useCmsEditMode } from "../hooks/useCmsEditMode.js";
import { useSearchParams } from "react-router-dom";
import { Save, X } from "lucide-react";

/**
 * GENERIC EDITABLE PAGE TEMPLATE
 * Use this template for any public page that needs inline edit mode
 * Just replace:
 * - PAGE_SLUG: "press" (the CMS slug)
 * - PAGE_TITLE: "Press" (header title)
 * - PAGE_HARDCODED: <PressPageHardcoded /> (fallback content)
 */

export function EditablePageTemplate() {
  const PAGE_SLUG = "press"; // Change this
  const PAGE_TITLE = "Press"; // Change this
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEditMode = searchParams.get("edit") === "true";
  
  const cms = useCmsEditMode(PAGE_SLUG, initialEditMode);

  useEffect(() => {
    if (cms.editMode) {
      setSearchParams({ edit: "true" });
    } else {
      setSearchParams({});
    }
  }, [cms.editMode, setSearchParams]);

  // If CMS has blocks, render them instead of hardcoded content
  if (!cms.loading && cms.blocks && cms.blocks.length > 0) {
    return (
      <div className="bg-white text-slate-900 min-h-screen">
        {/* Edit Mode Header */}
        {cms.editMode && (
          <div className="sticky top-0 z-40 border-b border-brand-black/10 bg-white px-6 py-3 shadow-sm">
            <div className="mx-auto max-w-6xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-block px-3 py-1 rounded-full bg-brand-red/10 text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                  Edit Mode
                </span>
                {cms.hasUnsavedChanges && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={cms.saveDraft}
                  disabled={cms.saving || !cms.hasUnsavedChanges}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </button>
                <button
                  onClick={cms.publishChanges}
                  disabled={cms.saving}
                  className="flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90 disabled:opacity-50"
                >
                  Publish
                </button>
                <button
                  onClick={() => cms.setEditMode(false)}
                  disabled={cms.saving}
                  className="flex items-center gap-2 rounded-full border border-brand-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] hover:bg-brand-black/5 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl space-y-3 px-6 py-10">
            {/* Replace with actual page header */}
            <p className="text-xs uppercase tracking-[0.35em] text-brand-red">{PAGE_TITLE}</p>
            <h1 className="text-3xl font-semibold">{PAGE_TITLE} Page</h1>
            <p className="text-sm text-slate-600">Edit this page inline by clicking blocks below.</p>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-6xl">
          <EditableBlockRenderer
            blocks={cms.draftBlocks}
            editMode={cms.editMode}
            onUpdateBlock={cms.updateBlock}
            onDeleteBlock={cms.deleteBlock}
            onDuplicateBlock={cms.duplicateBlock}
            onReorderBlocks={cms.reorderBlocks}
            onCreateBlock={cms.createBlock}
            saving={cms.saving}
          />
        </main>

        {/* Edit Mode Toggle Button (when not in edit mode) */}
        {!cms.editMode && (
          <button
            onClick={() => cms.setEditMode(true)}
            className="fixed bottom-6 right-6 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg hover:bg-brand-red/90"
          >
            Edit Page
          </button>
        )}
      </div>
    );
  }

  // Fallback to hardcoded content if CMS is empty or loading
  return <PageHardcoded onEditMode={() => cms.setEditMode(true)} />;
}

function PageHardcoded({ onEditMode }) {
  // Replace this with actual fallback content
  return (
    <div className="bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl space-y-3 px-6 py-10">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Page</p>
          <h1 className="text-3xl font-semibold">Page Title</h1>
          <p className="text-sm text-slate-600">
            This is the fallback hardcoded content that appears when CMS blocks are empty.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Section Title</h2>
          <p className="text-sm text-slate-700">
            Add CMS blocks to replace this content.
          </p>
        </section>
      </main>

      <button
        onClick={onEditMode}
        className="fixed bottom-6 right-6 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg hover:bg-brand-red/90"
      >
        Edit Page
      </button>
    </div>
  );
}

export default EditablePageTemplate;
