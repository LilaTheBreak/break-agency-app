import { apiFetch } from "./apiClient.js";

export async function login(email, password) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function signup(email, password, role) {
  return apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, role })
  });
}

export async function getCurrentUser() {
  return apiFetch("/api/auth/me");
}
