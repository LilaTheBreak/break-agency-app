/**
 * Script to identify and deduplicate CrmBrand records with duplicate brandNames
 * Run before applying unique constraint
 */
import prisma from "../src/lib/prisma.js";

async function deduplicateBrands() {
  console.log("[DEDUPE] Finding duplicate brand names...");

  // Find all brands grouped by brandName
  const brands = await prisma.crmBrand.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Group by brandName
  const groupedByName = new Map<string, typeof brands>();
  for (const brand of brands) {
    const existing = groupedByName.get(brand.brandName) || [];
    existing.push(brand);
    groupedByName.set(brand.brandName, existing);
  }

  // Find duplicates
  const duplicates = Array.from(groupedByName.entries()).filter(([_, brands]) => brands.length > 1);

  if (duplicates.length === 0) {
    console.log("[DEDUPE] ✅ No duplicate brand names found");
    return;
  }

  console.log(`[DEDUPE] ⚠️  Found ${duplicates.length} duplicate brand names:`);
  
  for (const [brandName, brands] of duplicates) {
    console.log(`\n  - "${brandName}" (${brands.length} duplicates)`);
    brands.forEach((b, i) => {
      console.log(`    [${i}] ID: ${b.id}, Created: ${b.createdAt.toISOString()}`);
    });

    // Keep the oldest brand, merge others into it
    const [keepBrand, ...removeBrands] = brands;
    
    console.log(`  → Keeping: ${keepBrand.id} (oldest)`);
    console.log(`  → Removing: ${removeBrands.map(b => b.id).join(", ")}`);

    // Reassign all contacts from duplicate brands to the kept brand
    for (const removeBrand of removeBrands) {
      const contactsCount = await prisma.crmBrandContact.count({
        where: { crmBrandId: removeBrand.id },
      });

      if (contactsCount > 0) {
        console.log(`  → Reassigning ${contactsCount} contacts from ${removeBrand.id} to ${keepBrand.id}`);
        await prisma.crmBrandContact.updateMany({
          where: { crmBrandId: removeBrand.id },
          data: { crmBrandId: keepBrand.id },
        });
      }

      // Check for tasks
      const tasksCount = await prisma.crmTask.count({
        where: { brandId: removeBrand.id },
      });

      if (tasksCount > 0) {
        console.log(`  → Reassigning ${tasksCount} tasks from ${removeBrand.id} to ${keepBrand.id}`);
        await prisma.crmTask.updateMany({
          where: { brandId: removeBrand.id },
          data: { brandId: keepBrand.id },
        });
      }

      // Check for outreach
      const outreachCount = await prisma.outreach.count({
        where: { linkedCrmBrandId: removeBrand.id },
      });

      if (outreachCount > 0) {
        console.log(`  → Reassigning ${outreachCount} outreach records from ${removeBrand.id} to ${keepBrand.id}`);
        await prisma.outreach.updateMany({
          where: { linkedCrmBrandId: removeBrand.id },
          data: { linkedCrmBrandId: keepBrand.id },
        });
      }

      // Delete the duplicate brand
      await prisma.crmBrand.delete({
        where: { id: removeBrand.id },
      });
      console.log(`  → Deleted duplicate brand: ${removeBrand.id}`);
    }
  }

  console.log("\n[DEDUPE] ✅ Deduplication complete");
}

async function deduplicateContacts() {
  console.log("\n[DEDUPE] Finding duplicate contact emails...");

  // Find all contacts grouped by email
  const contacts = await prisma.crmBrandContact.findMany({
    where: { email: { not: null } },
    orderBy: { createdAt: "asc" },
  });

  // Group by email
  const groupedByEmail = new Map<string, typeof contacts>();
  for (const contact of contacts) {
    if (!contact.email) continue;
    const existing = groupedByEmail.get(contact.email) || [];
    existing.push(contact);
    groupedByEmail.set(contact.email, existing);
  }

  // Find duplicates
  const duplicates = Array.from(groupedByEmail.entries()).filter(([_, contacts]) => contacts.length > 1);

  if (duplicates.length === 0) {
    console.log("[DEDUPE] ✅ No duplicate contact emails found");
    return;
  }

  console.log(`[DEDUPE] ⚠️  Found ${duplicates.length} duplicate contact emails:`);
  
  for (const [email, contacts] of duplicates) {
    console.log(`\n  - "${email}" (${contacts.length} duplicates)`);
    contacts.forEach((c, i) => {
      console.log(`    [${i}] ID: ${c.id}, Brand: ${c.crmBrandId}, Created: ${c.createdAt.toISOString()}`);
    });

    // Keep the oldest contact, remove others
    const [keepContact, ...removeContacts] = contacts;
    
    console.log(`  → Keeping: ${keepContact.id} (oldest)`);
    console.log(`  → Removing: ${removeContacts.map(c => c.id).join(", ")}`);

    // Update InboundEmails that reference duplicate contacts
    for (const removeContact of removeContacts) {
      const emailsCount = await prisma.inboundEmail.count({
        where: {
          metadata: {
            path: ["crmContactId"],
            equals: removeContact.id,
          },
        },
      });

      if (emailsCount > 0) {
        console.log(`  → Reassigning ${emailsCount} emails from ${removeContact.id} to ${keepContact.id}`);
        
        // This is a JSON field update - need to fetch and update individually
        const emails = await prisma.inboundEmail.findMany({
          where: {
            metadata: {
              path: ["crmContactId"],
              equals: removeContact.id,
            },
          },
        });

        for (const email of emails) {
          await prisma.inboundEmail.update({
            where: { id: email.id },
            data: {
              metadata: {
                ...(email.metadata as any),
                crmContactId: keepContact.id,
              },
            },
          });
        }
      }

      // Delete the duplicate contact
      await prisma.crmBrandContact.delete({
        where: { id: removeContact.id },
      });
      console.log(`  → Deleted duplicate contact: ${removeContact.id}`);
    }
  }

  console.log("\n[DEDUPE] ✅ Contact deduplication complete");
}

// Run deduplication
deduplicateBrands()
  .then(() => deduplicateContacts())
  .then(() => {
    console.log("\n[DEDUPE] 🎉 All deduplication complete. You can now apply unique constraints.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n[DEDUPE] ❌ Error during deduplication:", error);
    process.exit(1);
  });
