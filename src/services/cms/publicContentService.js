import {
  eventsRepo,
  galleryRepo,
  homepageSectionsRepo,
  newsRepo,
  pagesRepo,
  programsRepo,
  resourcesRepo,
} from './index.js';
import { filterPublicGalleryItems, listMediaAssetsByIds, resolvePublicMediaUrl } from '../media/index.js';
import { impactStats, sponsorshipTiers, testimonials } from '../../data/publicMockData.js';
import { getTenantSettings } from '../tenantService.js';

function mapProgram(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    image: row.image_url,
    progress: row.progress,
    progressLabel: row.progress_label,
    detail: {
      heroImage: row.hero_image_url ?? row.image_url,
      intro: row.body ?? row.summary,
      objectives: row.objectives ?? [],
      outcomes: row.outcomes ?? [],
    },
  };
}

function mapNews(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    image: row.image_url,
    date: row.published_at?.slice(0, 10) ?? row.created_at?.slice(0, 10),
    author: row.author,
    featured: row.featured,
    body: (row.body ?? '').split('\n\n').filter(Boolean),
  };
}

function mapEvent(row) {
  const date = new Date(row.event_date);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(date.getDate());
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    location: row.location,
    date: row.event_date,
    month,
    day,
    featured: row.featured,
  };
}

function mapGallery(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    image: row.image_url,
  };
}

function mapResource(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    type: row.file_type,
    size: row.file_size,
    fileUrl: row.file_url,
  };
}

function buildHomeContent(tenant, settings, sections) {
  const byKey = Object.fromEntries(sections.map((section) => [section.section_key, section]));
  const hero = byKey.hero ?? {};
  const about = byKey.about ?? {};

  return {
    hero: {
      badge: hero.subtitle ?? settings?.tagline ?? 'Kafue, Zambia',
      title: hero.title ?? settings?.heroTitle ?? tenant.name,
      subtitle: hero.body ?? settings?.heroBody ?? '',
      image: hero.image_url ?? settings?.heroImage ?? null,
      primaryCta: { label: hero.cta_label ?? settings?.donateCtaLabel ?? 'Donate Now', href: hero.cta_url ?? '/donate' },
      secondaryCta: { label: settings?.primaryCtaLabel ?? 'Our Programs', href: settings?.primaryCtaUrl ?? '/programs' },
      tertiaryCta: { label: 'Become a Volunteer', href: '/volunteer' },
    },
    about: {
      image: about.image_url ?? null,
      eyebrow: about.subtitle ?? 'Our Story',
      title: about.title ?? 'Nurturing Hope, One Child at a Time',
      body: about.body ? [about.body] : [],
      link: { label: about.cta_label ?? 'Learn more about our mission', href: about.cta_url ?? '/about' },
    },
  };
}

export async function loadPublicSiteContent(tenant, tenantSettings) {
  const tenantId = tenant.id;
  const settings = tenantSettings ?? (await getTenantSettings(tenantId));

  const [sections, programs, news, events, gallery, resources, pages] = await Promise.all([
    homepageSectionsRepo.list(tenantId, { publishedOnly: true }),
    programsRepo.list(tenantId, { publishedOnly: true }),
    newsRepo.list(tenantId, { publishedOnly: true }),
    eventsRepo.list(tenantId, { publishedOnly: true }),
    galleryRepo.list(tenantId, { publishedOnly: true }),
    resourcesRepo.list(tenantId, { publishedOnly: true }),
    pagesRepo.list(tenantId, { publishedOnly: true }),
  ]);

  const mappedPrograms = programs.map(mapProgram);
  const mappedNews = news.map(mapNews);
  const mappedEvents = events.map(mapEvent);
  const publicGallery = await filterPublicGalleryItems(tenantId, gallery);
  const galleryAssets = await listMediaAssetsByIds(
    tenantId,
    publicGallery.map((row) => row.media_asset_id).filter(Boolean),
  );
  const galleryAssetById = Object.fromEntries(galleryAssets.map((asset) => [asset.id, asset]));
  const mappedGallery = await Promise.all(
    publicGallery.map(async (row) => {
      const asset = row.media_asset_id ? galleryAssetById[row.media_asset_id] : null;
      const imageUrl = row.image_url ?? (asset ? await resolvePublicMediaUrl(asset) : null);
      return mapGallery({ ...row, image_url: imageUrl });
    }),
  );

  return {
    homeContent: buildHomeContent(tenant, settings, sections),
    programs: mappedPrograms,
    newsArticles: mappedNews,
    events: mappedEvents,
    galleryItems: mappedGallery.filter((item) => item.image),
    resources: resources.map(mapResource),
    pages,
    impactStats,
    testimonials,
    sponsorshipTiers,
  };
}

export async function getPublicProgram(tenantId, slug) {
  const row = await programsRepo.getBySlug(tenantId, slug, { publishedOnly: true });
  return row ? mapProgram(row) : null;
}

export async function getPublicNews(tenantId, slug) {
  const row = await newsRepo.getBySlug(tenantId, slug, { publishedOnly: true });
  return row ? mapNews(row) : null;
}

export async function getPublicPage(tenantId, slug) {
  return pagesRepo.getBySlug(tenantId, slug, { publishedOnly: true });
}

export default {
  loadPublicSiteContent,
  getPublicProgram,
  getPublicNews,
  getPublicPage,
};
