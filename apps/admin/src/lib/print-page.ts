const APPLICATION_PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 portrait; margin: 10mm 12mm; }
  html, body {
    background: #fff;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-sheet { background: #fff; }
  .print-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  .print-header-main { flex: 1; }
  .print-header-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }
  .print-id {
    font-size: 15pt;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.3px;
  }
  .print-status {
    font-size: 14pt;
    font-weight: 700;
    color: #1d4ed8;
    padding: 2px 0;
  }
  .print-status-rejected { color: #b91c1c; }
  .print-status-accepted { color: #15803d; }
  .print-status-reviewing { color: #b45309; }
  .print-status-interview { color: #6d28d9; }
  .print-date {
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 5px;
  }
  .print-photo {
    width: 90px;
    height: 112px;
    object-fit: cover;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .print-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 24px;
  }
  .print-field {
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 0 10px;
  }
  .print-label {
    font-size: 8pt;
    font-weight: 500;
    color: #64748b;
  }
  .print-value {
    font-size: 9.5pt;
    color: #0f172a;
    margin-top: 3px;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

export function printApplicationSheet(sheetElement: HTMLElement): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>${APPLICATION_PRINT_CSS}</style>
</head>
<body>${sheetElement.outerHTML}</body>
</html>`);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  };

  win.onafterprint = cleanup;

  const triggerPrint = () => {
    win.focus();
    win.print();
  };

  const images = doc.querySelectorAll('img');
  if (images.length === 0) {
    setTimeout(triggerPrint, 100);
    return;
  }

  let loaded = 0;
  const onReady = () => {
    loaded += 1;
    if (loaded >= images.length) {
      setTimeout(triggerPrint, 100);
    }
  };

  images.forEach((img) => {
    if (img.complete) {
      onReady();
    } else {
      img.onload = onReady;
      img.onerror = onReady;
    }
  });

  setTimeout(cleanup, 120_000);
}
