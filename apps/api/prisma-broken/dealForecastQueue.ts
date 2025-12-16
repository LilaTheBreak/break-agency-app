import { createSafeQueue } from '../../queues/index.js';

export const dealForecastQueue = createSafeQueue('deal-forecast');