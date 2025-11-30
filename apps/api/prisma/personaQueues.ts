import { createSafeQueue } from '../../queues/index.js';

export const personaExtractionQueue = createSafeQueue('persona-extraction');
export const personaTrainingQueue = createSafeQueue('persona-training');