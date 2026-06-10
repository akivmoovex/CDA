import env from '../config/env.js';
import {
  canAccessTenant,
  getPlatformUserByAuthId,
  isAdminRole,
} from '../services/platformUserService.js';

function buildDevUser(req) {
  if (!env.devAuth.enabled) {
    return null;
  }

  const role = env.devAuth.role;
  const isPlatformSuperAdmin = role === 'platform_super_admin';
  let tenantId = isPlatformSuperAdmin ? null : env.devAuth.tenantId;

  if (!isPlatformSuperAdmin && tenantId && req.tenant) {
    if (tenantId === req.tenant.slug) {
      tenantId = req.tenant.id;
    }
  }

  return {
    id: env.devAuth.userId,
    email: env.devAuth.email,
    role,
    tenantId,
    isPlatformSuperAdmin,
    isTenantAdmin: role === 'tenant_admin',
    isTenantEditor: role === 'tenant_editor',
  };
}

/**
 * Attach authenticated user and platform membership to the request.
 * Wire Supabase session/JWT verification here when auth is implemented.
 */
export async function attachAuthContext(req, res, next) {
  try {
    let user = req.session?.user ?? buildDevUser(req);

    if (user?.id && !user.role) {
      const platformUser = await getPlatformUserByAuthId(user.id);
      if (platformUser) {
        user = {
          ...user,
          role: platformUser.role,
          tenantId: platformUser.tenantId,
          isPlatformSuperAdmin: platformUser.isPlatformSuperAdmin,
          isTenantAdmin: platformUser.isTenantAdmin,
          isTenantEditor: platformUser.isTenantEditor,
        };
      }
    }

    req.user = user ?? null;
    req.platformUser = user?.role
      ? {
          role: user.role,
          tenantId: user.tenantId ?? null,
          isPlatformSuperAdmin: Boolean(user.isPlatformSuperAdmin),
        }
      : null;

    res.locals.user = req.user;
    res.locals.platformUser = req.platformUser;
    res.locals.isAuthenticated = Boolean(req.user);
    res.locals.isPlatformSuperAdmin = Boolean(req.user?.isPlatformSuperAdmin);

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req, res, next) {
  if (req.user) {
    return next();
  }

  if (req.accepts('html')) {
    return res.redirect('/admin/login');
  }

  return res.status(401).json({ error: 'Authentication required' });
}

export function requireAdmin(req, res, next) {
  if (req.user && isAdminRole(req.user.role)) {
    return next();
  }

  if (req.accepts('html')) {
    return res.status(403).render('errors/403', {
      layout: 'layouts/error',
      title: 'Access Denied',
      message: 'You do not have permission to access the admin area.',
    });
  }

  return res.status(403).json({ error: 'Admin access required' });
}

/**
 * Ensures tenant-scoped admins only access their own tenant unless super admin.
 */
export function requireTenantAccess(req, res, next) {
  if (!req.tenant) {
    return next(Object.assign(new Error('Tenant context missing'), { status: 500 }));
  }

  if (canAccessTenant(req.platformUser ?? req.user, req.tenant.id)) {
    return next();
  }

  if (req.accepts('html')) {
    return res.status(403).render('errors/403', {
      layout: 'layouts/error',
      title: 'Access Denied',
      message: 'You do not have permission to manage this organization.',
    });
  }

  return res.status(403).json({ error: 'Tenant access denied' });
}

export default {
  attachAuthContext,
  requireAuth,
  requireAdmin,
  requireTenantAccess,
};
