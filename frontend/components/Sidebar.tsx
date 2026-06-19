'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Sheet, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  hasHistory: boolean;
  onClearHistory: () => void;
}

export default function Sidebar({ hasHistory, onClearHistory }: SidebarProps) {
  const [sheetsOpen, setSheetsOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [credsPath, setCredsPath] = useState('credentials.json');

  return (
    <aside className="w-60 min-h-screen flex-shrink-0 flex flex-col"
      style={{ background: '#0F172A', boxShadow: '4px 0 24px rgba(0,0,0,0.18)' }}>

      {/* Brand */}
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366F1,#7C3AED)', boxShadow: '0 6px 16px rgba(99,102,241,0.50)' }}>
            <FileText size={20} color="white" />
          </div>
          <div>
            <div className="text-[17px] font-extrabold text-slate-100 tracking-tight leading-tight">
              DocIntel
            </div>
            <div className="text-[11px] font-medium mt-0.5 tracking-wide" style={{ color: '#3F4D5C' }}>
              AI Document Intelligence
            </div>
          </div>
        </div>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Google Sheets expander */}
      <div className="px-4 mb-2">
        <button
          onClick={() => setSheetsOpen(!sheetsOpen)}
          className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ color: '#94A3B8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <Sheet size={14} />
            <span>Google Sheets</span>
          </div>
          {sheetsOpen
            ? <ChevronDown size={14} />
            : <ChevronRight size={14} />}
        </button>

        {sheetsOpen && (
          <div className="mt-2 px-3 py-3 rounded-xl space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px]" style={{ color: '#4B5563' }}>
              Auto-log extractions to a Google Sheet.
            </p>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#4B5563' }}>
                Sheet URL
              </label>
              <input
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/…"
                className="w-full px-2.5 py-2 rounded-lg text-xs text-slate-100 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#4B5563' }}>
                Credentials JSON
              </label>
              <input
                value={credsPath}
                onChange={(e) => setCredsPath(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg text-xs text-slate-100 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Clear history */}
      {hasHistory && (
        <div className="px-4 pb-6">
          <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <button
            onClick={onClearHistory}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#94A3B8',
            }}>
            <Trash2 size={13} />
            Clear history
          </button>
        </div>
      )}
    </aside>
  );
}
