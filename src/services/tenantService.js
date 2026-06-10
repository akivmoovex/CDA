import { getSupabaseAdminClient } from '../config/supabase.js';
import {
  findFallbackTenantByCustomDomain,
  getFallbackDefaultTenant,
  getFallbackTenantSettings,
} from '../config/tenantFallback.js';
import { isUuid } from '../lib/isUuid.js';
import { normalizeHost, parseHost } from '../lib/hostParser.js';
import TenantCache from '../lib/tenantCache.js';

const tenantCache = new TenantCache();
const settingsCache = new TenantCache();

function mapTenantRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status ?? 'active',
    isFallback: false,
  };
}

function mapSettingsRow(row) {
  if (!row) {
    return null;
  }

  return {
    siteName: row.site_name ?? null,
    tagline: row.tagline ?? row.site_name ?? null,
    heroTitle: row.hero_title ?? row.meta_title ?? row.site_name ?? null,
    heroBody: row.hero_body ?? row.meta_description ?? null,
    primaryCtaLabel: row.primary_cta_label ?? null,
    primaryCtaUrl: row.primary_cta_url ?? null,
    donateCtaLabel: row.donate_cta_label ?? null,
    donateCtaUrl: row.donate_cta_url ?? null,
    contactEmail: row.contact_email ?? null,
    contactPhone: row.contact_phone ?? null,
    logoUrl: row.logo_url ?? null,
    faviconUrl: row.favicon_url ?? null,
    metaTitle: row.meta_title ?? row.site_name ?? null,
    metaDescription: row.meta_description ?? null,
    footerText: row.footer_text ?? null,
    primaryColor: row.primary_color ?? null,
    secondaryColor: row.secondary_color ?? null,
    address: row.address ?? null,
    extra: row.extra ?? {},
  };
}

function resolveSettingsFallbackKey(tenant) {
  return tenant?.slug ?? null;
}

async function queryTenantByDomain(normalizedHost) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: domainRow, error: domainError } = await supabase
    .from('tenant_domains')
    .select('tenant_id')
    .eq('domain', normalizedHost)
    .maybeSingle();

  if (domainError) {
    throw domainError;
  }

  if (!domainRow?.tenant_id) {
    return null;
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, status')
    .eq('id', domainRow.tenant_id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.status !== 'active') {
    return null;
  }

  return mapTenantRow(data);
}

async function resolveFromDatabase(parsed) {
  const normalizedHost = normalizeHost(parsed.host);
  if (!normalizedHost) {
    return null;
  }

  const cacheKey = `host:${normalizedHost}`;
  const cached = tenantCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const tenant = await queryTenantByDomain(normalizedHost);
  if (tenant) {
    tenantCache.set(cacheKey, tenant);
  }

  return tenant;
}

function resolveFromFallback(parsed) {
  const byDomain = findFallbackTenantByCustomDomain(parsed.host);
  if (byDomain) {
    return byDomain;
  }

  if (parsed.type === 'platform') {
    return getFallbackDefaultTenant();
  }

  return findFallbackTenantByCustomDomain(parsed.host) ?? getFallbackDefaultTenant();
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
export async function getTenantSettings(tenantOrId) {
  const tenant =
    typeof tenantOrId === 'object' && tenantOrId !== null
      ? tenantOrId
      : { id: tenantOrId, slug: null, isFallback: !isUuid(tenantOrId) };

  if (tenant.isFallback || !isUuid(tenant.id)) {
    const fallbackKey = resolveSettingsFallbackKey(tenant);
    const fallback = getFallbackTenantSettings(fallbackKey);
    if (fallback) {
      const cacheKey = `settings:fallback:${fallbackKey ?? 'default'}`;
      settingsCache.set(cacheKey, fallback);
    }
    return fallback;
  }

  const tenantId = tenant.id;
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

  const fallback = getFallbackTenantSettings(tenant.slug);
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
