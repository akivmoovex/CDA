import { Router } from 'express';
import attachAdminContext from '../../middleware/adminContext.js';
import { requireAdmin, requireAuth, requireTenantAccess } from '../../middleware/auth.js';
import createCmsRouter from './cms.js';
import createMediaRouter from './media.js';
import createSponsorshipsRouter from './sponsorships.js';
import createVolunteersRouter from './volunteers.js';

const router = Router();

router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/admin');
  }

  res.render('admin/login', {
    layout: 'layouts/admin-auth',
    title: 'Admin Login',
    pageTitle: 'Sign in to Admin',
  });
});

router.use(requireAuth, requireAdmin, requireTenantAccess, attachAdminContext);

router.get('/', (req, res) => {
  res.render('admin/dashboard', {
    layout: 'layouts/admin',
    title: 'Dashboard',
    pageTitle: 'Dashboard',
  });
});

router.use('/cms', createCmsRouter());
router.use('/media', createMediaRouter());
router.use('/volunteers', createVolunteersRouter());
router.use('/sponsorships', createSponsorshipsRouter());

router.get('/content', (_req, res) => res.redirect('/admin/cms'));
router.get('/events', (_req, res) => res.redirect('/admin/cms/events'));

const placeholderPages = [
  { path: '/donations', title: 'Donations', description: 'Review incoming donations and allocation by program.' },
  { path: '/reports', title: 'Impact Reports', description: 'Generate and export tenant impact summaries.' },
  { path: '/settings', title: 'Settings', description: 'Configure tenant branding, contact details, and admin preferences.' },
];

placeholderPages.forEach((page) => {
  router.get(page.path, (req, res) => {
    res.render('admin/placeholder', {
      layout: 'layouts/admin',
      title: page.title,
      pageTitle: page.title,
      pageDescription: page.description,
      formConfig: {
        title: page.title + ' Module',
        description: page.description,
        submitLabel: 'Coming Soon',
        disabled: true,
        cancelHref: '/admin',
        fields: [{ id: 'note', name: 'note', label: 'Notes', type: 'textarea', value: page.description, colspan: 2 }],
      },
    });
  });
});

export default router;
