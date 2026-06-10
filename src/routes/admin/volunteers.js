import { Router } from 'express';
import {
  createVolunteerAssignment,
  deleteVolunteerAssignment,
  getVolunteerApplication,
  listVolunteerApplications,
  listVolunteerAssignments,
  updateVolunteerApplication,
  volunteerStatusBadge,
} from '../../services/workflows/index.js';

function parseReviewBody(body) {
  return {
    status: body.status || undefined,
    admin_comments: body.admin_comments?.trim() || null,
  };
}

function parseAssignmentBody(body) {
  return {
    title: body.title?.trim(),
    description: body.description?.trim() || null,
    location: body.location?.trim() || null,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    status: body.status || 'scheduled',
  };
}

export function createVolunteersRouter() {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const statusFilter = req.query.status || null;
      const applications = await listVolunteerApplications(req.tenant.id, {
        status: statusFilter || undefined,
      });

      const rows = applications.map((app) => ({
        name: `${app.first_name} ${app.last_name}`,
        email: app.email,
        interest_area: app.interest_area ?? '—',
        submitted: new Date(app.created_at).toLocaleDateString(),
        status: volunteerStatusBadge(app.status),
        actions: {
          editHref: `/admin/volunteers/${app.id}`,
        },
      }));

      res.render('admin/volunteers/list', {
        layout: 'layouts/admin',
        title: 'Volunteers',
        pageTitle: 'Volunteer Applications',
        pageDescription: 'Review applications, update status, and manage volunteer assignments.',
        statusFilter,
        rows,
        flash: req.query.flash,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const application = await getVolunteerApplication(req.tenant.id, req.params.id);
      if (!application) {
        return res.status(404).render('errors/404', {
          layout: 'layouts/error',
          title: 'Not Found',
          message: 'Volunteer application not found.',
        });
      }

      const assignments = await listVolunteerAssignments(req.tenant.id, application.id);

      res.render('admin/volunteers/detail', {
        layout: 'layouts/admin',
        title: 'Volunteer Application',
        pageTitle: `${application.first_name} ${application.last_name}`,
        application,
        assignments,
        statusBadge: volunteerStatusBadge(application.status),
        flash: req.query.flash,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id', async (req, res, next) => {
    try {
      const payload = parseReviewBody(req.body);
      await updateVolunteerApplication(req.tenant.id, req.params.id, payload, req.user);
      res.redirect(`/admin/volunteers/${req.params.id}?flash=updated`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/assignments', async (req, res, next) => {
    try {
      const payload = parseAssignmentBody(req.body);
      if (!payload.title) {
        const err = new Error('Assignment title is required.');
        err.status = 400;
        err.expose = true;
        throw err;
      }
      await createVolunteerAssignment(req.tenant.id, req.params.id, payload);
      res.redirect(`/admin/volunteers/${req.params.id}?flash=assignment_added`);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/assignments/:assignmentId/delete', async (req, res, next) => {
    try {
      await deleteVolunteerAssignment(req.tenant.id, req.params.assignmentId);
      res.redirect(`/admin/volunteers/${req.params.id}?flash=assignment_deleted`);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createVolunteersRouter;
