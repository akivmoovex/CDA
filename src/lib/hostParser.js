import env from '../config/env.js';

export function normalizeHost(host) {
  const normalized = String(host || '')
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .toLowerCase()
    .trim();

  return normalized;
}

export function stripPort(hostname) {
  return normalizeHost(hostname);
}

/**
 * Classify the incoming host for tenant resolution.
 */
export function parseHost(hostname) {
  const host = normalizeHost(hostname);
  if (!host) {
    return { type: 'custom', host: '', subdomain: null };
  }

  const baseDomain = env.appBaseDomain.toLowerCase();

  if (env.platformHosts.includes(host)) {
    return { type: 'platform', host, subdomain: null };
  }

  if (host === baseDomain || host === `www.${baseDomain}`) {
    return { type: 'platform', host, subdomain: null };
  }

  if (host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.slice(0, -(baseDomain.length + 1));
    return { type: 'subdomain', host, subdomain };
  }

  return { type: 'custom', host, subdomain: null };
}

export default parseHost;
