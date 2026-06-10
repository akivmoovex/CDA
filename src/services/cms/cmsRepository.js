import { getSupabaseAdminClient } from '../../config/supabase.js';
import { isUuid } from '../../lib/isUuid.js';
import { logCmsAudit } from './auditService.js';
import {
  fallbackCreate,
  fallbackDelete,
  fallbackGetById,
  fallbackGetBySlug,
  fallbackList,
  fallbackUpdate,
} from './fallbackStore.js';

export function createCmsRepository({ table, entityType, slugField = 'slug' }) {
  function useFallbackStore(tenantId) {
    const supabase = getSupabaseAdminClient();
    return !supabase || !isUuid(tenantId);
  }

  async function list(tenantId, { publishedOnly = false } = {}) {
    if (useFallbackStore(tenantId)) {
      return fallbackList(table, tenantId, { publishedOnly });
    }

    const supabase = getSupabaseAdminClient();
    let query = supabase.from(table).select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
    if (publishedOnly) {
      query = query.eq('status', 'published');
    }
    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data ?? [];
  }

  async function getById(tenantId, id) {
    if (useFallbackStore(tenantId)) {
      return fallbackGetById(table, tenantId, id);
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(table).select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async function getBySlug(tenantId, slug, { publishedOnly = false } = {}) {
    if (useFallbackStore(tenantId)) {
      const row = fallbackGetBySlug(table, tenantId, slug);
      if (publishedOnly && row?.status !== 'published') {
        return null;
      }
      return row;
    }

    const supabase = getSupabaseAdminClient();
    let query = supabase.from(table).select('*').eq('tenant_id', tenantId).eq(slugField, slug);
    if (publishedOnly) {
      query = query.eq('status', 'published');
    }
    const { data, error } = await query.maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async function create(tenantId, payload, actor) {
    const record = { tenant_id: tenantId, ...payload };
    let data;

    if (useFallbackStore(tenantId)) {
      data = fallbackCreate(table, tenantId, record);
    } else {
      const supabase = getSupabaseAdminClient();
      const result = await supabase.from(table).insert(record).select('*').single();
      if (result.error) {
        throw result.error;
      }
      data = result.data;
    }

    await logCmsAudit({
      tenantId,
      entityType,
      entityId: data.id,
      action: 'create',
      user: actor,
      metadata: { title: data.title ?? data.section_key ?? data.slug },
    });

    return data;
  }

  async function update(tenantId, id, payload, actor) {
    let data;

    if (useFallbackStore(tenantId)) {
      data = fallbackUpdate(table, tenantId, id, payload);
    } else {
      const supabase = getSupabaseAdminClient();
      const result = await supabase.from(table).update(payload).eq('tenant_id', tenantId).eq('id', id).select('*').single();
      if (result.error) {
        throw result.error;
      }
      data = result.data;
    }

    if (!data) {
      return null;
    }

    await logCmsAudit({
      tenantId,
      entityType,
      entityId: id,
      action: 'update',
      user: actor,
      metadata: { fields: Object.keys(payload) },
    });

    return data;
  }

  async function remove(tenantId, id, actor) {
    const existing = await getById(tenantId, id);
    if (!existing) {
      return null;
    }

    if (useFallbackStore(tenantId)) {
      fallbackDelete(table, tenantId, id);
    } else {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase.from(table).delete().eq('tenant_id', tenantId).eq('id', id);
      if (error) {
        throw error;
      }
    }

    await logCmsAudit({
      tenantId,
      entityType,
      entityId: id,
      action: 'delete',
      user: actor,
      metadata: { title: existing.title ?? existing.section_key },
    });

    return existing;
  }

  async function write(tenantId, id, payload) {
    if (useFallbackStore(tenantId)) {
      return fallbackUpdate(table, tenantId, id, payload);
    }

    const supabase = getSupabaseAdminClient();
    const result = await supabase.from(table).update(payload).eq('tenant_id', tenantId).eq('id', id).select('*').single();
    if (result.error) {
      throw result.error;
    }
    return result.data;
  }

  async function publish(tenantId, id, actor) {
    const data = await write(tenantId, id, { status: 'published', published_at: new Date().toISOString() });
    if (data) {
      await logCmsAudit({ tenantId, entityType, entityId: id, action: 'publish', user: actor });
    }
    return data;
  }

  async function unpublish(tenantId, id, actor) {
    const data = await write(tenantId, id, { status: 'draft', published_at: null });
    if (data) {
      await logCmsAudit({ tenantId, entityType, entityId: id, action: 'unpublish', user: actor });
    }
    return data;
  }

  return {
    table,
    entityType,
    list,
    getById,
    getBySlug,
    create,
    update,
    remove,
    publish,
    unpublish,
  };
}

export default createCmsRepository;
