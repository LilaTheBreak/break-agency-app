import { JSDOM } from "jsdom";

/**
 * Strips HTML tags, quoted replies, and other clutter from an email body.
 * @param bodyHtml - The raw HTML content of the email.
 * @returns The cleaned, plain text content of the email.
 */
export function cleanEmailBody(bodyHtml: string): string {
  if (!bodyHtml) {
    return "";
  }

  // Use JSDOM to parse HTML and extract text content
  const dom = new JSDOM(bodyHtml);
  const document = dom.window.document;

  // Remove blockquotes, which Gmail uses for quoted replies
  document.querySelectorAll("blockquote").forEach((el) => el.remove());

  // Remove signature blocks (heuristic)
  // Gmail often wraps signatures in a div with a specific class
  document.querySelectorAll(".gmail_signature").forEach((el) => el.remove());

  let cleanText = document.body.textContent || "";

  // Replace multiple newlines/spaces with a single one
  cleanText = cleanText.replace(/(\r\n|\n|\r){2,}/g, "\n").trim();

  return cleanText;
}