import fs from 'fs';
import path from 'path';

// On Vercel (serverless), only /tmp is writable. Locally use data/ folder.
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'documents.json');

export interface StoredDocument {
  id: number;
  source_name: string;
  processed_at: string;
  [key: string]: unknown;
}

function readDB(): StoredDocument[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeDB(docs: StoredDocument[]): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(docs, null, 2));
}

export function getAllDocuments(): StoredDocument[] {
  return readDB().slice().reverse();
}

export function saveDocument(doc: Record<string, unknown>, sourceName: string): StoredDocument {
  const docs = readDB();
  const newDoc: StoredDocument = {
    ...doc,
    id: Date.now(),
    source_name: sourceName,
    processed_at: new Date().toISOString(),
  };
  docs.push(newDoc);
  writeDB(docs);
  return newDoc;
}

export function deleteDocument(id: number): void {
  writeDB(readDB().filter((d) => d.id !== id));
}

export function getStats() {
  const docs = readDB();

  const byPriorityMap: Record<string, number> = {};
  const byTypeMap: Record<string, number> = {};
  const byDayMap: Record<string, number> = {};

  for (const d of docs) {
    const p = (d.priority as string) || 'Medium';
    byPriorityMap[p] = (byPriorityMap[p] || 0) + 1;

    const t = (d.document_type as string) || 'Other';
    byTypeMap[t] = (byTypeMap[t] || 0) + 1;

    const day = d.processed_at ? d.processed_at.slice(0, 10) : 'unknown';
    byDayMap[day] = (byDayMap[day] || 0) + 1;
  }

  return {
    total: docs.length,
    by_priority: Object.entries(byPriorityMap).map(([priority, cnt]) => ({ priority, cnt })),
    by_type: Object.entries(byTypeMap)
      .map(([document_type, cnt]) => ({ document_type, cnt }))
      .sort((a, b) => b.cnt - a.cnt),
    by_day: Object.entries(byDayMap)
      .map(([day, cnt]) => ({ day, cnt }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  };
}
