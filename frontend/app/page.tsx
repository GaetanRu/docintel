'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ProcessTab from '@/components/ProcessTab';
import BatchTab from '@/components/BatchTab';
import AnalyticsTab from '@/components/AnalyticsTab';
import { api } from '@/lib/api';

type Tab = 'process' | 'batch' | 'analytics';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'process',   label: 'Single Document', icon: '📄' },
  { id: 'batch',     label: 'Batch Upload',    icon: '📦' },
  { id: 'analytics', label: 'Analytics',       icon: '📊' },
];

export default function Page() {
  const [tab, setTab]           = useState<Tab>('process');
  const [apiOk, setApiOk]       = useState<boolean | null>(null);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    api.health()
      .then((h) => setApiOk(h.api_key_configured))
      .catch(() => setApiOk(false));
  }, []);

  const handleClearHistory = () => {
    if (!confirm('Delete all document history? This cannot be undone.')) return;
    window.location.reload();
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F9FAFB' }}>
      <Sidebar hasHistory={docCount > 0} onClearHistory={handleClearHistory} />

      <main className="flex-1 overflow-y-auto">
        {apiOk === false && (
          <div className="flex items-center gap-3 px-6 py-3 text-sm font-medium"
            style={{ background: '#FEF2F2', borderBottom: '1px solid #FCA5A5', color: '#991B1B' }}>
            <AlertTriangle size={16} />
            <span>
              <strong>Backend unreachable or API key missing.</strong>&nbsp;
              Make sure FastAPI is running on port 8000 and{' '}
              <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#FEE2E2' }}>ANTHROPIC_API_KEY</code>
              {' '}is set in{' '}
              <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#FEE2E2' }}>.env</code>.
            </span>
          </div>
        )}

        <div className="px-8 pt-7 pb-10 max-w-5xl mx-auto">
          <div className="mb-7">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Document Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Powered by Claude · Extract structured data from any document instantly
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

          {tab === 'process'   && <ProcessTab />}
          {tab === 'batch'     && <BatchTab />}
          {tab === 'analytics' && <AnalyticsTab onDocCountChange={setDocCount} />}
        </div>
      </main>
    </div>
  );
}
