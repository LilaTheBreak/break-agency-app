const PANDADOC_API_KEY = process.env.PANDADOC_API_KEY || "";
const PANDADOC_BASE_URL = process.env.PANDADOC_BASE_URL || "https://api.pandadoc.com/public/v1";
const PANDADOC_TEMPLATE_ID = process.env.PANDADOC_TEMPLATE_ID || "";

type Party = {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

type CreateContractArgs = {
  title: string;
  parties: Party[];
  variables?: Record<string, string>;
  templateId?: string;
};

export async function createContract({ title, parties, variables = {}, templateId }: CreateContractArgs) {
  if (!PANDADOC_API_KEY || !(templateId || PANDADOC_TEMPLATE_ID)) {
    return {
      externalId: `mock-${Date.now()}`,
      fileUrl: `https://app.pandadoc.com/document/mock-${Date.now()}`,
      status: "draft"
    };
  }
  const payload = {
    name: title,
    template_uuid: templateId || PANDADOC_TEMPLATE_ID,
    recipients: parties.map((party, index) => ({
      email: party.email,
      first_name: party.firstName || party.email.split("@")[0],
      last_name: party.lastName || "",
      role: party.role || `signer${index + 1}`
    })),
    tokens: Object.entries(variables).map(([name, value]) => ({ name, value }))
  };
  const response = await pandaRequest("/documents", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create contract: ${text}`);
  }
  const data = await response.json();
  return {
    externalId: data?.id ?? `mock-${Date.now()}`,
    fileUrl: data?.links?.document ?? data?.download_url ?? "",
    status: data?.status ?? "draft"
  };
}

export async function sendForSignature(contractId: string, recipients: Party[]) {
  if (!contractId) throw new Error("contractId is required");
  if (!PANDADOC_API_KEY) {
    return { status: "sent" };
  }
  const payload = {
    silent: false,
    recipients: recipients.map((party, index) => ({
      email: party.email,
      first_name: party.firstName || party.email.split("@")[0],
      last_name: party.lastName || "",
      role: party.role || `signer${index + 1}`
    }))
  };
  const response = await pandaRequest(`/documents/${contractId}/send`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send contract: ${text}`);
  }
  return { status: "sent" };
}

export async function getSignatureStatus(contractId: string) {
  if (!contractId) throw new Error("contractId is required");
  if (!PANDADOC_API_KEY) {
    return { status: "signed" };
  }
  const response = await pandaRequest(`/documents/${contractId}`, { method: "GET" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch status: ${text}`);
  }
  const data = await response.json();
  return {
    status: data?.status ?? "unknown",
    fileUrl: data?.download_url ?? data?.links?.document ?? ""
  };
}

function pandaRequest(path: string, options: RequestInit) {
  if (!PANDADOC_API_KEY) {
    return Promise.resolve(
      new Response("PandaDoc API key missing", {
        status: 503
      })
    );
  }
  return fetch(`${PANDADOC_BASE_URL.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      Authorization: `API-Key ${PANDADOC_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}
