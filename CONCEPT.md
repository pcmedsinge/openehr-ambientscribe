# AmbientScribe — Concept Document

## The Problem

Clinical documentation is one of the highest-friction tasks in a practitioner's day. Structured data entry into EMR systems requires navigating multiple fields, dropdowns, and coded terminology — all while trying to stay present with the patient. The result is either documentation deferred until after clinic (prone to omission) or templates that feel mechanical and disconnected from how clinicians actually think.

Free-text dictation solves the friction problem but loses structure. Structured data entry solves the interoperability problem but creates friction. AmbientScribe is a proof-of-concept that tries to have both.

---

## The Approach

The practitioner writes or pastes a clinical note in natural language — the way they would dictate to a transcriptionist. GPT-4o parses the note and returns a structured JSON object whose fields map exactly to the openEHR encounter form. The form pre-fills. The practitioner reviews, edits anything that needs correcting, and submits. The encounter is stored as a versioned openEHR composition.

The key design principle: **AI is a pre-fill assistant, not an autonomous writer.** Every extracted field is editable. The practitioner always has the final word before anything hits the clinical record.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│                                                          │
│  Patient Worklist → Patient Detail → Encounter Wizard    │
│                          ↑                               │
│              AIService.ts (OpenAI SDK)                   │
│              EHRbaseService.ts (fetch wrapper)           │
└──────────────────────┬──────────────────────────────────┘
                       │ REST
         ┌─────────────▼──────────────┐
         │       EHRbase CDR          │
         │  (openEHR REST API v1)     │
         │  FLAT API  │  AQL          │
         └─────────────┬──────────────┘
                       │
               ┌───────▼────────┐
               │   PostgreSQL   │
               └────────────────┘
```

### Service Layer

There is no third-party openEHR SDK. All EHRbase communication goes through a single typed class, `EHRbaseService.ts`, which owns:

- EHR creation and lookup
- FLAT composition POST (new encounter)
- Composition GET (view + ETag capture)
- FLAT composition PUT with `If-Match` (versioned amend)
- AQL execution (worklist, encounter list, bind-back)

This keeps the openEHR API surface in one place and makes FLAT path changes easy to trace.

---

## openEHR Design Decisions

### Template choice: `outpatient_encounter`

An outpatient encounter covers the core clinical workflow without overcomplicating the template: presenting complaint → history → examination → diagnosis → plan. Six archetypes, all standard RM archetypes available in the public CKM library.

### FLAT API for writes

Compositions are posted and amended using the FLAT format (`/composition?format=FLAT`). FLAT is simpler to construct in code than canonical JSON or XML, and the field names are predictable once verified against a test POST.

### AQL for reads

All data retrieval uses AQL rather than fetching full compositions and parsing them client-side. AQL keeps query logic server-side and returns only the fields needed per screen.

Key AQL constraints observed from prior work:
- No multi-archetype joins in a single CONTAINS clause — separate queries per archetype
- No `SELECT DISTINCT` with `AS` alias — EHRbase rejects this silently
- `ORDER BY` must use the full archetype path, not the alias
- Broken AQL returns empty results, not errors — always log query results during development

### Versioning via ETag

openEHR composition amendments use optimistic locking. The workflow is:
1. `GET /composition/{id}` — capture the `ETag` response header
2. `PUT /composition/{id}?format=FLAT` with `If-Match: "{etag}"` — submit the amendment

EHRbase preserves all prior versions in its version history. The original composition is never overwritten. This is a core openEHR guarantee.

---

## AI Extraction Design

### Model and call pattern

GPT-4o with `response_format: { type: "json_object" }`. Single synchronous call — no streaming, no function calling. The system prompt defines a strict JSON schema that matches the wizard field names exactly.

### Prompt strategy

The system prompt does two things:
1. Defines the exact JSON structure to return (field names, types, constraints)
2. Instructs the model to leave a field as an empty string if the note does not contain enough information — never to invent or infer values

This prevents hallucinated clinical data from silently pre-filling the form. An empty field is obvious; a plausible-but-wrong value is not.

### Failure handling

If the extraction call fails or returns malformed JSON, the wizard opens with all fields blank. The practitioner enters data manually. The AI path is additive — its absence must never block the core workflow.

---

## Patient Data Model

20 patients seeded under namespace `ambient_patients`, IDs AMB-001 through AMB-020. Each has 2–3 prior encounters. Patients AMB-001 through AMB-005 have a last encounter date more than 12 weeks before the current date, so the worklist overdue flag fires for them immediately on first load.

This gives a realistic worklist state without requiring real patient data.

---

## What This Is Not

- **Not production clinical software.** No authentication, no audit logging, no role-based access control, no data residency controls.
- **Not a dictation tool.** There is no audio capture or speech-to-text. The free-text input is typed or pasted.
- **Not a diagnosis engine.** GPT-4o extracts what the practitioner wrote — it does not suggest diagnoses, flag drug interactions, or provide clinical decision support.

---

## Status

See [`PLAN.md`](./PLAN.md) for current build phase and checkpoint status.
