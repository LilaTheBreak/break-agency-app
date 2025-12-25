import { useState, useEffect } from "react";

/**
 * DeckDrawer: Create branded PDF decks from CRM data
 * Purpose: Fast creation of PDFs for outreach, proposals, and results
 * Design: No auto-generation, AI summarization is assistive only
 */
export default function DeckDrawer({ 
  open, 
  onClose, 
  records = [], 
  opportunities = [], 
  deals = [], 
  campaigns = [] 
}) {
  // Form state: Deck context
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedDeal, setSelectedDeal] = useState("");
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("");

  // Form state: Content blocks (toggles)
  const [includeCreatorStats, setIncludeCreatorStats] = useState(true);
  const [includeCampaignOverview, setIncludeCampaignOverview] = useState(true);
  const [includeResults, setIncludeResults] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);

  // Form state: Text inputs
  const [introText, setIntroText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [commentaryText, setCommentaryText] = useState("");

  // UI state
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [summarizing, setSummarizing] = useState(null); // "intro" | "summary" | "commentary" | null
  const [summaryPreview, setSummaryPreview] = useState(null); // { field, text }

  // Extract unique brands from records
  const brands = [...new Set(records.map(r => r.brand).filter(Boolean))];

  // Extract creators from selected records/opportunities
  const availableCreators = [...new Set([
    ...records.map(r => r.creatorName).filter(Boolean),
    ...opportunities.map(o => o.creatorName).filter(Boolean),
  ])];

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setSelectedCampaign("");
      setSelectedDeal("");
      setSelectedCreators([]);
      setSelectedBrand("");
      setIncludeCreatorStats(true);
      setIncludeCampaignOverview(true);
      setIncludeResults(false);
      setIncludeNotes(false);
      setIntroText("");
      setSummaryText("");
      setCommentaryText("");
      setSummaryPreview(null);
    }
  }, [open]);

  const handleSummarizeWithAI = async (field) => {
    setSummarizing(field);
    try {
      // Get context for AI summarization
      const context = {
        campaign: campaigns.find(c => c.id === selectedCampaign),
        deal: deals.find(d => d.id === selectedDeal),
        creators: selectedCreators,
        brand: selectedBrand,
        includeCreatorStats,
        includeCampaignOverview,
        includeResults,
        includeNotes,
      };

      const response = await fetch("/api/deck/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, context }),
      });

      if (!response.ok) throw new Error("Summarization failed");

      const { summary } = await response.json();
      setSummaryPreview({ field, text: summary });
    } catch (err) {
      console.error("AI summarization error:", err);
      alert("Unable to generate summary. Please try again.");
    } finally {
      setSummarizing(null);
    }
  };

  const handleUseSummary = () => {
    if (!summaryPreview) return;

    if (summaryPreview.field === "intro") {
      setIntroText(summaryPreview.text);
    } else if (summaryPreview.field === "summary") {
      setSummaryText(summaryPreview.text);
    } else if (summaryPreview.field === "commentary") {
      setCommentaryText(summaryPreview.text);
    }

    setSummaryPreview(null);
  };

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      const deckData = {
        context: {
          campaign: selectedCampaign,
          deal: selectedDeal,
          creators: selectedCreators,
          brand: selectedBrand,
        },
        content: {
          includeCreatorStats,
          includeCampaignOverview,
          includeResults,
          includeNotes,
        },
        text: {
          intro: introText,
          summary: summaryText,
          commentary: commentaryText,
        },
      };

      const response = await fetch("/api/deck/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deckData),
      });

      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deck-${selectedBrand || "outreach"}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Unable to generate PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const toggleCreator = (creator) => {
    setSelectedCreators(prev =>
      prev.includes(creator)
        ? prev.filter(c => c !== creator)
        : [...prev, creator]
    );
  };

  if (!open) return null;

  return (
    <aside className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl overflow-y-auto rounded-3xl border border-brand-black/10 bg-brand-white shadow-[0_24px_80px_rgba(0,0,0,0.15)]"
          style={{ maxHeight: "90vh" }}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-black/10 bg-brand-white px-6 py-4">
          <div>
            <h2 className="font-display text-2xl uppercase text-brand-black">Create Deck</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-brand-black/60">
              Fast branded PDF generation
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-black"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGeneratePDF}
              disabled={generatingPDF || !selectedBrand}
              className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
            >
              {generatingPDF ? "Generating..." : "Generate PDF"}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Section 1: Deck Context */}
          <section>
            <h3 className="mb-3 font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              Deck context
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black">
                  Brand *
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-sm"
                >
                  <option value="">Select brand...</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black">
                  Campaign
                </label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-sm"
                >
                  <option value="">None</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name || campaign.title || `Campaign ${campaign.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black">
                  Deal
                </label>
                <select
                  value={selectedDeal}
                  onChange={(e) => setSelectedDeal(e.target.value)}
                  className="w-full rounded-full border border-brand-black/20 bg-brand-white px-4 py-2 text-sm"
                >
                  <option value="">None</option>
                  {deals.map(deal => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title || `Deal ${deal.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-brand-black">
                  Creators
                </label>
                <div className="rounded-2xl border border-brand-black/20 bg-brand-white p-3">
                  {availableCreators.length === 0 ? (
                    <p className="text-xs text-brand-black/50">No creators available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableCreators.slice(0, 5).map(creator => (
                        <button
                          key={creator}
                          type="button"
                          onClick={() => toggleCreator(creator)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            selectedCreators.includes(creator)
                              ? "bg-brand-red text-white"
                              : "bg-brand-linen text-brand-black"
                          }`}
                        >
                          {creator}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Content Blocks */}
          <section>
            <h3 className="mb-3 font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              Content blocks
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-full border border-brand-black/10 bg-brand-linen/30 px-4 py-3">
                <input
                  type="checkbox"
                  checked={includeCreatorStats}
                  onChange={(e) => setIncludeCreatorStats(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-brand-black">Creator stats & reach</span>
              </label>

              <label className="flex items-center gap-3 rounded-full border border-brand-black/10 bg-brand-linen/30 px-4 py-3">
                <input
                  type="checkbox"
                  checked={includeCampaignOverview}
                  onChange={(e) => setIncludeCampaignOverview(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-brand-black">Campaign overview & timeline</span>
              </label>

              <label className="flex items-center gap-3 rounded-full border border-brand-black/10 bg-brand-linen/30 px-4 py-3">
                <input
                  type="checkbox"
                  checked={includeResults}
                  onChange={(e) => setIncludeResults(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-brand-black">Results & performance metrics</span>
              </label>

              <label className="flex items-center gap-3 rounded-full border border-brand-black/10 bg-brand-linen/30 px-4 py-3">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-brand-black">Notes & conversation highlights</span>
              </label>
            </div>
          </section>

          {/* Section 3: Text Inputs with AI */}
          <section>
            <h3 className="mb-3 font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
              Custom text
            </h3>
            <div className="space-y-4">
              {/* Intro */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black">
                    Introduction
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSummarizeWithAI("intro")}
                    disabled={summarizing === "intro"}
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red hover:underline disabled:opacity-50"
                  >
                    {summarizing === "intro" ? "Summarising..." : "Summarise with AI"}
                  </button>
                </div>
                <textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  placeholder="Opening remarks, deck purpose, key message..."
                  rows={3}
                  className="w-full rounded-2xl border border-brand-black/20 bg-brand-white p-4 text-sm"
                />
                {summaryPreview?.field === "intro" && (
                  <div className="mt-2 rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                        AI Suggestion
                      </p>
                      <button
                        type="button"
                        onClick={handleUseSummary}
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:underline"
                      >
                        Use This
                      </button>
                    </div>
                    <p className="text-sm text-brand-black">{summaryPreview.text}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black">
                    Executive summary
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSummarizeWithAI("summary")}
                    disabled={summarizing === "summary"}
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red hover:underline disabled:opacity-50"
                  >
                    {summarizing === "summary" ? "Summarising..." : "Summarise with AI"}
                  </button>
                </div>
                <textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  placeholder="High-level overview, key points, call to action..."
                  rows={3}
                  className="w-full rounded-2xl border border-brand-black/20 bg-brand-white p-4 text-sm"
                />
                {summaryPreview?.field === "summary" && (
                  <div className="mt-2 rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                        AI Suggestion
                      </p>
                      <button
                        type="button"
                        onClick={handleUseSummary}
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:underline"
                      >
                        Use This
                      </button>
                    </div>
                    <p className="text-sm text-brand-black">{summaryPreview.text}</p>
                  </div>
                )}
              </div>

              {/* Commentary */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black">
                    Additional commentary
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSummarizeWithAI("commentary")}
                    disabled={summarizing === "commentary"}
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red hover:underline disabled:opacity-50"
                  >
                    {summarizing === "commentary" ? "Summarising..." : "Summarise with AI"}
                  </button>
                </div>
                <textarea
                  value={commentaryText}
                  onChange={(e) => setCommentaryText(e.target.value)}
                  placeholder="Context, insights, next steps..."
                  rows={3}
                  className="w-full rounded-2xl border border-brand-black/20 bg-brand-white p-4 text-sm"
                />
                {summaryPreview?.field === "commentary" && (
                  <div className="mt-2 rounded-2xl border border-brand-red/20 bg-brand-red/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-red">
                        AI Suggestion
                      </p>
                      <button
                        type="button"
                        onClick={handleUseSummary}
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-black hover:underline"
                      >
                        Use This
                      </button>
                    </div>
                    <p className="text-sm text-brand-black">{summaryPreview.text}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>
    </aside>
  );
}
