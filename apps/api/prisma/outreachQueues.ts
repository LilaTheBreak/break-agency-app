import { createSafeQueue } from '../../queues/index.js';

export const outreachInputQueue = createSafeQueue('outreach-input');
export const outreachGenerateQueue = createSafeQueue('outreach-generate');
export const outreachSendQueue = createSafeQueue('outreach-send');