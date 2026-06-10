import env from '../config/env.js';

function renderErrorPage(res, status, { title, message, stack }) {
  res.status(status).render('errors/' + (status === 403 ? '403' : status === 404 ? '404' : '500'), {
    layout: 'layouts/error',
    title,
    message,
    appName: res.locals.appName || 'CDA Platform',
    tenant: res.locals.tenant || null,
    tenantSettings: res.locals.tenantSettings || {},
    ...(stack ? { stack } : {}),
  });
}

export function notFoundHandler(req, res) {
  renderErrorPage(res, 404, {
    title: 'Page Not Found',
    message: 'The page you requested could not be found.',
  });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status ?? err.statusCode ?? 500;

  if (!env.isProduction) {
    console.error(err);
  }

  if (req.accepts('html')) {
    return renderErrorPage(res, status, {
      title: status === 404 ? 'Page Not Found' : status === 500 ? 'Server Error' : 'Error',
      message: err.expose ? err.message : 'Something went wrong. Please try again later.',
      ...(env.isProduction ? {} : { stack: err.stack }),
    });
  }

  res.status(status).json({
    error: err.expose ? err.message : 'Internal server error',
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}

export default {
  notFoundHandler,
  errorHandler,
};
