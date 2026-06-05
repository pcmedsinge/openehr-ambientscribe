# FLAT Paths and AQL Paths — outpatient_encounter Template

This document explains every FLAT path and AQL path used in the `outpatient_encounter` template, where each part comes from, and shows real examples.

---

## What is a FLAT path?

When your app sends data to EHRbase, every value needs an **address** so EHRbase knows which field to store it in. That address is the FLAT path.

```
outpatient_encounter / story_history:0 / any_event:0 / story | value
     ↑                      ↑                 ↑           ↑       ↑
  template name         archetype          event        field  sub-field
  (you named this)    (openEHR gave     (openEHR gave  (openEHR   (the
                        this name)        this name)    named it)  actual
                                                                    text)
```

---

## Where each part comes from

| Segment | Example | Origin |
|---------|---------|--------|
| Template prefix | `outpatient_encounter` | **You** — the template ID you gave when uploading the OPT |
| Archetype name | `story_history` | **openEHR Foundation** — the archetype's official name, lowercased + underscored |
| `:0` index | `story_history:0` | Position — `:0` means the first instance. If there were two story sections it would be `:0` and `:1` |
| Event / sub-section | `any_event` | **openEHR archetype** — a generic event node defined in the archetype |
| Field name | `story` | **openEHR archetype** — the actual data field, named by the archetype author |
| `\|value` | `story\|value` | The content of a text field. Coded fields also have `\|code` and `\|terminology` |

---

## All confirmed paths for outpatient_encounter

These were verified by posting a test composition and reading back from EHRbase. Do NOT guess — always verify with `npm run probe-paths`.

### Composition-level (mandatory on every POST)

| Key in code | FLAT path | What it stores | Example value |
|-------------|-----------|---------------|---------------|
| `lang` | `outpatient_encounter/language\|code` | Language of the record | `en` |
| `langTerm` | `outpatient_encounter/language\|terminology` | Language terminology system | `ISO_639-1` |
| `territory` | `outpatient_encounter/territory\|code` | Country code | `GB` |
| `territoryTerm` | `outpatient_encounter/territory\|terminology` | Country terminology | `ISO_3166-1` |
| `startTime` | `outpatient_encounter/context/start_time` | When the encounter happened | `2026-06-05T09:00:00Z` |
| `setting` | `outpatient_encounter/context/setting\|code` | Care setting code | `238` |
| `settingVal` | `outpatient_encounter/context/setting\|value` | Care setting label | `other care` |
| `settingTerm` | `outpatient_encounter/context/setting\|terminology` | Setting terminology | `openehr` |
| `category` | `outpatient_encounter/category\|code` | Composition type code | `433` (= event) |
| `categoryVal` | `outpatient_encounter/category\|value` | Composition type label | `event` |
| `categoryTerm` | `outpatient_encounter/category\|terminology` | Category terminology | `openehr` |
| `composer` | `outpatient_encounter/composer\|name` | Who created the record | `Dr. Smith` |

---

### Reason for Encounter (presenting complaint)
**Archetype:** `openEHR-EHR-EVALUATION.reason_for_encounter.v1`
**What it models:** Why the patient came in — their presenting problem.

| Key | FLAT path | Example value |
|-----|-----------|--------------|
| `presenting` | `outpatient_encounter/reason_for_encounter:0/presenting_problem\|value` | `Hypertension review` |
| `reasonLang` | `outpatient_encounter/reason_for_encounter:0/language\|code` | `en` |
| `reasonLangT` | `outpatient_encounter/reason_for_encounter:0/language\|terminology` | `ISO_639-1` |
| `reasonEnc` | `outpatient_encounter/reason_for_encounter:0/encoding\|code` | `UTF-8` |
| `reasonEncT` | `outpatient_encounter/reason_for_encounter:0/encoding\|terminology` | `IANA_character-sets` |

> **Why language and encoding per archetype?** In openEHR, every ENTRY (EVALUATION, OBSERVATION) carries its own language and encoding so records from different languages can be mixed in the same composition. In practice for a single-language app you always send the same values — but they are mandatory.

---

### Story / Clinical History
**Archetype:** `openEHR-EHR-OBSERVATION.story.v1`
**What it models:** The patient's own account of their symptoms — what they told you.

| Key | FLAT path | Example value |
|-----|-----------|--------------|
| `story` | `outpatient_encounter/story_history:0/any_event:0/story\|value` | `Patient reports 3 weeks of lower back pain` |
| `storyTime` | `outpatient_encounter/story_history:0/any_event:0/time` | `2026-06-05T09:00:00Z` |
| `storyLang` | `outpatient_encounter/story_history:0/language\|code` | `en` |
| `storyEnc` | `outpatient_encounter/story_history:0/encoding\|code` | `UTF-8` |

