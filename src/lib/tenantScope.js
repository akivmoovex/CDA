/**
 * Helpers for enforcing tenant scope in services and queries.
 * Use alongside RLS policies in Supabase for defense in depth.
 */

export function getScopedTenantId(platformUser, requestedTenantId) {
  if (!platformUser) {
    return null;
  }

  if (platformUser.isPlatformSuperAdmin) {
    return requestedTenantId;
  }

  return platformUser.tenantId;
}

export function assertTenantScope(platformUser, tenantId) {
  if (!platformUser) {
    return false;
  }

  if (platformUser.isPlatformSuperAdmin) {
    return true;
  }

  return platformUser.tenantId === tenantId;
}

export default {
  getScopedTenantId,
  assertTenantScope,
};
