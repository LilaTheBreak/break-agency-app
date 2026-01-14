/**
 * CMS Public Page Registry
 * 
 * This is the SINGLE SOURCE OF TRUTH for which CMS pages are:
 * - Public-facing (visible to users)
 * - Editable via CMS
 * - Mapped to actual routes/components
 * 
 * Rules:
 * - Only pages in this registry appear in CMS dropdown
 * - Only pages in this registry can be edited
 * - Slug must match database slug exactly
 * - Route must match frontend route exactly
 * 
 * DO NOT add dashboard pages, admin pages, or internal pages here.
 * Those are NOT editable via CMS.
 */

export interface CmsPublicPage {
  /** Database slug (must match Page.slug exactly) */
  slug: string;
  /** Display title in CMS dropdown */
  title: string;
  /** Frontend route path */
  route: string;
  /** React component name (for reference) */
  component: string;
  /** Whether this page is editable via CMS */
  editable: boolean;
}

/**
 * Registry of all CMS-editable public pages
 */
export const CMS_PUBLIC_PAGES: readonly CmsPublicPage[] = [
  {
    slug: "welcome",
    title: "Landing Page",
    route: "/",
    component: "LandingPage",
    editable: true,
  },
  {
    slug: "resources",
    title: "Resource Hub",
    route: "/resource-hub",
    component: "ResourceHubPage",
    editable: true,
  },
  {
    slug: "careers",
    title: "Careers",
    route: "/careers",
    component: "CareersPage",
    editable: true,
  },
  {
    slug: "press",
    title: "Press",
    route: "/press",
    component: "PressPage",
    editable: true,
  },
  {
    slug: "help",
    title: "Help Center",
    route: "/help",
    component: "HelpCenterPage",
    editable: true,
  },
  {
    slug: "contact",
    title: "Contact",
    route: "/contact",
    component: "ContactPage",
    editable: true,
  },
  {
    slug: "legal",
    title: "Legal + Privacy",
    route: "/legal",
    component: "LegalPrivacyPage",
    editable: true,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    route: "/privacy",
    component: "PrivacyPolicyPage",
    editable: true,
  },
] as const;

/**
 * Get a page from the registry by slug
 */
export function getCmsPageBySlug(slug: string): CmsPublicPage | undefined {
  return CMS_PUBLIC_PAGES.find((page) => page.slug === slug);
}

/**
 * Get a page from the registry by route
 */
export function getCmsPageByRoute(route: string): CmsPublicPage | undefined {
  return CMS_PUBLIC_PAGES.find((page) => page.route === route);
}

/**
 * Check if a slug is in the registry (editable)
 */
export function isEditableCmsPage(slug: string): boolean {
  return CMS_PUBLIC_PAGES.some((page) => page.slug === slug);
}

/**
 * Get all editable slugs
 */
export function getEditableSlugs(): string[] {
  return CMS_PUBLIC_PAGES.map((page) => page.slug);
}

