import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { EHRbaseService, type EncounterRow } from '../services/EHRbaseService'
import { getPatientById } from '../data/patients'

interface LocationState { patientId?: string }

export default function PatientDetail() {
  const { ehrId } = useParams<{ ehrId: string }>()
  const { state } = useLocation()
  const patientId = (state as LocationState)?.patientId
  const demo = patientId ? getPatientById(patientId) : undefined

  const [encounters, setEncounters] = useState<EncounterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!ehrId) return
    EHRbaseService.getEncounters(ehrId)
      .then(setEncounters)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [ehrId])

  const breadcrumbs = [
    { label: 'Worklist', to: '/' },
    { label: demo?.name ?? ehrId ?? 'Patient' },
  ]

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      action={
        <Button onClick={() => navigate(`/patient/${ehrId}/new-encounter`, { state: { patientId, ehrId } })}>
          + New Encounter
        </Button>
      }
    >
      {/* Patient card */}
      {demo ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0">
              {demo.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{demo.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{demo.id} · {demo.gender}</p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-gray-500">Date of Birth</div>
              <div className="font-medium text-gray-900">{demo.dob}</div>
              <div className="text-xs text-gray-400">{calcAge(demo.dob)} years old</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <p className="text-gray-400 text-sm font-mono">{ehrId}</p>
        </div>
      )}

      {/* Encounter history */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Encounter History</h2>
        <span className="text-sm text-gray-400">{!loading ? `${encounters.length} encounter${encounters.length !== 1 ? 's' : ''}` : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading && <div className="p-10 text-center text-gray-400 text-sm">Loading encounters…</div>}
        {error   && <div className="p-10 text-center text-red-500 text-sm">Error: {error}</div>}
        {!loading && !error && encounters.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-gray-400 text-sm">No encounters recorded yet.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => navigate(`/patient/${ehrId}/new-encounter`, { state: { patientId, ehrId } })}
            >
              Record first encounter
            </Button>
          </div>
        )}
        {!loading && encounters.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Presenting Problem</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Diagnosis</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {encounters.map(enc => (
                <tr
                  key={enc.compositionId}
                  onClick={() => navigate(`/encounter/${encodeURIComponent(enc.compositionId)}`, {
                    state: { patientId, ehrId }
                  })}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap font-medium">
                    {formatDate(enc.visitDate)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-900">{enc.presentingProblem || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500">{enc.diagnosis || '—'}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-lg">›</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

function calcAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
