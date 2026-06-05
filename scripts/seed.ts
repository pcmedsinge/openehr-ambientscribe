/**
 * Seeds 20 patients (AMB-001 to AMB-020) with 2–3 encounters each.
 * AMB-001 to AMB-005 have a last encounter > 12 weeks ago (overdue flag).
 *
 * Prerequisites:
 *   1. EHRbase running (docker compose up -d)
 *   2. outpatient_encounter template uploaded (npm run upload-template)
 *   3. Run discover-paths and update FLAT_PATHS below if any differ
 *
 * Run: npm run seed
 */
import { EHRBASE_URL, TEMPLATE_ID, PATIENT_NAMESPACE, jsonHeaders } from './config.ts'

// ─────────────────────────────────────────────────────────────────────────────
// FLAT PATHS — verify with: npm run discover-paths
// Update any path that differs from what discover-paths prints.
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  startTime:        'outpatient_encounter/context/start_time',
  facility:         'outpatient_encounter/context/_health_care_facility|name',
  composer:         'outpatient_encounter/composer|name',
  // reason_for_encounter archetype
  presentingProblem:'outpatient_encounter/reason_for_encounter/presenting_problem:0|value',
  // story archetype
  clinicalHistory:  'outpatient_encounter/story/story:0|value',
  // exam archetype
  examFindings:     'outpatient_encounter/exam/description:0|value',
  // problem_diagnosis archetype
  diagnosisName:    'outpatient_encounter/problem_diagnosis/problem_diagnosis_name:0|value',
  diagnosisCode:    'outpatient_encounter/problem_diagnosis/problem_diagnosis_name:0|code',
  diagnosisTerm:    'outpatient_encounter/problem_diagnosis/problem_diagnosis_name:0|terminology',
  // clinical_synopsis archetype
  synopsis:         'outpatient_encounter/clinical_synopsis/synopsis:0|value',
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient definitions
// ─────────────────────────────────────────────────────────────────────────────
interface Patient {
  id: string
  name: string
  dob: string
  gender: string
  overdue: boolean
}

const PATIENTS: Patient[] = [
  // AMB-001 to AMB-005 — overdue (last encounter > 12 weeks ago)
  { id: 'AMB-001', name: 'John Smith',        dob: '1965-03-15', gender: 'Male',   overdue: true  },
  { id: 'AMB-002', name: 'Mary Johnson',      dob: '1972-07-22', gender: 'Female', overdue: true  },
  { id: 'AMB-003', name: 'Robert Williams',   dob: '1958-11-08', gender: 'Male',   overdue: true  },
  { id: 'AMB-004', name: 'Patricia Brown',    dob: '1945-05-30', gender: 'Female', overdue: true  },
  { id: 'AMB-005', name: 'Michael Davis',     dob: '1980-09-14', gender: 'Male',   overdue: true  },
  // AMB-006 to AMB-020 — recently seen
  { id: 'AMB-006', name: 'Linda Wilson',      dob: '1967-12-01', gender: 'Female', overdue: false },
  { id: 'AMB-007', name: 'David Moore',       dob: '1975-04-17', gender: 'Male',   overdue: false },
  { id: 'AMB-008', name: 'Barbara Taylor',    dob: '1952-08-25', gender: 'Female', overdue: false },
  { id: 'AMB-009', name: 'James Anderson',    dob: '1963-02-11', gender: 'Male',   overdue: false },
  { id: 'AMB-010', name: 'Susan Thomas',      dob: '1985-06-28', gender: 'Female', overdue: false },
  { id: 'AMB-011', name: 'Thomas Jackson',    dob: '1948-10-05', gender: 'Male',   overdue: false },
  { id: 'AMB-012', name: 'Jessica White',     dob: '1991-01-19', gender: 'Female', overdue: false },
  { id: 'AMB-013', name: 'Christopher Harris',dob: '1956-07-31', gender: 'Male',   overdue: false },
  { id: 'AMB-014', name: 'Sarah Martin',      dob: '1978-03-22', gender: 'Female', overdue: false },
  { id: 'AMB-015', name: 'Charles Thompson',  dob: '1943-09-07', gender: 'Male',   overdue: false },
  { id: 'AMB-016', name: 'Karen Garcia',      dob: '1969-11-14', gender: 'Female', overdue: false },
  { id: 'AMB-017', name: 'Joseph Martinez',   dob: '1982-05-03', gender: 'Male',   overdue: false },
  { id: 'AMB-018', name: 'Nancy Robinson',    dob: '1955-08-17', gender: 'Female', overdue: false },
  { id: 'AMB-019', name: 'Matthew Clark',     dob: '1988-04-29', gender: 'Male',   overdue: false },
  { id: 'AMB-020', name: 'Betty Rodriguez',   dob: '1960-12-08', gender: 'Female', overdue: false },
]

