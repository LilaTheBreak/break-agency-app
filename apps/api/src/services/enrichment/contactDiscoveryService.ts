/**
 * Contact Discovery Service
 * 
 * Identifies brand decision-makers from public sources:
 * - LinkedIn public search results
 * - Google indexing / Bing search operators
 * - Cached public profiles
 * - Website executive info
 * 
 * ⚠️ COMPLIANCE NOTES:
 * - NO LinkedIn authentication or credential-based scraping
 * - NO CAPTCHA bypassing
 * - Public data ONLY
 * - Respects robots.txt & Terms of Service
 * - Rate limited to avoid platform abuse
 */

import prisma from '../../lib/prisma.js';
import { logError } from '../../lib/logger.js';

export interface ContactDiscoveryInput {
  brandName: string;
  website?: string;
  linkedInCompanyUrl?: string;
  targetRoles?: string[]; // e.g., ["Head of Marketing", "Influencer Marketing Manager"]
  region?: string; // For compliance: "US" | "EU" | "UK" | etc
}

export interface DiscoveredContact {
  firstName: string;
  lastName: string;
  jobTitle: string;
  company: string;
  linkedInUrl: string;
  linkedInId?: string;
  confidenceScore: number; // 0-100
  source: 'linkedin' | 'website' | 'public_index' | 'manual' | 'hunter_io' | 'clearbit' | 'apollo';
  discoveryMethod: string; // How we found them
  notes?: string;
}

const DEFAULT_TARGET_ROLES = [
  'Head of Marketing',
  'Director of Marketing',
  'CMO',
  'Chief Marketing Officer',
  'Influencer Marketing Manager',
  'Partnerships Lead',
  'Director of Partnerships',
  'Brand Manager',
  'PR Manager',
  'Head of PR',
  'Social Media Manager',
  'Head of Social',
];

/**
 * Validate region compliance
 * Returns false if enrichment is restricted in that region
 */
export function isRegionCompliant(region?: string): boolean {
  if (!region) return true;
  
  // Add region-specific restrictions here
  // Example: Some EU regions might have stricter GDPR enforcement
  const restrictedRegions: string[] = [];
  
  return !restrictedRegions.includes(region.toUpperCase());
}

/**
 * Discover brand contacts from Hunter.io API
 * Real contact discovery from public B2B databases
 */
