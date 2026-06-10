import crypto from 'node:crypto';

const stores = new Map();

function tenantStore(tenantId) {
  if (!stores.has(tenantId)) {
    stores.set(tenantId, {
      volunteer_applications: [],
      volunteer_assignments: [],
      sponsorship_requests: [],
      sponsor_records: [],
      sponsorship_children: [],
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

  const appId = crypto.randomUUID();
  store.volunteer_applications = [
    {
      id: appId,
      tenant_id: tenantId,
      first_name: 'Grace',
      last_name: 'Banda',
      email: 'grace.banda@example.com',
      phone: '+260 97 000 1234',
      interest_area: 'Education Support',
      availability: 'Weekends',
      message: 'I am a retired teacher interested in literacy clubs.',
      status: 'pending',
      admin_comments: null,
      reviewed_at: null,
      reviewed_by: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      first_name: 'Michael',
      last_name: 'Zulu',
      email: 'michael.zulu@example.com',
      phone: null,
      interest_area: 'Health Outreach',
      availability: 'Flexible',
      message: 'Medical student looking for outreach experience.',
      status: 'approved',
      admin_comments: 'Strong candidate for mobile clinic support.',
      reviewed_at: nowIso(),
      reviewed_by: 'admin',
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  store.volunteer_assignments = [
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      application_id: store.volunteer_applications[1].id,
      title: 'Mobile Clinic Assistant',
      description: 'Support intake and health education sessions.',
      location: 'Kafue District Clinic',
      start_date: '2024-10-01',
      end_date: '2024-12-15',
      status: 'scheduled',
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  store.sponsorship_requests = [
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      first_name: 'Sarah',
      last_name: 'Ngoma',
      email: 'sarah.ngoma@example.com',
      phone: '+260 96 555 0101',
      tier_name: 'Full Student Sponsor',
      monthly_amount: '$75/month',
      message: 'I would like to sponsor a primary school student.',
      status: 'pending',
      admin_comments: null,
      reviewed_at: null,
      reviewed_by: null,
      sponsor_record_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      first_name: 'David',
      last_name: 'Mwanza',
      email: 'david.mwanza@example.com',
      phone: null,
      tier_name: 'Education Champion',
      monthly_amount: '$35/month',
      message: 'Interested in quarterly updates.',
      status: 'contacted',
      admin_comments: 'Sent onboarding pack; awaiting response.',
      reviewed_at: nowIso(),
      reviewed_by: 'admin',
      sponsor_record_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  store.sponsor_records = [];
  store.sponsorship_children = [
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      reference_code: 'CH-001',
      display_name: 'Student A',
      age_range: '8-10',
      program_area: 'Education Support',
      is_available: true,
      notes: 'Placeholder profile for internal matching.',
      sponsor_record_id: null,
      matched_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      reference_code: 'CH-002',
      display_name: 'Student B',
      age_range: '11-13',
      program_area: 'Education Support',
      is_available: true,
      notes: 'Placeholder profile for internal matching.',
      sponsor_record_id: null,
      matched_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      reference_code: 'CH-003',
      display_name: 'Student C',
      age_range: '14-16',
      program_area: 'Skills Development',
      is_available: true,
      notes: 'Placeholder profile for internal matching.',
      sponsor_record_id: null,
      matched_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  store.seeded = true;
  return store;
}

export function wfList(table, tenantId, { status, orderBy = 'created_at', ascending = false } = {}) {
  const store = seedTenantStore(tenantId);
  let rows = store[table].filter((row) => row.tenant_id === tenantId);
  if (status) {
    rows = rows.filter((row) => row.status === status);
  }
  return rows.sort((a, b) => {
    const av = a[orderBy];
    const bv = b[orderBy];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return ascending ? (av > bv ? 1 : -1) : av > bv ? -1 : 1;
  });
}

export function wfGetById(table, tenantId, id) {
  const store = seedTenantStore(tenantId);
  return store[table].find((row) => row.id === id && row.tenant_id === tenantId) ?? null;
}

export function wfListByForeignKey(table, tenantId, foreignKey, foreignId) {
  const store = seedTenantStore(tenantId);
  return store[table]
    .filter((row) => row.tenant_id === tenantId && row[foreignKey] === foreignId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function wfCreate(table, tenantId, payload) {
  const store = seedTenantStore(tenantId);
  const row = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    ...payload,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  store[table].push(row);
  return row;
}

export function wfUpdate(table, tenantId, id, payload) {
  const store = seedTenantStore(tenantId);
  const index = store[table].findIndex((row) => row.id === id && row.tenant_id === tenantId);
  if (index === -1) {
    return null;
  }
  store[table][index] = {
    ...store[table][index],
    ...payload,
    updated_at: nowIso(),
  };
  return store[table][index];
}

export function wfDelete(table, tenantId, id) {
  const store = seedTenantStore(tenantId);
  const index = store[table].findIndex((row) => row.id === id && row.tenant_id === tenantId);
  if (index === -1) {
    return null;
  }
  const [removed] = store[table].splice(index, 1);
  return removed;
}

export default {
  wfList,
  wfGetById,
  wfListByForeignKey,
  wfCreate,
  wfUpdate,
  wfDelete,
};
