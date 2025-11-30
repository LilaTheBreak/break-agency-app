/**
 * Fetches the list of recent emails from the backend.
 * @param {object} filters - Optional filters to apply.
 * @returns {Promise<Array>} A promise that resolves to an array of emails.
 */
export async function getInbox(filters = {}) {
  // In a real app, you'd pass filters as query params.
  // const query = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/inbox/recent`);
  if (!response.ok) {
    throw new Error("Failed to fetch inbox data.");
  }
  return response.json();
}

/**
 * Fetches a single email's details.
 * NOTE: The current backend doesn't have a single-email endpoint,
 * so this simulates fetching by finding it in the full list.
 * @param {string} id - The ID of the email to fetch.
 * @returns {Promise<object>} A promise that resolves to the email object.
 */
export async function getEmail(id) {
  const inbox = await getInbox();
  const email = inbox.find((e) => e.id === id);
  if (!email) {
    throw new Error(`Email with id ${id} not found.`);
  }
  // We'd also fetch the full body here if the API supported it.
  email.body = "This is a placeholder for the full email body, which would be fetched from a dedicated endpoint.";
  return email;
}

/**
 * Creates a deal draft from an email.
 * @param {string} emailId - The ID of the source email.
 * @returns {Promise<object>} A promise that resolves to the new deal draft.
 */
export async function createDealDraft(emailId) {
  const response = await fetch(`/api/deals/drafts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailId }),
  });
  if (!response.ok) {
    throw new Error("Failed to create deal draft.");
  }
  return response.json();
}

/**
 * Marks an email with a specific priority status.
 * @param {string} id - The ID of the email to update.
 * @returns {Promise<object>} A promise that resolves to the updated email.
 */
export async function markAsPriority(id) {
  const response = await fetch(`/api/inbox/${id}/priority`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to mark as priority.");
  }
  return response.json();
}