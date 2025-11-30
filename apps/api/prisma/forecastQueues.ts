import { createSafeQueue } from '../../queues/index.js';

export const forecastBuildQueue = createSafeQueue('forecast-build');
export const forecastPredictQueue = createSafeQueue('forecast-predict');
export const forecastSaveQueue = createSafeQueue('forecast-save');