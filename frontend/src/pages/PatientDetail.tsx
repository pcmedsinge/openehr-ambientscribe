import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { EHRbaseService, type EncounterRow } from '../services/EHRbaseService'
import { getPatientById } from '../data/patients'

interface LocationState {
  patientId?: string
}

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-blue-700"
        >
          ← Worklist
        </button>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-blue-700 text-lg">AmbientScribe</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Demographics header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {demo ? (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{demo.name}</h1>
                <p className="text-sm text-gray-500 mt-1">{demo.id}</p>
              </div>
              <div className="text-right text-sm text-gray-500 space-y-1">
                <p>DOB: <span className="text-gray-700">{demo.dob}</span></p>
                <p>Gender: <span className="text-gray-700">{demo.gender}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">EHR: {ehrId}</p>
          )}
        </div>

        {/* Encounter history */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Encounter History</h2>

          {loading && <p className="text-gray-500">Loading encounters...</p>}
          {error   && <p className="text-red-600">Error: {error}</p>}
          {!loading && !error && encounters.length === 0 && (
            <p className="text-gray-500">No encounters found.</p>
          )}

          {!loading && encounters.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Presenting Problem</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Diagnosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {encounters.map(enc => (
                    <tr
                      key={enc.compositionId}
                      onClick={() => navigate(`/encounter/${encodeURIComponent(enc.compositionId)}`, {
                        state: { patientId, ehrId }
                      })}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(enc.visitDate)}</td>
                      <td className="px-4 py-3 text-gray-900">{enc.presentingProblem || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{enc.diagnosis || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
