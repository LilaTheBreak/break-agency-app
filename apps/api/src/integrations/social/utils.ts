const NOT_IMPLEMENTED_MESSAGE = "Not implemented — social schema models were removed";

export async function ensureSocialToken() {
  throw new Error(NOT_IMPLEMENTED_MESSAGE);
}

export function createIntegrationError(provider: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const err = new Error(`[${provider}] ${message}`);
  return err;
}
