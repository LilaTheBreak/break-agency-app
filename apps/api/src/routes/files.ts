import { Router, type Request, type Response, type NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { uploadFile, generateSignedUrl, deleteFile } from "../services/storage/storageClient.js";

const router = Router();

const MAX_SIZE = 250 * 1024 * 1024;
const ALLOWED_TYPES = ["pdf", "png", "mov", "mp4", "docx"];

router.get("/files", requireUser, async (req, res) => {
  const currentUser = req.user!;
  const folder = typeof req.query.folder === "string" ? req.query.folder : undefined;
  const targetUser = typeof req.query.userId === "string" ? req.query.userId : currentUser.id;
  if (targetUser !== currentUser.id && !isAdmin(currentUser)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  const files = await prisma.file.findMany({
    where: {
      userId: targetUser,
      folder: folder || undefined
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const hydrated = await Promise.all(
    files.map(async (file) => ({
      ...file,
      url: await generateSignedUrl(file.key).catch(() => file.url)
    }))
  );
  res.json({ files: hydrated });
});

router.post("/files/upload", requireUser, async (req, res) => {
  const currentUser = req.user!;
  const { filename, content, folder = "general" } = req.body ?? {};
  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "filename is required" });
  }
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "content is required" });
  }
  const ext = getExtension(filename);
  if (!ALLOWED_TYPES.includes(ext)) {
    return res.status(400).json({ error: "File type not allowed" });
  }
  const base64 = content.includes(",") ? content.split(",").pop() || "" : content;
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) {
    return res.status(400).json({ error: "Invalid file content" });
  }
  if (buffer.length > MAX_SIZE) {
    return res.status(400).json({ error: "File exceeds 250MB limit" });
  }
  const storageFolder = `${folder}/${currentUser.id}`;
  const upload = await uploadFile(buffer, filename, storageFolder);
  const fileRecord = await prisma.file.create({
    data: {
      userId: currentUser.id,
      key: upload.key,
      url: upload.url,
      filename,
      type: ext,
      folder
    }
  });
  const signedUrl = await generateSignedUrl(upload.key).catch(() => upload.url);
  res.status(201).json({ file: { ...fileRecord, url: signedUrl } });
});

router.get("/files/:id", requireUser, async (req, res) => {
  const currentUser = req.user!;
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }
  if (file.userId !== currentUser.id && !isAdmin(currentUser)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  const url = await generateSignedUrl(file.key).catch(() => file.url);
  res.json({ file: { ...file, url } });
});

router.delete("/files/:id", requireUser, async (req, res) => {
  const currentUser = req.user!;
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }
  if (file.userId !== currentUser.id && !isAdmin(currentUser)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  await deleteFile(file.key).catch(() => null);
  await prisma.file.delete({ where: { id: file.id } });
  res.json({ success: true });
});

function getExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function isAdmin(user: { roles?: string[] }) {
  return Boolean(user.roles?.some((role) => role === "admin" || role === "founder"));
}

export default router;
