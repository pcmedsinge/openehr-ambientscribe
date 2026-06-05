import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { EHRbaseService, type EncounterDetail } from '../services/EHRbaseService'
import { getPatientById } from '../data/patients'

interface LocationState {
  patientId?: string
  ehrId?: string
}

export default function ViewEncounter() {
  const { compositionId } = useParams<{ compositionId: string }>()
  const { state } = useLocation()
  const { patientId, ehrId } = (state as LocationState) ?? {}
  const demo = patientId ? getPatientById(patientId) : undefined

  const [encounter, setEncounter] = useState<EncounterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!compositionId) return
    EHRbaseService.getEncounter(decodeURIComponent(compositionId))
      .then(setEncounter)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [compositionId])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(ehrId ? `/patient/${ehrId}` : '/', { state: { patientId } })}
          className="text-sm text-gray-500 hover:text-blue-700"
        >
          ← {demo?.name ?? 'Patient'}
        </button>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-blue-700 text-lg">AmbientScribe</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading && <p className="text-gray-500">Loading encounter...</p>}
        {error   && <p className="text-red-600">Error: {error}</p>}

        {encounter && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {formatDate(encounter.visitDate)}
                </h1>
                {demo && <p className="text-sm text-gray-500 mt-0.5">{demo.name} · {demo.id}</p>}
              </div>
            </div>

            <Section title="Presenting Problem">
              {encounter.presentingProblem}
            </Section>

            <Section title="Clinical History">
              {encounter.history}
            </Section>

            <Section title="Examination Findings">
              {encounter.examFindings}
            </Section>

            <Section title="Diagnosis">
              <span className="text-gray-900">{encounter.diagnosisName}</span>
              {encounter.diagnosisCode && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                  {encounter.diagnosisCode}
                </span>
              )}
            </Section>

            <Section title="Management Plan">
              {encounter.managementPlan}
            </Section>
          </div>
        )}
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h2>
      <p className="text-gray-800 text-sm leading-relaxed">{children || <span className="text-gray-300">—</span>}</p>
    </div>
  )
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
