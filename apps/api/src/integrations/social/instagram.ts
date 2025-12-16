const NOT_IMPLEMENTED_MESSAGE = "Not implemented — social schema models were removed";

export async function getProfileStats() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

export async function getLatestPosts() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

export async function refreshToken() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}
