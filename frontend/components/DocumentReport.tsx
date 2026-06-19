'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { ExtractedDocument } from '@/types';
import { normList, safeStr, PRIORITY_BG, PRIORITY_ICON } from '@/lib/utils';
import { api } from '@/lib/api';

interface Props {
  doc: ExtractedDocument;
  sourceName: string;
}

export default function DocumentReport({ doc, sourceName }: Props) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const priority = safeStr(doc.priority, 'Medium') as 'High' | 'Medium' | 'Low';
  const docType  = safeStr(doc.document_type, 'Document');
  const ref      = safeStr(doc.reference_number, '');
  const fromP    = safeStr(doc.from_party);
  const toP      = safeStr(doc.to_party);
  const dateV    = safeStr(doc.date);
  const amount   = safeStr(doc.total_amount);
  const due      = safeStr(doc.due_date, '');
  const summary  = safeStr(doc.summary, 'No summary available.');

  const actions  = normList(doc.action_items);
  const parties  = normList(doc.key_parties);
  const terms    = normList(doc.key_terms);
  const tags     = normList(doc.tags);

  const finDetails: Record<string, string> = (() => {
    const raw = doc.financial_details;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, safeStr(v)])
    );
  })();

  const handleExcelExport = async () => {
    setExporting(true);
    try {
      await api.exportExcel([{ ...doc, source_name: sourceName }]);
    } catch (e) {
      alert('Export failed: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleJsonExport = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${sourceName.replace(/\.[^.]+$/, '')}_report.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Truncation warning */}
      {doc._truncated && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#78350F' }}>
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          Document was very long — analysed from the first ~180,000 characters. Data near the end may be incomplete.
        </div>
      )}

      {/* Header card */}
      <div className="rounded-[20px] p-7 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.30)' }}>
        {/* decorative circles */}
        <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute -bottom-10 -left-5 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />

        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] mb-2" style={{ color: '#C4B5FD' }}>
            📄 &nbsp;{sourceName}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight mb-4">{docType}</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.20)' }}>{docType}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${PRIORITY_BG[priority]}`}>
              {PRIORITY_ICON[priority]} {priority} Priority
            </span>
            {ref && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.10)', color: '#C4B5FD', border: '1px solid rgba(255,255,255,0.22)' }}>
                Ref: {ref}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-3">
        {[['From', fromP], ['To', toP], ['Date', dateV], ['Amount', amount]].map(([label, val]) => (
          <div key={label} className="bg-white rounded-2xl p-4 text-center"
            style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</div>
            <div className="text-sm font-bold text-slate-900 break-words leading-snug">{val}</div>
          </div>
        ))}
      </div>

      {/* Due date */}
      {due && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#78350F' }}>
          ⏰ <strong>Due:</strong> {due}
        </div>
      )}

      {/* Summary */}
      <Section label="Summary">
        <div className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p className="text-sm leading-relaxed text-slate-700 pl-4"
            style={{ borderLeft: '4px solid #6366F1' }}>
            {summary}
          </p>
        </div>
      </Section>

      {/* Action items */}
      {actions.length > 0 && (
        <Section label="Action Items">
          <div className="space-y-2">
            {actions.map((item, i) => (
              <div key={i} className="flex gap-3 items-start px-4 py-3 rounded-r-xl text-sm text-slate-800"
                style={{ background: '#F5F3FF', border: '1px solid #EDE9FE', borderLeft: '3px solid #6366F1' }}>
                <span className="text-xs font-bold flex-shrink-0 pt-0.5" style={{ color: '#6366F1' }}>{i + 1}.</span>
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Key parties */}
      {parties.length > 0 && (
        <Section label="Key Parties">
          <div className="bg-white rounded-2xl p-5 space-y-2"
            style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {parties.map((p, i) => (
              <div key={i} className="flex justify-between py-2 text-sm border-b last:border-0"
                style={{ borderColor: '#F1F5F9' }}>
                <span className="text-slate-500 font-medium">Party {i + 1}</span>
                <span className="font-semibold text-slate-900 text-right">{p}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Financial details */}
      {Object.keys(finDetails).length > 0 && (
        <Section label="Financial Details">
          <div className="bg-white rounded-2xl p-5 space-y-1"
            style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {Object.entries(finDetails).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 text-sm border-b last:border-0"
                style={{ borderColor: '#F1F5F9' }}>
                <span className="text-slate-500 font-medium">{k}</span>
                <span className="font-semibold text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Key terms */}
      {terms.length > 0 && (
        <Section label="Key Terms &amp; Conditions">
          <div className="space-y-2">
            {terms.map((t, i) => (
              <div key={i} className="px-4 py-2.5 rounded-r-xl text-sm text-slate-800"
                style={{ background: '#F8FAFF', borderLeft: '3px solid #A5B4FC' }}>
                {t}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Export bar */}
      <div className="pt-2">
        <div className="h-px mb-5" style={{ background: 'linear-gradient(to right,transparent,#E5E7EB 20%,#E5E7EB 80%,transparent)' }} />
        <div className="flex gap-3">
          <button onClick={handleJsonExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-50"
            style={{ border: '1px solid #C7D2FE', color: '#4338CA' }}>
            <Download size={14} /> JSON
          </button>
          <button onClick={handleExcelExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-indigo-50 disabled:opacity-50"
            style={{ border: '1px solid #C7D2FE', color: '#4338CA' }}>
            <FileSpreadsheet size={14} /> {exporting ? 'Exporting…' : 'Excel'}
          </button>
        </div>

        {/* Raw JSON toggle */}
        <button onClick={() => setJsonOpen(!jsonOpen)}
          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
          {jsonOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          Raw extracted JSON
        </button>
        {jsonOpen && (
          <pre className="mt-2 p-4 rounded-xl text-xs overflow-auto max-h-72"
            style={{ background: '#F8FAFF', border: '1px solid #E5E7EB', color: '#334155' }}>
            {JSON.stringify(doc, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.10em] text-slate-400 mb-3 pb-2"
        style={{ borderBottom: '1px solid #F1F5F9' }}>
        {label}
      </div>
      {children}
    </div>
  );
}
