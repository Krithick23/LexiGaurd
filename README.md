# LexiGuard — AI Contract Risk Analyzer for Freelancers

> **"Understand your contract before you sign."**  
> An educational first-pass contract intelligence platform designed for Indian freelancers, employees, interns, and startup founders to spot predatory clauses, understand legal risks in plain English, and receive actionable negotiation counter-proposals.

---

## 🛡️ Table of Contents
1. [Key Features](#-key-features)
2. [Target Risks Identified](#-target-risks-identified)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Pipeline](#-architecture--pipeline)
5. [Project Structure](#-project-structure)
6. [Getting Started Locally](#-getting-started-locally)
7. [Environment Variables](#-environment-variables)
8. [Testing & Quality Assurance](#-testing--quality-assurance)
9. [Deployment Guide](#-deployment-guide)
10. [Legal Disclaimer & Security](#-legal-disclaimer--security)

---

## ✨ Key Features

- **Public Landing Page (`/`)**: Hero explanation, how it works in 4 steps, live risk preview, privacy policy, and prominent legal disclaimer.
- **Role-Tailored Risk Benchmarks**: Custom risk perspectives for **Freelancers**, **Employees**, and **Founders** (e.g., Section 27 Indian Contract Act 1872 restraint of trade, Indian Copyright Act 1957 moral rights, liability caps, and Net-15/30 payment standards).
- **Secure File Upload (`/upload`)**: Drag-and-drop support for **PDF**, **DOCX**, and **TXT** agreements up to 10 MB. Validates file magic bytes signatures. Includes 1-click pre-loaded sample agreements (Toxic & Negotiated Fair).
- **In-Memory Text Extraction**: Zero binary persistence on disk or MongoDB. Raw documents are parsed in memory and cleared immediately.
- **Contract Review Workspace (`/analysis/:id`)**:
  - Plain-language executive summary.
  - Overall risk badge (High, Medium, Low).
  - Prioritized Critical Red Flags alert box.
  - Keyword search across clause text, categories, reasons, and suggestions.
  - Filter by risk level and sort by original contract order or risk severity.
  - Expandable clause cards displaying original verbatim text, plain-English reasons, actionable negotiation suggestions, and safer alternative wording.
  - Downloadable PDF reports (via `html2pdf.js` with print fallback).
- **Contract Version Comparison (`/compare`)**: Side-by-side clause diffing with semantic Jaccard similarity, tracking resolved risks, persistent risks, and newly introduced clauses.
- **Contract History (`/history`)**: Paginated listing with search by filename/label, risk filters, and secure deletion with confirmation dialogs.
- **User Dashboard (`/dashboard`)**: Aggregated metrics (total analyzed, high/medium/low risk clauses count), Recharts risk distribution donut chart, and recent contract activity.
- **Profile & Privacy Settings (`/settings`)**: Update full name, review perspective, change password with verification, and cascade delete account and contracts.

---

## 🎯 Target Risks Identified

| Risk Category | What LexiGuard Detects | Indian Legal & Commercial Benchmark |
| :--- | :--- | :--- |
| **Non-Compete & Exclusivity** | Post-termination non-competes (e.g. 12–36 months), industry-wide bans | Post-termination non-competes in employment/contracting are void under **Section 27, Indian Contract Act, 1872**. |
| **Intellectual Property** | IP transfer before payment, grabbing pre-existing code/side projects, moral rights waivers | Carves out background tools; assignment conditional on full payment (**Indian Copyright Act, 1957**). |
| **Payment Terms** | Net-60/90+ days, subjective "satisfaction" withholding, arbitrary fee forfeitures | Recommends Net-15 or Net-30 days with objective milestone acceptance criteria. |
| **Indemnity & Liability** | Uncapped contractor liability, lopsided liability caps (e.g. INR 1,000 for client, unlimited for contractor) | Proposes mutual indemnification with liability capped to fees paid in preceding 6 months. |
| **Termination & Penalties** | Client exits with 0 notice while contractor must give 90 days or pay liquidated damages | Mutual 14–30 days notice with payment for work completed. |
| **Foreign Jurisdiction** | Specifying Delaware or London courts for an Indian freelancer | Domestic Indian jurisdiction or virtual SIAC/domestic arbitration. |
| **Scope Creep** | Unilateral deliverable alterations without additional compensation | Formal Change Order protocol with fee and schedule adjustments. |

---

## 💻 Technology Stack

### Frontend
- **React.js 18** with **Vite**
- **Tailwind CSS v3** (Custom LegalTech design system: slate/navy neutrals, indigo accents, amber/red risk alerts)
- **React Router DOM v6** (Protected and public route guards)
- **Axios** (Credentialed requests with HttpOnly cookies & Bearer fallback)
- **Lucide React** (Modern iconography)
- **Recharts** (Interactive dashboard risk breakdown charts)
- **html2pdf.js** (Client-side PDF report generation)

### Backend
- **Node.js** (ES Modules: `"type": "module"`)
- **Express.js** (REST API)
- **MongoDB & Mongoose** (Persistent document storage with compound indexes)
- **JWT & bcryptjs** (Secure authentication, 12-round password hashing)
- **Cookie-Parser** (Secure HttpOnly, SameSite session cookies)
- **Multer** (Memory storage upload limiter)
- **PDF-Parse & Mammoth** (PDF and DOCX text extraction with magic-bytes validation)
- **Google Gemini API** (`@google/genai` & `@google/generative-ai` with prompt-injection defense)
- **LexiGuard Heuristics Engine** (`fallbackAnalysis.js` with deterministic legal risk rules)
- **Zod** (Schema validation for AI outputs and incoming requests)
- **Helmet, CORS, Express-Rate-Limit, Morgan** (Production security & logging)

### Development & Testing
- **Vitest** (Unit tests for segmentation, legal heuristics, and diff algorithms)
- **Supertest** (API integration tests for authentication and contract flows)
- **MongoDB Memory Server** (Seamless out-of-the-box local development and testing)

---

## 🏗️ Architecture & Pipeline

```
[Contract Upload (PDF/DOCX/TXT)]
              │
              ▼
   [File Signature & Size Check]
              │
              ▼
   [In-Memory Text Extraction]
              │
              ▼
    [Sanitization & Normalization]
              │
              ▼
    [Clause Segmentation] ───────► (Numbered headers / Roman numerals / Paragraphs)
              │
              ▼
     [Risk Analysis Engine] ─────► (Google Gemini API with Prompt Injection Preamble
              │                   OR Deterministic LegalTech Fallback Heuristics)
              ▼
   [Negotiation Generator] ──────► (Diplomatic counter-proposals & balanced safer clauses)
              │
              ▼
   [Strict Zod Output Validation]
              │
              ▼
    [Mongoose Persistence] ──────► (Overall Risk, Clause Breakdown, Red Flags)
              │
              ▼
  [Interactive UI & PDF Export]
```

---

## 📁 Project Structure

```
lexiguard/
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js           # Credentialed Axios instance
│   │   │   ├── authApi.js         # Auth endpoints
│   │   │   └── contractApi.js     # Contract analysis & stats endpoints
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Responsive navigation & user menu
│   │   │   ├── Footer.jsx         # Brand links & legal disclaimer
│   │   │   ├── ProtectedRoute.jsx # Route authentication guard
│   │   │   ├── RiskBadge.jsx      # Low / Medium / High risk pill
│   │   │   ├── ClauseCard.jsx     # Expandable clause with counter & alternative
│   │   │   ├── RedFlagSummary.jsx # Critical risks alert box
│   │   │   ├── RoleSelector.jsx   # Freelancer / Employee / Founder perspective
│   │   │   ├── FileUploader.jsx   # Drag-and-drop with size & type validation
│   │   │   ├── LoadingState.jsx   # Spinner with contextual message
│   │   │   ├── EmptyState.jsx     # Zero-data guidance cards
│   │   │   ├── ErrorMessage.jsx   # Actionable error banners with retry
│   │   │   ├── ConfirmDialog.jsx  # Deletion confirmation modal
│   │   │   └── LegalDisclaimer.jsx# Compliance transparency notices
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # User session state provider
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Public product showcase
│   │   │   ├── Register.jsx       # Account creation with validation
│   │   │   ├── Login.jsx          # Login + 1-click demo access
│   │   │   ├── Dashboard.jsx      # Metrics, Recharts donut, recent contracts
│   │   │   ├── Upload.jsx         # File upload, privacy toggle, sample agreements
│   │   │   ├── Analysis.jsx       # Review workspace with search, filter, PDF export
│   │   │   ├── History.jsx        # Paginated contract history & deletion
│   │   │   ├── Compare.jsx        # Side-by-side clause version comparison
│   │   │   ├── Settings.jsx       # Profile edit, password change, account purge
│   │   │   └── NotFound.jsx       # 404 handler
│   │   ├── App.jsx                # Route declarations
│   │   ├── main.jsx               # React DOM root
│   │   └── index.css              # Tailwind directives & print styling
│   ├── index.html                 # SEO title & meta description
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas connection with dev in-memory fallback
│   ├── controllers/
│   │   ├── authController.js      # Register, login, session inspection, logout
│   │   ├── contractController.js  # Upload, analyze, history, stats, demo loader
│   │   └── userController.js      # Profile, password, cascade account deletion
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT cookie & header verification
│   │   ├── errorMiddleware.js     # Centralized error handler
│   │   ├── uploadMiddleware.js    # Multer memory storage & magic bytes checker
│   │   └── validateRequest.js     # Zod schema validation
│   ├── models/
│   │   ├── User.js                # User schema with bcrypt password hashing
│   │   └── Contract.js            # Contract schema with structured clauses & indexes
│   ├── prompts/
│   │   └── geminiPrompts.js       # Segment, Risk, and Negotiate prompts with safety preamble
│   ├── routes/
│   │   ├── auth.js                # /api/auth routes
│   │   ├── contract.js            # /api/contracts routes
│   │   └── user.js                # /api/user routes
│   ├── services/
│   │   ├── extractText.js         # PDF (pdf-parse) and DOCX (mammoth) extraction
│   │   ├── geminiService.js       # Google GenAI SDK with retry & exponential backoff
│   │   ├── segmentClauses.js      # Deterministic section & paragraph segmenter
│   │   ├── scoreRisk.js           # Multi-stage analysis orchestration
│   │   ├── negotiate.js           # Negotiation advice generator
│   │   ├── compareContracts.js    # Semantic Jaccard clause diffing
│   │   └── fallbackAnalysis.js    # High-precision deterministic legal heuristics
│   ├── utils/
│   │   ├── asyncHandler.js        # Express async wrapper
│   │   ├── sanitize.js            # Text normalizer & secret redaction
│   │   └── validateAIOutput.js    # Safe JSON parse, Zod schemas, clause reconciliation
│   ├── tests/
│   │   ├── auth.test.js           # Supertest integration tests
│   │   └── contract.test.js       # Vitest unit tests
│   ├── server.js                  # Express entry point
│   └── package.json
│
├── samples/
│   ├── sample_toxic_freelance_agreement.txt      # Predatory agreement for testing
│   └── sample_negotiated_freelance_agreement.txt # Fair draft for comparison
├── LICENSE                        # MIT License
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js** v18+ or higher
- **npm** v9+ or higher
- *(Optional)* A Google Gemini API Key from Google AI Studio (`GEMINI_API_KEY`). If omitted, LexiGuard runs smoothly on its built-in legal heuristics engine.
- *(Optional)* A MongoDB Atlas connection string. If omitted, LexiGuard automatically launches a local in-memory MongoDB instance for development.

### 1. Clone & Setup
```bash
git clone https://github.com/your-username/lexiguard.git
cd lexiguard
```

### 2. Configure Backend Environment
```bash
cd server
cp .env.example .env
```
Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/lexiguard
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key_optional
MAX_CONTRACTS_PER_USER=100
MAX_UPLOAD_SIZE_MB=10
```

### 3. Install & Start Backend
```bash
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

### 4. Install & Start Frontend
In a new terminal:
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Quality Assurance

Run the automated test suite powered by **Vitest** and **Supertest**:

```bash
cd server
npm test
```

### What the test suites cover:
1. **Clause Segmentation**: Verifies accurate parsing of numbered sections, Roman numerals, and fallback paragraphs without text loss.
2. **Legal Heuristics Engine**: Verifies that 36-month non-competes, Net-90 delayed payment holdbacks, and uncapped liabilities are classified as **High Risk** with Section 27 references.
3. **Contract Comparison**: Verifies that removing or modifying a toxic non-compete clause is flagged as a **Resolved Risk**.
4. **Authentication Integration**: Tests user registration, password strength, duplicate email rejection (HTTP 409), login authentication, and JWT issuance.

---

## 🌐 Deployment Guide

### Deploying the Backend to Render / Railway
1. Push repository to GitHub.
2. Create a new **Web Service** on Render pointing to the `server/` directory.
3. Build command: `npm install`
4. Start command: `node server.js`
5. Configure Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas M0 connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/lexiguard`)
   - `JWT_SECRET`: A long random secret string
   - `CLIENT_URL`: Your production Vercel frontend URL (e.g. `https://lexiguard.vercel.app`)
   - `GEMINI_API_KEY`: Your Google Gemini API Key

### Deploying the Frontend to Vercel
1. Create a new project on Vercel importing the repository.
2. Set Root Directory to `client`.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://lexiguard-api.onrender.com/api`)

---

## ⚖️ Legal Disclaimer & Security

### Legal Notice
**LexiGuard is an automated educational contract analysis tool and negotiation assistant.** It is **NOT** a law firm and does not provide formal legal representation, legal opinions, or guarantees regarding the judicial enforceability of any contractual provision under Indian or international law. Always consult a qualified advocate for high-value or disputed contracts.

### Security Guarantees
- **Zero Binary Persistence**: Uploaded PDFs and DOCX files are processed entirely in memory. Binary files are never written to disk or stored in MongoDB.
- **Prompt Injection Defense**: All system prompts strictly instruct the AI engine to treat user contract text as untrusted, passive data. Embedded override commands are safely ignored.
- **Data Minimization & User Control**: Users can toggle "Privacy Mode" to discard extracted raw text post-analysis, or delete contracts and accounts permanently at any time.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
