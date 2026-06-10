import {
  events,
  galleryItems,
  impactStats,
  mobileNavLinks,
  navLinks,
  newsArticles,
  programs,
  resources,
  sponsorshipTiers,
  testimonials,
} from '../data/publicMockData.js';

export function getFallbackHomeContent() {
  return {
    hero: {
      badge: 'Child Development Agency Kafue',
      title: 'Supporting children, families, and communities in Kafue',
      subtitle:
        'A community-focused child development platform for programs, sponsorship, volunteering, and impact stories.',
      image: null,
      primaryCta: { label: 'Our Programs', href: '/programs' },
      secondaryCta: { label: 'Donate', href: '/donate' },
      tertiaryCta: { label: 'Become a Volunteer', href: '/volunteer' },
    },
    about: {
      image: programs[0]?.image ?? null,
      eyebrow: 'Our Story',
      title: 'Child Development Agency Kafue',
      body: [
        'A community-focused child development platform for programs, sponsorship, volunteering, and impact stories.',
      ],
      link: { label: 'Learn more about our mission', href: '/about' },
    },
  };
}

export function getFallbackPublicSiteData() {
  return {
    programs,
    newsArticles,
    events,
    galleryItems,
    resources,
    impactStats,
    testimonials,
    homeContent: getFallbackHomeContent(),
    pages: [],
  };
}

export function applyPublicSiteLocals(res, content = {}) {
  const fallback = getFallbackPublicSiteData();

  res.locals.navLinks = navLinks;
  res.locals.mobileNavLinks = mobileNavLinks;
  res.locals.programs = content.programs?.length ? content.programs : fallback.programs;
  res.locals.newsArticles = content.newsArticles?.length ? content.newsArticles : fallback.newsArticles;
  res.locals.events = content.events?.length ? content.events : fallback.events;
  res.locals.galleryItems = content.galleryItems?.length ? content.galleryItems : fallback.galleryItems;
  res.locals.resources = content.resources?.length ? content.resources : fallback.resources;
  res.locals.sponsorshipTiers = sponsorshipTiers;
  res.locals.impactStats = content.impactStats?.length ? content.impactStats : fallback.impactStats;
  res.locals.testimonials = content.testimonials?.length ? content.testimonials : fallback.testimonials;
  res.locals.homeContent = content.homeContent?.hero ? content.homeContent : fallback.homeContent;
  res.locals.cmsPages = content.pages ?? [];
}

export default {
  getFallbackHomeContent,
  getFallbackPublicSiteData,
  applyPublicSiteLocals,
};
