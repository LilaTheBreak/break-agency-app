import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requestUploadUrl, confirmUpload, listUserFiles, getDownloadUrl } from "../services/fileService.js";
import { sendSlackAlert } from "../integrations/slack/slackClient.js";

const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1)
});

const confirmSchema = z.object({
  fileKey: z.string().min(1),
  filename: z.string().min(1),
  type: z.string().min(1)
});

export async function handleRequestUploadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }
    const payload = uploadUrlSchema.parse(req.body ?? {});
    const result = await requestUploadUrl(req.user.id, payload.filename, payload.contentType);
    res.json(result);
  } catch (error) {
    await sendSlackAlert("Upload URL request failed", { error: `${error}` });
    next(error);
  }
}

export async function handleConfirmUpload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }
    const payload = confirmSchema.parse(req.body ?? {});
    const file = await confirmUpload(req.user.id, payload.fileKey, payload.filename, payload.type);
    res.json({ file });
  } catch (error) {
    await sendSlackAlert("Upload confirm failed", { error: `${error}` });
    next(error);
  }
}

export async function handleListFiles(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }
    const targetUser = typeof req.query.userId === "string" ? req.query.userId : req.user.id;
    const folder = typeof req.query.folder === "string" ? req.query.folder : undefined;
    const isAdmin = req.user.roles?.some((role) => role.toLowerCase() === "admin");
    if (targetUser !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }
    const files = await listUserFiles(targetUser, folder);
    res.json({ files });
  } catch (error) {
    next(error);
  }
}

export async function handleDownloadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: true, message: "Authentication required" });
    }
    const isAdmin = req.user.roles?.some((role) => role.toLowerCase() === "admin") || false;
    const fileId = req.params.id;
    const file = await getDownloadUrl(fileId, req.user.id, isAdmin);
    res.json({ url: file.url });
  } catch (error) {
    next(error);
  }
}
