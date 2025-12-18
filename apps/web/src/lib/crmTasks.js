const STORAGE_KEY = "break_admin_crm_tasks_v1";

export const TASK_STATUSES = ["Pending", "In progress", "Awaiting release", "Complete"];
export const TASK_PRIORITIES = ["Low", "Medium", "High"];

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function readCrmTasks() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeCrmTasks(tasks) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(tasks) ? tasks : []));
}

export function upsertCrmTask(nextTask) {
  const tasks = readCrmTasks();
  const exists = tasks.some((t) => t.id === nextTask.id);
  const updated = exists ? tasks.map((t) => (t.id === nextTask.id ? nextTask : t)) : [nextTask, ...tasks];
  writeCrmTasks(updated);
  return updated;
}

export function deleteCrmTask(taskId) {
  const tasks = readCrmTasks();
  const updated = tasks.filter((t) => t.id !== taskId);
  writeCrmTasks(updated);
  return updated;
}

export function validateTask(task) {
  const errors = [];
  if (!task?.title?.trim()) errors.push("Task title is required.");
  return { ok: errors.length === 0, errors };
}

