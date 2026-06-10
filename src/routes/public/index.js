import { Router } from 'express';
import { mobileNavLinks, navLinks, sponsorshipTiers } from '../../data/publicMockData.js';
import loadPublicContent from '../../middleware/publicContent.js';
import {
  getPublicNews,
  getPublicPage,
  getPublicProgram,
  loadPublicSiteContent,
} from '../../services/cms/publicContentService.js';
import { parseSponsorshipRequest, parseVolunteerApplication } from '../../lib/publicFormParser.js';
import { createSponsorshipRequest, createVolunteerApplication } from '../../services/workflows/index.js';

const router = Router();

async function attachPublicSiteData(req, res, next) {
  try {
    const content = await loadPublicSiteContent(req.tenant, req.tenantSettings);

    res.locals.navLinks = navLinks;
    res.locals.mobileNavLinks = mobileNavLinks;
    res.locals.programs = content.programs;
    res.locals.newsArticles = content.newsArticles;
    res.locals.events = content.events;
    res.locals.galleryItems = content.galleryItems;
    res.locals.resources = content.resources;
    res.locals.sponsorshipTiers = sponsorshipTiers;
    res.locals.impactStats = content.impactStats;
    res.locals.testimonials = content.testimonials;
    res.locals.homeContent = content.homeContent;
    res.locals.cmsPages = content.pages;

    next();
  } catch (error) {
    next(error);
  }
}

function renderPublicPage(res, view, data = {}) {
  return res.render(view, {
    layout: 'layouts/public',
    ...data,
  });
}

router.use(loadPublicContent, attachPublicSiteData);

router.get('/', (req, res) => {
  const settings = req.tenantSettings ?? {};
  renderPublicPage(res, 'public/home', {
    title: settings.metaTitle ?? `${req.tenant.name} — Community Guardian`,
  });
});

router.get('/about', (req, res) => {
  renderPublicPage(res, 'public/about', {
    title: `About Us — ${req.tenant.name}`,
  });
});

router.get('/pages/:slug', async (req, res, next) => {
  try {
    const page = await getPublicPage(req.tenant.id, req.params.slug);
    if (!page) {
      return res.status(404).render('errors/404', {
        layout: 'layouts/error',
        title: 'Page Not Found',
        message: 'The page you requested could not be found.',
      });
    }

    renderPublicPage(res, 'public/page', {
      title: `${page.title} — ${req.tenant.name}`,
      page,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/programs', (req, res) => {
  renderPublicPage(res, 'public/programs', {
    title: `Programs — ${req.tenant.name}`,
  });
});

router.get('/programs/:slug', async (req, res, next) => {
  try {
    const program = await getPublicProgram(req.tenant.id, req.params.slug);
    if (!program) {
      return res.status(404).render('errors/404', {
        layout: 'layouts/error',
        title: 'Program Not Found',
        message: 'The program you requested could not be found.',
      });
    }

    const relatedPrograms = res.locals.programs.filter((item) => item.slug !== program.slug).slice(0, 3);

    renderPublicPage(res, 'public/program-detail', {
      title: `${program.title} — ${req.tenant.name}`,
      program,
      relatedPrograms,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sponsorship', (req, res) => {
  renderPublicPage(res, 'public/sponsorship', {
    title: `Sponsorship — ${req.tenant.name}`,
    submitted: req.query.submitted === '1',
    formError: null,
    formValues: {},
  });
});

router.post('/sponsorship', async (req, res, next) => {
  try {
    const payload = parseSponsorshipRequest(req.body);
    await createSponsorshipRequest(req.tenant.id, payload);
    return res.redirect('/sponsorship?submitted=1#interest');
  } catch (error) {
    if (error.expose) {
      return renderPublicPage(res, 'public/sponsorship', {
        title: `Sponsorship — ${req.tenant.name}`,
        submitted: false,
        formError: error.message,
        formValues: req.body,
      });
    }
    return next(error);
  }
});

router.get('/donate', (req, res) => {
  renderPublicPage(res, 'public/donation', {
    title: `Donate — ${req.tenant.name}`,
  });
});

router.get('/volunteer', (req, res) => {
  renderPublicPage(res, 'public/volunteer', {
    title: `Volunteer — ${req.tenant.name}`,
    submitted: req.query.submitted === '1',
    formError: null,
    formValues: {},
  });
});

router.post('/volunteer', async (req, res, next) => {
  try {
    const payload = parseVolunteerApplication(req.body);
    await createVolunteerApplication(req.tenant.id, payload);
    return res.redirect('/volunteer?submitted=1#apply');
  } catch (error) {
    if (error.expose) {
      return renderPublicPage(res, 'public/volunteer', {
        title: `Volunteer — ${req.tenant.name}`,
        submitted: false,
        formError: error.message,
        formValues: req.body,
      });
    }
    return next(error);
  }
});

router.get('/news', (req, res) => {
  const featuredArticle = res.locals.newsArticles.find((article) => article.featured) ?? res.locals.newsArticles[0];
  const articles = res.locals.newsArticles.filter((article) => article.slug !== featuredArticle?.slug);

  renderPublicPage(res, 'public/news', {
    title: `News — ${req.tenant.name}`,
    featuredArticle,
    articles,
  });
});

router.get('/news/:slug', async (req, res, next) => {
  try {
    const article = await getPublicNews(req.tenant.id, req.params.slug);
    if (!article) {
      return res.status(404).render('errors/404', {
        layout: 'layouts/error',
        title: 'Article Not Found',
        message: 'The news article you requested could not be found.',
      });
    }

    const relatedArticles = res.locals.newsArticles.filter((item) => item.slug !== article.slug).slice(0, 2);

    renderPublicPage(res, 'public/news-article', {
      title: `${article.title} — ${req.tenant.name}`,
      article,
      relatedArticles,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/events', (req, res) => {
  renderPublicPage(res, 'public/events', {
    title: `Events — ${req.tenant.name}`,
  });
});

router.get('/gallery', (req, res) => {
  renderPublicPage(res, 'public/gallery', {
    title: `Gallery — ${req.tenant.name}`,
  });
});

router.get('/resources', (req, res) => {
  renderPublicPage(res, 'public/resources', {
    title: `Resources — ${req.tenant.name}`,
  });
});

router.get('/contact', (req, res) => {
  renderPublicPage(res, 'public/contact', {
    title: `Contact — ${req.tenant.name}`,
  });
});

export default router;
