import crypto from 'node:crypto';
import {
  events as mockEvents,
  galleryItems as mockGallery,
  newsArticles as mockNews,
  programs as mockPrograms,
  resources as mockResources,
} from '../../data/publicMockData.js';

const stores = new Map();

function tenantStore(tenantId) {
  if (!stores.has(tenantId)) {
    stores.set(tenantId, {
      cms_pages: [],
      cms_homepage_sections: [],
      cms_programs: [],
      cms_news_posts: [],
      cms_events: [],
      cms_gallery_items: [],
      cms_resources: [],
      cms_audit_log: [],
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

  store.cms_homepage_sections = [
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      section_key: 'hero',
      title: "Empowering Every Child's Future in Kafue",
      subtitle: 'Community Guardian',
      body: 'We are dedicated to creating a nurturing environment where children can thrive through education, healthcare, and community support.',
      image_url: null,
      cta_label: 'Donate Now',
      cta_url: '/donate',
      extra: {},
      sort_order: 1,
      status: 'published',
      published_at: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      section_key: 'about',
      title: 'Nurturing Hope, One Child at a Time',
      subtitle: 'Our Story',
      body: 'Founded on the belief that geography should not define a child\'s potential, CDAK has been at the forefront of development in Kafue for over a decade.',
      image_url: null,
      cta_label: 'Learn more about our mission',
      cta_url: '/about',
      extra: {},
      sort_order: 2,
      status: 'published',
      published_at: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  store.cms_programs = mockPrograms.map((program, index) => ({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    slug: program.slug,
    title: program.title,
    category: program.category,
    summary: program.summary,
    body: program.detail?.intro ?? program.summary,
    image_url: program.image,
    hero_image_url: program.detail?.heroImage ?? program.image,
    progress: program.progress,
    progress_label: program.progressLabel,
    objectives: program.detail?.objectives ?? [],
    outcomes: program.detail?.outcomes ?? [],
    sort_order: index,
    status: 'published',
    published_at: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
  }));

  store.cms_news_posts = mockNews.map((article) => ({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    slug: article.slug,
    title: article.title,
    category: article.category,
    excerpt: article.excerpt,
    body: (article.body || []).join('\n\n'),
    image_url: article.image,
    author: article.author,
    featured: Boolean(article.featured),
    status: 'published',
    published_at: article.date,
    created_at: nowIso(),
    updated_at: nowIso(),
  }));

  store.cms_events = mockEvents.map((event, index) => ({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    location: event.location,
    event_date: event.date,
    event_time: null,
    featured: Boolean(event.featured),
    sort_order: index,
    status: 'published',
    published_at: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
  }));

  store.cms_gallery_items = mockGallery.map((item, index) => ({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    title: item.title,
    category: item.category,
    image_url: item.image,
    sort_order: index,
    status: 'published',
    published_at: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
  }));

  store.cms_resources = mockResources.map((resource, index) => ({
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    slug: resource.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: resource.title,
    description: resource.description,
    file_url: null,
    file_type: resource.type,
    file_size: resource.size,
    sort_order: index,
    status: 'published',
    published_at: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso(),
  }));

  store.cms_pages = [
    {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      slug: 'about',
      title: 'About Us',
      body: 'Child Development Agency Kafue is a grassroots organization dedicated to transforming lives.',
      meta_title: 'About Us',
      meta_description: 'Learn about CDAK mission and team.',
      status: 'published',
      published_at: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  store.seeded = true;
  return store;
}

export function fallbackList(table, tenantId, { publishedOnly = false } = {}) {
  const store = seedTenantStore(tenantId);
  let rows = [...store[table]].filter((row) => row.tenant_id === tenantId);
  if (publishedOnly) {
    rows = rows.filter((row) => row.status === 'published');
  }
  return rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(b.updated_at) - new Date(a.updated_at));
}

export function fallbackGetById(table, tenantId, id) {
  const store = seedTenantStore(tenantId);
  return store[table].find((row) => row.id === id && row.tenant_id === tenantId) ?? null;
}

export function fallbackGetBySlug(table, tenantId, slug) {
  const store = seedTenantStore(tenantId);
  return store[table].find((row) => row.slug === slug && row.tenant_id === tenantId) ?? null;
}

export function fallbackGetByKey(table, tenantId, keyField, keyValue) {
  const store = seedTenantStore(tenantId);
  return store[table].find((row) => row[keyField] === keyValue && row.tenant_id === tenantId) ?? null;
}

export function fallbackCreate(table, tenantId, payload) {
  const store = seedTenantStore(tenantId);
  const row = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    ...payload,
    created_at: nowIso(),
    updated_at: nowIso(),
    published_at: payload.status === 'published' ? nowIso() : null,
  };
  store[table].push(row);
  return row;
}

export function fallbackUpdate(table, tenantId, id, payload) {
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

export function fallbackDelete(table, tenantId, id) {
  const store = seedTenantStore(tenantId);
  const index = store[table].findIndex((row) => row.id === id && row.tenant_id === tenantId);
  if (index === -1) {
    return null;
  }
  const [removed] = store[table].splice(index, 1);
  return removed;
}

export function fallbackAudit(entry) {
  const store = tenantStore(entry.tenant_id);
  const row = { id: crypto.randomUUID(), created_at: nowIso(), ...entry };
  store.cms_audit_log.unshift(row);
  return row;
}

export default {
  fallbackList,
  fallbackGetById,
  fallbackGetBySlug,
  fallbackGetByKey,
  fallbackCreate,
  fallbackUpdate,
  fallbackDelete,
  fallbackAudit,
};
