'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ProcessTab from '@/components/ProcessTab';
import BatchTab from '@/components/BatchTab';
import AnalyticsTab from '@/components/AnalyticsTab';
import { api } from '@/lib/api';
import type { ExtractedDocument } from '@/types';

type Tab = 'process' | 'batch' | 'analytics';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'process',   label: 'Single Document', icon: '📄' },
  { id: 'batch',     label: 'Batch Upload',    icon: '📦' },
  { id: 'analytics', label: 'Analytics',       icon: '📊' },
];

const STORAGE_KEY = 'docintel_documents';

export default function Page() {
  const [tab, setTab]         = useState<Tab>('process');
  const [apiOk, setApiOk]     = useState<boolean | null>(null);
  const [documents, setDocuments] = useState<ExtractedDocument[]>([]);

  // Load persisted documents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDocuments(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    api.health()
      .then((h) => setApiOk(h.api_key_configured))
      .catch(() => setApiOk(false));
  }, []);

  const saveToStorage = (docs: ExtractedDocument[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(docs)); } catch {}
  };

  const handleDocumentAdded = useCallback((doc: ExtractedDocument) => {
    const enriched: ExtractedDocument = {
      ...doc,
      id: doc.id ?? Date.now(),
      processed_at: doc.processed_at ?? new Date().toISOString(),
    };
    setDocuments((prev) => {
      const next = [enriched, ...prev];
      saveToStorage(next);
      return next;
    });
  }, []);

  const handleDeleteDocument = useCallback((id: number) => {
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const handleClearHistory = () => {
    if (!confirm('Delete all document history? This cannot be undone.')) return;
    setDocuments([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F9FAFB' }}>
      <Sidebar hasHistory={documents.length > 0} onClearHistory={handleClearHistory} />

      <main className="flex-1 overflow-y-auto">
        {apiOk === false && (
          <div className="flex items-center gap-3 px-6 py-3 text-sm font-medium"
            style={{ background: '#FEF2F2', borderBottom: '1px solid #FCA5A5', color: '#991B1B' }}>
            <AlertTriangle size={16} />
            <span>
              <strong>API key missing or unreachable.</strong>&nbsp;
              Add <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#FEE2E2' }}>ANTHROPIC_API_KEY</code>
              {' '}to your Vercel environment variables.
            </span>
          </div>
        )}

        <div className="px-8 pt-7 pb-10 max-w-5xl mx-auto">
          <div className="mb-7">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Document Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Extract structured data from any document instantly
            </p>
            <p className="text-xs font-semibold mt-1.5 tracking-wide" style={{ color: '#7C3AED' }}>
              Powered by Claude API
            </p>
          </div>

          {/* Pill tabs */}
          <div className="inline-flex p-1 rounded-2xl mb-7"
            style={{ background: '#EAECF0', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={tab === t.id
                  ? { background: '#fff', color: '#4F46E5', fontWeight: 700, boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }
                  : { color: '#64748B' }}>
                {t.icon}&nbsp;&nbsp;{t.label}
              </button>
            ))}
          </div>

          {tab === 'process'   && <ProcessTab onDocumentAdded={handleDocumentAdded} />}
          {tab === 'batch'     && <BatchTab onDocumentAdded={handleDocumentAdded} />}
          {tab === 'analytics' && (
            <AnalyticsTab
              documents={documents}
              onDeleteDocument={handleDeleteDocument}
            />
          )}
        </div>
      </main>
    </div>
  );
}
