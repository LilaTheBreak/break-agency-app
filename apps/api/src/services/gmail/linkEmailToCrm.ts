import prisma from "../../lib/prisma.js";
import { randomUUID } from "crypto";
import { logAction } from "../../lib/auditLogger.js";

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
]);

/**
 * Parse email address into name and domain
 */
function parseEmailAddress(email: string): { name: string | null; domain: string | null; normalized: string } {
  const normalized = email.toLowerCase().trim();
  const parts = normalized.split("@");
  
  if (parts.length !== 2) {
    return { name: null, domain: null, normalized };
  }
  
  const [localPart, domain] = parts;
  
  // Try to extract name from local part (e.g., john.doe -> John Doe)
  const nameParts = localPart
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1));
  
  const name = nameParts.length > 0 ? nameParts.join(" ") : null;
  
  return { name, domain, normalized };
}

/**
 * Parse "Name <email@domain.com>" format
 */
function parseFromHeader(fromHeader: string): { name: string | null; email: string | null } {
  if (!fromHeader) {
    return { name: null, email: null };
  }
  
  // Try to match: "John Doe <john@example.com>"
  const match = fromHeader.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    const name = match[1].trim().replace(/^["']|["']$/g, ""); // Remove quotes
    const email = match[2].trim();
    return { name, email };
  }
  
  // No angle brackets, assume it's just an email
  const email = fromHeader.trim();
  return { name: null, email };
}

/**
 * Extract brand name from domain
 * nike.com -> Nike
 * amazon.co.uk -> Amazon
 */
function domainToBrandName(domain: string): string {
  // Remove TLD
  const parts = domain.split(".");
  const mainPart = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  
  // Capitalize first letter
  return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
}

/**
 * Check if domain should be treated as a brand
 */
function shouldCreateBrand(domain: string): boolean {
  return !FREE_EMAIL_PROVIDERS.has(domain.toLowerCase());
}

export interface LinkResult {
  contactId: string | null;
  brandId: string | null;
  contactCreated: boolean;
  brandCreated: boolean;
  error: string | null;
}

/**
 * Main function: Link an InboundEmail to CRM entities (Contact + Brand)
 * 
 * Flow:
 * 1. Parse sender email
 * 2. Find or create CrmBrandContact
 * 3. Find or create CrmBrand (if domain is not a free provider)
 * 4. Link contact to brand
 * 5. Update InboundEmail with contact/brand references
 */
export async function linkEmailToCrm(inboundEmail: {
  id: string;
  fromEmail: string;
  userId: string;
}): Promise<LinkResult> {
  const result: LinkResult = {
    contactId: null,
    brandId: null,
    contactCreated: false,
    brandCreated: false,
    error: null,
  };

  try {
    // Parse sender email
    const { name: parsedName, email: parsedEmail } = parseFromHeader(inboundEmail.fromEmail);
    
    if (!parsedEmail) {
      result.error = "Could not parse email address";
      return result;
    }

    const { name: nameFromEmail, domain, normalized } = parseEmailAddress(parsedEmail);
    
    if (!domain) {
      result.error = "Could not extract domain from email";
      return result;
    }

    const displayName = parsedName || nameFromEmail || normalized.split("@")[0];

    // Step 1: Find or create Contact
    let contact = await prisma.crmBrandContact.findFirst({
      where: { email: normalized },
    });

    if (!contact) {
      // Create new contact - use upsert to handle race conditions
      const firstName = displayName.split(" ")[0] || "";
      const lastName = displayName.split(" ").slice(1).join(" ") || "";

      try {
        contact = await prisma.crmBrandContact.create({
          data: {
            id: randomUUID(),
            crmBrandId: "", // Will be set later if brand is created
            firstName,
            lastName,
            email: normalized,
            primaryContact: false,
            notes: `Auto-created from Gmail: ${inboundEmail.fromEmail}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        result.contactCreated = true;
        console.log(`[GMAIL → CRM] Created contact: ${normalized} (${contact.id})`);

        // Audit log: Contact created from email
        await logAction({
          userId: inboundEmail.userId,
          action: "CONTACT_CREATED_FROM_EMAIL",
          entityType: "CONTACT",
          entityId: contact.id,
          metadata: {
            email: normalized,
            source: "gmail",
            inboundEmailId: inboundEmail.id,
          },
        });
      } catch (createError: any) {
        // Handle unique constraint violation (race condition)
        if (createError.code === 'P2002') {
          console.log(`[GMAIL → CRM] Contact ${normalized} created by concurrent sync, fetching...`);
          contact = await prisma.crmBrandContact.findFirst({
            where: { email: normalized },
          });
          
          if (!contact) {
            throw new Error(`Failed to create or find contact after unique violation: ${normalized}`);
          }
        } else {
          throw createError;
        }
      }
    }

    result.contactId = contact.id;

    // Step 2: Find or create Brand (only if not a free email provider)
    let brand = null;
    if (shouldCreateBrand(domain)) {
      const brandName = domainToBrandName(domain);

      // Find existing brand by name
      brand = await prisma.crmBrand.findFirst({
        where: { brandName },
      });

      if (!brand) {
        // Create brand with race condition handling
        try {
          brand = await prisma.crmBrand.create({
            data: {
              id: randomUUID(),
              brandName,
              website: `https://${domain}`,
              industry: "Other",
              status: "Prospect",
              internalNotes: `Auto-created from Gmail: ${normalized}`,
              lastActivityAt: new Date().toISOString(),
              lastActivityLabel: "Auto-created from Gmail",
              activity: [{ at: new Date().toISOString(), label: "Auto-created from Gmail" }],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          result.brandCreated = true;
          console.log(`[GMAIL → CRM] Created brand: ${brandName} (${brand.id})`);

          // Audit log: Brand created from email
          await logAction({
            userId: inboundEmail.userId,
            action: "BRAND_CREATED_FROM_EMAIL",
            entityType: "BRAND",
            entityId: brand.id,
            metadata: {
              brandName,
              domain,
              source: "gmail",
              inboundEmailId: inboundEmail.id,
            },
          });
        } catch (createError: any) {
          // Handle unique constraint violation (race condition)
          if (createError.code === 'P2002') {
            console.log(`[GMAIL → CRM] Brand ${brandName} created by concurrent sync, fetching...`);
            brand = await prisma.crmBrand.findFirst({
              where: { brandName },
            });
            
            if (!brand) {
              throw new Error(`Failed to create or find brand after unique violation: ${brandName}`);
            }
          } else {
            throw createError;
          }
        }
      }

      result.brandId = brand.id;

      // Step 3: Link contact to brand if needed
      if (contact.crmBrandId !== brand.id) {
        await prisma.crmBrandContact.update({
          where: { id: contact.id },
          data: { crmBrandId: brand.id },
        });

        console.log(`[GMAIL → CRM] Linked contact ${contact.id} to brand ${brand.id}`);
      }
    } else {
      // Free email provider - create standalone contact with placeholder brand
      if (!contact.crmBrandId) {
        // Create a "Personal Contacts" brand if it doesn't exist
        let personalBrand = await prisma.crmBrand.findFirst({
          where: { brandName: "Personal Contacts" },
        });

        if (!personalBrand) {
          personalBrand = await prisma.crmBrand.create({
            data: {
              id: randomUUID(),
              brandName: "Personal Contacts",
              industry: "Other",
              status: "Prospect",
              internalNotes: "Auto-created placeholder for personal email contacts",
              lastActivityAt: new Date().toISOString(),
              lastActivityLabel: "Auto-created",
              activity: [{ at: new Date().toISOString(), label: "Auto-created" }],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        await prisma.crmBrandContact.update({
          where: { id: contact.id },
          data: { crmBrandId: personalBrand.id },
        });

        result.brandId = personalBrand.id;
      }
    }

    // Step 4: Update InboundEmail with metadata linking
    await prisma.inboundEmail.update({
      where: { id: inboundEmail.id },
      data: {
        metadata: {
          ...(typeof inboundEmail === "object" && inboundEmail !== null && "metadata" in inboundEmail
            ? (inboundEmail as any).metadata
            : {}),
          crmContactId: result.contactId,
          crmBrandId: result.brandId,
          linkedAt: new Date().toISOString(),
        },
      },
    });

    console.log(
      `[GMAIL → CRM] Linked email ${inboundEmail.id} → Contact ${result.contactId} → Brand ${result.brandId || "none"}`
    );

    return result;
  } catch (error) {
    console.error("[GMAIL → CRM] Error linking email to CRM:", error);
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

/**
 * Batch link multiple emails to CRM
 * Returns summary stats
 */
export async function linkEmailsToCrm(
  emails: Array<{ id: string; fromEmail: string; userId: string }>
): Promise<{
  processed: number;
  contactsCreated: number;
  brandsCreated: number;
  errors: number;
}> {
  const stats = {
    processed: 0,
    contactsCreated: 0,
    brandsCreated: 0,
    errors: 0,
  };

  for (const email of emails) {
    const result = await linkEmailToCrm(email);
    stats.processed++;

    if (result.error) {
      stats.errors++;
    } else {
      if (result.contactCreated) stats.contactsCreated++;
      if (result.brandCreated) stats.brandsCreated++;
    }
  }

  return stats;
}
