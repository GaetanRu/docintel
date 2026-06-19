import Anthropic from '@anthropic-ai/sdk';
import type { FileResult } from './fileParser';

const EXTRACTION_PROMPT = `You are an expert business document analyst. Extract all key information from the document below and return it as structured JSON.

Automatically detect the document type and extract everything relevant. Always include these core fields regardless of document type:
- document_type: (e.g. "Invoice", "Vendor Quote", "Purchase Order", "Contract", "Report", "Email", "Spreadsheet", "Proposal", "Receipt", "Form", "Image", "Other")
- from_party: person or company sending/issuing the document
- to_party: person or company receiving the document
- date: primary date on the document (ISO format YYYY-MM-DD if possible)
- due_date: payment or response deadline if present
- total_amount: total monetary value if present (include currency symbol)
- reference_number: invoice #, PO #, quote #, contract # etc.
- summary: 2-3 sentence plain-English summary of what this document is and what it requires
- action_items: list of specific actions the recipient needs to take (as an array of strings)
- priority: "High", "Medium", or "Low" based on urgency/deadline
- key_dates: array of all important dates mentioned with labels
- key_parties: array of all companies/people mentioned with their roles
- financial_details: object with any monetary figures found (line items, taxes, totals, etc.)
- key_terms: array of important terms, conditions, or clauses
- tags: array of 3-5 keywords describing the document content

Return ONLY valid JSON with no extra text, no markdown fences. If a field is not present, use null.

DOCUMENT:
{document_text}`;

const IMAGE_PROMPT = `You are an expert business document analyst. The image shows a business document.

Extract all key information and return it as structured JSON with these fields:
- document_type, from_party, to_party, date, due_date, total_amount, reference_number
- summary: 2-3 sentence plain-English summary
- action_items: array of actions required
- priority: "High", "Medium", or "Low"
- key_dates, key_parties, financial_details, key_terms
- tags: array of 3-5 keywords

Return ONLY valid JSON. If a field is not visible or present, use null.`;

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

  if (fileResult.kind === 'image') {
    const imageBuffer = fileResult.content as Buffer;
    const base64 = imageBuffer.toString('base64');

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
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
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: EXTRACTION_PROMPT.replace('{document_text}', text),
    }],
  });

  const result = cleanJson(response.content[0].type === 'text' ? response.content[0].text : '');
  if (wasTruncated) result._truncated = true;
  return result;
}
