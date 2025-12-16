const SKIP_RESPONSE = {
  skipped: true,
  reason: "Deal insights disabled — dependent models removed from schema"
};

export async function generateDealInsights() {
  return SKIP_RESPONSE;
}
