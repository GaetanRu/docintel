'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, Calendar, Users } from 'lucide-react';
import type { ExtractedDocument } from '@/types';
import { normList, safeStr, PRIORITY_BG, PRIORITY_ICON } from '@/lib/utils';
import { api } from '@/lib/api';

interface Props {
  doc: ExtractedDocument;
  sourceName: string;
}

// Convert snake_case / camelCase keys to Title Case
function fmtKey(k: string) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format a value for display — handle arrays/objects gracefully
function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join(', ');
  return JSON.stringify(v);
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  'Action Required': { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' },
  'For Review':      { bg: '#FFFBEB', color: '#78350F', border: '#FCD34D' },
  'Approved':        { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  'For Records':     { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD' },
  'Pending':         { bg: '#F5F3FF', color: '#4C1D95', border: '#C4B5FD' },
};

export default function DocumentReport({ doc, sourceName }: Props) {
  const [jsonOpen, setJsonOpen]   = useState(false);
  const [exporting, setExporting] = useState(false);

  const priority       = safeStr(doc.priority, 'Medium') as 'High' | 'Medium' | 'Low';
  const docType        = safeStr(doc.document_type, 'Document');
  const docStatus      = safeStr((doc as any).document_status, '');
  const ref            = safeStr(doc.reference_number, '');
  const fromP          = safeStr(doc.from_party);
  const toP            = safeStr(doc.to_party);
  const dateV          = safeStr(doc.date);
  const amount         = safeStr(doc.total_amount);
  const due            = safeStr(doc.due_date, '');
  const summary        = safeStr(doc.summary, 'No summary available.');

  const actions     = normList(doc.action_items);
  const keyParties  = normList((doc as any).key_parties ?? doc.key_parties);
  const keyDates    = (doc as any).key_dates;
  const riskFlags   = normList((doc as any).risk_flags);
  const terms       = normList(doc.key_terms);
  const tags        = normList(doc.tags);

  // Parse financial_details
  const finRaw = (doc as any).financial_details;
  const lineItems: Array<{ description?: string; quantity?: string; unit_price?: string; amount?: string }> =
    Array.isArray(finRaw?.line_items) ? finRaw.line_items : [];

  // Summary financial rows (everything except line_items)
  const finSummaryRows: [string, string][] = finRaw && typeof finRaw === 'object'
    ? Object.entries(finRaw)
        .filter(([k]) => k !== 'line_items')
        .map(([k, v]) => [fmtKey(k), fmtVal(v)])
        .filter(([, v]) => v && v !== '—' && v !== 'null')
    : [];

  const statusStyle = STATUS_STYLE[docStatus] ?? null;

  const handleExcelExport = async () => {
    setExporting(true);
    try { await api.exportExcel([{ ...doc, source_name: sourceName }]); }
    catch (e) { alert('Export failed: ' + (e as Error).message); }
    finally { setExporting(false); }
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

      {/* Risk flags */}
      {riskFlags.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#7C2D12' }}>
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-orange-500" />
          <div>
            <p className="font-bold mb-1">Risk Flags</p>
            <ul className="space-y-0.5 list-disc list-inside">
              {riskFlags.map((f, i) => <li key={i} className="text-orange-900">{f}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="rounded-[20px] p-7 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.30)' }}>
        <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute -bottom-10 -left-5 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] mb-2" style={{ color: '#C4B5FD' }}>
            📄&nbsp;&nbsp;{sourceName}
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight mb-4">{docType}</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.20)' }}>{docType}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${PRIORITY_BG[priority]}`}>
              {PRIORITY_ICON[priority]} {priority} Priority
            </span>
            {ref && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.10)', color: '#C4B5FD', border: '1px solid rgba(255,255,255,0.22)' }}>
                Ref: {ref}
              </span>
            )}
            {statusStyle && docStatus && (
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                {docStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-3">
        {[['FROM', fromP], ['TO', toP], ['DATE', dateV], ['AMOUNT', amount]].map(([label, val]) => (
          <div key={label} className="bg-white rounded-2xl p-4 text-center"
            style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</div>
            <div className="text-sm font-bold text-slate-900 break-words leading-snug">{val || '—'}</div>
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
      <Section label="Executive Summary">
        <div className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p className="text-sm leading-7 text-slate-700 pl-4"
            style={{ borderLeft: '4px solid #6366F1' }}>
            {summary}
          </p>
        </div>
      </Section>

      {/* Action Items */}
      {actions.length > 0 && (
        <Section label="Action Items">
          <div className="space-y-2">
            {actions.map((item, i) => (
              <div key={i} className="flex gap-3 items-start px-4 py-3.5 rounded-r-xl text-sm"
                style={{ background: '#F5F3FF', border: '1px solid #EDE9FE', borderLeft: '3px solid #6366F1' }}>
                <span className="text-xs font-bold flex-shrink-0 pt-0.5 w-5 text-center rounded"
                  style={{ background: '#6366F1', color: '#fff', padding: '1px 5px' }}>{i + 1}</span>
                <span className="leading-relaxed text-slate-800">{item}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Key Dates */}
      {Array.isArray(keyDates) && keyDates.length > 0 && (
        <Section label="Key Dates">
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {keyDates.map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm"
                style={{ borderBottom: i < keyDates.length - 1 ? '1px solid #F1F5F9' : undefined }}>
                <div className="flex items-center gap-2.5">
                  <Calendar size={13} className="text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-600 font-medium">{d.label ?? d.name ?? `Date ${i + 1}`}</span>
                </div>
                <span className="font-bold text-slate-900">{d.date ?? safeStr(d)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Key Parties */}
      {keyParties.length > 0 && (
        <Section label="Parties Involved">
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {keyParties.map((p, i) => {
              // Split "Company Name — Role" or "Company Name (Role)"
              const dashIdx = p.indexOf(' — ');
              const parenIdx = p.indexOf(' (');
              let name = p, role = '';
              if (dashIdx > -1) { name = p.slice(0, dashIdx); role = p.slice(dashIdx + 3); }
              else if (parenIdx > -1) { name = p.slice(0, parenIdx); role = p.slice(parenIdx + 2, -1); }
              return (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 text-sm"
                  style={{ borderBottom: i < keyParties.length - 1 ? '1px solid #F1F5F9' : undefined }}>
                  <div className="flex items-center gap-2.5">
                    <Users size={13} className="text-indigo-400 flex-shrink-0" />
                    <span className="font-bold text-slate-900">{name}</span>
                  </div>
                  {role && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: '#EEF2FF', color: '#4338CA' }}>{role}</span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Line Items Table */}
      {lineItems.length > 0 && (
        <Section label="Line Items">
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F8FAFF', borderBottom: '1px solid #E5E7EB' }}>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500">Description</th>
                  <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 w-20">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 w-28">Unit Price</th>
                  <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: i < lineItems.length - 1 ? '1px solid #F8FAFF' : undefined }}>
                    <td className="px-5 py-3 text-slate-800 font-medium">{item.description ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-center">{item.quantity ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-right">{item.unit_price ?? '—'}</td>
                    <td className="px-5 py-3 font-bold text-slate-900 text-right">{item.amount ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Financial Summary */}
      {finSummaryRows.length > 0 && (
        <Section label="Financial Summary">
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {finSummaryRows.map(([k, v], i) => {
              const isTotal = k.toLowerCase().includes('total') || k.toLowerCase().includes('due');
              return (
                <div key={k} className="flex justify-between items-center px-5 py-3 text-sm"
                  style={{
                    borderBottom: i < finSummaryRows.length - 1 ? '1px solid #F1F5F9' : undefined,
                    background: isTotal ? '#F5F3FF' : undefined,
                  }}>
                  <span className={isTotal ? 'font-bold text-indigo-700' : 'text-slate-500 font-medium'}>{k}</span>
                  <span className={isTotal ? 'font-extrabold text-indigo-900 text-base' : 'font-semibold text-slate-900'}>{v}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Key Terms */}
      {terms.length > 0 && (
        <Section label="Key Terms &amp; Conditions">
          <div className="space-y-2">
            {terms.map((t, i) => (
              <div key={i} className="px-4 py-3 rounded-r-xl text-sm text-slate-700 leading-relaxed"
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
