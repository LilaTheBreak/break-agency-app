import pdf from 'pdf-parse';

/**
 * Extracts text content from a PDF buffer.
 * @param pdfBuffer The buffer containing the PDF file data.
 * @returns The extracted text content as a string.
 */
export const extractTextFromPdf = async (pdfBuffer: Buffer): Promise<string> => {
  const data = await pdf(pdfBuffer);
  return data.text;
};