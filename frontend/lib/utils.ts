import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeStr(val: unknown, fallback = '—'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val || fallback;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map((v) => safeStr(v, '')).filter(Boolean).join(', ') || fallback;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    // Format party-like objects: {name, role} → "Name (Role)"
    if (obj.name && obj.role) return `${obj.name} (${obj.role})`;
    if (obj.name) return String(obj.name);
    if (obj.label && obj.date) return `${obj.label}: ${obj.date}`;
    if (obj.invoice && obj.amount) return `${obj.invoice}: ${obj.amount}`;
    // Generic: join string values
    const vals = Object.values(obj).filter((v) => typeof v === 'string' || typeof v === 'number');
    return vals.join(' · ') || JSON.stringify(obj);
  }
  return String(val);
}

function itemToString(item: unknown): string {
  return safeStr(item, '');
}

export function normList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(itemToString).filter(Boolean);
  if (typeof val === 'string') return val.split('|').map((s) => s.trim()).filter(Boolean);
  if (typeof val === 'object') return [safeStr(val, '')].filter(Boolean);
  return [];
}

export const PRIORITY_COLOR: Record<string, string> = {
  High:   '#EF4444',
  Medium: '#F59E0B',
  Low:    '#10B981',
};

export const PRIORITY_BG: Record<string, string> = {
  High:   'bg-red-50 text-red-800 border-red-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  Low:    'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export const PRIORITY_ICON: Record<string, string> = {
  High: '🔴', Medium: '🟡', Low: '🟢',
};
