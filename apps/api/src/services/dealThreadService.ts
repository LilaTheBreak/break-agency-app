const SKIP_RESPONSE = {
  skipped: true,
  reason: "dealThread/dealEvent models removed from schema"
};

export async function rebuildDealThreads() {
  return SKIP_RESPONSE;
}

export async function getThreads() {
  return SKIP_RESPONSE;
}

export async function getDealsWithFilters() {
  return SKIP_RESPONSE;
}

export async function getThread() {
  return SKIP_RESPONSE;
}

export async function updateDealThreadStage() {
  return SKIP_RESPONSE;
}

export async function updateDealThreadAssociations() {
  return SKIP_RESPONSE;
}
