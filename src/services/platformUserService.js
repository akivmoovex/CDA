import { getSupabaseAdminClient } from '../config/supabase.js';

const ADMIN_ROLES = new Set(['platform_super_admin', 'tenant_admin', 'tenant_editor']);

function mapPlatformUser(row) {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    role: row.role,
    isPlatformSuperAdmin: row.role === 'platform_super_admin',
    isTenantAdmin: row.role === 'tenant_admin',
    isTenantEditor: row.role === 'tenant_editor',
  };
}

/**
 * Load platform membership for an authenticated Supabase user.
 */
export async function getPlatformUserByAuthId(userId) {
  if (!userId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('platform_users')
    .select('id, user_id, tenant_id, role')
    .eq('user_id', userId)
    .order('role', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPlatformUser(data) : null;
}

export function isAdminRole(role) {
  return ADMIN_ROLES.has(role);
}

/**
 * Returns true when the user may access admin data for the resolved tenant.
 */
export function canAccessTenant(platformUser, tenantId) {
  if (!platformUser || !isAdminRole(platformUser.role)) {
    return false;
  }

  if (platformUser.isPlatformSuperAdmin) {
    return true;
  }

  return platformUser.tenantId === tenantId;
}

export default {
  getPlatformUserByAuthId,
  isAdminRole,
  canAccessTenant,
};
