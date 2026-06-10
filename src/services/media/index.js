import { STORAGE_BUCKETS, isPublicStorageBucket } from '../../config/storageBuckets.js';
import { getSupabaseAdminClient } from '../../config/supabase.js';
import { galleryRepo } from '../cms/index.js';
import {
  getFileAccessUrl,
  getPublicFileUrl,
  promoteToPublicTenantMedia,
} from '../cms/storageService.js';
import {
  mediaAuditCreate,
  mediaAuditList,
  mediaCreate,
  mediaDelete,
  mediaGetById,
  mediaGetByIds,
  mediaList,
  mediaUpdate,
} from './fallbackStore.js';

function actorLabel(actor) {
  return actor?.email ?? actor?.id ?? 'system';
}

export async function logMediaAudit({
  tenantId,
  mediaId,
  action,
  user,
  comments = null,
  metadata = {},
}) {
  const entry = {
    tenant_id: tenantId,
    media_id: mediaId ?? null,
    action,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
    comments,
    metadata,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from('media_audit_log').insert(entry);
    if (error) {
      console.error('Media audit log insert failed:', error.message);
    }
    return entry;
  }

  return mediaAuditCreate(entry);
}

export function canApproveMedia(asset) {
  if (!asset) {
    return { ok: false, reason: 'Media asset not found.' };
  }
  if (asset.is_child_related && asset.consent_status === 'missing') {
    return { ok: false, reason: 'Child-related media requires consent before approval.' };
  }
  if (asset.is_child_related && !['recorded', 'not_required'].includes(asset.consent_status)) {
    return { ok: false, reason: 'Consent must be recorded before approving child-related media.' };
  }
  if (!['private', 'pending_review', 'changes_requested'].includes(asset.approval_status)) {
    return { ok: false, reason: 'Media is not in a reviewable state.' };
  }
  return { ok: true };
}

export function isMediaPubliclyVisible(asset) {
  return (
    asset?.approval_status === 'approved' &&
    isPublicStorageBucket(asset.storage_bucket ?? STORAGE_BUCKETS.TENANT_MEDIA)
  );
}

