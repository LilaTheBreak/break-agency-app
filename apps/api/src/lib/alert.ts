import { sendSlackAlert } from '../integrations/slack/slackClient';
import { logError } from './logger';

export async function alertError(
  message: string,
  error: unknown,
  meta: Record<string, unknown> = {}
) {
  logError(message, error, meta);
  await sendSlackAlert(message, { error: `${error}`, ...meta });
}
