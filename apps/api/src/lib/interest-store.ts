import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { sendNotification } from "./mailer.js";
import { env } from "../env.js";

interface InterestEntry {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
}

const STORAGE_DIR = path.resolve(process.cwd(), "storage");
const STORAGE_FILE = path.join(STORAGE_DIR, "interest.json");

async function ensureStorage() {
  await mkdir(STORAGE_DIR, { recursive: true });
}

async function readEntries(): Promise<InterestEntry[]> {
  try {
    const data = await readFile(STORAGE_FILE, "utf-8");
    return JSON.parse(data) as InterestEntry[];
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeEntries(entries: InterestEntry[]) {
  await ensureStorage();
  await writeFile(STORAGE_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

async function notifyTeam(email: string, createdAt: string, name?: string | null) {
  if (!env.NOTIFY_EMAIL) return;
  await sendNotification(
    env.NOTIFY_EMAIL,
    "New Home AI interest submission",
    `A new email has registered interest:<br><br>
     <strong>Email:</strong> ${email}<br>
     ${name ? `<strong>Name:</strong> ${name}<br>` : ""}
     <strong>Submitted:</strong> ${createdAt}<br><br>
     — Home AI website`
  );
}

export async function addInterest(email: string, name?: string | null) {
  const entries = await readEntries();
  const entry: InterestEntry = {
    id: randomUUID(),
    email,
    name: name?.trim() || null,
    createdAt: new Date().toISOString()
  };
  entries.push(entry);
  await writeEntries(entries);
  await notifyTeam(entry.email, entry.createdAt, entry.name);
  return entry;
}

export async function listInterest() {
  return readEntries();
}
