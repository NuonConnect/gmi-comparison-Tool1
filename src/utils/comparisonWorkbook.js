// The Saved History workbook: columns, rows and styling for the Excel export.
// Loaded only when someone exports (see comparisonExport.js), so exceljs
// stays out of the app's main bundle.
//
// Touches no browser APIs, so it can also be run from Node to check the layout.
import ExcelJS from 'exceljs';
import { calculatePlanTotals } from './planTotals.js';

const COLORS = {
  comparison: 'b91c1c',
  enquiry: '1f3a5f',
  client: '0f766e',
  plans: '6d28d9',
  premiums: '15803d',
  recommended: 'a16207',
  record: '4b5563',
};

const PILLS = {
  green: { fill: 'dcfce7', font: '166534' },
  amber: { fill: 'fef3c7', font: '92400e' },
  blue: { fill: 'dbeafe', font: '1e40af' },
};

const PLAN_TYPES = {
  SME: 'SME',
  BASIC: 'Basic',
  ENHANCED_BASIC: 'DHA (Predefined)',
  DHA_MANUAL: 'Enhanced Basic (DHA Enhanced)',
  ENHANCED_CUSTOM: 'Enhanced Basic (Custom)',
};

const argb = (hex) => `FF${hex.toUpperCase()}`;

// The colour mixed `amount` of the way to white: 0.82 gives the light tint
// behind each group's column headers.
const tint = (hex, amount = 0.82) =>
  [0, 2, 4]
    .map((i) => parseInt(hex.slice(i, i + 2), 16))
    .map((c) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0'))
    .join('');

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

// updated_at is written on every save, so it only means an edit when it is
// later than created_at. lastEditedBy is recorded from Oct 2026 onwards.
const wasEdited = (c) =>
  !!c.lastEditedBy ||
  (c.updated_at && c.created_at && new Date(c.updated_at) - new Date(c.created_at) > 1000);

const planStatus = (plan) => {
  if (plan.isRecommended && plan.isRenewal) return 'Recommended & Renewal';
  if (plan.isRecommended) return 'Recommended';
  if (plan.isRenewal) return 'Renewal';
  return null;
};

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const newRenewalPill = (v) => (v === 'Renewal' ? PILLS.amber : v === 'New' ? PILLS.green : null);
const yesPill = (v) => (v === 'Yes' ? PILLS.green : null);
const statusPill = (v) => (v === 'Renewal' ? PILLS.blue : v ? PILLS.amber : null);

const COMPARISON_GROUPS = [
  {
    title: 'Comparison', color: COLORS.comparison, columns: [
      { key: 'ref', header: 'Quote Ref No.', width: 16 },
      { key: 'business', header: 'New / Renewal', width: 12, pill: newRenewalPill },
    ],
  },
  {
    title: 'Zoho Enquiry', color: COLORS.enquiry, columns: [
      { key: 'enquiryNo', header: 'Enquiry No.', width: 14 },
      { key: 'enquiryName', header: 'Enquiry Name', width: 30 },
      { key: 'insuranceType', header: 'Insurance Type', width: 16 },
      { key: 'subType', header: 'Insurance Sub-type', width: 16 },
    ],
  },
  {
    title: 'Client', color: COLORS.client, columns: [
      { key: 'company', header: 'Company Name', width: 32 },
      { key: 'tpa', header: 'TPA', width: 12 },
      { key: 'planTypes', header: 'Plan Type', width: 20 },
      { key: 'categories', header: 'Categories', width: 16 },
      { key: 'members', header: 'Members', width: 10, type: 'int' },
      { key: 'dubaiMembers', header: 'Dubai Members', width: 10, type: 'int' },
      { key: 'neMembers', header: 'Northern Emirates Members', width: 14, type: 'int' },
    ],
  },
  {
    title: 'Plans', color: COLORS.plans, columns: [
      { key: 'planCount', header: 'No. of Plans', width: 9, type: 'int' },
      { key: 'insurers', header: 'Insurers Quoted', width: 34, wrap: true },
      { key: 'plansCompared', header: 'Plans Compared', width: 60, wrap: true },
    ],
  },
  {
    title: 'Premiums (AED, incl. VAT)', color: COLORS.premiums, columns: [
      { key: 'lowest', header: 'Lowest', width: 14, type: 'money' },
      { key: 'highest', header: 'Highest', width: 14, type: 'money' },
      { key: 'spread', header: 'Spread', width: 14, type: 'money' },
    ],
  },
  {
    title: 'Recommended vs Renewal (AED)', color: COLORS.recommended, columns: [
      { key: 'recName', header: 'Recommended Plan', width: 26 },
      { key: 'recPremium', header: 'Recommended Premium', width: 15, type: 'money' },
      { key: 'renName', header: 'Renewal Plan', width: 26 },
      { key: 'renPremium', header: 'Renewal Premium', width: 15, type: 'money' },
      { key: 'difference', header: 'Difference', width: 14, type: 'money', sign: true },
    ],
  },
  {
    title: 'Record', color: COLORS.record, columns: [
      { key: 'createdBy', header: 'Created By', width: 18 },
      { key: 'createdAt', header: 'Created Date', width: 17, type: 'date' },
      { key: 'editedBy', header: 'Last Edited By', width: 18 },
      { key: 'editedAt', header: 'Last Edited Date', width: 17, type: 'date' },
    ],
  },
];

const PLAN_GROUPS = [
  {
    title: 'Comparison', color: COLORS.comparison, columns: [
      { key: 'ref', header: 'Quote Ref No.', width: 16 },
      { key: 'business', header: 'New / Renewal', width: 12, pill: newRenewalPill },
      { key: 'enquiryNo', header: 'Enquiry No.', width: 14 },
      { key: 'company', header: 'Client Name', width: 32 },
      { key: 'tpa', header: 'TPA', width: 12 },
    ],
  },
  {
    title: 'Plan', color: COLORS.plans, columns: [
      { key: 'insurer', header: 'Insurer', width: 30 },
      { key: 'planTag', header: 'Plan Tag', width: 16 },
      { key: 'productName', header: 'Product Name', width: 20, wrap: true },
      { key: 'planType', header: 'Plan Type', width: 20 },
      { key: 'network', header: 'Network', width: 22, wrap: true },
      { key: 'annualLimit', header: 'Annual Limit', width: 18, wrap: true },
      { key: 'areaOfCover', header: 'Area of Cover', width: 24, wrap: true },
      { key: 'categories', header: 'Categories', width: 16 },
      { key: 'members', header: 'Members', width: 10, type: 'int' },
      { key: 'dubaiMembers', header: 'Dubai Members', width: 10, type: 'int' },
      { key: 'neMembers', header: 'Northern Emirates Members', width: 14, type: 'int' },
      { key: 'status', header: 'Status', width: 22, pill: statusPill },
    ],
  },
  {
    title: 'Premium (AED)', color: COLORS.premiums, columns: [
      { key: 'net', header: 'Net Premium', width: 14, type: 'money' },
      { key: 'fees', header: 'Fees & Levies', width: 13, type: 'money' },
      { key: 'vat', header: 'VAT', width: 12, type: 'money' },
      { key: 'total', header: 'Total Premium', width: 14, type: 'money' },
      { key: 'cheapest', header: 'Cheapest in Comparison', width: 13, pill: yesPill },
    ],
  },
  {
    title: 'Record', color: COLORS.record, columns: [
      { key: 'createdBy', header: 'Created By', width: 18 },
      { key: 'createdAt', header: 'Created Date', width: 17, type: 'date' },
    ],
  },
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
  const rec = plans.find((p) => p.isRecommended);
  const ren = plans.find((p) => p.isRenewal);
  const recPremium = rec ? premiums(rec).total : null;
  const renPremium = ren ? premiums(ren).total : null;
  const edited = wasEdited(c);

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
    recName: rec ? planLabel(rec) : null,
    recPremium,
    renName: ren ? planLabel(ren) : null,
    renPremium,
    difference: recPremium != null && renPremium != null ? recPremium - renPremium : null,
    createdBy: c.createdBy,
    createdAt: createdAt(c),
    editedBy: edited ? c.lastEditedBy : null,
    editedAt: edited ? c.updated_at : null,
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
      productName: flatten(cd.planName),
      planType: PLAN_TYPES[p.planType] || p.planType,
      network: flatten(cd.network),
      annualLimit: blank(p.annualLimit) || flatten(cd.aggregateLimit),
      areaOfCover,
      categories: (p.selectedCategories || []).join(', '),
      members: members(p) || null,
      dubaiMembers: Number(p.dubaiMembers) || null,
      neMembers: Number(p.northernEmiratesMembers) || null,
      status: planStatus(p),
      ...money,
      cheapest: money.total == null ? null : money.total === lowest ? 'Yes' : 'No',
    };
  });
};

