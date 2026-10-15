// Browser side of the Zoho integration. Nothing here talks to Zoho directly:
// every call goes through our own /api functions, which hold the Zoho keys and
// check the advisor's login. Each request carries the Netlify Identity access
// token (from useAuth().getAccessToken) so the server can tell who is asking.

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

// Returns { enquiries } or { error }, never throws — the picker shows the error
// inline and the advisor can carry on without an enquiry.
export async function searchEnquiries(q, token) {
  try {
    const res = await fetch(`/api/zoho-enquiries?${new URLSearchParams({ q })}`, {
      headers: authHeaders(token),
    });
    const body = await res.json().catch(() => null);
    if (!body) return { enquiries: [], error: 'Zoho search is not available on this site.' };
    if (!res.ok) return { enquiries: [], error: body.error || `Search failed (${res.status}).` };
    return { enquiries: body.enquiries || [] };
  } catch {
    return { enquiries: [], error: 'Zoho search is unavailable. Is the API running?' };
  }
}

// Files a comparison PDF (a Blob) in the enquiry's WorkDrive folder. Resolves
// to { ok, fileName, link, enquiryNo } or { ok: false, error }, never throws.
export async function fileInWorkDrive({ pdf, enquiryId, reference, token }) {
  try {
    const res = await fetch(`/api/workdrive-pdf?${new URLSearchParams({ enquiryId, reference })}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf', ...authHeaders(token) },
      body: pdf,
    });
    const body = await res.json().catch(() => null);
    if (!body) return { ok: false, error: 'WorkDrive filing is not available on this site.' };
    if (!res.ok) return { ok: false, error: body.error || `WorkDrive filing failed (${res.status}).` };
    return body.workdrive || { ok: false, error: 'WorkDrive gave no answer.' };
  } catch {
    return { ok: false, error: 'Could not reach the server to save to WorkDrive.' };
  }
}
