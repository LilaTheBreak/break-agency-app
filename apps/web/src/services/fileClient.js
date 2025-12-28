import { apiFetch } from "./apiClient.js";

const ALLOWED_TYPES = ["pdf", "png", "mov", "mp4", "docx"];

export async function uploadFileRequest({ file, folder }) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_TYPES.includes(extension)) {
    throw new Error("Unsupported file type");
  }
  const content = await fileToBase64(file);
  const response = await apiFetch("/api/files/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filename: file.name,
      content,
      folder
    })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to upload");
  }
  return response.json();
}

export async function listFilesRequest({ folder, userId }) {
  const params = new URLSearchParams();
  if (folder) params.set("folder", folder);
  if (userId) params.set("userId", userId);
  const query = params.toString();
  const response = await apiFetch(`/api/files${query ? `?${query}` : ""}`);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to load files");
  }
  return response.json();
}

export async function deleteFileRequest({ id }) {
  const response = await apiFetch(`/api/files/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to delete file");
  }
  return response.json();
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