// ---------------------------------------------------------------------------
// Workbook
// ---------------------------------------------------------------------------

// Excel dates have no time zone and exceljs writes a Date as UTC, so each one
// is shifted by the local offset first; otherwise times show 4 hours early in
// the UAE.
const toExcelDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

const cellValue = (col, v) => {
  if (col.type === 'date') return toExcelDate(v);
  if (col.type === 'money' || col.type === 'int') return typeof v === 'number' && Number.isFinite(v) ? v : null;
  return blank(v);
};

const solid = (hex) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } });
const thin = { style: 'thin', color: { argb: argb('d9d9d9') } };
const THIN_BORDER = { top: thin, left: thin, bottom: thin, right: thin };

const addDataSheet = (wb, name, groups, rows) => {
  const columns = groups.flatMap((g) => g.columns.map((c) => ({ ...c, group: g })));
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }] });
  ws.columns = columns.map((c) => ({ key: c.key, width: c.width }));

  // Row 1: one coloured band per group
  let start = 1;
  groups.forEach((g) => {
    const end = start + g.columns.length - 1;
    if (end > start) ws.mergeCells(1, start, 1, end);
    const cell = ws.getCell(1, start);
    cell.value = g.title.toUpperCase();
    cell.fill = solid(g.color);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    start = end + 1;
  });
  ws.getRow(1).height = 22;

  // Row 2: column headers in the group's colour
  const header = ws.getRow(2);
  columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: argb(c.group.color) } };
    cell.fill = solid(tint(c.group.color));
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { ...THIN_BORDER, bottom: { style: 'medium', color: { argb: argb(c.group.color) } } };
  });
  header.height = 44;
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: columns.length } };

  rows.forEach((data, r) => {
    const row = ws.addRow(columns.map((c) => cellValue(c, data[c.key])));
    columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const v = cell.value;
      cell.border = THIN_BORDER;
      if (r % 2 === 1) cell.fill = solid('faf4e6');
      cell.alignment = { vertical: 'top', wrapText: !!c.wrap };
      if (i === 0) cell.font = { bold: true };
      if (c.type === 'money') {
        cell.numFmt = '#,##0.00';
        cell.alignment = { ...cell.alignment, horizontal: 'right' };
        if (c.sign && v > 0) cell.font = { bold: true, color: { argb: argb('b91c1c') } };
        if (c.sign && v < 0) cell.font = { bold: true, color: { argb: argb('15803d') } };
      }
      if (c.type === 'int') cell.alignment = { ...cell.alignment, horizontal: 'right' };
      if (c.type === 'date') cell.numFmt = 'dd/mm/yyyy hh:mm';
      const pill = c.pill && v != null ? c.pill(v) : null;
      if (pill) {
        cell.fill = solid(pill.fill);
        cell.font = { bold: true, color: { argb: argb(pill.font) } };
        cell.alignment = { ...cell.alignment, horizontal: 'center' };
      }
    });
  });
  return ws;
};

