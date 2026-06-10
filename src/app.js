import compression from 'compression';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import env from './config/env.js';
import { attachAuthContext } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { tenantResolver } from './middleware/tenant.js';
import routes from './routes/index.js';
import { getSupabaseAdminClient } from './config/supabase.js';
import { normalizeHost } from './lib/hostParser.js';
import { resolveTenantByHostname } from './services/tenantService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.set('layout', 'layouts/public');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);

  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction ? undefined : false,
    }),
  );
  app.use(compression());
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(path.join(projectRoot, 'public')));

  app.use(expressLayouts);

  app.use((req, res, next) => {
    res.locals.appName = 'CDA Platform';
    res.locals.currentPath = req.path;
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      app: 'cda-platform',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  app.get('/health/db', async (_req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.json({
        ok: false,
        database: 'missing DATABASE_URL',
      });
    }

    try {
      const supabase = getSupabaseAdminClient();
      if (!supabase) {
        return res.json({
          ok: false,
          database: 'DATABASE_URL set but Supabase client unavailable (check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)',
        });
      }

      const { error } = await supabase.from('tenants').select('id').limit(1);
      if (error) {
        throw error;
      }

      return res.json({
        ok: true,
        database: 'connected',
      });
    } catch (error) {
      return res.status(503).json({
        ok: false,
        database: error.message,
      });
    }
  });

  app.get('/health/tenant', async (req, res) => {
    const host = req.hostname || req.headers.host || '';
    const normalizedHost = normalizeHost(host);

    try {
      const tenant = await resolveTenantByHostname(host);

      if (!tenant) {
        return res.json({
          ok: false,
          host,
          normalizedHost,
          tenant: null,
        });
      }

      return res.json({
        ok: true,
        host,
        normalizedHost,
        tenant: {
          slug: tenant.slug,
          name: tenant.name,
        },
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        host,
        normalizedHost,
        tenant: null,
        error: error.message,
      });
    }
  });

  app.use(tenantResolver);
  app.use(attachAuthContext);

  app.use((req, res, next) => {
    res.locals.appName = res.locals.appName || 'CDA Platform';
    res.locals.tenant = req.tenant ?? res.locals.tenant ?? null;
    res.locals.tenantSettings = req.tenantSettings ?? res.locals.tenantSettings ?? {};
    next();
  });

  app.use((req, res, next) => {
    const render = res.render.bind(res);
    res.render = (view, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      return render(view, { ...res.locals, ...(options ?? {}) }, callback);
    };
    next();
  });

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
