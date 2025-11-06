export function saveSession(user) {
  localStorage.setItem("user", JSON.stringify(user));
}
export function getSession() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}
export function clearSession() {
  localStorage.removeItem("user");
}
