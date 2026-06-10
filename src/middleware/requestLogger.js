export function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    console.log(
      `${req.method} ${req.originalUrl} host=${req.headers.host} status=${res.statusCode} ${Date.now() - startedAt}ms`,
    );
  });

  next();
}

export default requestLogger;
