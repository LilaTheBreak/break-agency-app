const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function fetchWithAuth(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// ============================================
// BRANDS
// ============================================

export async function fetchBrands() {
  return fetchWithAuth(`${API_BASE}/api/crm-brands`);
}

export async function fetchBrand(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-brands/${id}`);
}

export async function createBrand(data) {
  return fetchWithAuth(`${API_BASE}/api/crm-brands`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBrand(id, data) {
  return fetchWithAuth(`${API_BASE}/api/crm-brands/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteBrand(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-brands/${id}`, {
    method: "DELETE",
  });
}

export async function importLocalStorageData({ brands, contacts, outreach }) {
  return fetchWithAuth(`${API_BASE}/api/crm-brands/batch-import`, {
    method: "POST",
    body: JSON.stringify({ brands, contacts, outreach }),
  });
}

// ============================================
// CONTACTS
// ============================================

export async function fetchContacts(brandId = null) {
  const url = brandId
    ? `${API_BASE}/api/crm-contacts?brandId=${brandId}`
    : `${API_BASE}/api/crm-contacts`;
  return fetchWithAuth(url);
}

export async function fetchContact(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-contacts/${id}`);
}

export async function createContact(data) {
  return fetchWithAuth(`${API_BASE}/api/crm-contacts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateContact(id, data) {
  return fetchWithAuth(`${API_BASE}/api/crm-contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteContact(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-contacts/${id}`, {
    method: "DELETE",
  });
}

export async function addContactNote(id, text, author) {
  return fetchWithAuth(`${API_BASE}/api/crm-contacts/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
}

// ============================================
// OUTREACH RECORDS
// ============================================

export async function fetchOutreachRecords(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.contactId) params.set("contactId", filters.contactId);
  if (filters.dealId) params.set("dealId", filters.dealId);
  if (filters.outcome) params.set("outcome", filters.outcome);
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.limit) params.set("limit", filters.limit);

  const url = `${API_BASE}/api/outreach-records${params.toString() ? `?${params}` : ""}`;
  return fetchWithAuth(url);
}

export async function fetchOutreachRecord(id) {
  return fetchWithAuth(`${API_BASE}/api/outreach-records/${id}`);
}

export async function createOutreachRecord(data) {
  return fetchWithAuth(`${API_BASE}/api/outreach-records`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOutreachRecord(id, data) {
  return fetchWithAuth(`${API_BASE}/api/outreach-records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteOutreachRecord(id) {
  return fetchWithAuth(`${API_BASE}/api/outreach-records/${id}`, {
    method: "DELETE",
  });
}

export async function fetchOutreachStats(brandId = null) {
  const url = brandId
    ? `${API_BASE}/api/outreach-records/summary/stats?brandId=${brandId}`
    : `${API_BASE}/api/outreach-records/summary/stats`;
  return fetchWithAuth(url);
}

// ============================================
// CAMPAIGNS
// ============================================

export async function fetchCampaigns(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.status) params.set("status", filters.status);
  if (filters.owner) params.set("owner", filters.owner);

  const url = `${API_BASE}/api/crm-campaigns${params.toString() ? `?${params}` : ""}`;
  return fetchWithAuth(url);
}

export async function fetchCampaign(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-campaigns/${id}`);
}

export async function createCampaign(data) {
  return fetchWithAuth(`${API_BASE}/api/crm-campaigns`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id, data) {
  return fetchWithAuth(`${API_BASE}/api/crm-campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-campaigns/${id}`, {
    method: "DELETE",
  });
}

export async function linkDealToCampaign(campaignId, dealId, dealLabel = null) {
  return fetchWithAuth(`${API_BASE}/api/crm-campaigns/${campaignId}/link-deal`, {
    method: "POST",
    body: JSON.stringify({ dealId, dealLabel }),
  });
}

export async function unlinkDealFromCampaign(campaignId, dealId) {
  return fetchWithAuth(`${API_BASE}/api/crm-campaigns/${campaignId}/unlink-deal/${dealId}`, {
    method: "DELETE",
  });
}

export async function importCampaignsFromLocalStorage(campaigns) {
  return fetchWithAuth(`${API_BASE}/api/crm-campaigns/batch-import`, {
    method: "POST",
    body: JSON.stringify({ campaigns }),
  });
}

// ============================================
// EVENTS
// ============================================

export async function fetchEvents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.status) params.append("status", filters.status);
  if (filters.owner) params.append("owner", filters.owner);

  const url = params.toString() 
    ? `${API_BASE}/api/crm-events?${params.toString()}`
    : `${API_BASE}/api/crm-events`;
  
  return fetchWithAuth(url);
}

export async function fetchEvent(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-events/${id}`);
}

export async function createEvent(data) {
  return fetchWithAuth(`${API_BASE}/api/crm-events`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id, data) {
  return fetchWithAuth(`${API_BASE}/api/crm-events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-events/${id}`, {
    method: "DELETE",
  });
}

export async function addEventNote(id, text, author) {
  return fetchWithAuth(`${API_BASE}/api/crm-events/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
}

export async function importEventsFromLocalStorage(events) {
  return fetchWithAuth(`${API_BASE}/api/crm-events/batch-import`, {
    method: "POST",
    body: JSON.stringify({ events }),
  });
}

// ------------------------------------------------------
// DEALS
// ------------------------------------------------------

export async function fetchDeals(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.status) params.set("status", filters.status);
  if (filters.owner) params.set("owner", filters.owner);
  
  const url = params.toString()
    ? `${API_BASE}/api/crm-deals?${params.toString()}`
    : `${API_BASE}/api/crm-deals`;
  
  return fetchWithAuth(url);
}

export async function fetchDeal(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-deals/${id}`);
}

export async function createDeal(data) {
  return fetchWithAuth(`${API_BASE}/api/crm-deals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDeal(id, data) {
  return fetchWithAuth(`${API_BASE}/api/crm-deals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDeal(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-deals/${id}`, {
    method: "DELETE",
  });
}

export async function addDealNote(id, text, author) {
  return fetchWithAuth(`${API_BASE}/api/crm-deals/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ text, author }),
  });
}

export async function importDealsFromLocalStorage(deals) {
  return fetchWithAuth(`${API_BASE}/api/crm-deals/batch-import`, {
    method: "POST",
    body: JSON.stringify({ deals }),
  });
}

// ------------------------------------------------------
// CRM Contracts
// ------------------------------------------------------

export async function fetchContracts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.brandId) params.set("brandId", filters.brandId);
  if (filters.dealId) params.set("dealId", filters.dealId);
  if (filters.status) params.set("status", filters.status);
  if (filters.owner) params.set("owner", filters.owner);
  
  const url = params.toString()
    ? `${API_BASE}/api/crm-contracts?${params.toString()}`
    : `${API_BASE}/api/crm-contracts`;
  
  return fetchWithAuth(url);
}

export async function fetchContract(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-contracts/${id}`);
}

export async function createContract(data) {
  return fetchWithAuth(`${API_BASE}/api/crm-contracts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateContract(id, data) {
  return fetchWithAuth(`${API_BASE}/api/crm-contracts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteContract(id) {
  return fetchWithAuth(`${API_BASE}/api/crm-contracts/${id}`, {
    method: "DELETE",
  });
}

export async function addContractNote(id, note) {
  return fetchWithAuth(`${API_BASE}/api/crm-contracts/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function importContractsFromLocalStorage(contracts) {
  return fetchWithAuth(`${API_BASE}/api/crm-contracts/batch-import`, {
    method: "POST",
    body: JSON.stringify({ contracts }),
  });
}

