/**
 * Splits raw contract text into a structured array of clauses.
 * This is a simplified stub; a real implementation would use more advanced parsing.
 * @param rawText - The full text of the contract.
 * @returns An array of clause objects.
 */
export function extractClauses(rawText: string): { title: string; content: string }[] {
  console.log('[CLAUSE EXTRACTOR] Splitting contract text into clauses...');
  const clauses = [];
  const sections = rawText.split(/\n\s*\d+\.\s+/); // Split by lines starting with "1. ", "2. ", etc.

  for (const section of sections) {
    if (!section.trim()) continue;
    const lines = section.split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    clauses.push({ title, content });
  }

  return clauses.length > 0 ? clauses : [{ title: 'Full Contract', content: rawText }];
}