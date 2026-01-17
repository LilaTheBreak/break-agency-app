import React, { useEffect } from "react";
import { EditableBlockRenderer } from "../components/EditableBlockRenderer.jsx";
import { useCmsEditMode } from "../hooks/useCmsEditMode.js";
import { useSearchParams } from "react-router-dom";
import { Save, X } from "lucide-react";
import { toast } from "react-hot-toast";

export function CareersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEditMode = searchParams.get("edit") === "true";
  
  const cms = useCmsEditMode("careers", initialEditMode);

  useEffect(() => {
    // Sync URL with edit mode state
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

        {/* Page Content */}
        <div className="mx-auto max-w-6xl">
          <header className="border-b border-slate-200 bg-white">
            <div className="space-y-3 px-6 py-10">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Careers</p>
              <h1 className="text-3xl font-semibold">Join The Break.</h1>
              <p className="text-sm text-slate-600">
                We're building an internal-grade console for creators, brands, and culture teams.
              </p>
            </div>
          </header>

          <main>
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
        </div>

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
  return <CareersPageHardcoded onEditMode={() => cms.setEditMode(true)} />;
}

function CareersPageHardcoded({ onEditMode }) {
  return (
    <div className="bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl space-y-3 px-6 py-10">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-red">Careers</p>
          <h1 className="text-3xl font-semibold">Join The Break.</h1>
          <p className="text-sm text-slate-600">
            We're building an internal-grade console for creators, brands, and culture teams. When roles open up, we'll list them here.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Open roles</h2>
          <p className="text-sm text-slate-700">
            No active opportunities right now — please check back soon.
          </p>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Stay in touch</h2>
          <p className="text-sm text-slate-700">
            If you'd like to be considered when positions open, send a short note and portfolio to{" "}
            <a className="underline" href="mailto:careers@thebreakco.com">
              careers@thebreakco.com
            </a>
            .
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

export default CareersPage;
