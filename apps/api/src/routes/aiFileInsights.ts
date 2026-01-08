import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { getDownloadUrl } from "../services/fileService.js";
import { cleanText, detectFileType, extractText, splitIntoChunks } from "../lib/fileExtract.js";
import { generateFileInsights, InvalidAiResponseError } from "../services/aiFileInsightsService.js";
import { isAdmin as checkIsAdmin } from "../lib/roleHelpers.js";
import { logAIInteraction } from "../lib/aiHistoryLogger.js";

const router = Router();

const requestSchema = z.object({
  fileId: z.string().min(1)
});

router.post("/ai/file-insights", requireAuth, async (req: Request, res: Response) => {
  const parsed = requestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "fileId is required" });
  }

  const currentUser = req.user!;
  const userIsAdmin = checkIsAdmin(currentUser);

  try {
    const file = await getDownloadUrl(parsed.data.fileId, currentUser.id, userIsAdmin);

    const download = await fetch(file.url);
    if (!download.ok) {
      return res.status(400).json({ success: false, message: "File not readable" });
    }
    const arrayBuffer = await download.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detectedType = await detectFileType(buffer, file.filename);
    let rawText = "";
    try {
      rawText = await extractText(buffer, detectedType);
    } catch (error) {
      const message = detectedType === "image" ? "OCR failure" : "Unable to extract text";
      return res.status(400).json({ success: false, message });
    }

    const cleaned = cleanText(rawText).slice(0, 20000);
    const chunks = splitIntoChunks(cleaned, 1800);

    try {
      const aiResult = await generateFileInsights({
        text: chunks.join("\n\n"),
        filename: file.filename,
        detectedType: detectedType
      });

      // Log AI history
      await logAIInteraction(
        currentUser.id,
        `Analyze file: ${file.filename}`,
        JSON.stringify(aiResult),
        "file_insights",
        { fileId: parsed.data.fileId, filename: file.filename, detectedType }
      ).catch(err => console.error("[AI History] Failed to log file insights:", err));

      return res.json(aiResult);
    } catch (error) {
      if (error instanceof InvalidAiResponseError) {
        return res.status(400).json({ success: false, message: "AI returned invalid JSON" });
      }
      return res.status(500).json({ success: false, message: "Unable to generate insights" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch file";
    const status = message.toLowerCase().includes("forbidden") ? 403 : 400;
    return res.status(status).json({ success: false, message });
  }
});

export default router;
