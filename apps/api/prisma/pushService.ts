interface PushPayload {
  to: string; // User's push token
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Sends a push notification.
 * This is a stub implementation.
 */
export async function sendPushNotification(payload: PushPayload) {
  console.log(`[PUSH STUB] Sending to ${payload.to}: "${payload.title}" - "${payload.body}"`);
  // In a real app, this would use Expo's or Firebase's SDK to send a notification.
  return { status: 'ok' };
}