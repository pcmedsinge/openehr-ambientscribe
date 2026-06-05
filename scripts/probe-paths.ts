/**
 * One-shot path probe: creates a test EHR, posts a minimal FLAT composition,
 * GETs it back, prints actual FLAT keys, then cleans up.
 */
import { EHRBASE_URL, TEMPLATE_ID, jsonHeaders } from './config.ts'

// ── Create test EHR ────────────────────────────────────────────────────────
const ehrRes = await fetch(`${EHRBASE_URL}/ehr`, {
  method: 'POST',
  headers: jsonHeaders(),
  body: JSON.stringify({
    _type: 'EHR_STATUS',
    archetype_node_id: 'openEHR-EHR-EHR_STATUS.generic.v1',
    name: { value: 'Probe' },
    subject: {
      _type: 'PARTY_SELF',
      external_ref: {
        _type: 'PARTY_REF',
        id: { _type: 'GENERIC_ID', value: `PROBE-${Date.now()}`, scheme: 'probe' },
        namespace: 'probe',
        type: 'PERSON',
      },
    },
    is_modifiable: true,
    is_queryable: true,
  }),
})

if (!ehrRes.ok) {
  console.error('EHR creation failed:', ehrRes.status, await ehrRes.text())
  process.exit(1)
}

// EHRbase may return 201 with EHR ID in Location header or JSON body
let ehrId: string
const location = ehrRes.headers.get('Location') ?? ehrRes.headers.get('location') ?? ''
if (location) {
  ehrId = location.split('/').pop() ?? ''
}
if (!ehrId!) {
  const body = await ehrRes.text()
  try {
    const parsed = JSON.parse(body) as { ehr_id?: { value: string } }
    ehrId = parsed.ehr_id?.value ?? ''
  } catch { ehrId = '' }
}
if (!ehrId) {
  console.error('Could not extract EHR ID. Status:', ehrRes.status)
  process.exit(1)
}
console.log(`Test EHR: ${ehrId}`)

// ── POST FLAT composition with best-guess paths ───────────────────────────
const flat = {
  'outpatient_encounter/_name|value': 'Outpatient Encounter',
  'outpatient_encounter/language|code': 'en',
  'outpatient_encounter/language|terminology': 'ISO_639-1',
  'outpatient_encounter/territory|code': 'GB',
  'outpatient_encounter/territory|terminology': 'ISO_3166-1',
  'outpatient_encounter/context/start_time': '2026-06-05T09:00:00Z',
  'outpatient_encounter/context/setting|code': '238',
  'outpatient_encounter/context/setting|value': 'other care',
  'outpatient_encounter/context/setting|terminology': 'openehr',
  'outpatient_encounter/category|code': '433',
  'outpatient_encounter/category|value': 'event',
  'outpatient_encounter/category|terminology': 'openehr',
  'outpatient_encounter/composer|name': 'Probe',
  'outpatient_encounter/reason_for_encounter/presenting_problem:0|value': 'Test presenting problem',
  'outpatient_encounter/story/story:0|value': 'Test history',
  'outpatient_encounter/exam/description:0|value': 'Test exam findings',
  'outpatient_encounter/problem_diagnosis/problem_diagnosis_name:0|value': 'Test diagnosis',
  'outpatient_encounter/clinical_synopsis/synopsis:0|value': 'Test plan',
}

const postRes = await fetch(
  `${EHRBASE_URL}/ehr/${ehrId}/composition?format=FLAT&templateId=${TEMPLATE_ID}`,
  { method: 'POST', headers: jsonHeaders(), body: JSON.stringify(flat) }
)

if (!postRes.ok) {
  console.error('Composition POST failed:', postRes.status)
  console.error(await postRes.text())
  process.exit(1)
}

const comp = await postRes.json() as { uid?: { value: string } }
const compId = comp.uid?.value
if (!compId) {
  console.error('No composition UID in response:', JSON.stringify(comp))
  process.exit(1)
}
console.log(`Composition: ${compId}`)

// ── GET back in FLAT format ────────────────────────────────────────────────
const getRes = await fetch(
  `${EHRBASE_URL}/ehr/${ehrId}/composition/${compId}?format=FLAT`,
  { headers: jsonHeaders() }
)

if (!getRes.ok) {
  console.error('FLAT GET failed:', getRes.status, await getRes.text())
  process.exit(1)
}

const stored = await getRes.json() as Record<string, unknown>
const paths = Object.keys(stored).sort()

console.log(`\n${'═'.repeat(60)}`)
console.log(`Actual FLAT paths stored in EHRbase`)
console.log(`${'═'.repeat(60)}`)
paths.forEach(p => console.log(` ${p}  =  ${JSON.stringify(stored[p])}`))
console.log(`\nTotal: ${paths.length} paths`)
console.log('\n→ Compare these against FLAT_PATHS (P) in seed.ts and update any that differ.')
