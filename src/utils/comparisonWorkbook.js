// The Saved History workbook: columns and rows for the Excel export, laid out
// in the NSIB theme by xlsx.js (title, notes of the filters used, then a
// maroon header row with filter arrows and frozen panes).
//
// Touches no browser APIs, so it can also be run from Node to check the layout.
import { calculatePlanTotals } from './planTotals.js';
import { buildReportXlsx } from './xlsx.js';

const PLAN_TYPES = {
  SME: 'SME',
  BASIC: 'Basic',
  ENHANCED_BASIC: 'DHA (Predefined)',
  DHA_MANUAL: 'Enhanced Basic (DHA Enhanced)',
  ENHANCED_CUSTOM: 'Enhanced Basic (Custom)',
};

// ---------------------------------------------------------------------------
// Reading a saved comparison
// ---------------------------------------------------------------------------

const blank = (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? null : v);

// Custom companies are listed as "⭐ Name" in the provider dropdown.
const insurerName = (plan) => {
  const name = plan.providerName === 'Other' ? plan.customProviderName || 'Other' : plan.providerName;
  return blank(String(name || '').replace(/^⭐\s*/, ''));
};

// Benefits are stored per category ({ 'CAT A': '...', 'CAT AOther': '...' }),
// with "Other" holding the advisor's typed text. One value when every category
// agrees, otherwise "CAT A: x; CAT B: y".
const flatten = (value) => {
  if (value == null) return null;
  if (typeof value !== 'object') return blank(String(value).trim());
  const byCategory = {};
  Object.entries(value).forEach(([cat, v]) => {
    const text = v == null ? '' : String(v).trim();
    if (!text) return;
    const name = cat.replace(/Other$/, '');
    if (!byCategory[name] || cat.endsWith('Other')) byCategory[name] = text;
  });
  const values = Object.values(byCategory);
  if (values.length === 0) return null;
  if (values.every((v) => v === values[0])) return values[0];
  return Object.entries(byCategory).map(([cat, v]) => `${cat}: ${v}`).join('; ');
};

const members = (plan) =>
  ['catAMembers', 'catBMembers', 'catCMembers', 'catDMembers'].reduce((sum, k) => sum + (Number(plan[k]) || 0), 0);

// The premium lines as GMI shows them. A plan with no premiums entered yet has
// no premium, not just its levies.
const COUNT_FIELDS = ['catAMembers', 'catBMembers', 'catCMembers', 'catDMembers', 'dubaiMembers', 'northernEmiratesMembers'];

const premiums = (plan) => {
  // Older plans can be missing a count (e.g. no CAT D), which would make the
  // totals NaN; a missing count is 0.
  const counts = Object.fromEntries(COUNT_FIELDS.map((k) => [k, Number(plan[k]) || 0]));
  const t = calculatePlanTotals({ ...plan, ...counts });
  if (!t.totalPremium) return { totalPremium: null, pspFund: null, icpCharges: null, policyFee: null, vat: null, grandTotal: null };
  const { totalPremium, pspFund, icpCharges, policyFee, vat, grandTotal } = t;
  return { totalPremium, pspFund, icpCharges, policyFee, vat, grandTotal };
};

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
};

const distinct = (values) => [...new Set(values.filter((v) => blank(v) != null))];

const tpaOf = (c) => {
  const info = c.companyInfo || {};
  return info.tpa === 'Other' ? info.tpaManual : info.tpa;
};

const createdAt = (c) => c.created_at || c.date || null;

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------
// kind: text | ref (bold, first column) | center | int | money | date | wrap
//
// Only fields from the GMI comparison form, in the form's order: Company
// Information (with the Zoho enquiry), plan type, plan details, provider
// details, premium details, advisor comment.

const COMPARISON_COLUMNS = [
  { key: 'ref', header: 'Quote Ref No.', width: 16, kind: 'ref' },
  { key: 'company', header: 'Company Name', width: 32, kind: 'text' },
  { key: 'enquiryNo', header: 'Zoho Enquiry No.', width: 16, kind: 'text' },
  { key: 'enquiryName', header: 'Enquiry Name', width: 30, kind: 'text' },
  { key: 'contactName', header: 'Contact Name', width: 22, kind: 'text' },
  { key: 'insuranceType', header: 'Insurance Type', width: 16, kind: 'text' },
  { key: 'subType', header: 'Insurance Sub-type', width: 18, kind: 'text' },
  { key: 'stage', header: 'Enquiry Stage', width: 16, kind: 'center' },
  { key: 'tpa', header: 'TPA', width: 16, kind: 'wrap' },
  { key: 'planTypes', header: 'Plan Type', width: 28, kind: 'wrap' },
  { key: 'categories', header: 'Categories', width: 16, kind: 'text' },
  { key: 'planCount', header: 'No. of Plans', width: 13, kind: 'int' },
  { key: 'providers', header: 'Provider Names', width: 40, kind: 'wrap' },
  { key: 'members', header: 'Members', width: 12, kind: 'int' },
  { key: 'dubaiMembers', header: 'Dubai Members', width: 18, kind: 'int' },
  { key: 'neMembers', header: 'Northern Emirates Members', width: 14, kind: 'int' },
  { key: 'advisorComment', header: 'Advisor Comment', width: 40, kind: 'wrap' },
  { key: 'createdBy', header: 'Created By', width: 18, kind: 'text' },
  { key: 'createdAt', header: 'Created Date', width: 17, kind: 'date' },
];

