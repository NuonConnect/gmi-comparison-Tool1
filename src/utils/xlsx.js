// ============================================================================
// Minimal .xlsx writer — one styled sheet, no dependencies
// ============================================================================
// An .xlsx is a zip of a few XML files. This builds them for a single report
// sheet in the NSIB theme and packs them with a "stored" (uncompressed) zip,
// which every Excel version opens. Reports are a few hundred rows, so the
// missing compression costs nothing that matters.
//
// Text is written as inline strings, never shared formulas or cell formulas,
// so a client name starting with "=" can't run as one, and Arabic displays as
// typed.

// NSIB theme.
const MAROON = '8A0E20';
const GOLD = 'D9A441';
const SAND = 'F0E4CC';
const CREAM = 'FAF6ED';
const INK = '2B2118';
const MUTED = '7A6A55';

// ---------------------------------------------------------------------------
// Styles — the cellXfs index each kind of cell uses
// ---------------------------------------------------------------------------
// Data styles come in pairs: plain row, then cream (alternate) row.
const KINDS = ['text', 'ref', 'center', 'int', 'money', 'date', 'wrap'];
const S = {
  title: 1,
  note: 2,
  header: 3,
  data: (kind, alt) => 4 + KINDS.indexOf(kind) * 2 + (alt ? 1 : 0),
};

const font = (size, color, bold) =>
  `<font>${bold ? '<b/>' : ''}<sz val="${size}"/><color rgb="FF${color}"/><name val="Calibri"/><family val="2"/></font>`;
const solid = (color) =>
  `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`;
const side = (name, style, color) => `<${name} style="${style}"><color rgb="FF${color}"/></${name}>`;

const STYLES_XML = (() => {
  const fonts = [
    font(11, INK, false), // 0 body
    font(16, MAROON, true), // 1 title
    font(9, MUTED, false), // 2 notes
    font(11, 'FFFFFF', true), // 3 header
    font(11, INK, true), // 4 ref column
  ];
  const fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>', solid(MAROON), solid(CREAM)];
  const borders = [
    '<border><left/><right/><top/><bottom/><diagonal/></border>',
    `<border>${side('left', 'thin', SAND)}${side('right', 'thin', SAND)}${side('top', 'thin', SAND)}${side('bottom', 'thin', SAND)}<diagonal/></border>`,
    `<border>${side('left', 'thin', SAND)}${side('right', 'thin', SAND)}${side('top', 'thin', SAND)}${side('bottom', 'medium', GOLD)}<diagonal/></border>`,
  ];
  // 164 money, 165 date; 3 is Excel's built-in "#,##0" for counts.
  const numFmts = '<numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="dd-mmm-yyyy hh:mm"/></numFmts>';

  const xf = (fontId, fillId, borderId, numFmtId, align) =>
    `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="${borderId}" xfId="0"` +
    `${fontId ? ' applyFont="1"' : ''}${fillId ? ' applyFill="1"' : ''}${borderId ? ' applyBorder="1"' : ''}` +
    `${numFmtId ? ' applyNumberFormat="1"' : ''} applyAlignment="1"><alignment ${align}/></xf>`;

  const DATA = {
    text: [0, 0, 'horizontal="left" vertical="center"'],
    ref: [4, 0, 'horizontal="left" vertical="center"'],
    center: [0, 0, 'horizontal="center" vertical="center"'],
    int: [0, 3, 'horizontal="center" vertical="center"'],
    money: [0, 164, 'horizontal="right" vertical="center"'],
    date: [0, 165, 'horizontal="center" vertical="center"'],
    wrap: [0, 0, 'horizontal="left" vertical="center" wrapText="1"'],
  };
  const xfs = [
    xf(0, 0, 0, 0, 'vertical="center"'), // 0 default
    xf(1, 0, 0, 0, 'vertical="center"'), // 1 title
    xf(2, 0, 0, 0, 'vertical="center"'), // 2 notes
    xf(3, 2, 2, 0, 'horizontal="center" vertical="center" wrapText="1"'), // 3 header
    ...KINDS.flatMap((k) => {
      const [fontId, numFmtId, align] = DATA[k];
      return [xf(fontId, 0, 1, numFmtId, align), xf(fontId, 3, 1, numFmtId, align)];
    }),
  ];

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    numFmts +
    `<fonts count="${fonts.length}">${fonts.join('')}</fonts>` +
    `<fills count="${fills.length}">${fills.join('')}</fills>` +
    `<borders count="${borders.length}">${borders.join('')}</borders>` +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>` +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>'
  );
})();

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------
const escapeXml = (s) =>
  String(s)
    // Control characters are invalid in XML and make Excel "repair" the file.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const colName = (n) => {
  let s = '';
  for (let i = n; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
};

// Excel stores a date as days since 1899-12-30, with no time zone: use the
// local wall-clock time so a quote saved at 9am UAE reads 09:00.
const excelDate = (d) => (d.getTime() - d.getTimezoneOffset() * 60000) / 86400000 + 25569;

const cellXml = (ref, value, style) => {
  if (value === null || value === undefined || value === '') return style ? `<c r="${ref}" s="${style}"/>` : '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? `<c r="${ref}" s="${style}"/>` : `<c r="${ref}" s="${style}"><v>${excelDate(value)}</v></c>`;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `<c r="${ref}" s="${style}"><v>${value}</v></c>` : `<c r="${ref}" s="${style}"/>`;
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
};

// ---------------------------------------------------------------------------
// Sheet
// ---------------------------------------------------------------------------
// Layout: title (row 1), two note lines (rows 2–3), blank (row 4), header
// (row 5), data from row 6.
const HEADER_ROW = 5;

// columns: [{ header, width, kind }] where kind is one of KINDS.
const sheetXml = ({ title, notes, columns, rows }) => {
  const last = colName(columns.length);
  const out = [];
  out.push(`<row r="1" ht="24" customHeight="1">${cellXml('A1', title, S.title)}</row>`);
  notes.slice(0, 2).forEach((n, i) => out.push(`<row r="${i + 2}">${cellXml(`A${i + 2}`, n, S.note)}</row>`));
  out.push(
    `<row r="${HEADER_ROW}" ht="32" customHeight="1">` +
      columns.map((c, i) => cellXml(`${colName(i + 1)}${HEADER_ROW}`, c.header, S.header)).join('') +
      '</row>'
  );
  rows.forEach((values, r) => {
    const rowNo = HEADER_ROW + 1 + r;
    const alt = r % 2 === 1;
    out.push(
      `<row r="${rowNo}">` +
        columns.map((c, i) => cellXml(`${colName(i + 1)}${rowNo}`, values[i], S.data(c.kind, alt))).join('') +
        '</row>'
    );
  });

  const lastRow = HEADER_ROW + Math.max(rows.length, 1);
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    `<dimension ref="A1:${last}${lastRow}"/>` +
    '<sheetViews><sheetView workbookViewId="0" showGridLines="0">' +
    `<pane xSplit="1" ySplit="${HEADER_ROW}" topLeftCell="B${HEADER_ROW + 1}" activePane="bottomRight" state="frozen"/>` +
    '<selection pane="topRight"/><selection pane="bottomLeft"/>' +
    `<selection pane="bottomRight" activeCell="B${HEADER_ROW + 1}" sqref="B${HEADER_ROW + 1}"/>` +
    '</sheetView></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    // +3 so the filter arrow doesn't sit on top of the heading.
    `<cols>${columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width + 3}" customWidth="1"/>`).join('')}</cols>` +
    `<sheetData>${out.join('')}</sheetData>` +
    `<autoFilter ref="A${HEADER_ROW}:${last}${lastRow}"/>` +
    '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.6" header="0.3" footer="0.3"/>' +
    '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>' +
    `<headerFooter><oddFooter>&amp;L${escapeXml(title.replace(/&/g, '&&'))}&amp;RPage &amp;P of &amp;N</oddFooter></headerFooter>` +
    // Text like an annual limit of "150000" is meant as text: no green warning triangles.
    `<ignoredErrors><ignoredError sqref="A1:${last}${lastRow}" numberStoredAsText="1"/></ignoredErrors>` +
    '</worksheet>'
  );
};

