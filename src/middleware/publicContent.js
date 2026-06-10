import { getTenantSettings } from '../services/tenantService.js';

/**
 * Loads tenant-scoped public content for SSR pages.
 */
export async function loadPublicContent(req, res, next) {
  try {
    const settings = await getTenantSettings(req.tenant.id);

    req.tenantSettings = settings ?? {};
    res.locals.tenantSettings = settings ?? {};

    next();
  } catch (error) {
    next(error);
  }
}

export default loadPublicContent;
