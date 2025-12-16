const SKIP_RESPONSE = {
  skipped: true,
  reason: "Deal automation disabled — dealThread models removed from schema"
};

export async function runDealAutomation() {
  return SKIP_RESPONSE;
}
