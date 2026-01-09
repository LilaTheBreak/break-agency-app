/**
 * Domain Validation Utilities
 * 
 * Validates brand URLs and enforces domain matching between website and email
 */

const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'icloud.com',
  'google.com',
  'microsoft.com',
  'apple.com',
];

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Normalize URL (ensure protocol, lowercase)
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  let normalized = url.toLowerCase().trim();
  
  // Add https if no protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string | null {
  const match = email.match(/@([^\s.]+\.[^\s]+)$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Check if email domain is a public email provider
 */
export function isPublicEmailDomain(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  return PUBLIC_EMAIL_DOMAINS.includes(domain);
}

/**
 * Validate that email domain matches brand domain
 */
export function doesEmailMatchBrandDomain(email: string, brandDomain: string): boolean {
  const emailDomain = getEmailDomain(email);
  if (!emailDomain) return false;
  
  // Exact match
  if (emailDomain === brandDomain) return true;
  
  // Check if email domain is a subdomain of brand domain
  // e.g., marketing@company.co.uk matches company.co.uk
  return emailDomain.endsWith('.' + brandDomain);
}

/**
 * Get root domain from any subdomain
 * e.g., "marketing.company.com" → "company.com"
 */
export function getRootDomain(domain: string): string {
  const parts = domain.split('.');
  
  // Handle special cases like .co.uk
  if (parts.length > 2) {
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];
    
    if (['co', 'com', 'org', 'net', 'io', 'us'].includes(secondLastPart)) {
      return parts.slice(-3).join('.');
    }
  }
  
  return parts.slice(-2).join('.');
}

/**
 * Validate brand onboarding inputs
 */
export function validateBrandOnboarding(input: {
  websiteUrl: string;
  email: string;
  role: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate URL
  if (!input.websiteUrl) {
    errors.push('Website URL is required');
  } else if (!isValidUrl(input.websiteUrl)) {
    errors.push('Invalid website URL format');
  }
  
  // Validate email
  if (!input.email) {
    errors.push('Email is required');
  } else if (isPublicEmailDomain(input.email)) {
    errors.push('Please use your company email, not a public email provider');
  }
  
  // Validate email matches domain
  if (input.websiteUrl && input.email) {
    const brandDomain = extractDomain(input.websiteUrl);
    if (brandDomain && !doesEmailMatchBrandDomain(input.email, brandDomain)) {
      errors.push('Email domain must match your brand website domain');
    }
  }
  
  // Validate role
  const validRoles = ['Founder', 'Marketing', 'Brand Partnerships', 'Community', 'Product', 'Other'];
  if (!input.role || !validRoles.includes(input.role)) {
    errors.push('Invalid role selected');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
