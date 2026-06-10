import { getSupabaseAdminClient } from '../config/supabase.js';
import {
  findFallbackTenantByCustomDomain,
  findFallbackTenantBySubdomain,
  getFallbackDefaultTenant,
  getFallbackTenantSettings,
} from '../config/tenantFallback.js';
import { parseHost } from '../lib/hostParser.js';
import TenantCache from '../lib/tenantCache.js';

const tenantCache = new TenantCache();
const settingsCache = new TenantCache();

function mapTenantRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subdomain: row.subdomain,
    isDefault: row.is_default,
    isActive: row.is_active,
  };
}

function mapSettingsRow(row) {
  if (!row) {
    return null;
  }

  return {
    tagline: row.tagline,
    heroTitle: row.hero_title,
    heroBody: row.hero_body,
    primaryCtaLabel: row.primary_cta_label,
    primaryCtaUrl: row.primary_cta_url,
    donateCtaLabel: row.donate_cta_label,
    donateCtaUrl: row.donate_cta_url,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    footerText: row.footer_text,
    extra: row.extra ?? {},
  };
}

async function queryTenant(criteria) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  let query = supabase
    .from('tenants')
    .select('id, slug, name, subdomain, is_default, is_active')
    .eq('is_active', true)
    .limit(1);

  if (criteria.subdomain) {
    query = query.eq('subdomain', criteria.subdomain);
  }

  if (criteria.isDefault) {
    query = query.eq('is_default', true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapTenantRow(data) : null;
}

async function queryTenantByCustomDomain(hostname) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: domainRow, error: domainError } = await supabase
    .from('tenant_domains')
    .select('tenant_id')
    .eq('domain', hostname)
    .maybeSingle();

  if (domainError) {
    throw domainError;
  }

  if (!domainRow?.tenant_id) {
    return null;
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, subdomain, is_default, is_active')
    .eq('id', domainRow.tenant_id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapTenantRow(data) : null;
}

async function resolveFromDatabase(parsed) {
  if (parsed.type === 'custom') {
    const cacheKey = `host:${parsed.host}`;
    const cached = tenantCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const tenant = await queryTenantByCustomDomain(parsed.host);
    if (tenant) {
      tenantCache.set(cacheKey, tenant);
    }
    return tenant;
  }

  if (parsed.subdomain) {
    const cacheKey = `subdomain:${parsed.subdomain}`;
    const cached = tenantCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const tenant = await queryTenant({ subdomain: parsed.subdomain });
    if (tenant) {
      tenantCache.set(cacheKey, tenant);
    }
    return tenant;
  }

  const cacheKey = 'default';
  const cached = tenantCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const tenant = await queryTenant({ isDefault: true });
  if (tenant) {
    tenantCache.set(cacheKey, tenant);
  }
  return tenant;
}

function resolveFromFallback(parsed) {
  if (parsed.type === 'custom') {
    return findFallbackTenantByCustomDomain(parsed.host);
  }

  if (parsed.subdomain) {
    return findFallbackTenantBySubdomain(parsed.subdomain);
  }

  return getFallbackDefaultTenant();
}

/**
 * Resolve the active tenant from a request hostname.
 */
export async function resolveTenantByHostname(hostname) {
  const parsed = parseHost(hostname);

  try {
    const tenant = await resolveFromDatabase(parsed);
    if (tenant) {
      return tenant;
    }
  } catch (error) {
    console.error('Tenant lookup failed, using fallback registry:', error.message);
  }

  return resolveFromFallback(parsed);
}

/**
 * Load public content settings for a tenant.
 */
export async function getTenantSettings(tenantId) {
  const cacheKey = `settings:${tenantId}`;
  const cached = settingsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = getSupabaseAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const settings = mapSettingsRow(data);
        settingsCache.set(cacheKey, settings);
        return settings;
      }
    } catch (error) {
      console.error('Tenant settings lookup failed, using fallback:', error.message);
    }
  }

  const fallback = getFallbackTenantSettings(tenantId);
  if (fallback) {
    settingsCache.set(cacheKey, fallback);
  }

  return fallback;
}

export function clearTenantCaches() {
  tenantCache.clear();
  settingsCache.clear();
}

export default {
  resolveTenantByHostname,
  getTenantSettings,
  clearTenantCaches,
};
