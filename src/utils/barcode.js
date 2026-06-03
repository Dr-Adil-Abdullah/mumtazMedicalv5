function createSvgElement() {
  return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
}

async function getJsBarcode() {
  const module = await import('jsbarcode');
  return module.default;
}

export async function createBarcodeSVGString(value, options = {}) {
  const safeValue = String(value ?? '').trim();
  if (!safeValue) return '';

  const JsBarcode = await getJsBarcode();
  const svg = createSvgElement();
  JsBarcode(svg, safeValue, {
    format: 'CODE128',
    lineColor: '#0f172a',
    background: '#ffffff',
    width: 1.8,
    height: 58,
    margin: 6,
    fontSize: 16,
    displayValue: true,
    ...options
  });

  return svg.outerHTML;
}

export async function printBarcodeLabel({ title, subtitle, code, note = '' }) {
  const printWindow = window.open('', '_blank', 'width=760,height=620');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${title} - Barcode</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; }
          .sheet { max-width: 520px; margin: 0 auto; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; text-align: center; }
          .muted { color: #64748b; font-size: 13px; }
          @media print { body { padding: 0; background: white; } .card { border: 0; } }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="card">
            <div style="font-size: 24px; font-weight: 800; color: #0f172a;">${title}</div>
            <div class="muted" style="margin-top: 8px;">${subtitle}</div>
            <div style="margin-top: 20px;">Preparing barcode…</div>
            <div style="margin-top: 14px; font-size: 18px; font-weight: 700; color: #0f172a;">${code}</div>
            ${note ? `<div class="muted" style="margin-top: 10px;">${note}</div>` : ''}
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();

  try {
    const markup = await createBarcodeSVGString(code, { height: 70, width: 2 });
    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${title} - Barcode</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; }
            .sheet { max-width: 520px; margin: 0 auto; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; text-align: center; }
            .muted { color: #64748b; font-size: 13px; }
            @media print { body { padding: 0; background: white; } .card { border: 0; } }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="card">
              <div style="font-size: 24px; font-weight: 800; color: #0f172a;">${title}</div>
              <div class="muted" style="margin-top: 8px;">${subtitle}</div>
              <div style="margin-top: 20px;">${markup}</div>
              <div style="margin-top: 14px; font-size: 18px; font-weight: 700; color: #0f172a;">${code}</div>
              ${note ? `<div class="muted" style="margin-top: 10px;">${note}</div>` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
    return true;
  } catch {
    printWindow.close();
    return false;
  }
}
