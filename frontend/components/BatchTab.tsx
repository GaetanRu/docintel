'use client';

import { useState, useRef } from 'react';
import { Upload, Play, CheckCircle2, XCircle, Loader2, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import type { BatchResult } from '@/types';
import { PRIORITY_BG, PRIORITY_ICON } from '@/lib/utils';

export default function BatchTab() {
  const [files, setFiles]         = useState<File[]>([]);
  const [dragging, setDragging]   = useState(false);
  const [results, setResults]     = useState<BatchResult[]>([]);
  const [running, setRunning]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [currentFile, setCurrent] = useState('');
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = '.pdf,.txt,.md,.csv,.xlsx,.xls,.docx,.json,.html,.eml,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tif';

  const handleFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !names.has(f.name))];
    });
    setResults([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setResults([]);
  };

  const handleProcessAll = async () => {
    if (!files.length) return;
    setRunning(true); setResults([]); setProgress(0);
    const out: BatchResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setCurrent(f.name);
      setProgress(Math.round((i / files.length) * 100));
      try {
        const r = await api.extract(f);
        out.push({ status: 'ok', filename: f.name, result: r });
      } catch (e) {
        out.push({ status: 'error', filename: f.name, error: (e as Error).message });
      }
      setResults([...out]);
    }
    setProgress(100); setCurrent(''); setRunning(false);
  };

  const handleExportExcel = async () => {
    const docs = results.filter((r) => r.status === 'ok' && r.result).map((r) => ({
      ...r.result!,
      source_name: r.filename,
    }));
    if (!docs.length) return;
    setExporting(true);
    try { await api.exportExcel(docs); }
    catch (e) { alert('Export failed: ' + (e as Error).message); }
    finally { setExporting(false); }
  };

  const successCount = results.filter((r) => r.status === 'ok').length;
  const errorCount   = results.filter((r) => r.status === 'error').length;

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="cursor-pointer rounded-2xl p-8 text-center transition-all"
        style={{
          border: `2px dashed ${dragging ? '#6366F1' : '#C7D2FE'}`,
          background: dragging ? '#EEF2FF' : 'linear-gradient(135deg,#F5F3FF,#EEF2FF)',
          boxShadow: dragging ? '0 0 0 4px rgba(99,102,241,0.10)' : undefined,
        }}>
        <input ref={inputRef} type="file" accept={ACCEPTED} multiple className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)' }}>
          <Upload size={24} style={{ color: '#6366F1' }} />
        </div>
        <p className="font-semibold text-slate-700">
          Drop files here or <span style={{ color: '#6366F1' }}>browse</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, CSV, JSON, HTML, images, email and more</p>
      </div>

      {/* File list + process button */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl p-5"
          style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-700">
              <span style={{ color: '#6366F1' }}>{files.length}</span> file{files.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              {results.length > 0 && successCount > 0 && (
                <button onClick={handleExportExcel} disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                  style={{ border: '1px solid #C7D2FE', color: '#4338CA' }}>
                  <FileSpreadsheet size={13} />
                  {exporting ? 'Exporting…' : 'Export Excel'}
                </button>
              )}
              <button onClick={handleProcessAll} disabled={running}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6366F1,#7C3AED)', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}>
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {running ? 'Processing…' : 'Process All'}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {running && (
            <div className="mb-4">
              <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: '#EEF2FF' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366F1,#7C3AED)' }} />
              </div>
              <p className="text-xs text-slate-400">{currentFile && `Processing: ${currentFile}`}</p>
            </div>
          )}

          {/* Summary chips */}
          {results.length > 0 && !running && (
            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#D1FAE5', color: '#065F46' }}>
                ✓ {successCount} succeeded
              </span>
              {errorCount > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#FEE2E2', color: '#991B1B' }}>
                  ✗ {errorCount} failed
                </span>
              )}
            </div>
          )}

          {/* File rows */}
          <div className="space-y-2">
            {files.map((f, idx) => {
              const res = results.find((r) => r.filename === f.name);
              const isExpanded = expanded === idx;

              return (
                <div key={f.name} className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid #F1F5F9' }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {!res && !running && (
                        <div className="w-5 h-5 rounded-full" style={{ background: '#E5E7EB' }} />
                      )}
                      {!res && running && currentFile === f.name && (
                        <Loader2 size={18} className="animate-spin" style={{ color: '#6366F1' }} />
                      )}
                      {res?.status === 'ok' && <CheckCircle2 size={18} style={{ color: '#10B981' }} />}
                      {res?.status === 'error' && <XCircle size={18} style={{ color: '#EF4444' }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                      {res?.status === 'ok' && res.result && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {res.result.document_type ?? 'Document'} · {PRIORITY_ICON[res.result.priority ?? 'Medium']} {res.result.priority}
                        </p>
                      )}
                      {res?.status === 'error' && (
                        <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>{res.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {res?.status === 'ok' && (
                        <button onClick={() => setExpanded(isExpanded ? null : idx)}
                          className="text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-slate-50"
                          style={{ color: '#6366F1' }}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                      {!running && (
                        <button onClick={() => removeFile(f.name)}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors px-1">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded result summary */}
                  {isExpanded && res?.result && (
                    <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: '#F1F5F9' }}>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mb-3 ${PRIORITY_BG[res.result.priority ?? 'Medium']}`}>
                        {PRIORITY_ICON[res.result.priority ?? 'Medium']} {res.result.priority} Priority
                      </div>
                      {res.result.summary && (
                        <p className="text-sm text-slate-600 leading-relaxed pl-3"
                          style={{ borderLeft: '3px solid #6366F1' }}>
                          {res.result.summary.slice(0, 240)}{res.result.summary.length > 240 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <div className="bg-white rounded-2xl p-14 text-center"
          style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)' }}>
            <Upload size={28} style={{ color: '#A5B4FC' }} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Drop files to process in bulk</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Select multiple files — Claude extracts structured data from each one.
          </p>
        </div>
      )}
    </div>
  );
}
