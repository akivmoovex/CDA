/**
 * Static tenant registry used when Supabase is unavailable (local bootstrap).
 */
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
    metaTitle: 'Child Development Agency Kafue — Community Guardian',
    metaDescription: 'Transparent, child-centered development programs in Kafue.',
    footerText: 'Committed to sturdy hope — professional rigor and grassroots warmth.',
    contactEmail: null,
    contactPhone: null,
    logoUrl: null,
    faviconUrl: null,
    extra: {},
  },
};

const customDomains = [];

export function findFallbackTenantBySubdomain(subdomain) {
  const normalized = subdomain.toLowerCase();
  return tenants.find((tenant) => tenant.subdomain === normalized) ?? null;
}

export function findFallbackTenantByCustomDomain(hostname) {
  const normalized = hostname.toLowerCase();
  const mapping = customDomains.find((entry) => entry.hostname === normalized);
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
