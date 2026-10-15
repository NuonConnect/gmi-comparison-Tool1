// Netlify Function: Zoho CRM enquiry search
// Location: netlify/functions/zoho-enquiries.js
import { requireStaff, HttpError } from '../lib/auth.js';
import { coql, ENQUIRY_MODULE, FOLDER_ID_FIELD, FOLDER_URL_FIELD } from '../lib/zoho.js';

// GET /api/zoho-enquiries?q=<company name or enquiry no.>
//
// Finds Zoho CRM enquiries for the comparison being built. A name matches when
// every word of it begins a word of the enquiry name (for group enquiries, the
// company) or of its contact's name, in any order; "Enq298581" or just "298581"
// matches by enquiry number.
//
// Results are ranked rather than filtered: the typed enquiry number first, then
// Group Medical enquiries, then the most recent.
//
// Only what the picker shows is returned — no premiums, commissions or notes.

const MAX_RESULTS = 25;
const ENQUIRY_NO = /^(?:enq\s*)?(\d{3,})$/i;

// Legal suffixes say nothing about which company it is, and are written in
// too many ways ("LLC", "L.L.C", "L L C") to match on: a comparison for
// "ACME LLC" must still find the enquiry "ACME L.L.C".
const NOISE = new Set([
  'llc', 'l.l.c', 'l.l.c.', 'co', 'co.', 'company', 'fze', 'fzco', 'fzc', 'fz',
  'fz-llc', 'ltd', 'ltd.', 'est', 'est.', 'the', 'and', '&', '-',
]);

// COQL has no bind parameters, so the search text is reduced to characters
// that can't break out of a quoted string or act as a wildcard.
const clean = (s) =>
  String(s || '')
    .replace(/[^\p{L}\p{N} .&-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

function whereClause(q) {
  const enq = q.match(ENQUIRY_NO);
  if (enq) return `Enquiry_No1 like '%${enq[1]}%'`;

  // Each word must START a word of the name: a plain substring match let "umar"
  // pull in every "Kumar". Three words is plenty to narrow and keeps the query
  // within COQL's limit on conditions.
  const words = q
    .split(' ')
    .filter((w) => w.length >= 2 && !NOISE.has(w.toLowerCase()))
    .slice(0, 3);
  if (!words.length) return '';
  const all = (field) =>
    nest(words.map((w) => `(${field} like '${w}%' or ${field} like '% ${w}%')`), 'and');
  return `(${all('Deal_Name')} or ${all('Contact_Name.Full_Name')})`;
}

// COQL rejects more than two conditions in one bracket ("a and b and c" is a
// syntax error), so chains are nested pairwise: ((a and b) and c).
const nest = (conds, op) => conds.reduce((acc, c) => `(${acc} ${op} ${c})`);

export default async (req, context) => {
  const headers = { 'Content-Type': 'application/json' };
  const json = (status, data) => new Response(JSON.stringify(data), { status, headers });

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, Allow: 'GET' },
    });
  }

  try {
    await requireStaff(req);

    const q = clean(new URL(req.url).searchParams.get('q'));
    if (q.length < 3) return json(200, { enquiries: [] });

    const where = whereClause(q);
    if (!where) return json(200, { enquiries: [] });
    // A typed enquiry number lists its exact match first, ahead of the other
    // numbers that merely contain those digits.
    const typedNo = (q.match(ENQUIRY_NO) || [])[1];
    const isTyped = (e) => !!typedNo && e.enquiryNo.toLowerCase() === `enq${typedNo}`;

    const rows = await coql(
      `select Enquiry_No1, Deal_Name, Contact_Name.Full_Name, ` +
        `Insurance_Type, Insurance_Sub_type, Enquiry_Date, Stage, ` +
        `${FOLDER_ID_FIELD}, ${FOLDER_URL_FIELD} ` +
        `from ${ENQUIRY_MODULE} where ${where} order by Created_Time desc limit ${MAX_RESULTS}`
    );

    const enquiries = rows
      .map((r) => ({
        id: String(r.id),
        enquiryNo: r.Enquiry_No1 || '',
        enquiryName: r.Deal_Name || '',
        contactName: r['Contact_Name.Full_Name'] || '',
        insuranceType: r.Insurance_Type || '',
        subType: r.Insurance_Sub_type || '',
        enquiryDate: r.Enquiry_Date || '',
        stage: r.Stage || '',
        hasFolder: !!r[FOLDER_ID_FIELD],
        folderUrl: r[FOLDER_URL_FIELD] || '',
      }))
      .map((e, i) => ({ e, i }))
      .sort(
        (a, b) =>
          isTyped(b.e) - isTyped(a.e) ||
          (b.e.insuranceType === 'Group Medical') - (a.e.insuranceType === 'Group Medical') ||
          a.i - b.i
      )
      .map(({ e }) => e);

    return json(200, { enquiries });
  } catch (error) {
    if (!(error instanceof HttpError)) console.error('zoho-enquiries failed:', error);
    return json(error.status || 502, { error: error.message || 'Zoho search failed.' });
  }
};
