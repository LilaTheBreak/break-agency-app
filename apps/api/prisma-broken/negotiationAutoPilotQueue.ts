import { createSafeQueue } from '../../queues/index.js';

export const negotiationAutoPilotQueue = createSafeQueue('negotiation-autopilot');