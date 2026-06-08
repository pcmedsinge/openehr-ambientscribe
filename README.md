# AmbientScribe

![Status](https://img.shields.io/badge/status-complete-brightgreen) ![Phase](https://img.shields.io/badge/phase-4%20of%204-blue) ![Stack](https://img.shields.io/badge/stack-React%20%7C%20EHRbase%20%7C%20GPT--4o-informational)

> Paste a free-text clinical note → AI extracts structured data → openEHR form auto-populates → practitioner confirms and submits.

AmbientScribe is a clinical documentation tool that bridges unstructured dictation and structured openEHR records. A practitioner pastes or types a free-text note; GPT-4o extracts the clinical fields; the encounter form pre-fills for review; the practitioner confirms and the encounter is stored as a versioned openEHR composition in EHRbase.

---

## What it does

1. **Patient Worklist** — active patient list with overdue follow-up flags (>12 weeks since last visit)
2. **Patient Detail** — demographics and full encounter history
3. **New Encounter Wizard** — 4-step form covering Reason for Visit / Clinical History / Examination / Diagnosis + Management Plan
4. **AI Extraction** — paste a clinical note, GPT-4o pre-fills all wizard fields; every field stays editable
5. **View & Amend** — read-only encounter view with full versioned amendment (ETag-based, history preserved)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS |
| AI | OpenAI GPT-4o (`json_object` mode, single-call, no streaming) |
| Clinical data store | EHRbase 0.30 (openEHR CDR) |
| Database | PostgreSQL |
| Service layer | Custom `EHRbaseService.ts` typed class |

---

## openEHR Template

**Template ID:** `outpatient_encounter`

| Archetype | Purpose |
|-----------|---------|
| `openEHR-EHR-COMPOSITION.report.v1` | Outer composition shell |
| `openEHR-EHR-EVALUATION.reason_for_encounter.v1` | Presenting condition |
| `openEHR-EHR-OBSERVATION.story.v1` | Clinical history |
| `openEHR-EHR-OBSERVATION.exam.v1` | Examination findings |
| `openEHR-EHR-EVALUATION.problem_diagnosis.v1` | Diagnosis + ICD-11 code |
| `openEHR-EHR-EVALUATION.clinical_synopsis.v1` | Management plan |

---

## Infrastructure

| Service | Port |
|---------|------|
| EHRbase | 8086 |
| PostgreSQL | 5436 |
| Frontend (dev) | 5173 |

---

## Build Phases

| Phase | Goal | Status |
|-------|------|--------|
| 1 — Infrastructure & Data | EHRbase + template + 20-patient seed | ✅ Complete |
| 2 — Core UI Shell | Patient worklist + detail screens (read-only) | ✅ Complete |
| 3 — Encounter Authoring | 4-step wizard, manual FLAT submit | ✅ Complete |
| 4 — AI + Versioning | GPT-4o extraction + ETag-based amend | ✅ Complete |

---

## Quick Start

> **Prerequisites:** Docker Desktop running, Node.js 20+, an OpenAI API key.

### 1. Add your OpenAI key

Create `frontend/.env.local` (never committed — already in `.gitignore`):

```
VITE_OPENAI_API_KEY=sk-...
```

### 2. Start everything

```powershell
.\dev-start.ps1
```

This script:
- Checks Docker is running
- Starts EHRbase + PostgreSQL if not already up
- Waits for EHRbase to be healthy
- Uploads the `outpatient_encounter` template if missing
- Checks that `frontend/.env.local` exists with a real API key
- Installs frontend `node_modules` if missing
- Opens the Vite dev server in a new terminal

Then open **http://localhost:5173**

### 3. Stop

```powershell
.\dev-stop.ps1          # stops dev server, leaves Docker running
.\dev-stop.ps1 -Docker  # stops dev server AND Docker containers
```

### Re-seeding from scratch

If you've run `docker compose down -v` and need to re-seed the 20 demo patients:

```powershell
cd scripts
npm run upload-template
npm run seed
```

---

## Key Concepts

- openEHR FLAT API — composition POST and PUT
- AQL — patient worklist queries and encounter bind-back
- Composition versioning — ETag + `If-Match` header for safe amendments
- AI-assisted data entry — structured field extraction from free-text notes
- Typed service layer over a live REST CDR

---

## Documents

- [`docs/flat-paths.md`](./docs/flat-paths.md) — full FLAT path reference, AQL paths, and EHRbase gotchas
- [`CONCEPT.md`](./CONCEPT.md) — design rationale, architecture, and openEHR patterns
- [`PLAN.md`](./PLAN.md) — phased task list, checkpoints, and risk register
