import env from '../config/env.js';

export function stripPort(hostname) {
  return hostname.split(':')[0].toLowerCase();
}

/**
 * Classify the incoming host for tenant resolution.
 */
export function parseHost(hostname) {
  const host = stripPort(hostname);
  const baseDomain = env.appBaseDomain.toLowerCase();

  if (env.platformHosts.includes(host)) {
    return { type: 'platform', host, subdomain: null };
  }

  if (host === baseDomain || host.endsWith(`.${baseDomain}`)) {
    const subdomain = host === baseDomain ? null : host.slice(0, -(baseDomain.length + 1));
    return { type: 'subdomain', host, subdomain };
  }

  return { type: 'custom', host, subdomain: null };
}

export default parseHost;
