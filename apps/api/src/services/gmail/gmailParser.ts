import * as cheerio from "cheerio";

/**
 * Strips HTML tags, quoted replies, and other clutter from an email body.
 * @param bodyHtml - The raw HTML content of the email.
 * @returns The cleaned, plain text content of the email.
 */
export function cleanEmailBody(bodyHtml: string): string {
  if (!bodyHtml) {
    return "";
  }

  // Use cheerio to parse HTML and extract text content
  const $ = cheerio.load(bodyHtml);

  // Remove blockquotes, which Gmail uses for quoted replies
  $("blockquote").remove();

  // Remove signature blocks (heuristic)
  // Gmail often wraps signatures in a div with a specific class
  $(".gmail_signature").remove();

  let cleanText = $.text();

  // Replace multiple newlines/spaces with a single one
  cleanText = cleanText.replace(/(\r\n|\n|\r){2,}/g, "\n").trim();

  return cleanText;
}