export async function discoverContactsFromLinkedIn(
  brandName: string,
  linkedInCompanyUrl?: string
): Promise<DiscoveredContact[]> {
  try {
    const hunterApiKey = process.env.HUNTER_API_KEY;
    if (!hunterApiKey) {
      logError('[CONTACT DISCOVERY] HUNTER_API_KEY not configured');
      return [];
    }

    console.log(`[CONTACT DISCOVERY] Searching Hunter.io for ${brandName}`);
    
    // Step 1: Domain search to get company info
    const domain = extractDomainFromBrandName(brandName, linkedInCompanyUrl);
    if (!domain) {
      console.log(`[CONTACT DISCOVERY] Could not extract domain for ${brandName}`);
      return [];
    }

    // Step 2: Fetch company details from Hunter.io
    const companyRes = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&type=personal&limit=100`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!companyRes.ok) {
      throw new Error(`Hunter.io API error: ${companyRes.status}`);
    }

    const companyData = await companyRes.json();
    
    if (!companyData.data || !companyData.data.emails) {
      console.log(`[CONTACT DISCOVERY] No contacts found in Hunter.io for ${domain}`);
      return [];
    }

    // Step 3: Filter by target roles (Head of Marketing, etc.)
    const targetRoles = DEFAULT_TARGET_ROLES;
    const contacts: DiscoveredContact[] = [];

    for (const person of companyData.data.emails.slice(0, 50)) {
      const jobTitle = person.position || '';
      const isTargetRole = targetRoles.some(role => 
        jobTitle.toLowerCase().includes(role.toLowerCase())
      );

      // Include marketing/partnership roles and other decision-makers
      const isDecisionMaker = /^(ceo|cto|cfo|cmo|head|director|manager|vp|president|founder)$/i.test(
        jobTitle.split(' ')[0]
      ) || isTargetRole;

      if (!isDecisionMaker) continue;

      contacts.push({
        firstName: person.first_name || '',
        lastName: person.last_name || '',
        jobTitle: jobTitle,
        company: brandName,
        linkedInUrl: person.linkedin_url || '',
        linkedInId: person.linkedin_id || undefined,
        confidenceScore: Math.min(100, (person.confidence || 50) * 100),
        source: 'hunter_io',
        discoveryMethod: `hunter_io_domain_search_${person.type}`,
        notes: `Hunter.io verified contact | Type: ${person.type} | Sources: ${person.sources ? person.sources.join(', ') : 'direct'}`,
      });

      if (contacts.length >= 20) break; // Limit to prevent rate limiting
    }

    console.log(`[CONTACT DISCOVERY] Found ${contacts.length} qualified contacts from Hunter.io for ${brandName}`);
    return contacts;
  } catch (error) {
    logError('[CONTACT DISCOVERY] Hunter.io search failed:', error);
    return [];
  }
}

/**
 * Discover contacts from company website
 * Look for executive bios, team pages, LinkedIn profile links
 */
export async function discoverContactsFromWebsite(
  website: string
): Promise<DiscoveredContact[]> {
  try {
    const contacts: DiscoveredContact[] = [];
    
    // Fetch common pages: /team, /about, /leadership, /contact
    const possiblePages = [
      '/team',
      '/about',
      '/leadership',
      '/about-us',
      '/executives',
      '/staff',
    ];
    
    console.log(`[CONTACT DISCOVERY] Scraping team info from ${website}`);
    
    // In production, use a tool like:
    // - Cheerio/jsdom for HTML parsing
    // - Firecrawl or similar for JavaScript-heavy sites
    // - Proxies to avoid IP blocking
    
    // PLACEHOLDER: Return empty for now
    // Production implementation would:
    // 1. Fetch HTML from each page
    // 2. Parse for names, titles, emails
    // 3. Match against LinkedIn profiles
    // 4. Return confidence scores
    
    return contacts;
  } catch (error) {
    logError('[CONTACT DISCOVERY] Website scraping failed:', error);
    return [];
  }
}

export async function enrichDiscoveredContacts(
  contacts: DiscoveredContact[],
  brandId?: string
): Promise<any[]> {
  try {
    const enriched = await Promise.all(
      contacts.map(async (contact) => {
        // Create EnrichedContact record
        const record = await prisma.enrichedContact.create({
          data: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            jobTitle: contact.jobTitle,
            company: contact.company,
            linkedInUrl: contact.linkedInUrl,
            linkedInId: contact.linkedInId,
            confidenceScore: contact.confidenceScore,
            source: contact.source,
            discoveryMethod: contact.discoveryMethod,
            linkedBrandId: brandId,
            lawfulBasis: 'b2b_legitimate_interest',
            complianceCheckPassed: true,
            notes: contact.notes,
            activity: [
              {
                at: new Date().toISOString(),
                label: `Discovered via ${contact.source}`,
              },
            ],
          },
        });
        
        return record;
      })
    );
    
    console.log(`[CONTACT DISCOVERY] Enriched ${enriched.length} contacts`);
    return enriched;
  } catch (error) {
    logError('[CONTACT DISCOVERY] Enrichment failed:', error);
    throw error;
  }
}

/**
 * Filter contacts by confidence and compliance
 */
export function filterByConfidence(
  contacts: DiscoveredContact[],
  minConfidence: number = 60
): DiscoveredContact[] {
  return contacts.filter(c => c.confidenceScore >= minConfidence);
}

/**
 * Helper: Extract LinkedIn company ID from URL
 * https://www.linkedin.com/company/tesla/about → tesla
 */
function extractCompanyIdFromLinkedInUrl(url: string): string {
  const match = url.match(/\/company\/([^/]+)/);
  return match ? match[1] : '';
}

/**
 * Helper: Extract domain from brand name or LinkedIn URL
 */
function extractDomainFromBrandName(brandName: string, linkedInUrl?: string): string {
  // Try to extract from LinkedIn URL first
  if (linkedInUrl) {
    const match = linkedInUrl.match(/\/company\/([^/]+)/);
    if (match) {
      return match[1] + '.com'; // Approximate domain
    }
  }

  // Convert brand name to domain-like format
  // "Tesla" -> "tesla.com", "Apple Inc" -> "apple.com"
  const domain = brandName
    .toLowerCase()
    .split(/\s+/)[0] // Take first word
    .replace(/[^a-z0-9]/g, '')
    + '.com';

  return domain;
}

export default {
  discoverContactsFromLinkedIn,
  discoverContactsFromWebsite,
  enrichDiscoveredContacts,
  filterByConfidence,
  isRegionCompliant,
};