> **Why `any_event:0/time`?** An OBSERVATION always has events. Each event has a time — when was this observation made. For a clinical history taken at the start of the consult, it equals the encounter start time.

> **Why `story_history` not `story`?** The archetype's full name is "Story/History". EHRbase converts slashes to underscores → `story_history`. This is an example of why you must verify paths after upload — the designer may show one name, EHRbase stores a different one.

---

### Physical Examination Findings
**Archetype:** `openEHR-EHR-OBSERVATION.exam.v1`
**What it models:** What the clinician found on examining the patient.

| Key | FLAT path | Example value |
|-----|-----------|--------------|
| `exam` | `outpatient_encounter/physical_examination_findings:0/any_event:0/description\|value` | `BP 138/88. HR 72. Chest clear.` |
| `examTime` | `outpatient_encounter/physical_examination_findings:0/any_event:0/time` | `2026-06-05T09:00:00Z` |
| `examLang` | `outpatient_encounter/physical_examination_findings:0/language\|code` | `en` |
| `examEnc` | `outpatient_encounter/physical_examination_findings:0/encoding\|code` | `UTF-8` |

> **Why `physical_examination_findings` not `exam`?** The archetype's full name is "Physical examination findings". EHRbase converts it to `physical_examination_findings`. The archetype ID ends in `.exam.v1` but the name it generates in FLAT is the human-readable name, not the ID.

---

### Problem / Diagnosis
**Archetype:** `openEHR-EHR-EVALUATION.problem_diagnosis.v1`
**What it models:** The clinical diagnosis — with optional coding (ICD-11, SNOMED etc).

| Key | FLAT path | Example value |
|-----|-----------|--------------|
| `diagName` | `outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name\|value` | `Essential hypertension` |
| `diagCode` | `outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name\|code` | `BA00` |
| `diagTerm` | `outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name\|terminology` | `ICD-11` |
| `diagLang` | `outpatient_encounter/problem_diagnosis:0/language\|code` | `en` |
| `diagEnc` | `outpatient_encounter/problem_diagnosis:0/encoding\|code` | `UTF-8` |

> **`|value`, `|code`, `|terminology` together** — When a field is DV_CODED_TEXT (not plain text), it stores three things: the human-readable label, the code, and which coding system the code is from. You can provide all three or just the `|value`. EHRbase accepts free text without a code.

---

### Clinical Synopsis (Management Plan)
**Archetype:** `openEHR-EHR-EVALUATION.clinical_synopsis.v1`
**What it models:** The clinician's summary, assessment, or management plan.

| Key | FLAT path | Example value |
|-----|-----------|--------------|
| `synopsis` | `outpatient_encounter/clinical_synopsis:0/synopsis\|value` | `Continue metformin. Repeat HbA1c in 3 months.` |
| `synopsisLang` | `outpatient_encounter/clinical_synopsis:0/language\|code` | `en` |
| `synopsisEnc` | `outpatient_encounter/clinical_synopsis:0/encoding\|code` | `UTF-8` |

---

## Complete POST example

This is the exact JSON body sent to create one encounter:

```json
POST /ehrbase/rest/ecis/v1/composition?format=FLAT&templateId=outpatient_encounter&ehrId={ehr_id}

{
  "outpatient_encounter/language|code": "en",
  "outpatient_encounter/language|terminology": "ISO_639-1",
  "outpatient_encounter/territory|code": "GB",
  "outpatient_encounter/territory|terminology": "ISO_3166-1",
  "outpatient_encounter/context/start_time": "2026-06-05T09:00:00Z",
  "outpatient_encounter/context/setting|code": "238",
  "outpatient_encounter/context/setting|value": "other care",
  "outpatient_encounter/context/setting|terminology": "openehr",
  "outpatient_encounter/category|code": "433",
  "outpatient_encounter/category|value": "event",
  "outpatient_encounter/category|terminology": "openehr",
  "outpatient_encounter/composer|name": "Dr. Smith",

  "outpatient_encounter/reason_for_encounter:0/presenting_problem|value": "Hypertension review",
  "outpatient_encounter/reason_for_encounter:0/language|code": "en",
  "outpatient_encounter/reason_for_encounter:0/language|terminology": "ISO_639-1",
  "outpatient_encounter/reason_for_encounter:0/encoding|code": "UTF-8",
  "outpatient_encounter/reason_for_encounter:0/encoding|terminology": "IANA_character-sets",

  "outpatient_encounter/story_history:0/any_event:0/story|value": "Routine hypertension follow-up. Good compliance.",
  "outpatient_encounter/story_history:0/any_event:0/time": "2026-06-05T09:00:00Z",
  "outpatient_encounter/story_history:0/language|code": "en",
  "outpatient_encounter/story_history:0/language|terminology": "ISO_639-1",
  "outpatient_encounter/story_history:0/encoding|code": "UTF-8",
  "outpatient_encounter/story_history:0/encoding|terminology": "IANA_character-sets",

  "outpatient_encounter/physical_examination_findings:0/any_event:0/description|value": "BP 138/88. HR 72. No oedema.",
  "outpatient_encounter/physical_examination_findings:0/any_event:0/time": "2026-06-05T09:00:00Z",
  "outpatient_encounter/physical_examination_findings:0/language|code": "en",
  "outpatient_encounter/physical_examination_findings:0/language|terminology": "ISO_639-1",
  "outpatient_encounter/physical_examination_findings:0/encoding|code": "UTF-8",
  "outpatient_encounter/physical_examination_findings:0/encoding|terminology": "IANA_character-sets",

  "outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name|value": "Essential hypertension",
  "outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name|code": "BA00",
  "outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name|terminology": "ICD-11",
  "outpatient_encounter/problem_diagnosis:0/language|code": "en",
  "outpatient_encounter/problem_diagnosis:0/language|terminology": "ISO_639-1",
  "outpatient_encounter/problem_diagnosis:0/encoding|code": "UTF-8",
  "outpatient_encounter/problem_diagnosis:0/encoding|terminology": "IANA_character-sets",

  "outpatient_encounter/clinical_synopsis:0/synopsis|value": "Continue antihypertensives. Review in 12 weeks.",
  "outpatient_encounter/clinical_synopsis:0/language|code": "en",
  "outpatient_encounter/clinical_synopsis:0/language|terminology": "ISO_639-1",
  "outpatient_encounter/clinical_synopsis:0/encoding|code": "UTF-8",
  "outpatient_encounter/clinical_synopsis:0/encoding|terminology": "IANA_character-sets"
}
```

---

## FLAT paths vs AQL paths

These are two different things and are NOT interchangeable.

| | FLAT path | AQL path |
|-|-----------|---------|
| Used for | Writing data (POST composition) | Reading data (queries) |
| Format | `template/archetype:0/field\|value` | `c/content[openEHR-EHR-...]/data[at0001]/items[at0002]/value/value` |
| Example | `outpatient_encounter/story_history:0/any_event:0/story\|value` | `c/content[openEHR-EHR-OBSERVATION.story.v1]/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/value` |

FLAT is the shorthand format for writing. AQL uses the full openEHR archetype path for reading. The app uses both.

---

---

## AQL Paths — for reading data

AQL (Archetype Query Language) is how you read data out of EHRbase. It looks like SQL but the paths inside it point to specific fields inside archetypes.

---

### How an AQL path is structured

```
c / content[openEHR-EHR-EVALUATION.reason_for_encounter.v1] / data[at0001] / items[at0002] / value / value
↑         ↑                                                       ↑               ↑           ↑       ↑
comp   which archetype inside the composition                 which node      which item  the DV   the
alias  (the square bracket filters by archetype ID)           (at-code)       (at-code)  object  string
```

- `c` — an alias for COMPOSITION, defined in your FROM clause
- `content[openEHR-...]` — filters to a specific archetype inside the composition
- `data[at0001]` — the data node of the archetype (its internal at-code)
- `items[at0002]` — a specific item inside that data node (its at-code)
- `value/value` — first `value` = the DV_TEXT object, second `value` = the actual string inside it

**The at-codes** (`at0001`, `at0002` etc.) are fixed numbers defined by the archetype author. They never change for a given archetype version. You look them up in the archetype definition on ckm.openehr.org or discover them by reading the OPT XML.

---

### Confirmed AQL paths for outpatient_encounter

These are the paths for querying each clinical field.

#### Composition-level (always available)

| What you get | AQL path |
|-------------|---------|
| Composition UID | `c/uid/value` |
| Encounter date/time | `c/context/start_time/value` |
| Template ID | `c/archetype_details/template_id/value` |

#### Reason for Encounter — `openEHR-EHR-EVALUATION.reason_for_encounter.v1`

| What you get | AQL path |
|-------------|---------|
| Presenting problem (text) | `eval_rfe/data[at0001]/items[at0002]/value/value` |

Full query pattern:
```sql
SELECT eval_rfe/data[at0001]/items[at0002]/value/value as presenting_problem
FROM EHR e 
CONTAINS COMPOSITION c 
CONTAINS EVALUATION eval_rfe[openEHR-EHR-EVALUATION.reason_for_encounter.v1]
WHERE e/ehr_id/value = 'abc-123'
```

#### Story / Clinical History — `openEHR-EHR-OBSERVATION.story.v1`

