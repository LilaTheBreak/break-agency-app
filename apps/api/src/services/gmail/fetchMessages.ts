import { gmail_v1 as gmailV1 } from "googleapis";
import { getGoogleAPIClient } from "./tokens";

/**
 * Lists and fetches the full details of the last 50 messages for a user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of full Gmail message objects, or null if auth fails.
 */
export async function listAndFetchMessages(userId: string): Promise<gmailV1.Schema$Message[] | null> {
  const gmail = await getGoogleAPIClient(userId);
  if (!gmail) {
    console.error(`Could not get Gmail client for user ${userId}. Token might be missing or expired.`);
    return null;
  }

  // 1. List the most recent 50 message IDs
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults: 50,
    q: "in:inbox" // Only fetch messages from the inbox
  });

  const messages = listResponse.data.messages;
  if (!messages || messages.length === 0) {
    console.log(`No new messages found for user ${userId}.`);
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
    );

  const fullMessages = await Promise.all(messagePromises);

  // Filter out any failed requests which might result in null/undefined entries
  return fullMessages.filter((msg): msg is gmailV1.Schema$Message => !!msg);
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