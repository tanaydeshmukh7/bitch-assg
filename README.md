# Assignment Studio — AI Academic Assignment Generator

**Assignment Studio** is a full-stack academic productivity platform that transforms raw source materials (code screenshots, program outputs, handwritten or printed notes, lecture PDFs, and Word documents) into structured, publication-ready college assignments with university cover sheets, rich-text editing, live A4 multi-page previews, and native PDF/DOCX exports.

---

## 🌟 Key Features

1. **Multi-Format Raw Uploads**:
   - Terminal & code screenshots (.png, .jpg, .webp)
   - Handwritten and printed lecture notes (powered by **Tesseract OCR**)
   - PDF course materials & lecture slides (parsed with **PyMuPDF**)
   - Word documents (.docx) & source code (.py, .java, .cpp, .c, .js, .ts, etc.)
   - File validation with strict size limits (25MB), safe sanitized paths, and sandboxing.

2. **AI Assignment Organization**:
   - Powered by **Qwen3-32B** via Hugging Face Inference API / compatible endpoints.
   - Preserves factual accuracy, actual code variables, and execution outputs without fabricating test results or references.
   - Synthesizes academic sections (Aim, Objectives, Theory, System Requirements, Algorithm, Source Code, Output Verification, Results, Conclusion, References, and Viva Questions).
   - Flags missing information and gaps automatically.
   - Resilient fallback engine ensures you can test and use the application even before configuring API keys.

3. **Rich-Text Document Editor**:
   - Built on **Tiptap**.
   - Headings (H1, H2, H3), bold, italic, underline, alignments, bullet/numbered lists.
   - Shaded monospace code blocks, formatted tables, and image insertions.
   - Instant autosave with live status indicator ("Autosaving...", "Saved at 10:45 PM", "Unsaved changes").

4. **Realistic A4 Multi-Page Preview**:
   - True A4 page aspect ratio and standard 1-inch margins.
   - Automated university cover page (College, Department, Assignment Title, Course, Student Name, Roll No., Instructor Name, and Date).
   - Running headers and dynamic page numbers.

5. **Dual Canonical Exports**:
   - **Vector PDF (A4)**: Generated with ReportLab with crisp typography, styled code callouts, bordered tables, and cover sheet.
   - **Editable Word (.docx)**: Generated with python-docx using native Word styles, tables, and headers.
   - Both exports are derived from the exact same validated canonical document model.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Tiptap, React Router, Lucide Icons |
| **Backend** | Python 3.13+, FastAPI, Pydantic v2, PyMuPDF, python-docx, ReportLab, Pytesseract |
| **Database & Auth** | Supabase PostgreSQL, Supabase Auth (JWT), Row Level Security (RLS) |
| **Storage** | Supabase Storage (`assignment-studio-assets`, `assignment-studio-exports`) + local isolated fallback |
| **AI Inference** | Qwen 2.5/3 32B via Hugging Face Inference API / Router |

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (v3.11 - v3.13)
- *(Optional)* **Tesseract OCR** (for image OCR text extraction):
  - Windows: Download installer from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki) or install via `winget install UB-Mannheim.TesseractOCR`
  - Linux: `sudo apt-get install tesseract-ocr`
  - macOS: `brew install tesseract`

---

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
# Supabase Configuration (from Supabase Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SECRET_KEY=your-supabase-service-role-key

# Hugging Face AI Configuration (from https://huggingface.co/settings/tokens)
HF_TOKEN=hf_your_token_here
HF_MODEL=Qwen/Qwen2.5-32B-Instruct
HF_BASE_URL=https://api-inference.huggingface.co/models

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

> **Note**: Even if you haven't entered Supabase or Hugging Face credentials yet, Assignment Studio has a built-in offline/demo engine so you can launch and test the full application immediately!

---

### 3. Supabase Database Migration (SQL Editor)

In your Supabase project (`bith assg`):
1. Navigate to the **SQL Editor** tab in your Supabase dashboard.
2. Open `supabase/migrations/20261012000000_initial_schema.sql`.
3. Paste and run the entire SQL script.
4. This script sets up:
   - `profiles`, `projects`, `assets`, `sections`, `processing_jobs`, `exports` tables
   - Foreign keys, cascades, and updated_at triggers
   - **Row Level Security (RLS)** policies ensuring users can only read/modify their own records
   - Storage buckets (`assignment-studio-assets` and `assignment-studio-exports`) with ownership policies.

---

### 4. Running the Backend

From the repository root:

```bash
# Activate virtual environment
# Windows PowerShell:
backend\.venv\Scripts\Activate.ps1
# Or Linux/macOS:
# source backend/.venv/bin/activate

# Install requirements (if not already installed)
pip install -r backend/requirements.txt

# Start FastAPI server
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Backend API will be running at `http://localhost:8000`.
Interactive OpenAPI docs are available at `http://localhost:8000/docs`.

---

### 5. Running the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Supabase email confirmation and SMTP

Email confirmation must remain enabled in **Supabase Dashboard → Authentication → Providers → Email**. Configure the local development URLs in **Authentication → URL Configuration**:

- Site URL: `http://localhost:5173`
- Redirect URL: `http://localhost:5173/auth/callback`
- If other local hosts are used, add their exact callback URL separately (for example `http://127.0.0.1:5173/auth/callback`).

The frontend requests confirmation emails with the exact `${window.location.origin}/auth/callback` value as `emailRedirectTo`. The callback detects one flow at a time: PKCE `code` values are exchanged with `exchangeCodeForSession`, `token_hash` links with `type=email` or `type=signup` use `verifyOtp`, and implicit-flow fragments are consumed by the configured Supabase client. One-time PKCE codes are marked in session storage so the callback does not exchange the same code repeatedly. The callback does not mark users confirmed itself. Expired, invalid, or already-consumed links show a resend form. The application deliberately does not retry rate-limited email requests.

For reliable delivery beyond Supabase's built-in email limits, configure a provider in **Supabase Dashboard → Authentication → Emails / SMTP Settings**. Enter the provider's SMTP host, port, username, password, sender email, and sender name according to that provider's documentation, then save and send a test email. Never put SMTP credentials or `SUPABASE_SECRET_KEY` in frontend variables. The confirmation email template should retain Supabase's confirmation URL variable:

```text
{{ .ConfirmationURL }}
```

For production, set the production Site URL and production callback URL separately; do not use the localhost URL as the production redirect.

---

## 🧪 Running Automated Tests

Run backend integration and security isolation tests:

```bash
backend\.venv\Scripts\pytest.exe backend\tests -v
```

Tests verify:
- Health check and system diagnostics
- Authentication rejection on unauthorized requests
- Project CRUD operations
- **Strict User Isolation**: User Beta is completely blocked from accessing or modifying User Alpha's projects
- Pydantic schema validation for AI assignment proposals
- Heuristic fallback generator when AI API token is absent
- End-to-end binary **PDF** and **DOCX** generation from the shared document model.

---

## 🔒 Security Architecture

- **Token-Based Ownership**: All endpoints verify the caller's identity (`auth.uid()`).
- **Row Level Security (RLS)**: Enforced directly on Supabase PostgreSQL.
- **Secret Isolation**: `HF_TOKEN` and `SUPABASE_SECRET_KEY` are only ever accessed on the backend. Frontend only receives safe publishable tokens.
- **Safe File Storage**: Files are renamed with unique UUIDs and path isolation (`{user_id}/{project_id}/{uuid}_{filename}`). Code files are never executed.
