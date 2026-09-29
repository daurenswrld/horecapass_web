'use client';

/**
 * Текст загруженного резюме — прямо в браузере.
 *
 * Серверный конструктор резюме на проде не читает вложения (ни PDF, ни
 * картинки: «пришлите текст резюме» — та самая жалоба заказчицы от 22.09).
 * Пока сервер не обновят, веб сам достаёт текст из PDF/DOCX/TXT и отдаёт его
 * ИИ обычным сообщением. Библиотеки грузятся только когда нужны.
 *
 * Сервер принимает до 8000 символов в сообщении — длиннее обрезаем.
 */

const LIMIT = 7500;

export async function extractCvText(file: File): Promise<string | null> {
  const name = file.name.toLowerCase();
  try {
    let text: string | null = null;
    if (file.type === 'application/pdf' || name.endsWith('.pdf')) text = await fromPdf(file);
    else if (name.endsWith('.docx')) text = await fromDocx(file);
    else if (file.type.startsWith('text/') || name.endsWith('.txt')) text = await file.text();
    if (!text) return null;
    const clean = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return clean ? clean.slice(0, LIMIT) : null;
  } catch {
    return null;
  }
}

async function fromPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    let line = '';
    const lines: string[] = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      } else line += ' ';
    }
    if (line.trim()) lines.push(line);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n\n');
}

async function fromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return res.value;
}
