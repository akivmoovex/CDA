import { Router } from 'express';
import {
  createSponsorFromRequest,
  getSponsorRecord,
  getSponsorshipRequest,
  listSponsorRecords,
  listSponsorshipChildren,
  listSponsorshipRequests,
  matchChildToSponsor,
  sponsorshipStatusBadge,
  updateSponsorshipRequest,
} from '../../services/workflows/index.js';

function parseReviewBody(body) {
  return {
    status: body.status || undefined,
    admin_comments: body.admin_comments?.trim() || null,
  };
}

export function createSponsorshipsRouter() {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const statusFilter = req.query.status || null;
      const requests = await listSponsorshipRequests(req.tenant.id, {
        status: statusFilter || undefined,
      });

      const rows = requests.map((request) => ({
        name: `${request.first_name} ${request.last_name}`,
        email: request.email,
        tier: request.tier_name ?? '—',
        submitted: new Date(request.created_at).toLocaleDateString(),
        status: sponsorshipStatusBadge(request.status),
        actions: {
          editHref: `/admin/sponsorships/requests/${request.id}`,
        },
      }));

      res.render('admin/sponsorships/requests', {
        layout: 'layouts/admin',
        title: 'Sponsorships',
        pageTitle: 'Sponsorship Requests',
        pageDescription: 'Review sponsor interest forms and progress requests through matching.',
        activeTab: 'requests',
        statusFilter,
        rows,
        flash: req.query.flash,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/sponsors', async (req, res, next) => {
    try {
      const sponsors = await listSponsorRecords(req.tenant.id);

      const rows = sponsors.map((sponsor) => ({
        name: `${sponsor.first_name} ${sponsor.last_name}`,
        email: sponsor.email,
        tier: sponsor.tier_name ?? '—',
        status: {
          status: sponsor.status === 'active' ? 'success' : sponsor.status === 'paused' ? 'warning' : 'neutral',
          label: sponsor.status,
        },
        actions: {
          editHref: `/admin/sponsorships/sponsors/${sponsor.id}`,
        },
      }));

      res.render('admin/sponsorships/sponsors', {
        layout: 'layouts/admin',
        title: 'Sponsor Records',
        pageTitle: 'Sponsor Records',
        pageDescription: 'Active sponsors and internal child matching.',
        activeTab: 'sponsors',
        rows,
        flash: req.query.flash,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/requests/:id', async (req, res, next) => {
    try {
      const request = await getSponsorshipRequest(req.tenant.id, req.params.id);
      if (!request) {
        return res.status(404).render('errors/404', {
          layout: 'layouts/error',
          title: 'Not Found',
          message: 'Sponsorship request not found.',
        });
      }

      let sponsorRecord = null;
      if (request.sponsor_record_id) {
        sponsorRecord = await getSponsorRecord(req.tenant.id, request.sponsor_record_id);
      }

      res.render('admin/sponsorships/request-detail', {
        layout: 'layouts/admin',
        title: 'Sponsorship Request',
        pageTitle: `${request.first_name} ${request.last_name}`,
        request,
        sponsorRecord,
        statusBadge: sponsorshipStatusBadge(request.status),
        flash: req.query.flash,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/requests/:id', async (req, res, next) => {
    try {
      const payload = parseReviewBody(req.body);
      await updateSponsorshipRequest(req.tenant.id, req.params.id, payload, req.user);
      res.redirect(`/admin/sponsorships/requests/${req.params.id}?flash=updated`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/requests/:id/create-sponsor', async (req, res, next) => {
    try {
      const sponsor = await createSponsorFromRequest(req.tenant.id, req.params.id, req.user);
      if (!sponsor) {
        return res.status(404).render('errors/404', {
          layout: 'layouts/error',
          title: 'Not Found',
          message: 'Sponsorship request not found.',
        });
      }
      res.redirect(`/admin/sponsorships/sponsors/${sponsor.id}?flash=sponsor_created`);
    } catch (error) {
      next(error);
    }
  });

  router.get('/sponsors/:id', async (req, res, next) => {
    try {
      const sponsor = await getSponsorRecord(req.tenant.id, req.params.id);
      if (!sponsor) {
        return res.status(404).render('errors/404', {
          layout: 'layouts/error',
          title: 'Not Found',
          message: 'Sponsor record not found.',
        });
      }

      const availableChildren = await listSponsorshipChildren(req.tenant.id, { availableOnly: true });
      const allChildren = await listSponsorshipChildren(req.tenant.id);
      const matchedChild = allChildren.find((child) => child.sponsor_record_id === sponsor.id) ?? null;

      res.render('admin/sponsorships/sponsor-detail', {
        layout: 'layouts/admin',
        title: 'Sponsor Record',
        pageTitle: `${sponsor.first_name} ${sponsor.last_name}`,
        sponsor,
        availableChildren,
        matchedChild,
        flash: req.query.flash,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/sponsors/:id/match-child', async (req, res, next) => {
    try {
      const childId = req.body.child_id;
      if (!childId) {
        const err = new Error('Select a child profile to match.');
        err.status = 400;
        err.expose = true;
        throw err;
      }

      const result = await matchChildToSponsor(req.tenant.id, req.params.id, childId, req.user);
      if (result.error) {
        const err = new Error(result.error);
        err.status = 400;
        err.expose = true;
        throw err;
      }

      res.redirect(`/admin/sponsorships/sponsors/${req.params.id}?flash=matched`);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createSponsorshipsRouter;
