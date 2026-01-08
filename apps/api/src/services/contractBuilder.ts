import prisma from "../lib/prisma.js";
import { createPdfFromHtml } from "./pdfService.js";

// Note: contractTemplate model doesn't exist in schema
export async function buildContractFromTerms(terms: any, templateType = "brand_deal") {
  console.warn("Contract building not yet implemented - model does not exist");
  throw new Error("Contract template feature not yet implemented");
  
  // Original implementation (commented out - model doesn't exist):
  /*
  const template = await prisma.contractTemplate.findFirst({
    where: { type: templateType }
  });

  if (!template) {
    throw new Error(`Missing contract template for type ${templateType}`);
  }

  let html = template.body;
  Object.entries(terms).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), typeof value === "object" ? JSON.stringify(value) : String(value));
  });

  const pdf = await createPdfFromHtml(html);

  return { html, pdf };
  */
}
