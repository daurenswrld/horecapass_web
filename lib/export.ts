/**
 * Выгрузка таблиц админки: CSV, Excel (.xlsx) и PDF (печать в PDF).
 *
 * Заказчица (видео 14.10): «все отчёты скачивать не только CSV, а и PDF,
 * Excel, и выбирать период». Без библиотек: .xlsx — это zip с несколькими
 * XML-файлами, а сжатие zip не обязательно (метод «stored»), так что файл
 * собирается здесь же. PDF — через печать браузера: отдельное окно с чистой
 * таблицей и диалогом «Сохранить как PDF».
 */

export interface Column<T> {
  label: string;
  value: (row: T) => string | number | null | undefined;
}

export interface Report<T> {
  /** Имя файла без расширения. */
  name: string;
  title: string;
  /** Строка под заголовком в PDF: период, фильтры. */
  subtitle?: string;
  columns: Column<T>[];
  rows: T[];
}

const cell = (v: unknown) => (v == null ? '' : String(v));

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const safeName = (name: string) => name.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'report';

/* CSV ------------------------------------------------------------------------ */

export function toCsv<T>(report: Report<T>): string {
  const quote = (v: unknown) => {
    const s = cell(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [report.columns.map((c) => quote(c.label)).join(',')];
  for (const row of report.rows) lines.push(report.columns.map((c) => quote(c.value(row))).join(','));
  return lines.join('\r\n');
}

export function downloadCsv<T>(report: Report<T>) {
  // BOM: без него Excel открывает UTF-8 как кракозябры.
  save(new Blob(['﻿' + toCsv(report)], { type: 'text/csv;charset=utf-8' }), `${safeName(report.name)}.csv`);
}

/* XLSX ----------------------------------------------------------------------- */

const xml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Управляющие символы XML запрещены — выкидываем.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

function colName(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function sheetXml<T>(report: Report<T>): string {
  const rowXml = (values: unknown[], r: number, header = false) =>
    `<row r="${r}">` +
    values
      .map((v, c) => {
        const ref = `${colName(c)}${r}`;
        if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`;
        return `<c r="${ref}" t="inlineStr"${header ? ' s="1"' : ''}><is><t xml:space="preserve">${xml(cell(v))}</t></is></c>`;
      })
      .join('') +
    '</row>';
  const rows = [rowXml(report.columns.map((c) => c.label), 1, true)];
  report.rows.forEach((row, i) => rows.push(rowXml(report.columns.map((c) => c.value(row)), i + 2)));
  const widths = report.columns
    .map((c, i) => {
      const longest = Math.max(c.label.length, ...report.rows.slice(0, 200).map((r) => cell(c.value(r)).length));
      return `<col min="${i + 1}" max="${i + 1}" width="${Math.min(60, Math.max(8, longest + 2))}" customWidth="1"/>`;
    })
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    `<cols>${widths}</cols><sheetData>${rows.join('')}</sheetData></worksheet>`
  );
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Zip без сжатия (stored): ровно то, что нужно Excel, и без библиотек. */
function zip(files: [string, string][]): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of files) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, data);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true);
    dir.setUint16(6, 20, true);
    dir.setUint16(8, 0x0800, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, data.length, true);
    dir.setUint32(24, data.length, true);
    dir.setUint16(28, nameBytes.length, true);
    dir.setUint32(42, offset, true);
    central.push(new Uint8Array(dir.buffer), nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const dirSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, dirSize, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of all) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

export function toXlsx<T>(report: Report<T>): Uint8Array {
  const sheet = xml(report.title).slice(0, 31).replace(/[\\/?*[\]:]/g, ' ') || 'Report';
  return zip([
    [
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    ],
    [
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ],
    [
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sheet}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      'xl/_rels/workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    ],
    [
      'xl/styles.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    ],
    ['xl/worksheets/sheet1.xml', sheetXml(report)],
  ]);
}

export function downloadXlsx<T>(report: Report<T>) {
  const bytes = toXlsx(report);
  save(
    new Blob([bytes.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${safeName(report.name)}.xlsx`,
  );
}

/* PDF ------------------------------------------------------------------------ */

/** Чистая таблица в новом окне и диалог печати: там «Сохранить как PDF». */
export function printPdf<T>(report: Report<T>, opened?: Window | null) {
  // Окно открывают прямо по клику (иначе его режет блокировщик всплывающих окон),
  // а данные могут прийти позже — поэтому его можно передать готовым.
  const win = opened ?? window.open('', '_blank', 'width=1100,height=800');
  if (!win) return false;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const head = report.columns.map((c) => `<th>${esc(c.label)}</th>`).join('');
  const body = report.rows
    .map((r) => `<tr>${report.columns.map((c) => `<td>${esc(cell(c.value(r)))}</td>`).join('')}</tr>`)
    .join('');
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(report.title)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font: 11px/1.4 Arial, Helvetica, sans-serif; color: #06213A; margin: 0; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  p { margin: 0 0 12px; color: #6b5b4b; }
  table { border-collapse: collapse; width: 100%; }
  th { text-align: left; background: #F6EFE5; }
  th, td { border: 1px solid #e3d8cb; padding: 4px 6px; vertical-align: top; }
  tr { break-inside: avoid; }
</style></head><body>
<h1>${esc(report.title)}</h1>
<p>${esc(report.subtitle ?? '')}${report.subtitle ? ' · ' : ''}${report.rows.length} rows · HorecaPass, ${esc(new Date().toLocaleString('en-GB'))}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`);
  win.document.close();
  win.focus();
  win.setTimeout(() => win.print(), 250);
  return true;
}
