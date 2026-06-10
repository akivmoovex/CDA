import { Router } from 'express';
import { mobileNavLinks, navLinks, sponsorshipTiers } from '../../data/publicMockData.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { applyPublicSiteLocals, getFallbackPublicSiteData } from '../../lib/fallbackPublicContent.js';
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
    applyPublicSiteLocals(res, content);
    next();
  } catch (error) {
    console.error('Public site data load failed, using fallback homepage content:', {
      message: error.message,
      host: req.headers.host,
      tenantSlug: req.tenant?.slug ?? null,
    });
    applyPublicSiteLocals(res, getFallbackPublicSiteData());
    next();
  }
}

function renderPublicPage(res, view, data = {}) {
  return res.render(view, {
    layout: 'layouts/public',
    ...data,
  });
}

router.use(loadPublicContent, attachPublicSiteData);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    console.log('Rendering homepage', {
      host: req.headers.host,
      tenantSlug: req.tenant?.slug || res.locals.tenant?.slug || null,
      tenantId: req.tenant?.id || res.locals.tenant?.id || null,
    });

    try {
      const settings = req.tenantSettings ?? res.locals.tenantSettings ?? {};
      renderPublicPage(res, 'public/home', {
        title:
          settings.metaTitle ??
          settings.siteName ??
          `${req.tenant?.name ?? 'Child Development Agency Kafue'} — Community Guardian`,
      });
    } catch (error) {
      console.error('Homepage render failed, using fallback content:', {
        message: error.message,
        host: req.headers.host,
        tenantSlug: req.tenant?.slug ?? null,
      });
      applyPublicSiteLocals(res, getFallbackPublicSiteData());
      renderPublicPage(res, 'public/home', {
        title: 'Child Development Agency Kafue',
      });
    }
  }),
);

router.get('/about', (req, res) => {
  renderPublicPage(res, 'public/about', {
    title: `About Us — ${req.tenant.name}`,
  });
});

router.get('/pages/:slug', asyncHandler(async (req, res) => {
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
}));

router.get('/programs', (req, res) => {
  renderPublicPage(res, 'public/programs', {
    title: `Programs — ${req.tenant.name}`,
  });
});

router.get('/programs/:slug', asyncHandler(async (req, res) => {
  const program = await getPublicProgram(req.tenant.id, req.params.slug);
  if (!program) {
    return res.status(404).render('errors/404', {
      layout: 'layouts/error',
      title: 'Program Not Found',
      message: 'The program you requested could not be found.',
    });
  }

  const relatedPrograms = (res.locals.programs ?? []).filter((item) => item.slug !== program.slug).slice(0, 3);

  renderPublicPage(res, 'public/program-detail', {
    title: `${program.title} — ${req.tenant.name}`,
    program,
    relatedPrograms,
  });
}));

router.get('/sponsorship', (req, res) => {
  renderPublicPage(res, 'public/sponsorship', {
    title: `Sponsorship — ${req.tenant.name}`,
    submitted: req.query.submitted === '1',
    formError: null,
    formValues: {},
  });
});

router.post('/sponsorship', asyncHandler(async (req, res) => {
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
    throw error;
  }
}));

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

router.post('/volunteer', asyncHandler(async (req, res) => {
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
    throw error;
  }
}));

router.get('/news', (req, res) => {
  const newsArticles = res.locals.newsArticles ?? [];
  const featuredArticle = newsArticles.find((article) => article.featured) ?? newsArticles[0];
  const articles = newsArticles.filter((article) => article.slug !== featuredArticle?.slug);

  renderPublicPage(res, 'public/news', {
    title: `News — ${req.tenant.name}`,
    featuredArticle,
    articles,
  });
});

router.get('/news/:slug', asyncHandler(async (req, res) => {
  const article = await getPublicNews(req.tenant.id, req.params.slug);
  if (!article) {
    return res.status(404).render('errors/404', {
      layout: 'layouts/error',
      title: 'Article Not Found',
      message: 'The news article you requested could not be found.',
    });
  }

  const relatedArticles = (res.locals.newsArticles ?? [])
    .filter((item) => item.slug !== article.slug)
    .slice(0, 2);

  renderPublicPage(res, 'public/news-article', {
    title: `${article.title} — ${req.tenant.name}`,
    article,
    relatedArticles,
  });
}));

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