export async function assertGalleryPublishable(tenantId, galleryItem) {
  if (!galleryItem?.media_asset_id) {
    const error = new Error('Gallery items must be linked to an approved media asset before publishing.');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  const asset = await getMediaAsset(tenantId, galleryItem.media_asset_id);
  if (!asset) {
    const error = new Error('Linked media asset not found.');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  if (asset.is_child_related && asset.approval_status !== 'approved') {
    const error = new Error('Child-related media must be approved before it can be published.');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  if (asset.approval_status !== 'approved' || !isPublicStorageBucket(asset.storage_bucket)) {
    const error = new Error('Media must be approved and stored in a public bucket before it can be published.');
    error.status = 400;
    error.expose = true;
    throw error;
  }

  return asset;
}

export async function enrichMediaAssetForAdmin(asset) {
  if (!asset) {
    return asset;
  }

  const accessUrl = await getFileAccessUrl({
    bucket: asset.storage_bucket,
    storagePath: asset.storage_path,
    fileUrl: asset.file_url,
  });

  return {
    ...asset,
    access_url: accessUrl,
  };
}

export async function resolvePublicMediaUrl(asset) {
  if (!asset || !isMediaPubliclyVisible(asset)) {
    return null;
  }

  if (asset.file_url && isPublicStorageBucket(asset.storage_bucket)) {
    return asset.file_url;
  }

  if (asset.storage_bucket && asset.storage_path) {
    return getPublicFileUrl(asset.storage_bucket, asset.storage_path);
  }

  return asset.file_url ?? null;
}

export async function filterPublicGalleryItems(tenantId, galleryRows) {
  const assets = await listMediaAssets(tenantId);
  const approvedAssets = assets.filter((asset) => isMediaPubliclyVisible(asset));
  const approvedIds = new Set(approvedAssets.map((asset) => asset.id));
  const approvedByUrl = new Map(
    (
      await Promise.all(
        approvedAssets.map(async (asset) => [await resolvePublicMediaUrl(asset), asset]),
      )
    ).filter(([url]) => Boolean(url)),
  );

  return galleryRows.filter((row) => {
    if (row.media_asset_id) {
      return approvedIds.has(row.media_asset_id);
    }
    if (row.image_url && approvedByUrl.has(row.image_url)) {
      return true;
    }
    return false;
  });
}

async function dbList(table, tenantId, filters = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    if (table === 'media_assets') {
      return mediaList(tenantId, filters);
    }
    return mediaAuditList(tenantId, filters.mediaId);
  }

  let query = supabase.from(table).select('*').eq('tenant_id', tenantId);
  if (filters.approvalStatus) {
    query = query.eq('approval_status', filters.approvalStatus);
  }
  if (filters.mediaKind) {
    query = query.eq('media_kind', filters.mediaKind);
  }
  if (filters.childRelated === true) {
    query = query.eq('is_child_related', true);
  }
  if (filters.mediaId) {
    query = query.eq('media_id', filters.mediaId).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listMediaAssets(tenantId, filters = {}) {
  return dbList('media_assets', tenantId, filters);
}

export async function listMediaAssetsByIds(tenantId, ids) {
  if (!ids.length) {
    return [];
  }
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return mediaGetByIds(tenantId, ids);
  }

  const { data, error } = await supabase.from('media_assets').select('*').eq('tenant_id', tenantId).in('id', ids);
  if (error) throw error;
  return data ?? [];
}

export async function getMediaAsset(tenantId, id) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return mediaGetById(tenantId, id);
  }

  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMediaStats(tenantId) {
  const assets = await listMediaAssets(tenantId);
  return {
    pendingReview: assets.filter((asset) => asset.approval_status === 'pending_review').length,
    missingConsent: assets.filter(
      (asset) => asset.is_child_related && ['missing', 'unknown', 'pending'].includes(asset.consent_status),
    ).length,
    approved: assets.filter((asset) => asset.approval_status === 'approved').length,
    total: assets.length,
  };
}

export async function listMediaAuditLog(tenantId, mediaId) {
  return dbList('media_audit_log', tenantId, { mediaId });
}

function initialApprovalStatus(isChildRelated) {
  return isChildRelated ? 'pending_review' : 'private';
}

function initialConsentStatus(isChildRelated, consentStatus) {
  if (consentStatus) {
    return consentStatus;
  }
  return isChildRelated ? 'pending' : 'not_required';
}

export async function createMediaAsset(tenantId, payload, actor) {
  const isChildRelated = Boolean(payload.is_child_related);
  const record = {
    title: payload.title,
    description: payload.description ?? null,
    file_url: payload.file_url ?? '',
    storage_bucket:
      payload.storage_bucket ??
      (isChildRelated ? STORAGE_BUCKETS.PRIVATE_DOCUMENTS : STORAGE_BUCKETS.TENANT_MEDIA),
    storage_path: payload.storage_path ?? null,
    mime_type: payload.mime_type ?? null,
    media_kind: payload.media_kind ?? 'photo',
    tags: payload.tags ?? [],
    is_child_related: isChildRelated,
    consent_status: initialConsentStatus(isChildRelated, payload.consent_status),
    approval_status: payload.approval_status ?? initialApprovalStatus(isChildRelated),
    reviewer_comments: null,
    uploaded_by: actorLabel(actor),
    gallery_item_id: payload.gallery_item_id ?? null,
  };

  const supabase = getSupabaseAdminClient();
  let data;
  if (!supabase) {
    data = mediaCreate(tenantId, record);
  } else {
    const result = await supabase
      .from('media_assets')
      .insert({ tenant_id: tenantId, ...record })
      .select('*')
      .single();
    if (result.error) throw result.error;
    data = result.data;
  }

  await logMediaAudit({
    tenantId,
    mediaId: data.id,
    action: 'upload',
    user: actor,
    metadata: { title: data.title, is_child_related: data.is_child_related },
  });

  if (data.approval_status === 'pending_review') {
    await logMediaAudit({
      tenantId,
      mediaId: data.id,
      action: 'submit_review',
      user: actor,
      metadata: { reason: 'child_related_auto_queue' },
    });
  }

  return data;
}

export async function updateMediaAsset(tenantId, id, payload, actor) {
  const supabase = getSupabaseAdminClient();
  let data;
  if (!supabase) {
    data = mediaUpdate(tenantId, id, payload);
  } else {
    const result = await supabase
      .from('media_assets')
      .update(payload)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select('*')
      .single();
    if (result.error) throw result.error;
    data = result.data;
  }

  if (data) {
    await logMediaAudit({
      tenantId,
      mediaId: id,
      action: 'update',
      user: actor,
      metadata: { fields: Object.keys(payload) },
    });
  }

  return data;
}

export async function submitMediaForReview(tenantId, id, actor) {
  const asset = await getMediaAsset(tenantId, id);
  if (!asset) {
    return null;
  }

  const data = await updateMediaAsset(
    tenantId,
    id,
    { approval_status: 'pending_review', reviewer_comments: null },
    actor,
  );

  await logMediaAudit({
    tenantId,
    mediaId: id,
    action: 'submit_review',
    user: actor,
  });

  return data;
}

async function applyReviewDecision(tenantId, id, { approvalStatus, comments, actor, auditAction, extraFields = {} }) {
  const data = await updateMediaAsset(
    tenantId,
    id,
    {
      ...extraFields,
      approval_status: approvalStatus,
      reviewer_comments: comments ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: actorLabel(actor),
    },
    actor,
  );

  await logMediaAudit({
    tenantId,
    mediaId: id,
    action: auditAction,
    user: actor,
    comments: comments ?? null,
  });

  return data;
}

export async function approveMedia(tenantId, tenantSlug, id, comments, actor) {
  const asset = await getMediaAsset(tenantId, id);
  const gate = canApproveMedia(asset);
  if (!gate.ok) {
    const error = new Error(gate.reason);
    error.status = 400;
    error.expose = true;
    throw error;
  }

  const extraFields = {};
  if (asset.storage_bucket === STORAGE_BUCKETS.PRIVATE_DOCUMENTS && asset.storage_path) {
    const promoted = await promoteToPublicTenantMedia({
      tenantSlug,
      sourceBucket: asset.storage_bucket,
      sourcePath: asset.storage_path,
      targetFolder: asset.gallery_item_id ? 'gallery' : 'media/approved',
      mimeType: asset.mime_type,
    });
    extraFields.storage_bucket = promoted.bucket;
    extraFields.storage_path = promoted.storagePath;
    extraFields.file_url = promoted.url;
  }

  const data = await applyReviewDecision(tenantId, id, {
    approvalStatus: 'approved',
    comments,
    actor,
    auditAction: 'approve',
    extraFields,
  });

  if (asset.gallery_item_id && extraFields.file_url) {
    await galleryRepo.update(tenantId, asset.gallery_item_id, { image_url: extraFields.file_url }, actor);
  }

  return data;
}

export async function rejectMedia(tenantId, id, comments, actor) {
  return applyReviewDecision(tenantId, id, {
    approvalStatus: 'rejected',
    comments,
    actor,
    auditAction: 'reject',
  });
}

export async function requestMediaChanges(tenantId, id, comments, actor) {
  return applyReviewDecision(tenantId, id, {
    approvalStatus: 'changes_requested',
    comments,
    actor,
    auditAction: 'request_changes',
  });
}

export async function recordMediaConsent(tenantId, id, consentStatus, actor) {
  const data = await updateMediaAsset(tenantId, id, { consent_status: consentStatus }, actor);
  if (data) {
    await logMediaAudit({
      tenantId,
      mediaId: id,
      action: 'consent_recorded',
      user: actor,
      metadata: { consent_status: consentStatus },
    });
  }
  return data;
}

export async function linkMediaToGalleryItem(tenantId, mediaId, galleryItemId, actor) {
  return updateMediaAsset(tenantId, mediaId, { gallery_item_id: galleryItemId }, actor);
}

export async function deleteMediaAsset(tenantId, id, actor) {
  const existing = await getMediaAsset(tenantId, id);
  if (!existing) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    mediaDelete(tenantId, id);
  } else {
    const { error } = await supabase.from('media_assets').delete().eq('tenant_id', tenantId).eq('id', id);
    if (error) throw error;
  }

  await logMediaAudit({
    tenantId,
    mediaId: id,
    action: 'delete',
    user: actor,
    metadata: { title: existing.title },
  });

  return existing;
}

export function consentStatusBadge(status) {
  const map = {
    unknown: { status: 'neutral', label: 'Unknown' },
    pending: { status: 'warning', label: 'Consent Pending' },
    recorded: { status: 'success', label: 'Consent Recorded' },
    missing: { status: 'error', label: 'Missing Consent' },
    not_required: { status: 'info', label: 'Not Required' },
  };
  return map[status] ?? { status: 'neutral', label: status };
}

export function approvalStatusBadge(status) {
  const map = {
    private: { status: 'neutral', label: 'Private' },
    pending_review: { status: 'warning', label: 'Pending Review' },
    approved: { status: 'success', label: 'Approved' },
    rejected: { status: 'error', label: 'Rejected' },
    changes_requested: { status: 'info', label: 'Changes Requested' },
  };
  return map[status] ?? { status: 'neutral', label: status };
}

export function inferMediaKind(mimeType) {
  if (!mimeType) {
    return 'photo';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (mimeType === 'application/pdf') {
    return 'document';
  }
  return 'photo';
}

export default {
  logMediaAudit,
  canApproveMedia,
  isMediaPubliclyVisible,
  assertGalleryPublishable,
  filterPublicGalleryItems,
  listMediaAssets,
  listMediaAssetsByIds,
  getMediaAsset,
  getMediaStats,
  listMediaAuditLog,
  createMediaAsset,
  updateMediaAsset,
  submitMediaForReview,
  approveMedia,
  rejectMedia,
  requestMediaChanges,
  recordMediaConsent,
  linkMediaToGalleryItem,
  deleteMediaAsset,
  consentStatusBadge,
  approvalStatusBadge,
  inferMediaKind,
};
