// Excel export of the Saved History list: exactly the comparisons the current
// filters show, either one row per comparison or one row per plan (for pivot
// tables). This part only names and saves the file; the workbook itself, with
// exceljs, is in comparisonWorkbook.js and is loaded only when someone
// exports, so it stays out of the app's main bundle.

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PRODUCT = 'GroupMedical';

// ---------------------------------------------------------------------------
// Filters → names
// ---------------------------------------------------------------------------

const PERIOD_NAMES = { all: 'All time', thisMonth: 'This month', lastMonth: 'Last month' };

// "This month", "2026-10-15", "2026-10-01 to 2026-10-15", "From 2026-10-01"
export function describePeriod({ periodFilter, specificDate, dateFrom, dateTo }) {
  if (periodFilter === 'onDate') return specificDate || 'All time';
  if (periodFilter === 'range') {
    if (dateFrom && dateTo) return `${dateFrom} to ${dateTo}`;
    if (dateFrom) return `From ${dateFrom}`;
    if (dateTo) return `Up to ${dateTo}`;
    return 'All time';
  }
  return PERIOD_NAMES[periodFilter] || 'All time';
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// GroupMedical-Comparisons-This-month-2026-10-16.xlsx,
// GroupMedical-Plans-2026-10-01_to_2026-10-15-2026-10-16.xlsx
export function exportFileName(layout, filters) {
  const period = describePeriod(filters).replace(/ to /g, '_to_').replace(/\s+/g, '-');
  return `${PRODUCT}-${layout === 'plans' ? 'Plans' : 'Comparisons'}-${period}-${today()}.xlsx`;
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

// Asks where to save straight away, while the click still counts as a user
// gesture (the picker refuses to open once that has lapsed, and loading
// exceljs can take a moment). Resolves to null if the user cancels.
async function chooseSaveTarget(fileName) {
  if (typeof window.showSaveFilePicker !== 'function') return { download: true };
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [{ description: 'Excel workbook', accept: { [XLSX_MIME]: ['.xlsx'] } }],
    });
    return { handle };
  } catch (error) {
    if (error?.name === 'AbortError') return null;
    // Blocked (e.g. inside a cross-origin frame): fall back to a download.
    console.warn('Save picker unavailable, downloading instead:', error);
    return { download: true };
  }
}

async function writeSaveTarget(target, blob, fileName) {
  if (target.handle) {
    const writable = await target.handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Builds and saves the workbook. Resolves to { rowCount } once saved, or null
// if the user cancelled the save dialog. Throws if the export fails.
export async function exportComparisons({ comparisons, layout, filters, info }) {
  const fileName = exportFileName(layout, filters);
  const target = await chooseSaveTarget(fileName);
  if (!target) return null;

  const { buildWorkbook } = await import('./comparisonWorkbook.js');
  const { workbook, rowCount } = buildWorkbook(comparisons, layout, {
    ...info,
    period: describePeriod(filters),
  });
  const buffer = await workbook.xlsx.writeBuffer();
  await writeSaveTarget(target, new Blob([buffer], { type: XLSX_MIME }), fileName);
  return { rowCount, fileName };
}
