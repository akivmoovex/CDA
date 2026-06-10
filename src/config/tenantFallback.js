/**
 * Static tenant registry used when Supabase is unavailable (local bootstrap).
 */
import { normalizeHost } from '../lib/hostParser.js';

const tenants = [
  {
    id: 'cda-kafue',
    slug: 'cda-kafue',
    name: 'Child Development Agency Kafue',
    subdomain: 'cda-kafue',
    isDefault: true,
    isActive: true,
  },
];

const settingsByTenantId = {
  'cda-kafue': {
    tagline: 'Community Guardian',
    heroTitle: 'Building brighter futures for children in Kafue',
    heroBody:
      'Child Development Agency Kafue connects donors, partners, and local communities through transparent, child-centered development programs.',
    primaryCtaLabel: 'Our Programs',
    primaryCtaUrl: '/programs',
    donateCtaLabel: 'Donate',
    donateCtaUrl: '/donate',
    metaTitle: 'Child Development Agency Kafue',
    metaDescription:
      'A child development and community support agency website for CDA Kafue.',
    footerText: 'Committed to sturdy hope — professional rigor and grassroots warmth.',
    contactEmail: null,
    contactPhone: null,
    logoUrl: null,
    faviconUrl: null,
    extra: {},
  },
};

const customDomains = [
  { domain: 'netraz.org', tenantId: 'cda-kafue' },
  { domain: 'www.netraz.org', tenantId: 'cda-kafue' },
  { domain: 'localhost', tenantId: 'cda-kafue' },
  { domain: '127.0.0.1', tenantId: 'cda-kafue' },
];

export function findFallbackTenantBySubdomain(subdomain) {
  const normalized = subdomain.toLowerCase();
  return tenants.find((tenant) => tenant.subdomain === normalized) ?? null;
}

export function findFallbackTenantByCustomDomain(hostname) {
  const normalized = normalizeHost(hostname);
  if (!normalized) {
    return null;
  }

  const mapping = customDomains.find((entry) => entry.domain === normalized);
  if (!mapping) {
    return null;
  }

  return tenants.find((tenant) => tenant.id === mapping.tenantId) ?? null;
}

export function getFallbackDefaultTenant() {
  return tenants.find((tenant) => tenant.isDefault) ?? tenants[0] ?? null;
}

export function getFallbackTenantSettings(tenantId) {
  return settingsByTenantId[tenantId] ?? null;
}

export default tenants;
