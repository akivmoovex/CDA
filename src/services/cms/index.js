import { createCmsRepository } from './cmsRepository.js';

export const pagesRepo = createCmsRepository({ table: 'cms_pages', entityType: 'page' });
export const homepageSectionsRepo = createCmsRepository({
  table: 'cms_homepage_sections',
  entityType: 'homepage_section',
  slugField: 'section_key',
});
export const programsRepo = createCmsRepository({ table: 'cms_programs', entityType: 'program' });
export const newsRepo = createCmsRepository({ table: 'cms_news_posts', entityType: 'news_post' });
export const eventsRepo = createCmsRepository({ table: 'cms_events', entityType: 'event' });
export const galleryRepo = createCmsRepository({ table: 'cms_gallery_items', entityType: 'gallery_item' });
export const resourcesRepo = createCmsRepository({ table: 'cms_resources', entityType: 'resource' });

export const cmsRepositories = {
  pages: pagesRepo,
  homepage: homepageSectionsRepo,
  programs: programsRepo,
  news: newsRepo,
  events: eventsRepo,
  gallery: galleryRepo,
  resources: resourcesRepo,
};

export default cmsRepositories;
