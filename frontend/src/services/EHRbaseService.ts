import { TEMPLATE_ID, PATIENT_NAMESPACE, AQL, FLAT, FLAT_READ, FLAT_DEFAULTS } from '../config/template-config'

const OPENEHR = '/ehrbase/rest/openehr/v1'
const ECIS    = '/ehrbase/rest/ecis/v1'
const CREDENTIALS = btoa('ehrbase-user:SuperSecretPassword1')

function headers(extra?: Record<string, string>) {
  return {
    Authorization: `Basic ${CREDENTIALS}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  }
}

async function aql<T>(query: string): Promise<T[]> {
  const res = await fetch(`${OPENEHR}/query/aql`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ q: query }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('AQL failed:', query, err)
    return []
  }
  const data = await res.json() as { rows: T[] }
  return data.rows ?? []
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PatientRow {
  ehrId: string
  patientId: string
  lastVisit: string        // ISO date string
  isOverdue: boolean
}

export interface EncounterRow {
  compositionId: string
  visitDate: string
  presentingProblem: string
  diagnosis: string
}

export interface EncounterDetail {
  compositionId: string
  ehrId: string        // EHR UUID — used to resolve patient demographics if not in nav state
  visitDate: string
  presentingProblem: string
  history: string
  examFindings: string
  diagnosisName: string
  diagnosisCode: string
  managementPlan: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TWELVE_WEEKS_MS = 12 * 7 * 24 * 60 * 60 * 1000

function isOverdue(lastVisitDate: string): boolean {
  return Date.now() - new Date(lastVisitDate).getTime() > TWELVE_WEEKS_MS
}

// ── Public API ───────────────────────────────────────────────────────────────

export const EHRbaseService = {

  // Returns all patients with their most recent visit date.
  // AQL returns one row per composition; we group by EHR in JS.
  async getPatients(): Promise<PatientRow[]> {
    const rows = await aql<[string, string, string]>(`
      SELECT
        ${AQL.ehrId}     as ehr_id,
        ${AQL.patientId} as patient_id,
        ${AQL.startTime} as visit_date
      FROM EHR e
      CONTAINS COMPOSITION c
      WHERE ${AQL.namespace} = '${PATIENT_NAMESPACE}'
      ORDER BY ${AQL.startTime} DESC
    `)

    // Group by EHR — first row per EHR is the most recent (ordered DESC)
    const seen = new Map<string, PatientRow>()
    for (const [ehrId, patientId, visitDate] of rows) {
      if (!seen.has(ehrId)) {
        seen.set(ehrId, {
          ehrId,
          patientId,
          lastVisit: visitDate,
          isOverdue: isOverdue(visitDate),
        })
      }
    }

    return [...seen.values()].sort((a, b) => a.patientId.localeCompare(b.patientId))
  },

  // Returns all encounters for one patient, most recent first.
  async getEncounters(ehrId: string): Promise<EncounterRow[]> {
    // Query reason_for_encounter and problem_diagnosis separately to avoid
    // multi-archetype join issues in EHRbase 0.30 (known silent-empty gotcha).

    const reasonRows = await aql<[string, string, string]>(`
      SELECT
        ${AQL.compUid}   as uid,
        ${AQL.startTime} as visit_date,
        ${AQL.presenting} as presenting_problem
      FROM EHR e
      CONTAINS COMPOSITION c
      CONTAINS EVALUATION eval_rfe[openEHR-EHR-EVALUATION.reason_for_encounter.v1]
      WHERE e/ehr_id/value = '${ehrId}'
      ORDER BY ${AQL.startTime} DESC
    `)

    const diagRows = await aql<[string, string]>(`
      SELECT
        ${AQL.compUid}  as uid,
        ${AQL.diagName} as diagnosis
      FROM EHR e
      CONTAINS COMPOSITION c
      CONTAINS EVALUATION eval_pd[openEHR-EHR-EVALUATION.problem_diagnosis.v1]
      WHERE e/ehr_id/value = '${ehrId}'
    `)

    const diagMap = new Map(diagRows.map(([uid, diag]) => [uid, diag]))

    return reasonRows.map(([uid, visitDate, presenting]) => ({
      compositionId: uid,
      visitDate,
      presentingProblem: presenting ?? '',
      diagnosis: diagMap.get(uid) ?? '',
    }))
  },

  // Returns the full detail of one encounter in FLAT format.
  async getEncounter(compositionId: string): Promise<EncounterDetail | null> {
    const res = await fetch(`${ECIS}/composition/${compositionId}?format=FLAT`, {
      headers: headers(),
    })

    if (!res.ok) {
      console.error('getEncounter failed:', res.status, await res.text())
      return null
    }

    const data = await res.json() as { composition?: Record<string, string>; ehrId?: string }
    const flat = data.composition ?? (data as unknown as Record<string, string>)

    return {
      compositionId,
      ehrId:             data.ehrId ?? '',
      visitDate:         flat[FLAT_READ.startTime]   ?? '',
      presentingProblem: flat[FLAT_READ.presenting]  ?? '',
      history:           flat[FLAT_READ.story]       ?? '',
      examFindings:      flat[FLAT_READ.exam]        ?? '',
      diagnosisName:     flat[FLAT_READ.diagName]    ?? '',
      diagnosisCode:     flat[FLAT_READ.diagCode]    ?? '',
      managementPlan:    flat[FLAT_READ.synopsis]    ?? '',
    }
  },

  // Resolves the patient ID (e.g. AMB-010) from an EHR UUID.
  // Used as fallback when nav state doesn't carry patientId.
  async resolvePatientId(ehrId: string): Promise<string> {
    const rows = await aql<[string]>(`
      SELECT ${AQL.patientId} as patient_id
      FROM EHR e
      WHERE ${AQL.ehrId} = '${ehrId}'
    `)
    return rows[0]?.[0] ?? ''
  },

  // Creates a new encounter composition.
  async createEncounter(
    ehrId: string,
    fields: {
      visitDate: string
      presentingProblem: string
      history: string
      examFindings: string
      diagnosisName: string
      diagnosisCode: string
      managementPlan: string
      composerName?: string
    }
  ): Promise<string> {
    const raw: Record<string, string> = {
      ...FLAT_DEFAULTS,
      [FLAT.startTime]:  fields.visitDate,
      [FLAT.storyTime]:  fields.visitDate,
      [FLAT.examTime]:   fields.visitDate,
      [FLAT.composer]:   fields.composerName ?? 'AmbientScribe',
      [FLAT.presenting]: fields.presentingProblem,
      [FLAT.story]:      fields.history,
      [FLAT.exam]:       fields.examFindings,
      [FLAT.diagName]:   fields.diagnosisName,
      // DV_CODED_TEXT always requires a non-empty code + terminology.
      // Use the provided ICD-11 code, or fall back to "local" terminology
      // with "unspecified" so the field is always valid.
      [FLAT.diagCode]:   fields.diagnosisCode.trim() || 'unspecified',
      [FLAT.diagTerm]:   fields.diagnosisCode.trim() ? 'ICD-11' : 'local',
      [FLAT.synopsis]:   fields.managementPlan,
    }

    // Strip any field with an empty or whitespace-only value before posting.
    // Sending empty strings for optional fields can cause EHRbase validation
    // errors. This also future-proofs Phase 4 where AI extraction may return
    // empty strings for fields it could not extract.
    const flat = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v.trim() !== '')
    )

    const res = await fetch(
      `${ECIS}/composition?format=FLAT&templateId=${TEMPLATE_ID}&ehrId=${ehrId}`,
      { method: 'POST', headers: headers(), body: JSON.stringify(flat) }
    )

    if (!res.ok) throw new Error(`Create encounter failed: ${await res.text()}`)
    const data = await res.json() as { compositionUid: string }
    return data.compositionUid
  },
}
