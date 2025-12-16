import { createSafeQueue } from '../../queues/index.js';

export const deadlineGuardQueue = createSafeQueue('deadline-guard');