// CAT A / CAT B hold LSB / HSB on BASIC plans.
const categoryColumns = ['A', 'B', 'C', 'D'].flatMap((cat) => [
  { key: `cat${cat}Members`, header: `CAT ${cat}${cat === 'A' ? ' / LSB' : cat === 'B' ? ' / HSB' : ''} Members`, width: 17, kind: 'int' },
  { key: `cat${cat}Premium`, header: `CAT ${cat}${cat === 'A' ? ' / LSB' : cat === 'B' ? ' / HSB' : ''} Premium Per Person (AED)`, width: 21, kind: 'money' },
]);

const PLAN_COLUMNS = [
  { key: 'ref', header: 'Quote Ref No.', width: 16, kind: 'ref' },
  { key: 'company', header: 'Company Name', width: 32, kind: 'text' },
  { key: 'enquiryNo', header: 'Zoho Enquiry No.', width: 16, kind: 'text' },
  { key: 'enquiryName', header: 'Enquiry Name', width: 30, kind: 'text' },
  { key: 'tpa', header: 'TPA', width: 14, kind: 'center' },
  { key: 'planType', header: 'Plan Type', width: 28, kind: 'text' },
  { key: 'provider', header: 'Provider Name', width: 30, kind: 'text' },
  { key: 'planTag', header: 'Plan Tag', width: 16, kind: 'text' },
  { key: 'recommended', header: 'Recommended', width: 13, kind: 'center' },
  { key: 'renewal', header: 'Renewal', width: 10, kind: 'center' },
  { key: 'annualLimit', header: 'Annual Limit', width: 18, kind: 'wrap' },
  { key: 'categories', header: 'Categories', width: 16, kind: 'text' },
  { key: 'network', header: 'Network', width: 22, kind: 'wrap' },
  { key: 'areaOfCover', header: 'Area of Cover', width: 24, kind: 'wrap' },
  ...categoryColumns,
  { key: 'dubaiMembers', header: 'Dubai Members', width: 18, kind: 'int' },
  { key: 'neMembers', header: 'Northern Emirates Members', width: 14, kind: 'int' },
  { key: 'dependentRatio', header: 'Dependent Ratio', width: 14, kind: 'center' },
  { key: 'totalPremium', header: 'Total Premium (AED)', width: 15, kind: 'money' },
  { key: 'pspFund', header: 'PSP Fund (AED)', width: 17, kind: 'money' },
  { key: 'icpCharges', header: 'ICP Charges (AED)', width: 13, kind: 'money' },
  { key: 'policyFee', header: 'Policy Fee (AED)', width: 18, kind: 'money' },
  { key: 'vat', header: 'VAT (AED)', width: 13, kind: 'money' },
  { key: 'grandTotal', header: 'Grand Total (AED)', width: 19, kind: 'money' },
  { key: 'createdBy', header: 'Created By', width: 18, kind: 'text' },
  { key: 'createdAt', header: 'Created Date', width: 17, kind: 'date' },
];

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

const comparisonRow = (c) => {
  const plans = c.plans || [];
  // The census (members, emirates) is the same for every plan in practice;
  // the largest is taken in case one plan was left part-filled.
  const census = plans.reduce((best, p) => (!best || members(p) > members(best) ? p : best), null);
  const e = c.enquiry || {};

  return {
    ref: c.referenceNumber,
    company: c.companyName || c.companyInfo?.companyName,
    enquiryNo: e.enquiryNo,
    enquiryName: e.enquiryName,
    contactName: e.contactName,
    insuranceType: e.insuranceType,
    subType: e.subType,
    stage: e.stage,
    tpa: distinct(plans.map((p) => p.tpa)).join(', ') || tpaOf(c),
    planTypes: distinct(plans.map((p) => PLAN_TYPES[p.planType] || p.planType)).join(', '),
    categories: distinct(plans.flatMap((p) => p.selectedCategories || [])).join(', '),
    planCount: plans.length,
    providers: distinct(plans.map(insurerName)).join(', '),
    members: census ? members(census) || null : null,
    dubaiMembers: census ? Number(census.dubaiMembers) || null : null,
    neMembers: census ? Number(census.northernEmiratesMembers) || null : null,
    advisorComment: c.advisorComment,
    createdBy: c.createdBy,
    createdAt: createdAt(c),
  };
};

