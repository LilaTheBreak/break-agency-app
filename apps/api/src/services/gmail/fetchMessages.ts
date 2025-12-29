import { gmail_v1 as gmailV1 } from "googleapis";
import { getGoogleAPIClient, GmailNotConnectedError } from "./tokens.js";

/**
 * Lists and fetches the full details of the last 50 messages for a user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of full Gmail message objects, or null if auth fails.
 */
export async function listAndFetchMessages(userId: string): Promise<gmailV1.Schema$Message[] | null> {
  try {
    const gmail = await getGoogleAPIClient(userId);
    if (!gmail) {
      console.error(`[GMAIL FETCH] Could not get Gmail client for user ${userId}. Token might be missing or expired.`);
      return null;
    }

    // 1. List the most recent 50 message IDs
    let listResponse;
    try {
      listResponse = await gmail.users.messages.list({
        userId: "me",
        maxResults: 50,
        q: "in:inbox" // Only fetch messages from the inbox
      });
    } catch (listError: any) {
      console.error(`[GMAIL FETCH] Failed to list messages for user ${userId}:`, {
        error: listError instanceof Error ? listError.message : String(listError),
        code: listError?.code,
        status: listError?.response?.status,
        statusText: listError?.response?.statusText,
      });
      throw listError; // Re-throw to be handled by caller
    }

    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      console.log(`[GMAIL FETCH] No new messages found for user ${userId}.`);
      return [];
    }

    // 2. Batch fetch the full details for each message
    // Note: Google's batch API would be more efficient here for a large number of requests.
    // For 50 messages, individual requests are acceptable but less optimal.
    const messagePromises = messages
      .filter((msg) => msg.id)
      .map((msg) =>
        gmail.users.messages
          .get({
            userId: "me",
            id: msg.id!,
            format: "full" // 'full' gets payload with body, headers, etc.
          })
          .then((res) => res.data)
          .catch((getError) => {
            // Log individual message fetch failures but don't fail entire sync
            console.warn(`[GMAIL FETCH] Failed to fetch message ${msg.id} for user ${userId}:`, {
              error: getError instanceof Error ? getError.message : String(getError),
              messageId: msg.id,
            });
            return null; // Return null for failed fetches
          })
      );

    const fullMessages = await Promise.all(messagePromises);

    // Filter out any failed requests which might result in null/undefined entries
    const validMessages = fullMessages.filter((msg): msg is gmailV1.Schema$Message => !!msg);
    
    if (validMessages.length < fullMessages.length) {
      console.warn(`[GMAIL FETCH] Some messages failed to fetch for user ${userId}: ${fullMessages.length - validMessages.length} failed`);
    }
    
    return validMessages;
  } catch (error) {
    // If it's a GmailNotConnectedError, return null (handled by caller)
    if (error instanceof GmailNotConnectedError) {
      return null;
    }
    
    // Log and re-throw other errors
    console.error(`[GMAIL FETCH] Unexpected error fetching messages for user ${userId}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Fetches a single full thread from the Gmail API.
 * @param userId The ID of the user.
 * @param threadId The Gmail ID of the thread.
 * @returns A promise that resolves to the full thread object, or null if auth fails.
 */
export async function fetchGmailThread(userId: string, threadId: string): Promise<gmailV1.Schema$Thread | null> {
  const gmail = await getGoogleAPIClient(userId);
  if (!gmail) {
    return null;
  }

  const threadResponse = await gmail.users.threads.get({ userId: "me", id: threadId });
  return threadResponse.data;
}