// ─────────────────────────────────────────────────────────────────────────────
// Clinical scenarios (cycled across patients)
// ─────────────────────────────────────────────────────────────────────────────
const SCENARIOS = [
  {
    reason: 'Hypertension review',
    history: 'Routine hypertension follow-up. Good medication compliance. Occasional headaches, no chest pain or dyspnoea.',
    exam: 'BP 138/88 mmHg. HR 72 bpm regular. Heart sounds normal. No peripheral oedema.',
    diagnosisName: 'Essential hypertension',
    icdCode: 'BA00',
    plan: 'Continue current antihypertensives. Lifestyle advice reinforced. Target BP <130/80. Review in 12 weeks.',
  },
  {
    reason: 'Type 2 diabetes management',
    history: 'Three-monthly T2DM review. HbA1c 7.8% six weeks ago. No hypoglycaemic episodes. Variable dietary compliance.',
    exam: 'Weight 89 kg, BMI 31.2. Foot exam: intact sensation, no ulceration. BP 134/82 mmHg.',
    diagnosisName: 'Type 2 diabetes mellitus without complications',
    icdCode: '5A11',
    plan: 'Continue metformin 1g BD. Reinforce diet. Repeat HbA1c in 3 months. Eye review overdue — refer.',
  },
  {
    reason: 'Upper respiratory tract infection',
    history: '3-day history of sore throat, nasal congestion, and low-grade fever. No productive cough.',
    exam: 'Temp 37.8°C. Throat mildly erythematous, no exudate. Cervical nodes not enlarged. Chest clear.',
    diagnosisName: 'Acute upper respiratory tract infection',
    icdCode: 'CA0G',
    plan: 'Viral URTI. Symptomatic management: paracetamol, fluids, rest. No antibiotics. Return if fever persists beyond 5 days.',
  },
  {
    reason: 'Lower back pain',
    history: '6-week history of lumbar pain after heavy lifting. No radiculopathy, no bladder or bowel symptoms.',
    exam: 'Lumbar flexion reduced. Paraspinal tenderness L3–L5. SLR negative bilaterally. Neuro exam normal.',
    diagnosisName: 'Mechanical low back pain',
    icdCode: 'ME84',
    plan: 'Naproxen 500mg BD PRN up to 2 weeks. Physiotherapy referral. Avoid bed rest. Review in 4 weeks.',
  },
  {
    reason: 'Anxiety review',
    history: 'GAD follow-up. Moderate improvement on sertraline commenced 3 months ago. Sleep remains poor. No suicidal ideation.',
    exam: 'Appearance appropriate. Euthymic mood. GAD-7 score 9 (moderate).',
    diagnosisName: 'Generalised anxiety disorder',
    icdCode: '6B00',
    plan: 'Continue sertraline 50mg. CBT referral — awaiting. Sleep hygiene counselled. Review in 8 weeks.',
  },
  {
    reason: 'Asthma review',
    history: '2–3 nocturnal awakenings per week. Reliever used 4–5 times weekly. No recent oral steroid courses.',
    exam: 'SpO2 98%. Mild expiratory wheeze bilaterally. PEFR 78% predicted.',
    diagnosisName: 'Asthma, uncontrolled',
    icdCode: 'CA23',
    plan: 'Step up: add ICS budesonide 200mcg BD. Inhaler technique reviewed. Asthma action plan updated. Review in 4 weeks.',
  },
  {
    reason: 'Chest pain evaluation',
    history: 'Intermittent exertional central chest tightness over 4 weeks, relieved by rest. Risk factors: hypertension, dyslipidaemia, ex-smoker.',
    exam: 'BP 142/90. HR 78 regular. Heart sounds normal, no murmurs. Peripheral pulses present.',
    diagnosisName: 'Chest pain on exertion — query stable angina',
    icdCode: 'MD81',
    plan: 'Aspirin 100mg commenced. GTN spray prescribed. Urgent cardiology referral and stress test arranged.',
  },
  {
    reason: 'Right knee pain',
    history: '3-month right knee pain, worse on stairs and prolonged standing. Morning stiffness <30 minutes. No locking or giving way.',
    exam: 'Medial joint line tenderness. Mild crepitus on flexion. McMurray negative. No effusion.',
    diagnosisName: 'Primary osteoarthritis of right knee',
    icdCode: 'FA74',
    plan: 'Paracetamol 1g QID regular. Physiotherapy for quadriceps strengthening. Weight loss advice. Review 6 weeks.',
  },
  {
    reason: 'Hypothyroidism review',
    history: 'On levothyroxine 75mcg. Reports fatigue and mild weight gain over 2 months. Good medication compliance.',
    exam: 'Pulse 62 bpm. Mild facial puffiness. Thyroid not enlarged. Reflexes mildly sluggish.',
    diagnosisName: 'Primary hypothyroidism',
    icdCode: '5A00',
    plan: 'Increase levothyroxine to 100mcg. Repeat TFTs in 6 weeks. Advise separation from calcium supplements.',
  },
  {
    reason: 'Reflux and heartburn',
    history: '3-month epigastric burning, worse post-meals and when lying flat. No dysphagia or haematemesis.',
    exam: 'Abdomen soft. Mild epigastric tenderness on deep palpation. No guarding. BMI 29.',
    diagnosisName: 'Gastro-oesophageal reflux disease',
    icdCode: 'DA26',
    plan: 'Omeprazole 20mg daily before breakfast × 4 weeks. Elevate head of bed, reduce alcohol and coffee. Review in 4 weeks.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// Today: 2026-06-05. Overdue threshold: 12 weeks before today = 2026-03-12.
// ─────────────────────────────────────────────────────────────────────────────
function isoDate(year: number, month: number, day: number, hour = 9, min = 0): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00+00:00`
}

function overdueEncounterDates(count: number, patientIndex: number): string[] {
  // Last encounter: Oct–Nov 2025 (well before the 12-week threshold)
  const last = [
    isoDate(2025, 10, 8 + patientIndex, 9),
    isoDate(2025, 11, 5 + patientIndex, 10),
    isoDate(2025, 12, 2 + patientIndex, 14),
  ]
  return last.slice(0, count)
}

function activeEncounterDates(count: number, patientIndex: number): string[] {
  // Spread across 2025-2026, last encounter after 2026-03-12
  const dates = [
    isoDate(2025, 6 + (patientIndex % 4), 10 + patientIndex, 9),
    isoDate(2025, 10 + (patientIndex % 3), 15 + (patientIndex % 10), 11),
    isoDate(2026, 3 + (patientIndex % 3), 14 + (patientIndex % 14), 9),
  ]
  return dates.slice(0, count)
}

// ─────────────────────────────────────────────────────────────────────────────
// EHRbase helpers
// ─────────────────────────────────────────────────────────────────────────────
async function createEHR(patient: Patient): Promise<string> {
  const body = {
    _type: 'EHR_STATUS',
    archetype_node_id: 'openEHR-EHR-EHR_STATUS.generic.v1',
    name: { value: 'EHR Status' },
    subject: {
      _type: 'PARTY_IDENTIFIED',
      name: patient.name,
      identifiers: [
        { _type: 'DV_IDENTIFIER', issuer: 'AmbientScribe', assigner: 'AmbientScribe', id: patient.id,     type: 'PatientID'   },
        { _type: 'DV_IDENTIFIER', issuer: 'AmbientScribe', assigner: 'AmbientScribe', id: patient.dob,    type: 'DateOfBirth' },
        { _type: 'DV_IDENTIFIER', issuer: 'AmbientScribe', assigner: 'AmbientScribe', id: patient.gender, type: 'Gender'      },
      ],
      external_ref: {
        _type: 'PARTY_REF',
        id: { _type: 'GENERIC_ID', value: patient.id, scheme: PATIENT_NAMESPACE },
        namespace: PATIENT_NAMESPACE,
        type: 'PERSON',
      },
    },
    is_modifiable: true,
    is_queryable: true,
  }

  const res = await fetch(`${EHRBASE_URL}/ehr`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`EHR creation failed for ${patient.id} — HTTP ${res.status}: ${await res.text()}`)
  }

  const data = await res.json() as { ehr_id: { value: string } }
  return data.ehr_id.value
}

async function createEncounter(
  ehrId: string,
  patientId: string,
  scenario: typeof SCENARIOS[number],
  encounterDate: string,
): Promise<string> {
  const flat: Record<string, string> = {
    [P.startTime]:         encounterDate,
    [P.facility]:          'AmbientScribe Clinic',
    [P.composer]:          'Dr. Seed Script',
    [P.presentingProblem]: scenario.reason,
    [P.clinicalHistory]:   scenario.history,
    [P.examFindings]:      scenario.exam,
    [P.diagnosisName]:     scenario.diagnosisName,
    [P.diagnosisCode]:     scenario.icdCode,
    [P.diagnosisTerm]:     'ICD-11',
    [P.synopsis]:          scenario.plan,
  }

  const res = await fetch(
    `${EHRBASE_URL}/ehr/${ehrId}/composition?format=FLAT&templateId=${TEMPLATE_ID}`,
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(flat),
    }
  )

  if (!res.ok) {
    throw new Error(
      `Encounter creation failed for ${patientId} — HTTP ${res.status}: ${await res.text()}`
    )
  }

  const data = await res.json() as { uid?: { value: string } }
  return data.uid?.value ?? 'unknown'
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
console.log('AmbientScribe seed script')
console.log(`EHRbase: ${EHRBASE_URL}`)
console.log(`Template: ${TEMPLATE_ID}`)
console.log()

// Verify EHRbase is reachable
const healthRes = await fetch(
  `${EHRBASE_URL}/definition/template/adl1.4`,
  { headers: { Authorization: (jsonHeaders()).Authorization, Accept: 'application/json' } }
)
if (!healthRes.ok) {
  console.error(`EHRbase not reachable (HTTP ${healthRes.status}). Is docker compose up?`)
  process.exit(1)
}

// Verify template exists
const templates = await healthRes.json() as Array<{ template_id: string }>
const templateExists = templates.some(t => t.template_id === TEMPLATE_ID)
if (!templateExists) {
  console.error(`Template "${TEMPLATE_ID}" not found. Run: npm run upload-template`)
  process.exit(1)
}

console.log(`Template "${TEMPLATE_ID}" confirmed.\n`)

let totalEHRs = 0
let totalEncounters = 0

for (let i = 0; i < PATIENTS.length; i++) {
  const patient = PATIENTS[i]
  const encounterCount = i % 3 === 0 ? 3 : 2
  const scenarioBase = i % SCENARIOS.length
  const dates = patient.overdue
    ? overdueEncounterDates(encounterCount, i)
    : activeEncounterDates(encounterCount, i)

  process.stdout.write(`  ${patient.id}  ${patient.name.padEnd(22)}`)

  const ehrId = await createEHR(patient)
  totalEHRs++

  for (let j = 0; j < encounterCount; j++) {
    const scenario = SCENARIOS[(scenarioBase + j) % SCENARIOS.length]
    await createEncounter(ehrId, patient.id, scenario, dates[j])
    totalEncounters++
    process.stdout.write('.')
  }

  const tag = patient.overdue ? ' [overdue]' : ''
  console.log(`  ehr_id: ${ehrId}${tag}`)
}

console.log()
console.log(`Done. Created ${totalEHRs} EHRs and ${totalEncounters} compositions.`)
console.log()
console.log('Verify with AQL:')
console.log("  SELECT count(c) FROM EHR e CONTAINS COMPOSITION c WHERE e/ehr_status/subject/external_ref/namespace = 'ambient_patients'")
