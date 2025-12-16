// Placeholder forecast engine so backend starts without errors.

export async function generateForecast(data: any) {
  return {
    closeProbability: 0.5,
    recommendedRate: null,
    timeline: null,
    summary: "Forecast placeholder response.",
    data,
  };
}
