import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { EHRbaseService, type EncounterDetail } from '../services/EHRbaseService'
import { getPatientById } from '../data/patients'

interface LocationState { patientId?: string; ehrId?: string }

const SECTIONS = [
  { key: 'presentingProblem', label: 'Presenting Problem',    color: 'border-blue-400'    },
  { key: 'history',           label: 'Clinical History',      color: 'border-purple-400'  },
  { key: 'examFindings',      label: 'Examination Findings',  color: 'border-teal-400'    },
  { key: 'diagnosisName',     label: 'Diagnosis',             color: 'border-amber-400'   },
  { key: 'managementPlan',    label: 'Management Plan',       color: 'border-emerald-400' },
] as const

export default function ViewEncounter() {
  const { compositionId } = useParams<{ compositionId: string }>()
  const { state } = useLocation()
  const { patientId, ehrId } = (state as LocationState) ?? {}
  const demo = patientId ? getPatientById(patientId) : undefined

  const [encounter, setEncounter] = useState<EncounterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!compositionId) return
    EHRbaseService.getEncounter(decodeURIComponent(compositionId))
      .then(setEncounter)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [compositionId])

  const breadcrumbs = [
    { label: 'Worklist', to: '/' },
    { label: demo?.name ?? 'Patient', to: ehrId ? `/patient/${ehrId}` : undefined },
    { label: encounter ? formatDate(encounter.visitDate) : 'Encounter' },
  ]

  return (
    <Layout breadcrumbs={breadcrumbs}>
      {loading && <div className="py-20 text-center text-gray-400 text-sm">Loading encounter…</div>}
      {error   && <div className="py-20 text-center text-red-500 text-sm">Error: {error}</div>}

      {encounter && (
        <div className="space-y-4">
          {/* Encounter header */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{formatDate(encounter.visitDate)}</h1>
              {demo && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {demo.name} · {demo.id} · {demo.gender}
                </p>
              )}
            </div>
            {encounter.diagnosisCode && (
              <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-mono font-medium">
                {encounter.diagnosisCode}
              </span>
            )}
          </div>

          {/* Clinical sections */}
          {SECTIONS.map(section => {
            const value = encounter[section.key as keyof EncounterDetail]
            return (
              <div key={section.key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className={`border-l-4 ${section.color} pl-4`}>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {section.label}
                  </h2>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {value || <span className="text-gray-300 italic">Not recorded</span>}
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
