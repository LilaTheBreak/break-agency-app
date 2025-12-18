import { importLocalStorageData, importCampaignsFromLocalStorage, importEventsFromLocalStorage, importDealsFromLocalStorage, importContractsFromLocalStorage } from "../services/crmClient.js";

const STORAGE_KEYS = {
  brands: "break_admin_brands_v1",
  contacts: "break_admin_contacts_v1",
  outreach: "break_admin_outreach_records_v1",
  campaigns: "break_admin_crm_campaigns_v1",
  events: "break_admin_crm_events_v1",
  deals: "break_admin_crm_deals_v1",
  contracts: "break_admin_crm_contracts_v1",
};

function safeRead(key) {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeRemove(key) {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function checkForLocalStorageData() {
  const brands = safeRead(STORAGE_KEYS.brands);
  const contacts = safeRead(STORAGE_KEYS.contacts);
  const outreach = safeRead(STORAGE_KEYS.outreach);
  const campaigns = safeRead(STORAGE_KEYS.campaigns);
  const events = safeRead(STORAGE_KEYS.events);
  const deals = safeRead(STORAGE_KEYS.deals);
  const contracts = safeRead(STORAGE_KEYS.contracts);

  const hasData =
    (Array.isArray(brands) && brands.length > 0) ||
    (Array.isArray(contacts) && contacts.length > 0) ||
    (Array.isArray(outreach) && outreach.length > 0) ||
    (Array.isArray(campaigns) && campaigns.length > 0) ||
    (Array.isArray(events) && events.length > 0) ||
    (Array.isArray(deals) && deals.length > 0) ||
    (Array.isArray(contracts) && contracts.length > 0);

  return {
    hasData,
    counts: {
      brands: Array.isArray(brands) ? brands.length : 0,
      contacts: Array.isArray(contacts) ? contacts.length : 0,
      outreach: Array.isArray(outreach) ? outreach.length : 0,
      campaigns: Array.isArray(campaigns) ? campaigns.length : 0,
      events: Array.isArray(events) ? events.length : 0,
      deals: Array.isArray(deals) ? deals.length : 0,
      contracts: Array.isArray(contracts) ? contracts.length : 0,
    },
  };
}

export async function migrateLocalStorageToDatabase() {
  const brands = safeRead(STORAGE_KEYS.brands) || [];
  const contacts = safeRead(STORAGE_KEYS.contacts) || [];
  const outreach = safeRead(STORAGE_KEYS.outreach) || [];
  const campaigns = safeRead(STORAGE_KEYS.campaigns) || [];
  const events = safeRead(STORAGE_KEYS.events) || [];
  const deals = safeRead(STORAGE_KEYS.deals) || [];
  const contracts = safeRead(STORAGE_KEYS.contracts) || [];

  if (!brands.length && !contacts.length && !outreach.length && !campaigns.length && !events.length && !deals.length && !contracts.length) {
    throw new Error("No data found in localStorage to migrate");
  }

  try {
    // Import brands, contacts, and outreach together
    const result = await importLocalStorageData({
      brands,
      contacts,
      outreach,
    });

    // Import campaigns separately
    if (campaigns.length > 0) {
      const campaignResult = await importCampaignsFromLocalStorage(campaigns);
      result.imported.campaigns = campaignResult.imported.campaigns;
    }

    // Import events separately
    if (events.length > 0) {
      const eventResult = await importEventsFromLocalStorage(events);
      result.imported.events = eventResult.imported;
    }

    // Import deals separately
    if (deals.length > 0) {
      const dealResult = await importDealsFromLocalStorage(deals);
      result.imported.deals = dealResult.imported;
    }

    // Import contracts separately
    if (contracts.length > 0) {
      const contractResult = await importContractsFromLocalStorage(contracts);
      result.imported.contracts = contractResult.imported;
    }

    // Clear localStorage after successful migration
    safeRemove(STORAGE_KEYS.brands);
    safeRemove(STORAGE_KEYS.contacts);
    safeRemove(STORAGE_KEYS.outreach);
    safeRemove(STORAGE_KEYS.campaigns);
    safeRemove(STORAGE_KEYS.events);
    safeRemove(STORAGE_KEYS.deals);
    safeRemove(STORAGE_KEYS.contracts);

    return result;
  } catch (error) {
    console.error("[MIGRATION] Failed to migrate data:", error);
    throw error;
  }
}

export function clearLocalStorageData() {
  safeRemove(STORAGE_KEYS.brands);
  safeRemove(STORAGE_KEYS.contacts);
  safeRemove(STORAGE_KEYS.outreach);
  safeRemove(STORAGE_KEYS.campaigns);
  safeRemove(STORAGE_KEYS.events);
  safeRemove(STORAGE_KEYS.deals);
  safeRemove(STORAGE_KEYS.contracts);
}
