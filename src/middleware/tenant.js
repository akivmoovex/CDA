import { resolveTenantByHostname } from '../services/tenantService.js';

/**
 * Resolves the active tenant from the request host and attaches it to req/res locals.
 */
export async function tenantResolver(req, res, next) {
  try {
    const hostname = req.hostname || req.headers.host || '';
    const tenant = await resolveTenantByHostname(hostname);

    if (!tenant) {
      return res.status(404).render('errors/404', {
        layout: 'layouts/error',
        title: 'Site Not Found',
        message: 'No organization is configured for this domain.',
        appName: res.locals.appName || 'CDA Platform',
        tenant: null,
        tenantSettings: {},
      });
    }

    req.tenant = tenant;
    res.locals.tenant = tenant;
    res.locals.tenantSlug = tenant.slug;

    next();
  } catch (error) {
    next(error);
  }
}

export default tenantResolver;
