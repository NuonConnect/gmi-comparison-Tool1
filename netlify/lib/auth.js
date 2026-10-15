// Server-side login check for the endpoints that reach into Zoho.
//
// The browser sends the advisor's Netlify Identity access token; we ask the
// Identity service who it belongs to rather than decoding it ourselves, so a
// forged or expired token is rejected by the same service that issued it.
//
// A valid login is not enough on its own: the login page allows sign-up, so
// anyone could create an account. Zoho holds every client, premium and
// commission, so these endpoints also require a confirmed company address.

const IDENTITY_PATH = '/.netlify/identity';
const STAFF_DOMAIN = (process.env.STAFF_EMAIL_DOMAIN || 'nsib.ae').toLowerCase();

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// IDENTITY_URL wins (needed for local dev, where localhost has no Identity);
// on Netlify the site's own URL serves it.
function identityUrl(req) {
  const base = String(
    process.env.IDENTITY_URL || process.env.VITE_IDENTITY_URL || process.env.URL || new URL(req.url).origin
  ).replace(/\/+$/, '');
  return base.endsWith(IDENTITY_PATH) ? base : `${base}${IDENTITY_PATH}`;
}

export async function requireStaff(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Not signed in.');

  let user = null;
  try {
    const res = await fetch(`${identityUrl(req)}/user`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) user = await res.json().catch(() => null);
  } catch {
    throw new HttpError(502, 'Could not reach the sign-in service.');
  }
  if (!user?.email) throw new HttpError(401, 'Your session has expired. Sign in again.');

  const email = String(user.email).toLowerCase();
  if (!email.endsWith(`@${STAFF_DOMAIN}`) || !(user.confirmed_at || user.email_confirmed_at)) {
    throw new HttpError(403, `Zoho access is limited to confirmed @${STAFF_DOMAIN} accounts.`);
  }
  return user;
}
