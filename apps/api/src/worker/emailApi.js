/**
 * Sends an email.
 * @param {object} payload - The email data.
 * @returns {Promise<object>} The API response.
 */
export async function sendEmail(payload) {
  const response = await fetch('/api/inbox/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to send email.');
  return response.json();
}

/**
 * Generates an AI-powered reply.
 * @param {object} payload - The context for the reply (thread, tone, etc.).
 * @returns {Promise<object>} The API response with the generated text.
 */
export async function generateAIReply(payload) {
  const response = await fetch('/api/ai/email/generate-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to generate AI reply.');
  return response.json();
}

/**
 * Saves an email draft.
 * @param {object} payload - The draft data.
 * @returns {Promise<object>} The API response with the saved draft.
 */
export async function saveDraft(payload) {
  const response = await fetch('/api/inbox/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to save draft.');
  return response.json();
}

/**
 * Fetches a conversation thread.
 * @param {string} threadId - The ID of the thread.
 * @returns {Promise<Array>} A list of messages in the thread.
 */
export async function getThread(threadId) {
  const response = await fetch(`/api/inbox/thread/${threadId}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch thread.');
  return response.json();
}

/**
 * Gets a presigned URL for file uploads and uploads the file.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} The S3 key of the uploaded file.
 */
export async function uploadAttachment(file) {
  // 1. Get presigned URL from our backend
  const presignResponse = await fetch(`/api/files/presign?fileName=${file.name}&fileType=${file.type}`, { credentials: 'include' });
  if (!presignResponse.ok) throw new Error('Could not get presigned URL.');
  const { url, fields, key } = await presignResponse.json();

  // 2. Upload file to S3 using the presigned URL
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  formData.append('file', file);

  const uploadResponse = await fetch(url, { method: 'POST', body: formData });
  if (!uploadResponse.ok) throw new Error('S3 upload failed.');

  return key; // Return the key for the backend to reference
}