| What you get | AQL path |
|-------------|---------|
| Story text | `obs_story/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/value` |

Full query pattern:
```sql
SELECT obs_story/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/value as history
FROM EHR e 
CONTAINS COMPOSITION c 
CONTAINS OBSERVATION obs_story[openEHR-EHR-OBSERVATION.story.v1]
WHERE e/ehr_id/value = 'abc-123'
```

#### Physical Examination Findings — `openEHR-EHR-OBSERVATION.exam.v1`

| What you get | AQL path |
|-------------|---------|
| Description text | `obs_exam/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/value` |

#### Problem / Diagnosis — `openEHR-EHR-EVALUATION.problem_diagnosis.v1`

| What you get | AQL path |
|-------------|---------|
| Diagnosis name (text) | `eval_pd/data[at0001]/items[at0002]/value/value` |
| Diagnosis code | `eval_pd/data[at0001]/items[at0002]/value/defining_code/code_string` |
| Coding system | `eval_pd/data[at0001]/items[at0002]/value/defining_code/terminology_id/value` |

#### Clinical Synopsis — `openEHR-EHR-EVALUATION.clinical_synopsis.v1`

| What you get | AQL path |
|-------------|---------|
| Synopsis text | `eval_cs/data[at0001]/items[at0002]/value/value` |

---

### The 3 AQL queries used in this app

**Query 1 — Patient worklist with last visit date**

Used by: Patient Worklist screen

```sql
SELECT
  e/ehr_id/value                                    as ehr_id,
  e/ehr_status/subject/external_ref/id/value        as patient_id,
  c/context/start_time/value                        as visit_date
FROM EHR e
CONTAINS COMPOSITION c
WHERE e/ehr_status/subject/external_ref/namespace = 'ambient_patients'
ORDER BY c/context/start_time/value DESC
```

Returns one row per composition. The app groups these by patient and takes the most recent `visit_date` per patient to build the worklist.

---

**Query 2 — Encounter list for one patient**

Used by: Patient Detail screen

```sql
SELECT
  c/uid/value                                                          as uid,
  c/context/start_time/value                                           as visit_date,
  eval_rfe/data[at0001]/items[at0002]/value/value                      as presenting_problem,
  eval_pd/data[at0001]/items[at0002]/value/value                       as diagnosis
FROM EHR e
CONTAINS COMPOSITION c
CONTAINS EVALUATION eval_rfe[openEHR-EHR-EVALUATION.reason_for_encounter.v1]
CONTAINS EVALUATION eval_pd[openEHR-EHR-EVALUATION.problem_diagnosis.v1]
WHERE e/ehr_id/value = '{ehrId}'
ORDER BY c/context/start_time/value DESC
```

> **Important gotcha:** EHRbase 0.30 can reject multi-archetype joins. If this query returns empty results, split it into two separate queries (one per archetype) and join in the app layer. See the gotchas section below.

---

**Query 3 — Full encounter detail**

Used by: View Encounter screen

EHRbase is asked for the full composition in FLAT format:

```
GET /ecis/v1/composition/{compositionId}?format=FLAT
```

Returns all FLAT key-value pairs. The app reads each field using the known FLAT path keys from `template-config.ts`.

---

### AQL vs FLAT — side by side comparison

| | FLAT | AQL |
|-|------|-----|
| **Direction** | Writing data IN to EHRbase | Reading data OUT of EHRbase |
| **When used** | POST composition (create/amend encounter) | SELECT query (worklist, detail, search) |
| **Path style** | `template_id/archetype_name:0/field\|value` | `alias/data[at-code]/items[at-code]/value/value` |
| **Looks like** | `outpatient_encounter/story_history:0/any_event:0/story\|value` | `obs/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/value` |
| **Defined by** | EHRbase web template (verify with probe-paths) | Archetype at-codes (fixed, from ckm.openehr.org) |
| **Analogy** | The delivery address on a parcel going IN | The shelf address when picking an item OUT |

---

## Gotchas proven in this project

1. **Archetype name ≠ archetype ID suffix.** The archetype ID ends in `.exam.v1` but the FLAT path uses `physical_examination_findings` — the human name, not the ID.

2. **Always verify after upload.** Run `npm run probe-paths` after every template change. The path you expect and the path EHRbase generates are often different.

3. **language and encoding are mandatory per ENTRY.** Every EVALUATION and OBSERVATION needs `language|code`, `language|terminology`, `encoding|code`, `encoding|terminology` or EHRbase throws a validation error.

4. **EhrScape endpoint for FLAT POST.** Use `/ecis/v1/composition` not `/openehr/v1/ehr/{id}/composition` — EHRbase 0.30 has a name-resolution bug on the openEHR v1 FLAT endpoint.
