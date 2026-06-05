// All FLAT paths (for writing) and AQL paths (for reading) in one place.
// Never write a raw path string anywhere else in the app — always import from here.

export const TEMPLATE_ID = 'outpatient_encounter'
export const PATIENT_NAMESPACE = 'ambient_patients'

// ── FLAT paths ───────────────────────────────────────────────────────────────
// Used when POSTing a composition to EHRbase.
// Verified via probe-paths against EHRbase 0.30 web template introspect.

export const FLAT = {
  // Composition metadata
  lang:           'outpatient_encounter/language|code',
  langTerm:       'outpatient_encounter/language|terminology',
  territory:      'outpatient_encounter/territory|code',
  territoryTerm:  'outpatient_encounter/territory|terminology',
  startTime:      'outpatient_encounter/context/start_time',
  setting:        'outpatient_encounter/context/setting|code',
  settingVal:     'outpatient_encounter/context/setting|value',
  settingTerm:    'outpatient_encounter/context/setting|terminology',
  category:       'outpatient_encounter/category|code',
  categoryVal:    'outpatient_encounter/category|value',
  categoryTerm:   'outpatient_encounter/category|terminology',
  composer:       'outpatient_encounter/composer|name',

  // reason_for_encounter archetype — presenting complaint
  presenting:     'outpatient_encounter/reason_for_encounter:0/presenting_problem|value',
  reasonLang:     'outpatient_encounter/reason_for_encounter:0/language|code',
  reasonLangT:    'outpatient_encounter/reason_for_encounter:0/language|terminology',
  reasonEnc:      'outpatient_encounter/reason_for_encounter:0/encoding|code',
  reasonEncT:     'outpatient_encounter/reason_for_encounter:0/encoding|terminology',

  // story_history archetype — clinical history
  story:          'outpatient_encounter/story_history:0/any_event:0/story|value',
  storyTime:      'outpatient_encounter/story_history:0/any_event:0/time',
  storyLang:      'outpatient_encounter/story_history:0/language|code',
  storyLangT:     'outpatient_encounter/story_history:0/language|terminology',
  storyEnc:       'outpatient_encounter/story_history:0/encoding|code',
  storyEncT:      'outpatient_encounter/story_history:0/encoding|terminology',

  // physical_examination_findings archetype — exam
  exam:           'outpatient_encounter/physical_examination_findings:0/any_event:0/description|value',
  examTime:       'outpatient_encounter/physical_examination_findings:0/any_event:0/time',
  examLang:       'outpatient_encounter/physical_examination_findings:0/language|code',
  examLangT:      'outpatient_encounter/physical_examination_findings:0/language|terminology',
  examEnc:        'outpatient_encounter/physical_examination_findings:0/encoding|code',
  examEncT:       'outpatient_encounter/physical_examination_findings:0/encoding|terminology',

  // problem_diagnosis archetype — diagnosis
  diagName:       'outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name|value',
  diagCode:       'outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name|code',
  diagTerm:       'outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name|terminology',
  diagLang:       'outpatient_encounter/problem_diagnosis:0/language|code',
  diagLangT:      'outpatient_encounter/problem_diagnosis:0/language|terminology',
  diagEnc:        'outpatient_encounter/problem_diagnosis:0/encoding|code',
  diagEncT:       'outpatient_encounter/problem_diagnosis:0/encoding|terminology',

  // clinical_synopsis archetype — management plan
  synopsis:       'outpatient_encounter/clinical_synopsis:0/synopsis|value',
  synopsisLang:   'outpatient_encounter/clinical_synopsis:0/language|code',
  synopsisLangT:  'outpatient_encounter/clinical_synopsis:0/language|terminology',
  synopsisEnc:    'outpatient_encounter/clinical_synopsis:0/encoding|code',
  synopsisEncT:   'outpatient_encounter/clinical_synopsis:0/encoding|terminology',
} as const

// ── AQL paths ────────────────────────────────────────────────────────────────
// Used inside AQL SELECT statements when querying EHRbase.
// These use archetype at-codes, not the FLAT naming.
// Alias prefixes (e, c, eval_rfe, obs_story, etc.) must match your FROM/CONTAINS clause.

