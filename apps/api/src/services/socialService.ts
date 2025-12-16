const NOT_IMPLEMENTED_MESSAGE = "Not implemented — social schema models were removed";

export async function connectSocialAccount() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

export async function getSocialAnalyticsForUser() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

export async function refreshSocialAnalytics() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}
