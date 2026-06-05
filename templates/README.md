# outpatient_encounter — Template Build Guide

This directory holds the OPT file once exported from Archetype Designer.
The `outpatient_encounter.opt` file is NOT committed to git (it is generated).

---

## How to build the template

### 1. Open Archetype Designer
Go to https://tools.openehr.org/designer (or your local instance).
Create a new template. Set the template ID exactly to: `outpatient_encounter`

### 2. Add archetypes in this order

| Step | Archetype | Role |
|------|-----------|------|
| 1 | `openEHR-EHR-COMPOSITION.encounter.v1` | Outer shell — select this as the root |
| 2 | `openEHR-EHR-EVALUATION.reason_for_encounter.v1` | Presenting complaint |
| 3 | `openEHR-EHR-OBSERVATION.story.v1` | Clinical history |
| 4 | `openEHR-EHR-OBSERVATION.exam.v1` | Examination findings |
| 5 | `openEHR-EHR-EVALUATION.problem_diagnosis.v1` | Diagnosis + ICD-11 code |
| 6 | `openEHR-EHR-EVALUATION.clinical_synopsis.v1` | Management plan |

Add archetypes 2–6 into the `content` section of the encounter COMPOSITION.

### 3. Constraints to set

- All six archetypes: set occurrence to `0..*` (optional, repeating)
- `problem_diagnosis` → `Problem/Diagnosis name`: enable terminology binding to ICD-11 (optional but useful)
- Leave everything else at default constraints

### 4. Export
- Export as **OPT (ADL 1.4)** format
- Save the file as `templates/outpatient_encounter.opt` in this project

### 5. Upload to EHRbase
```bash
cd scripts
npm install
npm run upload-template
```

### 6. Verify
```
GET http://localhost:8086/ehrbase/rest/openehr/v1/definition/template/adl1.4
Authorization: Basic ZWhyYmFzZS11c2VyOlN1cGVyU2VjcmV0UGFzc3dvcmQx
```
`outpatient_encounter` should appear in the list.

### 7. Discover FLAT paths
```bash
npm run discover-paths
```
Compare output against `FLAT_PATHS` in `seed.ts`. Update any that differ.

---

## Important: do NOT trust the designer path labels
The FLAT paths EHRbase uses after upload may differ from what the designer shows.
Always verify via `discover-paths` before running `seed.ts`.
