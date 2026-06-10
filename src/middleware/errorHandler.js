export function notFoundHandler(req, res) {
  res.status(404).render('errors/404', {
    layout: 'layouts/error',
    title: 'Page Not Found',
    message: 'The page you requested could not be found.',
    appName: res.locals.appName || 'CDA Platform',
    tenant: res.locals.tenant || null,
    tenantSettings: res.locals.tenantSettings || {},
  });
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.status || err.statusCode || 500;

  console.error('Request error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    host: req.headers.host,
    statusCode,
  });

  if (req.accepts('html')) {
    const is404 = statusCode === 404;
    return res.status(statusCode).render('layouts/error', {
      layout: false,
      title: is404 ? 'Page not found' : 'Something went wrong',
      appName: res.locals.appName || 'CDA Platform',
      tenant: res.locals.tenant || null,
      tenantSettings: res.locals.tenantSettings || {},
      body: `
        <p class="text-6xl font-bold text-primary">${statusCode}</p>
        <h1 class="mt-4 font-display text-2xl font-bold text-primary">${is404 ? 'Page not found' : 'Something went wrong'}</h1>
        <p class="mt-3 text-on-surface-variant">${is404 ? 'The page you requested could not be found.' : 'The page could not be loaded.'}</p>
        <a href="/" class="btn-primary mt-8 inline-flex">Return home</a>
      `,
    });
  }

  res.status(statusCode).json({
    error: err.expose ? err.message : 'Internal server error',
  });
}

export default {
  notFoundHandler,
  errorHandler,
};
