const NOT_IMPLEMENTED_MESSAGE = "Not implemented — social schema models were removed";

export async function getStatsForUser() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

export async function getPostsForUser() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

export async function refreshSocialIntegrations() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}
