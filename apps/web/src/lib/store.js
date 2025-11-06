const KEY = "home_app_data_v1";

export function loadAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

export function saveSection(section, data) {
  const all = loadAll();
  all[section] = { ...(all[section] || {}), ...data, _updatedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(all));
  return all[section];
}

export function getSection(section) {
  const all = loadAll();
  return all[section] || null;
}
