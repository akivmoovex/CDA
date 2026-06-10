/**
 * Static tenant registry used when Supabase is unavailable (local bootstrap).
 */
import { normalizeHost } from '../lib/hostParser.js';

const tenants = [
  {
    id: null,
    slug: 'cda-kafue',
    name: 'Child Development Agency Kafue',
    status: 'active',
    isFallback: true,
  },
];

const settingsBySlug = {
  'cda-kafue': {
    siteName: 'Child Development Agency Kafue',
    metaTitle: 'Child Development Agency Kafue',
    metaDescription:
      'A child development and community support agency website for CDA Kafue.',
    primaryColor: '#1D4ED8',
    secondaryColor: '#16A34A',
    tagline: 'Community Guardian',
    heroTitle: 'Building brighter futures for children in Kafue',
    heroBody:
      'Child Development Agency Kafue connects donors, partners, and local communities through transparent, child-centered development programs.',
    primaryCtaLabel: 'Our Programs',
    primaryCtaUrl: '/programs',
    donateCtaLabel: 'Donate',
    donateCtaUrl: '/donate',
    footerText: 'Committed to sturdy hope — professional rigor and grassroots warmth.',
    contactEmail: null,
    contactPhone: null,
    logoUrl: null,
    faviconUrl: null,
    extra: {},
  },
};

const customDomains = [
  { domain: 'netraz.org', slug: 'cda-kafue' },
  { domain: 'www.netraz.org', slug: 'cda-kafue' },
  { domain: 'localhost', slug: 'cda-kafue' },
  { domain: '127.0.0.1', slug: 'cda-kafue' },
];

export function findFallbackTenantByCustomDomain(hostname) {
  const normalized = normalizeHost(hostname);
  if (!normalized) {
    return null;
  }

  const mapping = customDomains.find((entry) => entry.domain === normalized);
  if (!mapping) {
    return null;
  }

  return tenants.find((tenant) => tenant.slug === mapping.slug) ?? null;
}

export function getFallbackDefaultTenant() {
  return tenants[0] ?? null;
}

export function getFallbackTenantSettings(slug) {
  if (!slug) {
    return settingsBySlug['cda-kafue'] ?? null;
  }

  return settingsBySlug[slug] ?? settingsBySlug['cda-kafue'] ?? null;
}

export default tenants;
