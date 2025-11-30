export async function fetchInstagramDMs(accessToken: string) {
  // Placeholder: integrate with Instagram Graph API for direct message ingestion.
  // Returns a normalized structure for downstream ingestion.
  return [
    {
      externalId: "ig_123",
      senderHandle: "brandxyz",
      senderName: "Brand XYZ",
      senderImage: "https://example.com/avatar.png",
      message: "We’d love to send a PR package",
      raw: {}
    }
  ];
}
