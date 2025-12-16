// Placeholder email generator so backend starts without errors.

export async function generateEmail(payload: any) {
  return {
    subject: "Placeholder subject",
    body: "Placeholder body content.",
    payload,
  };
}
