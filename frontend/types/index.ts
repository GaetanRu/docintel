export interface ExtractedDocument {
  id?: number;
  source_name?: string;
  processed_at?: string;
  document_type?: string;
  priority?: 'High' | 'Medium' | 'Low';
  reference_number?: string;
  from_party?: string;
  to_party?: string;
  date?: string;
  total_amount?: string;
  due_date?: string;
  summary?: string;
  action_items?: string | string[];
  key_parties?: string | string[];
  financial_details?: Record<string, string> | string;
  key_terms?: string | string[];
  tags?: string;
  _truncated?: boolean;
}

export interface BatchResult {
  status: 'ok' | 'error';
  filename: string;
  result?: ExtractedDocument;
  error?: string;
}

export interface Stats {
  total: number;
  by_priority: Array<{ priority: string; cnt: number }>;
  by_type: Array<{ document_type: string; cnt: number }>;
  by_day: Array<{ day: string; cnt: number }>;
}
