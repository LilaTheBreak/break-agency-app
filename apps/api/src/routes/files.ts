import { Router, type Request, type Response, type NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { deleteObject } from "../lib/s3.js";
import {
  requestUploadUrl,
  confirmUpload,
  listUserFiles,
  getDownloadUrl
} from "../services/fileService.js";
// import slackClient from "../integrations/slack/slackClient.js";

const router = Router();

router.get("/", requireUser, async (req, res, next) => {
  try {
    const currentUser = req.user!;
    const folder = typeof req.query.folder === "string" ? req.query.folder : undefined;
    const targetUser = typeof req.query.userId === "string" ? req.query.userId : currentUser.id;
    const isAdmin = currentUser.roles?.some((role) => role.toLowerCase() === "admin") || false;
    if (targetUser !== currentUser.id && !isAdmin) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }
    const files = await listUserFiles(targetUser, folder);
    res.json({ files });
  } catch (err) {
    next(err);
  }
});

router.post("/upload-url", requireUser, async (req, res, next) => {
  try {
    const currentUser = req.user!;
    const { filename, contentType } = req.body ?? {};
    if (!filename || !contentType) {
      return res.status(400).json({ error: true, message: "filename and contentType are required" });
    }
    const result = await requestUploadUrl(currentUser.id, filename, contentType);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/confirm", requireUser, async (req, res, next) => {
  try {
    const currentUser = req.user!;
    const { fileKey, filename, type } = req.body ?? {};
    if (!fileKey || !filename || !type) {
      return res.status(400).json({ error: true, message: "fileKey, filename, type are required" });
    }
    const file = await confirmUpload(currentUser.id, fileKey, filename, type);
    res.json({ file });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/download", requireUser, async (req, res, next) => {
  try {
    const currentUser = req.user!;
    const isAdmin = currentUser.roles?.some((role) => role.toLowerCase() === "admin") || false;
    const file = await getDownloadUrl(req.params.id, currentUser.id, isAdmin);
    res.json({ url: file.url });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireUser, async (req, res) => {
  const currentUser = req.user!;
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) {
    return res.status(404).json({ error: true, message: "File not found" });
  }
  const isAdmin = currentUser.roles?.some((role) => role.toLowerCase() === "admin") || false;
  if (file.userId !== currentUser.id && !isAdmin) {
    return res.status(403).json({ error: true, message: "Forbidden" });
  }
  await deleteObject(file.key).catch(() => null);
  await prisma.file.delete({ where: { id: file.id } });
  res.json({ success: true });
});

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: true, message: "Authentication required" });
  }
  next();
}

export default router;
