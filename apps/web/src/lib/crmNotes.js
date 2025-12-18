const STORAGE_KEY = "break_admin_crm_notes_v1";

export const NOTE_TYPES = [
  "Relationship insight",
  "Commercial insight",
  "Process / preference",
  "Risk / caution",
  "General"
];

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function readCrmNotes() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeCrmNotes(notes) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(notes) ? notes : []));
}

export function upsertCrmNote(nextNote) {
  const notes = readCrmNotes();
  const exists = notes.some((n) => n.id === nextNote.id);
  const updated = exists ? notes.map((n) => (n.id === nextNote.id ? nextNote : n)) : [nextNote, ...notes];
  writeCrmNotes(updated);
  return updated;
}

export function deleteCrmNote(noteId) {
  const notes = readCrmNotes();
  const updated = notes.filter((n) => n.id !== noteId);
  writeCrmNotes(updated);
  return updated;
}

export function validateNote(note) {
  const errors = [];
  if (!note?.noteText?.trim()) errors.push("Note text is required.");
  const hasContext = Boolean(note?.brandId || note?.contactId || note?.dealId);
  if (!hasContext) errors.push("Notes must be attached to a brand, contact, or deal.");
  return { ok: errors.length === 0, errors };
}

export function listNotesForContext({ brandId, contactId, dealId }) {
  const notes = readCrmNotes();
  return notes.filter((note) => {
    if (dealId && note.dealId === dealId) return true;
    if (contactId && note.contactId === contactId) return true;
    if (brandId && note.brandId === brandId) return true;
    return false;
  });
}

