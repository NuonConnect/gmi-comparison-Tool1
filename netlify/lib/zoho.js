// Zoho CRM + WorkDrive access for the Netlify functions.
//
// Authentication is a Zoho "Self Client" refresh token, exchanged for a
// short-lived access token on demand. The client secret and refresh token live
// only in the server's environment — never prefix them with VITE_, which would
// bundle them into the browser build.
//
// Scopes the refresh token needs:
//   ZohoCRM.coql.READ, ZohoCRM.modules.deals.READ, ZohoCRM.modules.contacts.READ,
//   WorkDrive.files.CREATE  (contacts: the search reads the enquiry's contact name)
//
// Kept outside netlify/functions so Netlify doesn't deploy it as a function.

const ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';
const API_URL = process.env.ZOHO_API_URL || 'https://www.zohoapis.com';

// "Enquiries" in the CRM UI is the renamed Deals module.
export const ENQUIRY_MODULE = 'Deals';
export const FOLDER_ID_FIELD = 'zohoworkdriveforcrm__Workdrive_Folder_ID';
export const FOLDER_URL_FIELD = 'zohoworkdriveforcrm__Workdrive_Folder_URL';

// Access tokens last an hour. Keep one per warm instance so a burst of
// searches doesn't hit Zoho's token endpoint, which is rate limited.
let cached = { token: '', expiresAt: 0 };

async function accessToken() {
  if (cached.token && Date.now() < cached.expiresAt) return cached.token;

  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
  // Named, so a variable left blank in the host's settings is found at a glance.
  const missing = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'].filter(
    (name) => !String(process.env[name] || '').trim()
  );
  if (missing.length) {
    throw new Error(`Zoho is not configured on the server: ${missing.join(', ')} missing or empty.`);
  }

  const res = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: ZOHO_REFRESH_TOKEN,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`Zoho sign-in failed: ${body.error || res.status}`);
  }
  // Refresh a minute early so a token never expires mid-request.
  cached = {
    token: body.access_token,
    expiresAt: Date.now() + ((body.expires_in || 3600) - 60) * 1000,
  };
  return cached.token;
}

async function zohoFetch(path, init = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Zoho-oauthtoken ${await accessToken()}` },
  });
  // CRM answers an empty result with 204 and no body.
  if (res.status === 204) return {};
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body.message || body.code || body.errors?.[0]?.title || res.status;
    throw new Error(`Zoho request failed: ${detail}`);
  }
  return body;
}

export async function coql(selectQuery) {
  const body = await zohoFetch('/crm/v7/coql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ select_query: selectQuery }),
  });
  return body.data || [];
}

export async function getEnquiry(id) {
  const fields = ['Enquiry_No1', 'Deal_Name', FOLDER_ID_FIELD, FOLDER_URL_FIELD].join(',');
  const body = await zohoFetch(
    `/crm/v7/${ENQUIRY_MODULE}/${encodeURIComponent(id)}?fields=${fields}`
  );
  return body.data?.[0] || null;
}

// Uploads a file into a WorkDrive folder. A file of the same name already
// there is replaced: WorkDrive stores the upload as its newest version and
// keeps the earlier ones in the file's version history, so an updated
// comparison supersedes the old one without losing what was sent before.
export async function uploadToWorkDrive(folderId, filename, buffer, contentType) {
  const form = new FormData();
  form.append('content', new Blob([buffer], { type: contentType }), filename);
  form.append('filename', filename);
  form.append('parent_id', folderId);
  form.append('override-name-exist', 'true');

  const body = await zohoFetch('/workdrive/api/v1/upload', { method: 'POST', body: form });
  const attrs = body.data?.[0]?.attributes || {};
  return {
    fileId: attrs.resource_id || '',
    fileName: attrs.FileName || filename,
    link: attrs.Permalink || `https://workdrive.zoho.com/folder/${folderId}`,
  };
}
