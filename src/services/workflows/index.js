import { getSupabaseAdminClient } from '../../config/supabase.js';
import {
  wfCreate,
  wfDelete,
  wfGetById,
  wfList,
  wfListByForeignKey,
  wfUpdate,
} from './fallbackStore.js';

function actorLabel(actor) {
  return actor?.email ?? actor?.id ?? 'system';
}

async function dbList(table, tenantId, { status, orderBy = 'created_at', ascending = false } = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return wfList(table, tenantId, { status, orderBy, ascending });
  }

  let query = supabase.from(table).select('*').eq('tenant_id', tenantId);
  if (status) {
    query = query.eq('status', status);
  }
  query = query.order(orderBy, { ascending });
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function dbGetById(table, tenantId, id) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return wfGetById(table, tenantId, id);
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function dbListByForeignKey(table, tenantId, foreignKey, foreignId) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return wfListByForeignKey(table, tenantId, foreignKey, foreignId);
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq(foreignKey, foreignId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function dbCreate(table, tenantId, payload) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return wfCreate(table, tenantId, payload);
  }

  const record = { tenant_id: tenantId, ...payload };
  const { data, error } = await supabase.from(table).insert(record).select('*').single();
  if (error) throw error;
  return data;
}

async function dbUpdate(table, tenantId, id, payload) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return wfUpdate(table, tenantId, id, payload);
  }

  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function dbDelete(table, tenantId, id) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return wfDelete(table, tenantId, id);
  }

  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listVolunteerApplications(tenantId, { status } = {}) {
  return dbList('volunteer_applications', tenantId, { status });
}

export async function getVolunteerApplication(tenantId, id) {
  return dbGetById('volunteer_applications', tenantId, id);
}

export async function createVolunteerApplication(tenantId, payload) {
  return dbCreate('volunteer_applications', tenantId, {
    ...payload,
    status: 'pending',
  });
}

export async function updateVolunteerApplication(tenantId, id, payload, actor) {
  const reviewFields = {};
  if (payload.status && payload.status !== 'pending') {
    reviewFields.reviewed_at = new Date().toISOString();
    reviewFields.reviewed_by = actorLabel(actor);
  }
  return dbUpdate('volunteer_applications', tenantId, id, { ...payload, ...reviewFields });
}

export async function listVolunteerAssignments(tenantId, applicationId) {
  return dbListByForeignKey('volunteer_assignments', tenantId, 'application_id', applicationId);
}

export async function createVolunteerAssignment(tenantId, applicationId, payload) {
  return dbCreate('volunteer_assignments', tenantId, {
    application_id: applicationId,
    ...payload,
  });
}

export async function deleteVolunteerAssignment(tenantId, assignmentId) {
  return dbDelete('volunteer_assignments', tenantId, assignmentId);
}

export async function listSponsorshipRequests(tenantId, { status } = {}) {
  return dbList('sponsorship_requests', tenantId, { status });
}

export async function getSponsorshipRequest(tenantId, id) {
  return dbGetById('sponsorship_requests', tenantId, id);
}

export async function createSponsorshipRequest(tenantId, payload) {
  return dbCreate('sponsorship_requests', tenantId, {
    ...payload,
    status: 'pending',
  });
}

export async function updateSponsorshipRequest(tenantId, id, payload, actor) {
  const reviewFields = {};
  if (payload.status && !['pending'].includes(payload.status)) {
    reviewFields.reviewed_at = new Date().toISOString();
    reviewFields.reviewed_by = actorLabel(actor);
  }
  return dbUpdate('sponsorship_requests', tenantId, id, { ...payload, ...reviewFields });
}

export async function listSponsorRecords(tenantId, { status } = {}) {
  return dbList('sponsor_records', tenantId, { status });
}

export async function getSponsorRecord(tenantId, id) {
  return dbGetById('sponsor_records', tenantId, id);
}

export async function createSponsorFromRequest(tenantId, requestId, actor) {
  const request = await getSponsorshipRequest(tenantId, requestId);
  if (!request) {
    return null;
  }

  const sponsor = await dbCreate('sponsor_records', tenantId, {
    first_name: request.first_name,
    last_name: request.last_name,
    email: request.email,
    phone: request.phone,
    tier_name: request.tier_name,
    monthly_amount: request.monthly_amount,
    status: 'active',
    notes: request.message,
    request_id: requestId,
  });

  await dbUpdate('sponsorship_requests', tenantId, requestId, {
    sponsor_record_id: sponsor.id,
    status: request.status === 'matched' ? 'matched' : 'contacted',
    reviewed_at: new Date().toISOString(),
    reviewed_by: actorLabel(actor),
  });

  return sponsor;
}

export async function listSponsorshipChildren(tenantId, { availableOnly = false } = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    let rows = wfList('sponsorship_children', tenantId);
    if (availableOnly) {
      rows = rows.filter((row) => row.is_available);
    }
    return rows;
  }

  let query = supabase.from('sponsorship_children').select('*').eq('tenant_id', tenantId);
  if (availableOnly) {
    query = query.eq('is_available', true);
  }
  query = query.order('reference_code', { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function matchChildToSponsor(tenantId, sponsorRecordId, childId, actor) {
  const child = await dbGetById('sponsorship_children', tenantId, childId);
  if (!child || !child.is_available) {
    return { error: 'Child profile is not available for matching.' };
  }

  const sponsor = await dbGetById('sponsor_records', tenantId, sponsorRecordId);
  if (!sponsor) {
    return { error: 'Sponsor record not found.' };
  }

  await dbUpdate('sponsorship_children', tenantId, childId, {
    is_available: false,
    sponsor_record_id: sponsorRecordId,
    matched_at: new Date().toISOString(),
  });

  if (sponsor.request_id) {
    await dbUpdate('sponsorship_requests', tenantId, sponsor.request_id, {
      status: 'matched',
      reviewed_at: new Date().toISOString(),
      reviewed_by: actorLabel(actor),
    });
  }

  return { child: await dbGetById('sponsorship_children', tenantId, childId) };
}

export function volunteerStatusBadge(status) {
  const map = {
    pending: { status: 'warning', label: 'Pending' },
    approved: { status: 'success', label: 'Approved' },
    rejected: { status: 'error', label: 'Rejected' },
  };
  return map[status] ?? { status: 'neutral', label: status };
}

export function sponsorshipStatusBadge(status) {
  const map = {
    pending: { status: 'warning', label: 'Pending' },
    contacted: { status: 'info', label: 'Contacted' },
    matched: { status: 'success', label: 'Matched' },
    rejected: { status: 'error', label: 'Rejected' },
  };
  return map[status] ?? { status: 'neutral', label: status };
}

export default {
  listVolunteerApplications,
  getVolunteerApplication,
  createVolunteerApplication,
  updateVolunteerApplication,
  listVolunteerAssignments,
  createVolunteerAssignment,
  deleteVolunteerAssignment,
  listSponsorshipRequests,
  getSponsorshipRequest,
  createSponsorshipRequest,
  updateSponsorshipRequest,
  listSponsorRecords,
  getSponsorRecord,
  createSponsorFromRequest,
  listSponsorshipChildren,
  matchChildToSponsor,
  volunteerStatusBadge,
  sponsorshipStatusBadge,
};
