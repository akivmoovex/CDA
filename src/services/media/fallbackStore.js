import crypto from 'node:crypto';

const stores = new Map();

function tenantStore(tenantId) {
  if (!stores.has(tenantId)) {
    stores.set(tenantId, {
      media_assets: [],
      media_audit_log: [],
      seeded: false,
    });
  }
  return stores.get(tenantId);
}

function nowIso() {
  return new Date().toISOString();
}

function seedTenantStore(tenantId) {
  const store = tenantStore(tenantId);
  if (store.seeded) {
    return store;
  }

  const assets = [
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      title: 'Classroom Smiles',
      description: 'Literacy club session',
      file_url:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAmJBqLh-dLtogSNV_Up-OJ8uRz3ZLfWWwBUin-MOy2RqPGb645mHbFJiJn-8I-MfMw_fgyMBv8_Rj4_W-5oRnPgWSz5Iaa3ssrspFZm0jEDhnhDANs-dkqtRt1eoby_loYyJ02Rsu_8yweGDZzJIBu3uDwsy-lTCHPi6N7eTbILJhtC4jdGGRL9MMoD1vJfFXjXBM6cbqnU0Up73FpJzWZ7z1Zp50ePld-cvsxx1XgwbjKPCTD2Mb1WaUUYfacj2CPnrixHpEcwySM',
      storage_bucket: 'private-documents',
      storage_path: 'cda-kafue/gallery/pending/classroom-smiles.jpg',
      mime_type: 'image/jpeg',
      media_kind: 'photo',
      tags: ['education', 'community'],
      is_child_related: true,
      consent_status: 'recorded',
      approval_status: 'pending_review',
      reviewer_comments: null,
      reviewed_at: null,
      reviewed_by: null,
      uploaded_by: 'M. Okoro',
      gallery_item_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      title: 'Mobile Clinic Outreach',
      description: 'Health program field visit',
      file_url: '',
      storage_bucket: 'private-documents',
      storage_path: 'cda-kafue/media/pending/mobile-clinic.jpg',
      mime_type: 'image/jpeg',
      media_kind: 'photo',
      tags: ['health'],
      is_child_related: true,
      consent_status: 'missing',
      approval_status: 'pending_review',
      reviewer_comments: 'Awaiting signed consent forms from guardians.',
      reviewed_at: null,
      reviewed_by: null,
      uploaded_by: 'L. Diop',
      gallery_item_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      title: 'Community Forum',
      description: 'Annual community gathering',
      file_url:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDLIWhPJMqEyF6Qc48sfj1UeRXfZZgdP9UucN1Oan5buMRhiuUWc43Eg_5w1o4cmOy0o9mXFLVa4Uk0w_QYIYw9vap8Q73AMOEFSyIKokVEOEKagmIpWlv-lp_z2zT71zbw-STzmNgOtdA7f0acONICnHQQWf1Yhqq9qW4cNAM1RC47rnF7E9N4px-LCgTCqTRU1izs3VadRaYnHotjfEPEaxowy5qwR_rHqI3TJH-XVoayiQewilGhJilRZ7LCFz-vkYeyWs-IHv_W',
      storage_bucket: 'tenant-media',
      storage_path: 'cda-kafue/gallery/community-forum.jpg',
      mime_type: 'image/jpeg',
      media_kind: 'photo',
      tags: ['community'],
      is_child_related: false,
      consent_status: 'not_required',
      approval_status: 'approved',
      reviewer_comments: 'Approved for public gallery.',
      reviewed_at: nowIso(),
      reviewed_by: 'admin',
      uploaded_by: 'Admin',
      gallery_item_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  store.media_assets = assets;
  store.media_audit_log = assets.flatMap((asset) => [
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      media_id: asset.id,
      action: 'upload',
      user_id: null,
      user_email: asset.uploaded_by,
      comments: null,
      metadata: { title: asset.title },
      created_at: asset.created_at,
    },
    ...(asset.approval_status === 'approved'
      ? [
          {
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            media_id: asset.id,
            action: 'approve',
            user_id: null,
            user_email: 'admin',
            comments: asset.reviewer_comments,
            metadata: {},
            created_at: asset.reviewed_at,
          },
        ]
      : []),
  ]);

  store.seeded = true;
  return store;
}

export function mediaList(tenantId, { approvalStatus, mediaKind, childRelated } = {}) {
  const store = seedTenantStore(tenantId);
  let rows = store.media_assets.filter((row) => row.tenant_id === tenantId);
  if (approvalStatus) {
    rows = rows.filter((row) => row.approval_status === approvalStatus);
  }
  if (mediaKind) {
    rows = rows.filter((row) => row.media_kind === mediaKind);
  }
  if (childRelated === true) {
    rows = rows.filter((row) => row.is_child_related);
  }
  return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function mediaGetById(tenantId, id) {
  const store = seedTenantStore(tenantId);
  return store.media_assets.find((row) => row.id === id && row.tenant_id === tenantId) ?? null;
}

export function mediaGetByIds(tenantId, ids) {
  const store = seedTenantStore(tenantId);
  const idSet = new Set(ids.filter(Boolean));
  return store.media_assets.filter((row) => row.tenant_id === tenantId && idSet.has(row.id));
}

export function mediaCreate(tenantId, payload) {
  const store = seedTenantStore(tenantId);
  const row = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    ...payload,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  store.media_assets.unshift(row);
  return row;
}

export function mediaUpdate(tenantId, id, payload) {
  const store = seedTenantStore(tenantId);
  const index = store.media_assets.findIndex((row) => row.id === id && row.tenant_id === tenantId);
  if (index === -1) {
    return null;
  }
  store.media_assets[index] = {
    ...store.media_assets[index],
    ...payload,
    updated_at: nowIso(),
  };
  return store.media_assets[index];
}

export function mediaDelete(tenantId, id) {
  const store = seedTenantStore(tenantId);
  const index = store.media_assets.findIndex((row) => row.id === id && row.tenant_id === tenantId);
  if (index === -1) {
    return null;
  }
  const [removed] = store.media_assets.splice(index, 1);
  return removed;
}

export function mediaAuditList(tenantId, mediaId) {
  const store = seedTenantStore(tenantId);
  return store.media_audit_log
    .filter((row) => row.tenant_id === tenantId && row.media_id === mediaId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function mediaAuditCreate(entry) {
  const store = tenantStore(entry.tenant_id);
  const row = { id: crypto.randomUUID(), created_at: nowIso(), ...entry };
  store.media_audit_log.unshift(row);
  return row;
}

export default {
  mediaList,
  mediaGetById,
  mediaGetByIds,
  mediaCreate,
  mediaUpdate,
  mediaDelete,
  mediaAuditList,
  mediaAuditCreate,
};
