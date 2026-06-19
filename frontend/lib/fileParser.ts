export interface FileResult {
  kind: 'text' | 'image';
  content: string | Buffer;
  media_type?: string;
  filename: string;
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tif', 'tiff']);
const IMAGE_MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
  tif: 'image/tiff', tiff: 'image/tiff',
};

export const SUPPORTED_EXTENSIONS = new Set([
  'pdf', 'txt', 'md', 'csv', 'json', 'html', 'htm',
  'xlsx', 'xls', 'docx', 'eml', 'msg',
  ...IMAGE_EXTS,
]);

const MAX_CHARS = 180_000;

export async function parseFile(buffer: Buffer, filename: string): Promise<FileResult> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  if (IMAGE_EXTS.has(ext)) {
    return {
      kind: 'image',
      content: buffer,
      media_type: IMAGE_MIME[ext] || 'image/jpeg',
      filename,
    };
  }

  let text = '';

  try {
    if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text ?? '';
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value ?? '';
    } else if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buffer, { type: 'buffer' });
      text = wb.SheetNames.map((name: string) => {
        const ws = wb.Sheets[name];
        return `=== Sheet: ${name} ===\n${XLSX.utils.sheet_to_csv(ws)}`;
      }).join('\n\n');
    } else {
      // txt, md, csv, json, html, eml, msg — all readable as UTF-8
      text = buffer.toString('utf-8');
    }
  } catch (err) {
    text = `[Parse error: ${(err as Error).message}]\n` + buffer.toString('utf-8').slice(0, 1000);
  }

  return {
    kind: 'text',
    content: text.slice(0, MAX_CHARS),
    filename,
  };
}
