'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ExtractedDocument } from '@/types';
import DocumentReport from './DocumentReport';

export default function ProcessTab() {
  const [mode, setMode]           = useState<'file' | 'text'>('file');
  const [file, setFile]           = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<ExtractedDocument | null>(null);
  const [error, setError]         = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = '.pdf,.txt,.md,.csv,.xlsx,.xls,.docx,.json,.html,.eml,.png,.jpg,.jpeg,.gif,.webp,.bmp,.tif';

  const handleFile = (f: File) => { setFile(f); setResult(null); setError(''); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const canExtract = mode === 'file' ? !!file : pasteText.trim().length > 0;

  const handleExtract = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      let extractedResult: ExtractedDocument;
      if (mode === 'file' && file) {
        extractedResult = await api.extract(file);
      } else {
        // For paste-text: create a temporary .txt file
        const blob = new Blob([pasteText], { type: 'text/plain' });
        const txtFile = new File([blob], 'pasted_text.txt', { type: 'text/plain' });
        extractedResult = await api.extract(txtFile);
      }
      setResult(extractedResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Input card */}
      <div className="bg-white rounded-2xl p-5"
        style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05),0 4px 12px rgba(0,0,0,0.03)' }}>

        {/* Mode toggle */}
        <div className="inline-flex p-1 rounded-xl mb-4"
          style={{ background: '#EAECF0', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
          {(['file', 'text'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={mode === m
                ? { background: '#fff', color: '#4F46E5', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                : { color: '#64748B' }}>
              {m === 'file' ? '📎 Upload File' : '📝 Paste Text'}
            </button>
          ))}
        </div>

        {/* File upload zone */}
        {mode === 'file' && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="relative cursor-pointer rounded-2xl p-8 transition-all text-center"
            style={{
              border: `2px dashed ${dragging ? '#6366F1' : '#C7D2FE'}`,
              background: dragging ? '#EEF2FF' : 'linear-gradient(135deg,#F5F3FF,#EEF2FF)',
              boxShadow: dragging ? '0 0 0 4px rgba(99,102,241,0.10)' : undefined,
            }}>
            <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)' }}>
              <Upload size={24} style={{ color: '#6366F1' }} />
            </div>
            {file ? (
              <div>
                <p className="font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-700">Drop file here or <span style={{ color: '#6366F1' }}>browse</span></p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, CSV, JSON, HTML, images, email and more</p>
              </div>
            )}
          </div>
        )}

        {/* Paste text area */}
        {mode === 'text' && (
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your document text here…"
            rows={8}
            className="w-full px-4 py-3 rounded-xl text-sm text-slate-800 outline-none resize-y transition-all"
            style={{
              border: '1px solid #E5E7EB',
              background: '#FAFAFA',
              lineHeight: '1.7',
            }}
          />
        )}

        {/* Extract button */}
        <button
          onClick={handleExtract}
          disabled={!canExtract || loading}
          className="mt-4 w-full py-3 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg,#6366F1,#7C3AED)',
            boxShadow: canExtract && !loading ? '0 4px 16px rgba(99,102,241,0.40)' : undefined,
          }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Analysing with Claude…' : '🚀 Extract Document'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <DocumentReport doc={result} sourceName={file?.name ?? 'pasted_text.txt'} />
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="bg-white rounded-2xl p-14 text-center"
          style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)' }}>
            <FileText size={28} style={{ color: '#A5B4FC' }} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Ready to process your document</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Upload a file or paste text above, then click <strong>Extract Document</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