const addInfoSheet = (wb, info, layout, rowCount) => {
  const ws = wb.addWorksheet('Report Info');
  ws.columns = [{ width: 22 }, { width: 56 }];
  ws.mergeCells('A1:B1');
  const title = ws.getCell('A1');
  title.value = 'GROUP MEDICAL COMPARISONS REPORT';
  title.fill = solid(COLORS.comparison);
  title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 28;

  const lines = [
    ['Report', layout === 'plans' ? 'Plans (one row per plan)' : 'Comparisons (one row per comparison)'],
    ['Generated', toExcelDate(info.generatedAt || new Date())],
    ['Generated by', info.generatedBy || 'Unknown'],
    ['Period', info.period || 'All time'],
    ['Advisor', info.advisor || 'All advisors'],
    ['Rows', rowCount],
  ];
  lines.forEach(([label, value], i) => {
    const row = ws.getRow(i + 3);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, color: { argb: argb(COLORS.record) } };
    row.getCell(2).value = value;
    row.getCell(2).alignment = { horizontal: 'left' };
    if (value instanceof Date) row.getCell(2).numFmt = 'dd/mm/yyyy hh:mm';
    [1, 2].forEach((n) => { row.getCell(n).border = { bottom: thin }; });
  });
  return ws;
};

// layout: 'comparisons' (one row per comparison) or 'plans' (one per plan).
// info: { generatedAt, generatedBy, period, advisor } for the Report Info sheet.
export function buildWorkbook(comparisons, layout, info = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = info.generatedBy || 'NSIB';
  wb.created = new Date();
  const rows = layout === 'plans' ? comparisons.flatMap(planRows) : comparisons.map(comparisonRow);
  addDataSheet(wb, layout === 'plans' ? 'Plans' : 'Comparisons', layout === 'plans' ? PLAN_GROUPS : COMPARISON_GROUPS, rows);
  addInfoSheet(wb, info, layout, rows.length);
  return { workbook: wb, rowCount: rows.length };
}