const workbookXml = (sheetName, columnCount, rowCount) => {
  const ref = `'${sheetName}'!$A$${HEADER_ROW}:$${colName(columnCount)}$${HEADER_ROW + Math.max(rowCount, 1)}`;
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
    '<definedNames>' +
    `<definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">${escapeXml(ref)}</definedName>` +
    // Repeat the header row on every printed page.
    `<definedName name="_xlnm.Print_Titles" localSheetId="0">${escapeXml(`'${sheetName}'!$${HEADER_ROW}:$${HEADER_ROW}`)}</definedName>` +
    '</definedNames>' +
    '</workbook>'
  );
};

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
  '</Types>';

const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
  '</Relationships>';

const WORKBOOK_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
  '</Relationships>';

// ---------------------------------------------------------------------------
// Zip ("stored", no compression)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const zip = (files) => {
  const enc = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const parts = [];
  const central = [];
  let offset = 0;
  files.forEach(({ name, data }) => {
    const nameBytes = enc.encode(name);
    const body = enc.encode(data);
    const crc = crc32(body);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, body.length, true);
    local.setUint32(22, body.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, body);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true); // version made by
    dir.setUint16(6, 20, true);
    dir.setUint16(8, 0x0800, true);
    dir.setUint16(10, 0, true);
    dir.setUint16(12, dosTime, true);
    dir.setUint16(14, dosDate, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, body.length, true);
    dir.setUint32(24, body.length, true);
    dir.setUint16(28, nameBytes.length, true);
    dir.setUint32(42, offset, true); // other fields stay zero
    central.push(new Uint8Array(dir.buffer), nameBytes);

    offset += 30 + nameBytes.length + body.length;
  });

  const centralSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------
// Builds a one-sheet report workbook and returns it as a Blob.
//   title    row 1, also the print footer
//   notes    up to two short lines under the title
//   columns  [{ header, width, kind: 'text'|'ref'|'center'|'int'|'money'|'date'|'wrap' }]
//   rows     arrays of values in column order: strings, numbers, Dates or null
export const buildReportXlsx = ({ sheetName, title, notes = [], columns, rows }) =>
  zip([
    { name: '[Content_Types].xml', data: CONTENT_TYPES },
    { name: '_rels/.rels', data: ROOT_RELS },
    { name: 'xl/workbook.xml', data: workbookXml(sheetName, columns.length, rows.length) },
    { name: 'xl/_rels/workbook.xml.rels', data: WORKBOOK_RELS },
    { name: 'xl/styles.xml', data: STYLES_XML },
    { name: 'xl/worksheets/sheet1.xml', data: sheetXml({ title, notes, columns, rows }) },
  ]);
