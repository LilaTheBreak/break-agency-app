import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Embeds a signature image into a PDF document at a specified position.
 * @param pdfBuffer The original PDF document as a buffer.
 * @param signatureImagePng The signature image (as a PNG) as a buffer.
 * @param x The x-coordinate to place the signature.
 * @param y The y-coordinate to place the signature.
 * @returns A buffer of the newly signed PDF document.
 */
export const embedSignatureInPdf = async (
  pdfBuffer: Buffer,
  signatureImagePng: Buffer,
  x: number,
  y: number
): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const signatureImage = await pdfDoc.embedPng(signatureImagePng);
  const page = pdfDoc.getPages()[0]; // Assuming signature on the first page

  page.drawImage(signatureImage, { x, y, width: 150, height: 75 });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};