import Anthropic from '@anthropic-ai/sdk';
import type { FileResult } from './fileParser';

const EXTRACTION_PROMPT = `You are an expert business document analyst. Extract all key information from the document below and return it as structured JSON.

Automatically detect the document type and extract everything relevant. Return these fields:

- document_type: (e.g. "Invoice", "Purchase Order", "Contract", "Report", "Email", "Proposal", "Receipt", "Other")
- document_status: one of "Action Required", "For Review", "Approved", "For Records", "Pending"
- from_party: person or company sending/issuing the document
- to_party: person or company receiving the document
- date: primary date on the document (ISO format YYYY-MM-DD if possible)
- due_date: payment or response deadline if present
- total_amount: total monetary value if present (include currency symbol)
- reference_number: invoice #, PO #, quote #, contract # etc.
- summary: Write a 4–6 sentence professional analysis covering: (1) what this document is and its purpose, (2) who the parties are and their roles, (3) the key financial, legal, or operational details, (4) what actions are required and by when, and (5) the overall risk level and urgency. Be specific — include actual amounts, dates, party names, and reference numbers.
- action_items: array of specific, concrete actions the recipient must take — include deadlines and dollar amounts where relevant
- priority: "High", "Medium", or "Low" based on urgency and deadline proximity
- risk_flags: array of strings describing risks or concerns (e.g. "Payment due in 5 days", "Late fee applies", "Missing signature block", "Unusual liability clause"). Empty array if none.
- key_dates: array of objects with {"label": "...", "date": "..."} for every important date mentioned
- key_parties: array of strings describing each party with their role (e.g. "Acme Supplies Co. — Vendor/Supplier", "Hyper Solutions Inc. — Customer/Bill To")
- financial_details: object with:
    - line_items: array of objects, each with {"description": "...", "quantity": "...", "unit_price": "...", "amount": "..."}. Use empty array if no line items.
    - subtotal: subtotal before tax if present
    - tax_rate: tax rate if present
    - tax_amount: tax amount if present
    - total_due: final total amount due
    - payment_terms: e.g. "NET 30", "Due on Receipt"
    - payment_method: e.g. "Wire Transfer", "Check", "ACH"
    - late_fee: late fee policy if present
    - [any other financial fields found in the document]
- key_terms: array of important contract terms, conditions, or clauses (skip if not applicable)
- tags: array of 4–6 keywords describing the document content

Return ONLY valid JSON with no extra text, no markdown fences. If a field is not present, use null. For arrays, use empty array [] if not applicable.

DOCUMENT:
{document_text}`;

const IMAGE_PROMPT = `You are an expert business document analyst. The image or PDF shows a business document.

Extract all key information and return structured JSON with these exact fields:
- document_type, document_status, from_party, to_party, date, due_date, total_amount, reference_number
- summary: 4–6 sentence professional analysis: what it is, who the parties are, key financial/legal details, required actions and deadlines, overall risk/urgency. Be specific — use actual amounts, dates, names, reference numbers.
- action_items: array of specific concrete actions with deadlines
- priority: "High", "Medium", or "Low"
- risk_flags: array of risk concerns, or []
- key_dates: array of {"label": "...", "date": "..."} objects
- key_parties: array of party descriptions with roles
- financial_details: {"line_items": [{"description":"...","quantity":"...","unit_price":"...","amount":"..."}], "subtotal":"...", "tax_rate":"...", "tax_amount":"...", "total_due":"...", "payment_terms":"...", "payment_method":"...", "late_fee":"..."}
- key_terms: array of important terms/clauses
- tags: array of 4–6 keywords

Return ONLY valid JSON. Use null for missing fields, [] for empty arrays.`;

function cleanJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return { document_type: 'Unknown', summary: raw.slice(0, 300), error: 'Parse failed' };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { document_type: 'Unknown', summary: raw.slice(0, 300), error: 'Parse failed' };
  }
}

export async function extractDocument(fileResult: FileResult): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });

  // PDFs: send directly to Claude as a native document block (no DOM-dependent pdf-parse)
  if (fileResult.kind === 'pdf') {
    const pdfBuffer = fileResult.content as Buffer;
    const base64 = pdfBuffer.toString('base64');

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          } as any,
          { type: 'text', text: IMAGE_PROMPT },
        ],
      }],
    });

    return cleanJson(response.content[0].type === 'text' ? response.content[0].text : '');
  }

  if (fileResult.kind === 'image') {
    const imageBuffer = fileResult.content as Buffer;
    const base64 = imageBuffer.toString('base64');

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: (fileResult.media_type ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          },
          { type: 'text', text: IMAGE_PROMPT },
        ],
      }],
    });

    return cleanJson(response.content[0].type === 'text' ? response.content[0].text : '');
  }

  const text = fileResult.content as string;
  if (!text?.trim()) {
    return { document_type: 'Unknown', summary: 'No readable content found.', priority: 'Low', tags: [], action_items: [] };
  }

  const wasTruncated = text.length >= 180_000;
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: EXTRACTION_PROMPT.replace('{document_text}', text),
    }],
  });

  const result = cleanJson(response.content[0].type === 'text' ? response.content[0].text : '');
  if (wasTruncated) result._truncated = true;
  return result;
}
