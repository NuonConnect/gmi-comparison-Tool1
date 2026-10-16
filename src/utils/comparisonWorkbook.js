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

const planLabel = (plan) => {
  const insurer = insurerName(plan) || 'Unnamed plan';
  return plan.planTag ? `${insurer} - ${plan.planTag}` : insurer;
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

// A plan with no premiums entered yet has no premium, not just its levies.
const premiums = (plan) => {
  const t = calculatePlanTotals(plan);
  if (!t.totalPremium) return { net: null, fees: null, vat: null, total: null };
  return { net: t.totalPremium, fees: t.pspFund + t.icpCharges + t.policyFee, vat: t.vat, total: t.grandTotal };
};

const distinct = (values) => [...new Set(values.filter((v) => blank(v) != null))];

const isRenewalBusiness = (c) =>
  (c.plans || []).some((p) => p.isRenewal) ||
  /renew/i.test(`${c.enquiry?.insuranceType || ''} ${c.enquiry?.subType || ''}`);

const tpaOf = (c) => {
  const info = c.companyInfo || {};
  return info.tpa === 'Other' ? info.tpaManual : info.tpa;
};

const createdAt = (c) => c.created_at || c.date || null;

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------
// kind: text | ref (bold, first column) | center | int | money | date | wrap

const COMPARISON_COLUMNS = [
  { key: 'ref', header: 'Quote Ref No.', width: 16, kind: 'ref' },
  { key: 'business', header: 'New / Renewal', width: 14, kind: 'center' },
  { key: 'enquiryNo', header: 'Enquiry No.', width: 14, kind: 'text' },
  { key: 'enquiryName', header: 'Enquiry Name', width: 30, kind: 'text' },
  { key: 'insuranceType', header: 'Insurance Type', width: 16, kind: 'text' },
  { key: 'subType', header: 'Insurance Sub-type', width: 18, kind: 'text' },
  { key: 'company', header: 'Company Name', width: 32, kind: 'text' },
  { key: 'tpa', header: 'TPA', width: 16, kind: 'wrap' },
  { key: 'planTypes', header: 'Plan Type', width: 28, kind: 'wrap' },
  { key: 'categories', header: 'Categories', width: 16, kind: 'text' },
  { key: 'members', header: 'Members', width: 12, kind: 'int' },
  { key: 'dubaiMembers', header: 'Dubai Members', width: 14, kind: 'int' },
  { key: 'neMembers', header: 'Northern Emirates Members', width: 14, kind: 'int' },
  { key: 'planCount', header: 'No. of Plans', width: 13, kind: 'int' },
  { key: 'insurers', header: 'Insurers Quoted', width: 34, kind: 'wrap' },
  { key: 'plansCompared', header: 'Plans Compared', width: 60, kind: 'wrap' },
  { key: 'lowest', header: 'Lowest Premium (AED)', width: 14, kind: 'money' },
  { key: 'highest', header: 'Highest Premium (AED)', width: 14, kind: 'money' },
  { key: 'spread', header: 'Spread (AED)', width: 14, kind: 'money' },
  { key: 'createdBy', header: 'Created By', width: 18, kind: 'text' },
  { key: 'createdAt', header: 'Created Date', width: 17, kind: 'date' },
];

const PLAN_COLUMNS = [
  { key: 'ref', header: 'Quote Ref No.', width: 16, kind: 'ref' },
  { key: 'business', header: 'New / Renewal', width: 14, kind: 'center' },
  { key: 'enquiryNo', header: 'Enquiry No.', width: 14, kind: 'text' },
  { key: 'company', header: 'Client Name', width: 32, kind: 'text' },
  { key: 'tpa', header: 'TPA', width: 12, kind: 'center' },
  { key: 'insurer', header: 'Insurer', width: 30, kind: 'text' },
  { key: 'planTag', header: 'Plan Tag', width: 16, kind: 'text' },
  { key: 'planType', header: 'Plan Type', width: 28, kind: 'text' },
  { key: 'network', header: 'Network', width: 22, kind: 'wrap' },
  { key: 'annualLimit', header: 'Annual Limit', width: 18, kind: 'wrap' },
  { key: 'areaOfCover', header: 'Area of Cover', width: 24, kind: 'wrap' },
  { key: 'categories', header: 'Categories', width: 16, kind: 'text' },
  { key: 'members', header: 'Members', width: 12, kind: 'int' },
  { key: 'dubaiMembers', header: 'Dubai Members', width: 14, kind: 'int' },
  { key: 'neMembers', header: 'Northern Emirates Members', width: 14, kind: 'int' },
  { key: 'net', header: 'Net Premium (AED)', width: 14, kind: 'money' },
  { key: 'fees', header: 'Fees & Levies (AED)', width: 13, kind: 'money' },
  { key: 'vat', header: 'VAT (AED)', width: 12, kind: 'money' },
  { key: 'total', header: 'Total Premium (AED)', width: 14, kind: 'money' },
  { key: 'cheapest', header: 'Cheapest in Comparison', width: 13, kind: 'center' },
  { key: 'createdBy', header: 'Created By', width: 18, kind: 'text' },
  { key: 'createdAt', header: 'Created Date', width: 17, kind: 'date' },
];

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

const comparisonRow = (c) => {
  const plans = c.plans || [];
  const priced = plans.map((p) => ({ plan: p, total: premiums(p).total })).filter((x) => x.total != null);
  const totals = priced.map((x) => x.total);
  const lowest = totals.length ? Math.min(...totals) : null;
  const highest = totals.length ? Math.max(...totals) : null;
  // The census (members, emirates) is the same for every plan in practice;
  // the largest is taken in case one plan was left part-filled.
  const census = plans.reduce((best, p) => (!best || members(p) > members(best) ? p : best), null);

  return {
    ref: c.referenceNumber,
    business: isRenewalBusiness(c) ? 'Renewal' : 'New',
    enquiryNo: c.enquiry?.enquiryNo,
    enquiryName: c.enquiry?.enquiryName,
    insuranceType: c.enquiry?.insuranceType,
    subType: c.enquiry?.subType,
    company: c.companyName || c.companyInfo?.companyName,
    tpa: distinct(plans.map((p) => p.tpa)).join(', ') || tpaOf(c),
    planTypes: distinct(plans.map((p) => PLAN_TYPES[p.planType] || p.planType)).join(', '),
    categories: distinct(plans.flatMap((p) => p.selectedCategories || [])).join(', '),
    members: census ? members(census) || null : null,
    dubaiMembers: census ? Number(census.dubaiMembers) || null : null,
    neMembers: census ? Number(census.northernEmiratesMembers) || null : null,
    planCount: plans.length,
    insurers: distinct(plans.map(insurerName)).join(', '),
    plansCompared: plans
      .map((p) => {
        const total = premiums(p).total;
        return total == null ? planLabel(p) : `${planLabel(p)}: AED ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      })
      .join('; '),
    lowest,
    highest,
    spread: totals.length ? highest - lowest : null,
    createdBy: c.createdBy,
    createdAt: createdAt(c),
  };
};

const planRows = (c) => {
  const plans = c.plans || [];
  const totals = plans.map((p) => premiums(p).total).filter((t) => t != null);
  const lowest = totals.length ? Math.min(...totals) : null;
  const shared = {
    ref: c.referenceNumber,
    business: isRenewalBusiness(c) ? 'Renewal' : 'New',
    enquiryNo: c.enquiry?.enquiryNo,
    company: c.companyName || c.companyInfo?.companyName,
    createdBy: c.createdBy,
    createdAt: createdAt(c),
  };
  return plans.map((p) => {
    const money = premiums(p);
    const cd = p.categoriesData || {};
    const areaOfCover =
      flatten(cd.areaOfCover) ||
      blank(p.areaOfCoverMode === 'textarea' ? p.areaOfCoverTextarea : p.areaOfCoverDropdown);
    return {
      ...shared,
      tpa: p.tpa || tpaOf(c),
      insurer: insurerName(p),
      planTag: p.planTag,
      planType: PLAN_TYPES[p.planType] || p.planType,
      network: flatten(cd.network),
      annualLimit: blank(p.annualLimit) || flatten(cd.aggregateLimit),
      areaOfCover,
      categories: (p.selectedCategories || []).join(', '),
      members: members(p) || null,
      dubaiMembers: Number(p.dubaiMembers) || null,
      neMembers: Number(p.northernEmiratesMembers) || null,
      ...money,
      cheapest: money.total == null ? null : money.total === lowest ? 'Yes' : 'No',
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
  const columns = isPlans ? PLAN_COLUMNS : COMPARISON_COLUMNS;
  const data = isPlans ? comparisons.flatMap(planRows) : comparisons.map(comparisonRow);
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
      `Generated ${formatDateTime(generatedAt)} by ${info.generatedBy || 'Unknown'}  ·  ` +
        `Amounts in AED; ${isPlans ? 'Total Premium includes' : 'premiums include'} fees, levies and 5% VAT`,
    ],
    columns,
    rows: data.map((row) => columns.map((c) => cellValue(c, row[c.key]))),
  });
  return { blob, rowCount: data.length };
}
