export function safeEnv(name: string, fallback = "") {
  const value = process.env[name];
  if (!value) {
    console.warn(`[WARN] Missing env var: ${name}, using fallback.`);
    return fallback;
  }
  return value;
}
