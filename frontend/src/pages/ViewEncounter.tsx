import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { EHRbaseService, type EncounterDetail } from '../services/EHRbaseService'
import { getPatientById, type PatientDemographics } from '../data/patients'

interface LocationState { patientId?: string; ehrId?: string }

const SECTIONS = [
  { key: 'presentingProblem', label: 'Presenting Problem',   accent: 'border-indigo-500'  },
  { key: 'history',           label: 'Clinical History',     accent: 'border-violet-500'  },
  { key: 'examFindings',      label: 'Examination Findings', accent: 'border-cyan-500'    },
  { key: 'diagnosisName',     label: 'Diagnosis',            accent: 'border-amber-500'   },
  { key: 'managementPlan',    label: 'Management Plan',      accent: 'border-emerald-500' },
] as const

export default function ViewEncounter() {
  const { compositionId } = useParams<{ compositionId: string }>()
  const { state } = useLocation()
  const navState = (state as LocationState) ?? {}
  const navigate = useNavigate()

  const [encounter, setEncounter] = useState<EncounterDetail | null>(null)
  const [demo, setDemo] = useState<PatientDemographics | undefined>(
    navState.patientId ? getPatientById(navState.patientId) : undefined
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    if (!compositionId) return
    EHRbaseService.getEncounter(decodeURIComponent(compositionId))
      .then(async enc => {
        setEncounter(enc)
        if (enc && !demo) {
          const ehrId = navState.ehrId ?? enc.ehrId
          if (ehrId) {
            const patientId = await EHRbaseService.resolvePatientId(ehrId)
            if (patientId) setDemo(getPatientById(patientId))
          }
        }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [compositionId])

  async function handleEdit() {
    if (!compositionId) return
    const ehrId = navState.ehrId ?? encounter?.ehrId
    if (!ehrId) return
    setEditLoading(true)
    try {
      const result = await EHRbaseService.getEncounterWithETag(decodeURIComponent(compositionId))
      if (!result) return
      const patientId = navState.patientId ?? demo?.id
      navigate(`/patient/${ehrId}/new-encounter`, {
        state: {
          patientId,
          ehrId,
          mode: 'edit',
          compositionId: decodeURIComponent(compositionId),
          etag: result.etag,
          visitDate: result.detail.visitDate,
          prefill: {
            presentingProblem: result.detail.presentingProblem,
            history:           result.detail.history,
            examFindings:      result.detail.examFindings,
            diagnosisName:     result.detail.diagnosisName,
            diagnosisCode:     result.detail.diagnosisCode,
            managementPlan:    result.detail.managementPlan,
          },
        },
      })
    } finally {
      setEditLoading(false)
    }
  }

  const ehrId = navState.ehrId ?? encounter?.ehrId
  const breadcrumbs = [
    { label: 'Worklist', to: '/' },
    { label: demo?.name ?? 'Patient', to: ehrId ? `/patient/${ehrId}` : undefined },
    { label: encounter ? formatDate(encounter.visitDate) : 'Encounter' },
  ]

  return (
    <Layout breadcrumbs={breadcrumbs}>
      {loading && <div className="py-24 text-center text-slate-600 text-sm">Loading encounter…</div>}
      {error   && <div className="py-24 text-center text-rose-500 text-sm">Error: {error}</div>}

      {encounter && (
        <div className="space-y-3">
          {/* Encounter header card */}
          <div className="bg-[#0f0f1a] rounded-xl border border-white/[0.07] p-5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-100">{formatDate(encounter.visitDate)}</h1>
              {demo && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {demo.name} · {demo.id} · {demo.gender}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {encounter.diagnosisCode && encounter.diagnosisCode !== 'unspecified' && (
                <span className="text-xs bg-amber-500/[0.12] border border-amber-500/25 text-amber-300
                  px-3 py-1 rounded-full font-mono font-medium">
                  ICD-11: {encounter.diagnosisCode}
                </span>
              )}
              <Button variant="secondary" size="sm" loading={editLoading} onClick={handleEdit}>
                Edit
              </Button>
            </div>
          </div>

          {/* Clinical sections */}
          {SECTIONS.map(section => {
            const value = encounter[section.key as keyof EncounterDetail]
            return (
              <div key={section.key} className="bg-[#0f0f1a] rounded-xl border border-white/[0.07] p-5">
                <div className={`border-l-2 ${section.accent} pl-4`}>
                  <h2 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
                    {section.label}
                  </h2>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {value || <span className="text-slate-700 italic text-xs">Not recorded</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
