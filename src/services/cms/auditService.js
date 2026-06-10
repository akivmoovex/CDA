import { getSupabaseAdminClient } from '../../config/supabase.js';
import { fallbackAudit } from './fallbackStore.js';

export async function logCmsAudit({
  tenantId,
  entityType,
  entityId,
  action,
  user,
  metadata = {},
}) {
  const entry = {
    tenant_id: tenantId,
    entity_type: entityType,
    entity_id: entityId ?? null,
    action,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    metadata,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from('cms_audit_log').insert(entry);
    if (error) {
      console.error('Audit log insert failed:', error.message);
    }
    return entry;
  }

  return fallbackAudit(entry);
}

export default logCmsAudit;
