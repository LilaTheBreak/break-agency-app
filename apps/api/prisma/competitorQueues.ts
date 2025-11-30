import { createSafeQueue } from '../../queues/index.js';

export const competitorDiscoveryQueue = createSafeQueue('competitor-discovery');
export const competitorScrapeQueue = createSafeQueue('competitor-scrape');
export const competitorAnalysisQueue = createSafeQueue('competitor-analysis');