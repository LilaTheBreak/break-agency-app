/**
 * Fetches market benchmark data for a specific type of deliverable.
 * This is a stub for a service that might connect to a third-party data provider.
 * @param deliverableType - e.g., "IG_POST", "YT_VIDEO"
 * @returns An object with market rate benchmarks.
 */
export async function getMarketBenchmark(deliverableType: string) {
  console.log(`[MARKET DATA STUB] Fetching benchmarks for ${deliverableType}`);
  // In a real app, this would query an external API or internal historical data.
  const base = deliverableType.includes('YT') ? 5000 : 1500;
  return {
    marketLow: base * 0.8,
    marketAvg: base * 1.2,
    marketHigh: base * 2.0,
  };
}