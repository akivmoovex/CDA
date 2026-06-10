import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  appBaseDomain: process.env.APP_BASE_DOMAIN ?? 'localhost',
  platformHosts: (process.env.PLATFORM_HOSTS ?? 'localhost,127.0.0.1')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
  devAuth: {
    enabled: process.env.DEV_AUTH_ENABLED === 'true',
    userId: process.env.DEV_AUTH_USER_ID ?? 'dev-user',
    email: process.env.DEV_AUTH_EMAIL ?? 'dev@example.com',
    role: process.env.DEV_AUTH_ROLE ?? 'tenant_admin',
    tenantId: process.env.DEV_AUTH_TENANT_ID ?? 'cda-kafue',
  },
  isProduction: process.env.NODE_ENV === 'production',
};

export default env;
