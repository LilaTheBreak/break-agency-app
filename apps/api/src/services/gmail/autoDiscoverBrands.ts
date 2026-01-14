import prisma from '../../lib/prisma.js';
import { randomUUID } from "crypto";
import { gmail_v1 as gmailV1 } from "googleapis";

/**
 * Free email providers that should NOT be treated as brands
 */
const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "mail.com",
  "yandex.com",
  "fastmail.com",
  "zoho.com",
]);

interface EmailInfo {
  email: string;
  name: string | null;
  domain: string;
}

interface DiscoveredBrand {
  domain: string;
  email: string;
  contactName: string | null;
  createdBrandId?: string;
  createdContactId?: string;
  error?: string;
}

/**
 * Extract email address from "Name <email@domain.com>" format or just email
 */
export function parseFromHeader(fromHeader: string): EmailInfo | null {
  const trimmed = fromHeader.trim();
  
  // Try to match "Name <email>" format
  const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    const [, name, email] = match;
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      return {
        email: email.toLowerCase(),
        name: name.trim() || null,
        domain,
      };
    }
  }
  
  // Otherwise treat as plain email
  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (domain) {
    return {
      email: trimmed.toLowerCase(),
      name: null,
      domain,
    };
  }
  
  return null;
}

/**
 * Extract sender name from email local part (e.g., john.doe@company.com -> John Doe)
 */
export function extractNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] || '';
  
  const nameParts = localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1));
  
  return nameParts.length > 0 ? nameParts.join(' ') : 'Unknown';
}

/**
 * Check if a domain looks like a business domain (not a free email provider)
 */
export function isBusinessDomain(domain: string): boolean {
  return !FREE_EMAIL_PROVIDERS.has(domain.toLowerCase());
}

/**
 * Format domain into a potential brand name
 * e.g., "netflix.com" -> "Netflix"
 */
export function formatBrandName(domain: string): string {
  const name = domain
    .replace(/\.com$|\.co\.uk$|\.io$|\.net$/, '') // Remove TLD
    .split('.')
    .pop() || domain;
  
  return name
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Analyze Gmail messages and discover brands to add to CRM
 * @param messages - Array of Gmail message objects
 * @param userId - ID of the user (for audit logging)
 * @returns Array of discovered brands with their contact info
 */
export async function discoverBrandsFromMessages(
  messages: gmailV1.Schema$Message[],
  userId: string
): Promise<DiscoveredBrand[]> {
  const discovered = new Map<string, DiscoveredBrand>();
  
  for (const message of messages) {
    try {
      // Extract From header
      const headers = message.payload?.headers || [];
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value;
      
      if (!fromHeader) {
        continue;
      }
      
      const emailInfo = parseFromHeader(fromHeader);
      if (!emailInfo || !isBusinessDomain(emailInfo.domain)) {
        continue;
      }
      
      // Skip if we've already discovered this domain
      if (discovered.has(emailInfo.domain)) {
        continue;
      }
      
      discovered.set(emailInfo.domain, {
        domain: emailInfo.domain,
        email: emailInfo.email,
        contactName: emailInfo.name || extractNameFromEmail(emailInfo.email),
      });
    } catch (error) {
      console.error('[AUTO DISCOVER] Error processing message:', error);
      continue;
    }
  }
  
  return Array.from(discovered.values());
}

/**
 * Create or update brand and contact in CRM
 * @param discoveredBrand - Brand discovery data
 * @param userId - ID of the user creating the brand
 * @returns Result with created IDs or error
 */
export async function createBrandAndContact(
  discoveredBrand: DiscoveredBrand,
  userId: string
): Promise<DiscoveredBrand> {
  const result = { ...discoveredBrand };
  
  try {
    // Check if brand already exists for this domain
    const existingBrand = await prisma.crmBrand.findFirst({
      where: {
        website: {
          contains: discoveredBrand.domain,
          mode: 'insensitive',
        },
      },
    });
    
    if (existingBrand) {
      result.createdBrandId = existingBrand.id;
      
      // Check if contact already exists
      const existingContact = await prisma.crmBrandContact.findFirst({
        where: {
          crmBrandId: existingBrand.id,
          email: discoveredBrand.email,
        },
      });
      
      if (existingContact) {
        result.createdContactId = existingContact.id;
        return result;
      }
      
      // Create contact for existing brand
      const contact = await prisma.crmBrandContact.create({
        data: {
          id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          crmBrandId: existingBrand.id,
          firstName: discoveredBrand.contactName?.split(' ')[0] || 'Unknown',
          lastName: discoveredBrand.contactName?.split(' ').slice(1).join(' ') || '',
          email: discoveredBrand.email,
          relationshipStatus: 'New',
          owner: userId,
          updatedAt: new Date(),
        },
      });
      
      result.createdContactId = contact.id;
      return result;
    }
    
    // Create new brand
    const brandName = formatBrandName(discoveredBrand.domain);
    const now = new Date().toISOString();
    
    const brand = await prisma.crmBrand.create({
      data: {
        id: randomUUID(),
        brandName,
        website: `https://${discoveredBrand.domain}`,
        industry: 'Other',
        status: 'Prospect',
        owner: userId,
        lastActivityAt: now,
        lastActivityLabel: 'Brand discovered from Gmail',
        activity: [
          {
            at: now,
            label: 'Brand discovered from Gmail inbox',
          },
        ],
        updatedAt: now,
      },
    });
    
    result.createdBrandId = brand.id;
    
    // Create contact for the new brand
    const contact = await prisma.crmBrandContact.create({
      data: {
        id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        crmBrandId: brand.id,
        firstName: discoveredBrand.contactName?.split(' ')[0] || 'Unknown',
        lastName: discoveredBrand.contactName?.split(' ').slice(1).join(' ') || '',
        email: discoveredBrand.email,
        relationshipStatus: 'New',
        owner: userId,
        updatedAt: new Date(),
      },
    });
    
    result.createdContactId = contact.id;
    
    console.log(`[AUTO DISCOVER] Created brand "${brandName}" (${brand.id}) with contact ${contact.id}`);
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AUTO DISCOVER] Error creating brand/contact:', {
      domain: discoveredBrand.domain,
      error: result.error,
    });
    return result;
  }
}

/**
 * Main function: Discover and create brands from Gmail messages
 * @param messages - Array of Gmail messages to analyze
 * @param userId - ID of the user
 * @returns Summary of discovered brands
 */
export async function autoDiscoverBrandsFromInbox(
  messages: gmailV1.Schema$Message[],
  userId: string
): Promise<{
  discovered: number;
  created: number;
  results: DiscoveredBrand[];
}> {
  console.log(`[AUTO DISCOVER] Starting brand discovery from ${messages.length} messages for user ${userId}`);
  
  // Step 1: Discover brands from messages
  const discoveredBrands = await discoverBrandsFromMessages(messages, userId);
  console.log(`[AUTO DISCOVER] Discovered ${discoveredBrands.length} unique business domains`);
  
  // Step 2: Create brands and contacts
  const results = await Promise.all(
    discoveredBrands.map(brand => createBrandAndContact(brand, userId))
  );
  
  const created = results.filter(r => r.createdBrandId && !r.error).length;
  
  console.log(`[AUTO DISCOVER] Auto-discovery complete: ${discoveredBrands.length} discovered, ${created} new brands created`);
  
  return {
    discovered: discoveredBrands.length,
    created,
    results,
  };
}
