// Netlify Function: file a comparison PDF in its enquiry's WorkDrive folder
// Location: netlify/functions/workdrive-pdf.js
import { requireStaff, HttpError } from '../lib/auth.js';
import { getEnquiry, uploadToWorkDrive, FOLDER_ID_FIELD } from '../lib/zoho.js';

// POST /api/workdrive-pdf?enquiryId=<Zoho id>&reference=<GMI ref>
// Body: the PDF itself (Content-Type: application/pdf).
//
// The browser makes the PDF (see src/utils/reportPdf.js) — Chromium is too big
// and too slow to start for a Netlify function — and this files it in the
// linked Zoho enquiry's WorkDrive folder.

// Netlify caps a request at 6 MB, base64 included, so a PDF can be about 4.5 MB.
const MAX_BYTES = 4.5 * 1024 * 1024;

export default async (req, context) => {
  const headers = { 'Content-Type': 'application/json' };
  const json = (status, data) => new Response(JSON.stringify(data), { status, headers });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, Allow: 'POST' },
    });
  }

  const params = new URL(req.url).searchParams;
  const enquiryId = String(params.get('enquiryId') || '');
  const reference = String(params.get('reference') || '');
  if (!/^\d{6,25}$/.test(enquiryId)) {
    return json(400, { error: 'An enquiry is required to save to WorkDrive.' });
  }

  try {
    await requireStaff(req);

    const pdf = Buffer.from(await req.arrayBuffer());
    if (pdf.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new HttpError(400, 'The upload is not a PDF.');
    }
    if (pdf.length > MAX_BYTES) {
      throw new HttpError(413, 'The PDF is too large to save to WorkDrive.');
    }

    // The folder is read from the enquiry here, never taken from the request,
    // so a signed-in user can only file into a folder that belongs to a real
    // enquiry.
    const enquiry = await getEnquiry(enquiryId);
    if (!enquiry) throw new HttpError(404, 'The enquiry was not found in Zoho.');
    const folderId = enquiry[FOLDER_ID_FIELD];
    if (!folderId) {
      throw new HttpError(409, `${enquiry.Enquiry_No1 || 'This enquiry'} has no WorkDrive folder yet.`);
    }

    // Named by the comparison's reference, not the date, so saving the same
    // comparison again replaces its file (see uploadToWorkDrive) while other
    // comparisons for the enquiry keep files of their own.
    const ref = /^[\w-]{1,40}$/.test(reference) ? reference : String(Date.now());
    const base = `NSIB_GMI_Comparison_${ref}.pdf`;
    const name = enquiry.Enquiry_No1 ? `${enquiry.Enquiry_No1}_${base}` : base;
    const file = await uploadToWorkDrive(folderId, name, pdf, 'application/pdf');

    return json(200, { workdrive: { ok: true, enquiryNo: enquiry.Enquiry_No1 || '', ...file } });
  } catch (error) {
    if (!(error instanceof HttpError)) console.error('workdrive-pdf failed:', error);
    return json(error.status || 500, { error: error.message || 'Could not save to WorkDrive.' });
  }
};

export const config = {
  path: "/api/workdrive-pdf"
};
