import { createSafeQueue } from '../../queues/index.js';

export const budgetPlanQueue = createSafeQueue('budget-plan');