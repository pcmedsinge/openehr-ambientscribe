# AmbientScribe — Delivery Plan

**Concept:** Practitioner pastes a free-text clinical note → GPT-4o extracts structured fields → openEHR form auto-populates → practitioner confirms and submits.

**Stack:** React 18 + Vite + TypeScript + Tailwind | EHRbase 8086 | PostgreSQL 5436 | Frontend 5173

---

## Phase Gate Rule
Each phase ends with a **verification checkpoint**. Do NOT start the next phase until the checkpoint passes. This is non-negotiable — skipping checkpoints is how hours get lost to compounding failures.

---

## Phase 1 — Infrastructure & Data
**Goal:** EHRbase running, template uploaded, 20 patients seeded. Queryable from Postman before any UI is written.

### Tasks
- [ ] 1.1 Write `docker-compose.yml` — EHRbase + PostgreSQL (ports 8086 / 5436)
- [ ] 1.2 Verify EHRbase health: `GET http://localhost:8086/ehrbase/rest/openehr/v1/definition/template/adl1.4`
- [ ] 1.3 Build `outpatient_encounter` template in Archetype Designer
  - Archetypes: encounter shell, reason_for_encounter, story, exam, problem_diagnosis, clinical_synopsis
- [ ] 1.4 Upload OPT to EHRbase, verify template appears in template list
- [ ] 1.5 Record actual FLAT paths from a test POST — do NOT trust designer paths
- [ ] 1.6 Write `scripts/seed.ts` — 20 EHRs (AMB-001 to AMB-020), 2–3 encounters each
  - AMB-001 to AMB-005: last encounter >12 weeks ago (for worklist overdue flag)
- [ ] 1.7 Run seed script, verify row counts via AQL

### Checkpoint 1
```
GET /ehr/{ehr_id} returns valid EHR for AMB-001
AQL: SELECT count(c) FROM EHR e CONTAINS COMPOSITION c returns 50+ compositions
AMB-003 last encounter date is > 12 weeks before today
```
**Do not start Phase 2 until all three pass.**

---

## Phase 2 — Core UI Shell (Read-Only)
**Goal:** Patient worklist and detail screens show real data from EHRbase. No AI, no form submission — a working read-only app.

### Tasks
- [ ] 2.1 Scaffold Vite + React + TypeScript + Tailwind project
- [ ] 2.2 Write `src/services/EHRbaseService.ts` — typed class with methods:
  - `getPatients()` — AQL worklist query
  - `getPatientDetail(ehrId)` — AQL detail query
  - `getEncounters(ehrId)` — AQL encounter list
- [ ] 2.3 Patient Worklist screen
  - Table: Patient ID, Name, DOB, last visit date, overdue flag (>12 weeks)
  - AQL must use proven patterns — no multi-archetype joins, no DISTINCT+alias
- [ ] 2.4 Patient Detail screen
  - Header: demographics
  - Encounter history list with date + presenting complaint
  - Click row → View Encounter (read-only display of all archetype fields)
- [ ] 2.5 Routing: `/` → Worklist, `/patient/:ehrId` → Detail, `/encounter/:compositionId` → View

### Checkpoint 2
```
Worklist loads all 20 patients without console errors
AMB-001 through AMB-005 show overdue badge
Clicking AMB-010 → detail screen shows their 2-3 prior encounters
Clicking an encounter → all fields render (no undefined / blank fields)
```
**Do not start Phase 3 until all four pass.**

---

## Phase 3 — Encounter Authoring (Manual)
**Goal:** 4-step encounter wizard submits a valid FLAT composition to EHRbase. AI is NOT involved yet — this phase proves FLAT paths work.

### Tasks
- [ ] 3.1 Add `createEncounter(ehrId, flatData)` to `EHRbaseService.ts`
- [ ] 3.2 Build 4-step wizard component
  - Step 1: Reason for Encounter + History (story)
  - Step 2: Examination Findings
  - Step 3: Diagnosis (free text + ICD-11 code)
  - Step 4: Management Plan (clinical synopsis) + Review & Submit
- [ ] 3.3 Form validation — required fields block progression to next step
- [ ] 3.4 Submit → POST FLAT composition → success toast + redirect to View Encounter
- [ ] 3.5 Verify submitted composition in EHRbase via GET and via AQL bind-back

### Checkpoint 3
```
Complete wizard for AMB-006 → submit → redirects to View Encounter
View Encounter shows all 5 archetype sections populated correctly
GET /composition/{id} in Postman returns the exact values entered
AQL bind-back query returns the new encounter in AMB-006's history
```
**Do not start Phase 4 until all four pass.**

---

## Phase 4 — AI Extraction + Versioning
**Goal:** GPT-4o extracts fields from pasted note and pre-fills the wizard. Amend flow persists version history via ETag.

### Tasks
- [ ] 4.1 Add `extractFromNote(noteText)` to a new `AIService.ts`
  - Model: GPT-4o with `response_format: json_object`
  - System prompt: strict JSON schema matching wizard field names
  - No streaming — single call, await full response
- [ ] 4.2 Add "Paste Clinical Note" step before Step 1 of wizard
  - Textarea → Extract button → spinner → pre-fills all wizard fields
  - Practitioner can edit any field before submitting
- [ ] 4.3 Handle extraction failures gracefully — fallback to blank form, no crash
- [ ] 4.4 Add `amendEncounter(compositionId, ehrId, flatData)` to `EHRbaseService.ts`
  - GET composition to capture ETag
  - PUT with `If-Match: "{etag}"` header
- [ ] 4.5 View Encounter screen: add "Amend" button → re-opens wizard pre-filled
- [ ] 4.6 After amend: verify prior version preserved in EHRbase version history

### Checkpoint 4 (Final Demo Gate)
```
Paste sample note for AMB-015 → all wizard fields pre-filled by GPT-4o
Edit one field manually → submit → View Encounter shows correct values
Amend the encounter → change diagnosis → submit → version history shows 2 versions
GET /composition/{id}?version_at_time=... returns the original version
Worklist still loads, no regressions on Checkpoint 1-3 scenarios
```
**All five passing = Module 5 complete.**

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| EHRbase template upload fails / wrong paths | High | Phase 1 checkpoint forces FLAT path verification before any UI |
| AQL silent empty results | High | Wrap all queries in try/catch + log; test against seeded data |
| GPT-4o extracts wrong field names | Medium | Constrain with strict JSON schema in system prompt |
| ETag versioning conflict (412 error) | Medium | Always GET fresh ETag immediately before PUT |
| DISTINCT + alias AQL rejection | Low (known) | Never use DISTINCT with AS alias — use subquery or drop alias |

---

## Session Notes
_Add notes here as work progresses — decisions made, paths confirmed, failures hit._

- Phase started: —
- Phase 1 done: —
- Phase 2 done: —
- Phase 3 done: —
- Phase 4 done: —
