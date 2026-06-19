import type { ExtractedDocument, BatchResult, Stats } from '@/types';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => req<{ status: string; api_key_configured: boolean }>('/api/health'),

  extract: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return req<ExtractedDocument>('/api/extract', { method: 'POST', body: form });
  },

  batch: (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return req<BatchResult[]>('/api/batch', { method: 'POST', body: form });
  },

  documents: () => req<ExtractedDocument[]>('/api/documents'),

  stats: () => req<Stats>('/api/stats'),

  deleteDocument: (id: number) =>
    req<{ deleted: number }>(`/api/documents/${id}`, { method: 'DELETE' }),

  exportExcel: async (documents: ExtractedDocument[]): Promise<void> => {
    const res = await fetch('/api/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents }),
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docintel_export_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
