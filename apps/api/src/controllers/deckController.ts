import type { Request, Response } from "express";
import PDFDocument from "pdfkit";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate branded PDF deck from CRM data
 * POST /api/deck/generate
 */
export async function generateDeck(req: Request, res: Response) {
  try {
    const { context, content, text } = req.body;

    // Create PDF document
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="deck-${context.brand || "outreach"}-${Date.now()}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Brand colors
    const brandBlack = "#000000";
    const brandRed = "#a70f0c";
    const brandIvory = "#fafaf6";

    // === Cover Page ===
    doc.fillColor(brandBlack);
    doc.fontSize(36).font("Helvetica-Bold").text("BREAK", 60, 200, { align: "left" });
    doc.fontSize(18).font("Helvetica").text(context.brand || "Outreach Deck", 60, 250);
    
    if (text.intro) {
      doc.fontSize(12)
        .font("Helvetica")
        .fillColor("#666666")
        .text(text.intro, 60, 320, { width: 475, align: "left" });
    }

    doc.fontSize(10)
      .fillColor(brandRed)
      .text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase(), 60, 750);

    // === Context Page ===
    doc.addPage();
    doc.fillColor(brandRed).fontSize(10).text("DECK CONTEXT", 60, 60);
    doc.moveDown(0.5);

    const contextY = doc.y;
    doc.fillColor(brandBlack).fontSize(14).font("Helvetica-Bold");

    if (context.brand) {
      doc.text(`Brand: ${context.brand}`, 60, doc.y);
      doc.moveDown(0.5);
    }

    if (context.campaign) {
      doc.text(`Campaign: ${context.campaign}`, 60, doc.y);
      doc.moveDown(0.5);
    }

    if (context.deal) {
      doc.text(`Deal: ${context.deal}`, 60, doc.y);
      doc.moveDown(0.5);
    }

    if (context.creators?.length > 0) {
      doc.text(`Creators: ${context.creators.join(", ")}`, 60, doc.y, { width: 475 });
      doc.moveDown(0.5);
    }

    // === Content Blocks ===
    if (content.includeCreatorStats) {
      doc.addPage();
      doc.fillColor(brandRed).fontSize(10).text("CREATOR STATS & REACH", 60, 60);
      doc.moveDown();
      doc.fillColor(brandBlack).fontSize(12).font("Helvetica").text(
        "Creator statistics and audience reach data would be displayed here based on selected creators.",
        60,
        doc.y,
        { width: 475 }
      );
    }

    if (content.includeCampaignOverview) {
      doc.addPage();
      doc.fillColor(brandRed).fontSize(10).text("CAMPAIGN OVERVIEW", 60, 60);
      doc.moveDown();
      doc.fillColor(brandBlack).fontSize(12).font("Helvetica").text(
        "Campaign timeline, objectives, deliverables, and key milestones would be displayed here.",
        60,
        doc.y,
        { width: 475 }
      );
    }

    if (content.includeResults) {
      doc.addPage();
      doc.fillColor(brandRed).fontSize(10).text("RESULTS & PERFORMANCE", 60, 60);
      doc.moveDown();
      doc.fillColor(brandBlack).fontSize(12).font("Helvetica").text(
        "Campaign performance metrics, engagement rates, ROI, and key insights would be displayed here.",
        60,
        doc.y,
        { width: 475 }
      );
    }

    if (content.includeNotes) {
      doc.addPage();
      doc.fillColor(brandRed).fontSize(10).text("NOTES & HIGHLIGHTS", 60, 60);
      doc.moveDown();
      doc.fillColor(brandBlack).fontSize(12).font("Helvetica").text(
        "Conversation highlights, key decisions, and important notes would be displayed here.",
        60,
        doc.y,
        { width: 475 }
      );
    }

    // === Summary Page ===
    if (text.summary) {
      doc.addPage();
      doc.fillColor(brandRed).fontSize(10).text("EXECUTIVE SUMMARY", 60, 60);
      doc.moveDown();
      doc.fillColor(brandBlack).fontSize(12).font("Helvetica").text(text.summary, 60, doc.y, {
        width: 475,
        align: "left",
      });
    }

    // === Commentary Page ===
    if (text.commentary) {
      doc.addPage();
      doc.fillColor(brandRed).fontSize(10).text("ADDITIONAL COMMENTARY", 60, 60);
      doc.moveDown();
      doc.fillColor(brandBlack).fontSize(12).font("Helvetica").text(text.commentary, 60, doc.y, {
        width: 475,
        align: "left",
      });
    }

    // === Closing Page ===
    doc.addPage();
    doc.fillColor(brandBlack).fontSize(24).font("Helvetica-Bold").text("Thank you", 60, 300);
    doc.fontSize(12)
      .font("Helvetica")
      .fillColor("#666666")
      .text("For more information, please contact us.", 60, 350);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Deck generation error:", error);
    res.status(500).json({ error: "Failed to generate deck" });
  }
}

/**
 * AI summarization for deck text fields
 * POST /api/deck/summarize
 */
export async function summarizeWithAI(req: Request, res: Response) {
  try {
    const { field, context } = req.body;

    // Build prompt based on field and context
    let prompt = "";

    if (field === "intro") {
      prompt = `Write a brief, professional introduction for a brand deck. 
Context: Brand: ${context.brand || "N/A"}, Campaign: ${context.campaign || "N/A"}
Keep it to 2-3 sentences, focused and engaging.`;
    } else if (field === "summary") {
      prompt = `Write an executive summary for a brand deck.
Context: Brand: ${context.brand || "N/A"}, Campaign: ${context.campaign || "N/A"}, Deal: ${context.deal || "N/A"}
Creators: ${context.creators?.join(", ") || "N/A"}
Include: ${context.includeCreatorStats ? "Creator stats" : ""} ${context.includeCampaignOverview ? "Campaign overview" : ""} ${context.includeResults ? "Results" : ""}
Keep it to 3-4 sentences, highlight key points.`;
    } else if (field === "commentary") {
      prompt = `Write additional commentary for a brand deck.
Context: Brand: ${context.brand || "N/A"}, Campaign: ${context.campaign || "N/A"}
Include insights, context, or next steps. Keep it to 2-3 sentences.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional brand strategist writing concise, engaging copy for brand decks. Be direct, avoid fluff.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const summary = completion.choices[0]?.message?.content?.trim() || "";

    res.json({ summary });
  } catch (error) {
    console.error("AI summarization error:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
}