export const AQL = {
  // EHR / subject
  ehrId:        'e/ehr_id/value',
  patientId:    'e/ehr_status/subject/external_ref/id/value',
  namespace:    'e/ehr_status/subject/external_ref/namespace',

  // Composition
  compUid:      'c/uid/value',
  startTime:    'c/context/start_time/value',
  templateId:   'c/archetype_details/template_id/value',

  // reason_for_encounter — alias eval_rfe in FROM clause
  presenting:   'eval_rfe/data[at0001]/items[at0002]/value/value',

  // story — alias obs_story in FROM clause
  story:        'obs_story/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/value',

  // exam — alias obs_exam in FROM clause
  exam:         'obs_exam/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value/value',

  // problem_diagnosis — alias eval_pd in FROM clause
  diagName:     'eval_pd/data[at0001]/items[at0002]/value/value',
  diagCode:     'eval_pd/data[at0001]/items[at0002]/value/defining_code/code_string',

  // clinical_synopsis — alias eval_cs in FROM clause
  synopsis:     'eval_cs/data[at0001]/items[at0002]/value/value',
} as const

// ── FLAT READ paths ──────────────────────────────────────────────────────────
// EHRbase strips |value on DV_TEXT when returning FLAT GET responses.
// DV_TEXT with 0..* occurrences uses :0 index instead of |value.
// DV_CODED_TEXT keeps |value, |code, |terminology.
// Use these keys when reading a composition back from EHRbase.
export const FLAT_READ = {
  startTime:    'outpatient_encounter/context/start_time',
  composer:     'outpatient_encounter/composer|name',
  presenting:   'outpatient_encounter/reason_for_encounter:0/presenting_problem',
  story:        'outpatient_encounter/story_history:0/any_event:0/story:0',
  exam:         'outpatient_encounter/physical_examination_findings:0/any_event:0/description',
  diagName:     'outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name|value',
  diagCode:     'outpatient_encounter/problem_diagnosis:0/problem_diagnosis_name|code',
  synopsis:     'outpatient_encounter/clinical_synopsis:0/synopsis',
} as const

// ── Mandatory FLAT fields added to every composition POST ────────────────────
// These never change — same for every encounter in this app.
export const FLAT_DEFAULTS: Record<string, string> = {
  [FLAT.lang]:         'en',
  [FLAT.langTerm]:     'ISO_639-1',
  [FLAT.territory]:    'GB',
  [FLAT.territoryTerm]:'ISO_3166-1',
  [FLAT.setting]:      '238',
  [FLAT.settingVal]:   'other care',
  [FLAT.settingTerm]:  'openehr',
  [FLAT.category]:     '433',
  [FLAT.categoryVal]:  'event',
  [FLAT.categoryTerm]: 'openehr',
  // per-archetype language + encoding
  [FLAT.reasonLang]:   'en', [FLAT.reasonLangT]:   'ISO_639-1', [FLAT.reasonEnc]:   'UTF-8', [FLAT.reasonEncT]:   'IANA_character-sets',
  [FLAT.storyLang]:    'en', [FLAT.storyLangT]:    'ISO_639-1', [FLAT.storyEnc]:    'UTF-8', [FLAT.storyEncT]:    'IANA_character-sets',
  [FLAT.examLang]:     'en', [FLAT.examLangT]:     'ISO_639-1', [FLAT.examEnc]:     'UTF-8', [FLAT.examEncT]:     'IANA_character-sets',
  [FLAT.diagLang]:     'en', [FLAT.diagLangT]:     'ISO_639-1', [FLAT.diagEnc]:     'UTF-8', [FLAT.diagEncT]:     'IANA_character-sets',
  [FLAT.synopsisLang]: 'en', [FLAT.synopsisLangT]: 'ISO_639-1', [FLAT.synopsisEnc]: 'UTF-8', [FLAT.synopsisEncT]: 'IANA_character-sets',
}