const planRows = (c) => {
  const plans = c.plans || [];
  const shared = {
    ref: c.referenceNumber,
    company: c.companyName || c.companyInfo?.companyName,
    enquiryNo: c.enquiry?.enquiryNo,
    enquiryName: c.enquiry?.enquiryName,
    createdBy: c.createdBy,
    createdAt: createdAt(c),
  };
  return plans.map((p) => {
    const cd = p.categoriesData || {};
    const areaOfCover =
      flatten(cd.areaOfCover) ||
      blank(p.areaOfCoverMode === 'textarea' ? p.areaOfCoverTextarea : p.areaOfCoverDropdown);
    const census = {};
    ['A', 'B', 'C', 'D'].forEach((cat) => {
      census[`cat${cat}Members`] = num(p[`cat${cat}Members`]);
      census[`cat${cat}Premium`] = num(p[`cat${cat}Premium`]);
    });
    return {
      ...shared,
      tpa: p.tpa || tpaOf(c),
      planType: PLAN_TYPES[p.planType] || p.planType,
      provider: insurerName(p),
      planTag: p.planTag,
      recommended: p.isRecommended ? 'Yes' : null,
      renewal: p.isRenewal ? 'Yes' : null,
      annualLimit: blank(p.annualLimit) || flatten(cd.aggregateLimit),
      categories: (p.selectedCategories || []).join(', '),
      network: flatten(cd.network),
      areaOfCover,
      ...census,
      dubaiMembers: num(p.dubaiMembers),
      neMembers: num(p.northernEmiratesMembers),
      dependentRatio: p.dependentRatio,
      ...premiums(p),
    };
  });
};

// ---------------------------------------------------------------------------
// Workbook
// ---------------------------------------------------------------------------

// Real Date objects, so Excel can sort and filter them as dates; xlsx.js
// writes them in local time.
const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const cellValue = (col, v) => {
  if (col.kind === 'date') return toDate(v);
  if (col.kind === 'money') return typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  if (col.kind === 'int') return typeof v === 'number' && Number.isFinite(v) ? v : null;
  return blank(v) == null ? null : String(v);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');
// 16-Oct-2026 14:30, local time
const formatDateTime = (d) =>
  `${pad(d.getDate())}-${MONTHS[d.getMonth()]}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// layout: 'comparisons' (one row per comparison) or 'plans' (one per plan).
// info: { generatedAt, generatedBy, period, advisor } for the notes under the title.
// Returns the .xlsx as a Blob, and how many data rows it has.
export function buildWorkbook(comparisons, layout, info = {}) {
  const isPlans = layout === 'plans';
  const data = isPlans ? comparisons.flatMap(planRows) : comparisons.map(comparisonRow);
  // Leave out columns nobody filled in for these rows (e.g. the Zoho enquiry
  // columns for comparisons saved before enquiries could be linked). Ref No.
  // always stays, as the frozen first column.
  const columns = (isPlans ? PLAN_COLUMNS : COMPARISON_COLUMNS).filter(
    (c, i) => i === 0 || data.some((row) => cellValue(c, row[c.key]) != null)
  );
  const title = `NSIB Group Medical - ${isPlans ? 'Quotes by Plan' : 'Saved Comparisons'}`;
  const count = isPlans
    ? `${plural(data.length, 'plan')} from ${plural(comparisons.length, 'comparison')}`
    : plural(data.length, 'comparison');
  const generatedAt = info.generatedAt instanceof Date ? info.generatedAt : new Date();

  const blob = buildReportXlsx({
    sheetName: isPlans ? 'Plans' : 'Comparisons',
    title,
    notes: [
      `Period: ${info.period || 'All time'}  ·  Created by: ${info.advisor || 'All advisors'}  ·  ${count}`,
      `Generated ${formatDateTime(generatedAt)} by ${info.generatedBy || 'Unknown'}` +
        (isPlans ? '  ·  Amounts in AED; Grand Total = Total Premium + PSP Fund + ICP Charges + Policy Fee + 5% VAT' : ''),
    ],
    columns,
    rows: data.map((row) => columns.map((c) => cellValue(c, row[c.key]))),
  });
  return { blob, rowCount: data.length };
}
