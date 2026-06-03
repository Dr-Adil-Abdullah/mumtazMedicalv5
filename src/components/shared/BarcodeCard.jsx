import { useEffect, useState } from 'react';
import { createBarcodeSVGString } from '../../utils/barcode';

export default function BarcodeCard({ title, subtitle, code, note = '' }) {
  const [svgMarkup, setSvgMarkup] = useState('');

  useEffect(() => {
    let active = true;
    setSvgMarkup('');

    async function loadBarcode() {
      const markup = await createBarcodeSVGString(code);
      if (active) {
        setSvgMarkup(markup);
      }
    }

    loadBarcode();

    return () => {
      active = false;
    };
  }, [code]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-slate-900 shadow-soft">
      <div className="text-2xl font-black">{title}</div>
      {subtitle ? <div className="mt-2 text-sm text-slate-500">{subtitle}</div> : null}
      <div className="mt-5 flex min-h-[120px] items-center justify-center">
        {svgMarkup ? <div dangerouslySetInnerHTML={{ __html: svgMarkup }} /> : <div>Preparing barcode…</div>}
      </div>
      <div className="mt-3 text-lg font-semibold">{code}</div>
      {note ? <div className="mt-2 text-xs text-slate-500">{note}</div> : null}
    </div>
  );
}
