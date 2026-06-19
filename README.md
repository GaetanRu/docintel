# DocIntel — AI Document Intelligence Platform

> Upload any business document. Get structured, actionable data in seconds.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Claude](https://img.shields.io/badge/Claude-claude--opus--4--5-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)

**[Live Demo](https://YOUR-PROJECT.vercel.app)** — drop in `demo/sample_invoice.pdf` to see it work immediately.

---

## What it does

DocIntel automates business document processing workflows. Drop in a contract, invoice, purchase order, financial report, or scanned image — DocIntel extracts the key information automatically using Anthropic's Claude multimodal API and returns a structured, searchable record.

**What gets extracted from every document:**
- Document type, parties (from / to), key dates, payment terms
- Financial amounts and line-item details
- Priority level (High / Medium / Low)
- Action items and deadlines
- Tags and plain-English summary

No manual data entry. No copy-pasting. The entire workflow runs in a browser with a single `npm run dev`.

---

## Features

| Feature | Description |
|---|---|
| **Single Document** | Drag-drop or paste text — get a full structured report instantly |
| **Batch Processing** | Upload many files at once with per-file live progress tracking |
| **Vision AI** | Images (PNG, JPG, WEBP, etc.) sent directly to Claude's vision API |
| **15+ file formats** | PDF, Word, Excel, CSV, JSON, HTML, email (.eml), images |
| **Analytics Dashboard** | Stat cards, 14-day processing bar chart, document-type donut chart |
| **Document History** | Searchable, filterable history with inline expand and delete |
| **Excel Export** | One-click `.xlsx` export of all extracted data |
| **JSON Export** | Full structured JSON download per document |
| **Secure by design** | API key lives server-side only — never reaches the browser |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| AI | Anthropic Claude claude-opus-4-5 via `@anthropic-ai/sdk` |
| File Parsing | `pdf-parse`, `mammoth` (DOCX), `xlsx` (Excel), native UTF-8 |
| Storage | JSON file persistence — zero database setup |
| Deployment | Vercel (free tier) |

**No separate backend.** All API logic runs in Next.js API routes (Node.js runtime) — one command starts everything.

---

## Getting Started

### Prerequisites
- Node.js 18+
- An Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/docintel.git
cd docintel/frontend
npm install
```

### 2. Add your API key

Create `frontend/.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run

```bash
npm run dev
```

Open **http://localhost:3000** — that's it.

### Try it immediately

A sample invoice is included at `demo/sample_invoice.pdf`. Drop it into the app to see extraction in action — no setup needed beyond your API key.

---

## Project Structure

```
docintel-web/
├── demo/
│   └── sample_invoice.pdf        # Sample document for testing
├── frontend/
│   ├── app/
│   │   ├── api/                  # Next.js API routes (the full backend)
│   │   │   ├── health/           # API key status check
│   │   │   ├── extract/          # File upload + Claude extraction + save
│   │   │   ├── documents/        # GET all docs / DELETE by id
│   │   │   ├── stats/            # Analytics aggregation
│   │   │   └── export/excel/     # Excel export endpoint
│   │   ├── page.tsx              # Root — tab shell (Single / Batch / Analytics)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ProcessTab.tsx        # Single document tab
│   │   ├── BatchTab.tsx          # Batch upload with live progress
│   │   ├── AnalyticsTab.tsx      # Analytics dashboard + history
│   │   ├── DocumentReport.tsx    # Full extraction report component
│   │   └── Sidebar.tsx           # Dark sidebar with branding
│   └── lib/
│       ├── extractor.ts          # Claude API calls (text + vision)
│       ├── fileParser.ts         # Multi-format file parsing pipeline
│       ├── db.ts                 # JSON persistence layer
│       ├── api.ts                # Client-side API helpers
│       └── utils.ts              # Type-safe rendering utilities (safeStr)
```

---

## Architecture

```
Browser
  │
  ├── /api/health        → checks ANTHROPIC_API_KEY is configured
  ├── /api/extract       → parses file → calls Claude → saves → returns doc
  ├── /api/documents     → reads all / deletes by id from documents.json
  ├── /api/stats         → aggregates by priority, type, and day
  └── /api/export/excel  → builds .xlsx from documents array
```

Claude runs in two modes:
- **Text documents** (PDF, DOCX, XLSX, CSV, etc.) → content extracted and sent as a text prompt
- **Images** (PNG, JPG, WEBP, etc.) → base64-encoded and sent as a multimodal content block

All extraction runs server-side — the API key never touches the client.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Set **Root Directory** to `frontend`
4. Add environment variable: `ANTHROPIC_API_KEY` → your key
5. Click Deploy

Your API key is stored in Vercel's encrypted environment variables — it never leaves the server.

---

## Security

- `ANTHROPIC_API_KEY` loaded from `.env.local` (local) or Vercel env vars (production)
- The `/api/health` endpoint returns `{ api_key_configured: true/false }` — never the key itself
- A red banner surfaces in the UI if the key is missing or the backend is unreachable
- `.env.local` and `frontend/data/` are gitignored — safe to push

---

## License

MIT — free to use, fork, and build on.

---

*Built by [Gaetan Rutayisire](https://www.linkedin.com/in/YOUR_LINKEDIN) · Powered by Anthropic Claude · 2025*
