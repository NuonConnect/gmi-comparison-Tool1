// Turns a comparison report (the same HTML the print dialog gets) into a PDF
// Blob in the browser, for filing in Zoho WorkDrive.
//
// The report is a whole document with its own <style>, so it's rendered in a
// hidden iframe and html2pdf runs inside that iframe: run from this page, it
// would clone the report into the app's document, where the report's styles
// and the app's would clash.
import html2pdfUrl from 'html2pdf.js/dist/html2pdf.bundle.min.js?url';

// The WorkDrive function accepts about 4.5 MB (Netlify's request cap), so
// each attempt trades a little sharpness for size until the PDF fits.
const MAX_BYTES = 4.2 * 1024 * 1024;
const ATTEMPTS = [
  { scale: 2, quality: 0.9 },
  { scale: 1.5, quality: 0.8 },
  { scale: 1, quality: 0.75 },
];
// A4 landscape at 96dpi — the width the report is laid out for.
const PAGE_WIDTH_PX = 1123;
const PAGE_HEIGHT_PX = 794;

const loadScript = (doc, src) =>
  new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load the PDF maker.'));
    doc.head.appendChild(script);
  });

// Resolves once the report's images (insurer logos, cover art) have loaded,
// or after 15 s — a logo that never arrives shouldn't block the filing.
const whenLoaded = (win) =>
  new Promise((resolve) => {
    const done = () => win.document.fonts.ready.then(resolve, resolve);
    if (win.document.readyState === 'complete') return done();
    win.addEventListener('load', done, { once: true });
    setTimeout(resolve, 15000);
  });

export async function reportToPdf(html) {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-20000px',
    top: '0',
    width: `${PAGE_WIDTH_PX}px`,
    height: `${PAGE_HEIGHT_PX}px`,
    border: '0',
  });
  document.body.appendChild(iframe);

  try {
    const win = iframe.contentWindow;
    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();
    await whenLoaded(win);
    await loadScript(doc, html2pdfUrl);

    for (const { scale, quality } of ATTEMPTS) {
      const blob = await win
        .html2pdf()
        .set({
          margin: 0,
          image: { type: 'jpeg', quality },
          html2canvas: { scale, useCORS: true, backgroundColor: '#ffffff', windowWidth: PAGE_WIDTH_PX },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
          // Honour the report's page-break CSS, and never cut a table row in two.
          pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] },
        })
        .from(doc.body)
        .outputPdf('blob');
      // Re-made in this window: a Blob from the iframe dies with it.
      const pdf = new Blob([await blob.arrayBuffer()], { type: 'application/pdf' });
      if (pdf.size <= MAX_BYTES) return pdf;
    }
    throw new Error('The PDF is too large to save to WorkDrive.');
  } finally {
    iframe.remove();
  }
}
