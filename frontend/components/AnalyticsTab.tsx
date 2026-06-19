'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import type { ExtractedDocument } from '@/types';
import { PRIORITY_COLOR, PRIORITY_BG, PRIORITY_ICON, normList, safeStr } from '@/lib/utils';

const PIE_COLORS = ['#6366F1', '#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE'];

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
      style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: color }} />
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${color}18` }}>
        {icon}
      </div>
      <div>
        <div className="text-3xl font-extrabold leading-none" style={{ color }}>{value}</div>
        <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs font-semibold shadow-lg"
      style={{ background: '#1E293B', color: '#F1F5F9', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="text-slate-400 mb-1">{label}</div>
      <div style={{ color: '#A5B4FC' }}>{payload[0].value} doc{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
};

interface Props {
  documents: ExtractedDocument[];
  onDeleteDocument: (id: number) => void;
}

export default function AnalyticsTab({ documents, onDeleteDocument }: Props) {
  const [search, setSearch]       = useState('');
  const [filterPrio, setFilter]   = useState<string>('All');
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [deleting, setDeleting]   = useState<number | null>(null);

  // Compute stats client-side from documents prop
  const stats = useMemo(() => {
    const byPriorityMap: Record<string, number> = {};
    const byTypeMap: Record<string, number>     = {};
    const byDayMap: Record<string, number>      = {};

    for (const d of documents) {
      const p = (d.priority as string) || 'Medium';
      byPriorityMap[p] = (byPriorityMap[p] || 0) + 1;

      const t = (d.document_type as string) || 'Other';
      byTypeMap[t] = (byTypeMap[t] || 0) + 1;

      const day = d.processed_at ? d.processed_at.slice(0, 10) : 'unknown';
      byDayMap[day] = (byDayMap[day] || 0) + 1;
    }

    return {
      total: documents.length,
      by_priority: Object.entries(byPriorityMap).map(([priority, cnt]) => ({ priority, cnt })),
      by_type: Object.entries(byTypeMap)
        .map(([document_type, cnt]) => ({ document_type, cnt }))
        .sort((a, b) => b.cnt - a.cnt),
      by_day: Object.entries(byDayMap)
        .map(([day, cnt]) => ({ day, cnt }))
        .sort((a, b) => a.day.localeCompare(b.day)),
    };
  }, [documents]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    onDeleteDocument(id);
    setDeleting(null);
  };

  const filtered = documents.filter((d) => {
    const matchSearch = !search ||
      d.source_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.document_type?.toLowerCase().includes(search.toLowerCase()) ||
      d.summary?.toLowerCase().includes(search.toLowerCase());
    const matchPrio = filterPrio === 'All' || d.priority === filterPrio;
    return matchSearch && matchPrio;
  });

  const priorityData = stats.by_priority;
  const typeData     = stats.by_type.slice(0, 8);
  const dayData      = stats.by_day.slice(-14);

  const highCount = priorityData.find((p) => p.priority === 'High')?.cnt   ?? 0;
  const medCount  = priorityData.find((p) => p.priority === 'Medium')?.cnt ?? 0;
  const lowCount  = priorityData.find((p) => p.priority === 'Low')?.cnt    ?? 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Docs"      value={stats.total} color="#6366F1" icon="📁" />
        <StatCard label="High Priority"   value={highCount}   color="#EF4444" icon="🔴" />
        <StatCard label="Medium Priority" value={medCount}    color="#F59E0B" icon="🟡" />
        <StatCard label="Low Priority"    value={lowCount}    color="#10B981" icon="🟢" />
      </div>

      {/* Charts row */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {/* Daily processing bar chart */}
          <div className="col-span-2 bg-white rounded-2xl p-5"
            style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Documents per day</h3>
            {dayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dayData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EEF2FF' }} />
                  <Bar dataKey="cnt" name="Documents" radius={[6, 6, 0, 0]}>
                    {dayData.map((_, i) => (
                      <Cell key={i} fill={i === dayData.length - 1 ? '#6366F1' : '#C7D2FE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No timeline data yet</div>
            )}
          </div>

          {/* Doc types donut */}
          <div className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Document types</h3>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={typeData.map((t) => ({ name: t.document_type, value: t.cnt }))}
                    dataKey="value" cx="50%" cy="45%" outerRadius={64} innerRadius={36} paddingAngle={3}>
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconSize={8} iconType="circle"
                    formatter={(v) => <span style={{ fontSize: 10, color: '#64748B' }}>{v}</span>} />
                  <Tooltip formatter={(v: any) => [`${v} doc${v !== 1 ? 's' : ''}`, '']}
                    contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No type data yet</div>
            )}
          </div>
        </div>
      )}

      {/* History list */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#F8FAFF', border: '1px solid #E5E7EB', color: '#1E293B' }}
            />
          </div>
          <div className="flex gap-1.5">
            {(['All', 'High', 'Medium', 'Low'] as const).map((p) => (
              <button key={p} onClick={() => setFilter(p)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={filterPrio === p
                  ? { background: '#6366F1', color: '#fff' }
                  : { background: '#F1F5F9', color: '#64748B' }}>
                {p === 'All' ? 'All' : `${PRIORITY_ICON[p]} ${p}`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {documents.length === 0
              ? 'No documents processed yet. Upload one to get started.'
              : 'No documents match your filter.'}
          </div>
        ) : (
          <div>
            {filtered.map((doc, idx) => {
              const isExpanded = expanded === idx;
              const actions = normList(doc.action_items);
              const tags    = normList(doc.tags);
              return (
                <div key={doc.id ?? idx} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F8FAFF' : undefined }}>
                  <div className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : idx)}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: PRIORITY_COLOR[doc.priority ?? 'Medium'] }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {doc.source_name ?? 'Untitled'}
                        </p>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                          style={{ background: '#EEF2FF', color: '#4338CA' }}>
                          {doc.document_type ?? '—'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {doc.processed_at ? new Date(doc.processed_at).toLocaleString() : '—'}
                        {doc.from_party && ` · ${safeStr(doc.from_party)}`}
                        {doc.total_amount && ` · ${safeStr(doc.total_amount)}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PRIORITY_BG[doc.priority ?? 'Medium']}`}>
                        {PRIORITY_ICON[doc.priority ?? 'Medium']} {doc.priority}
                      </span>
                      {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (doc.id !== undefined) handleDelete(doc.id); }}
                        disabled={deleting === doc.id}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-40">
                        <Trash2 size={13} className={deleting === doc.id ? 'text-red-300 animate-pulse' : 'text-slate-300 hover:text-red-400'} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid #F1F5F9', background: '#FAFBFF' }}>
                      {doc.summary && (
                        <div className="pt-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Summary</p>
                          <p className="text-sm text-slate-700 leading-relaxed pl-3"
                            style={{ borderLeft: '3px solid #6366F1' }}>
                            {safeStr(doc.summary)}
                          </p>
                        </div>
                      )}
                      {actions.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Action Items</p>
                          <div className="space-y-1.5">
                            {actions.map((a, i) => (
                              <div key={i} className="text-sm text-slate-700 pl-3 py-1.5 rounded-r-lg"
                                style={{ borderLeft: '3px solid #A5B4FC', background: '#F5F3FF' }}>
                                <span className="font-semibold text-indigo-400 mr-2">{i + 1}.</span>{a}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tags.map((t) => (
                            <span key={t} className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
