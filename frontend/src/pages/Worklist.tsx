import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EHRbaseService, type PatientRow } from '../services/EHRbaseService'
import { getPatientById } from '../data/patients'

export default function Worklist() {
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    EHRbaseService.getPatients()
      .then(setPatients)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageShell><p className="text-gray-500 py-12 text-center">Loading patients...</p></PageShell>
  if (error)   return <PageShell><p className="text-red-600 py-12 text-center">Error: {error}</p></PageShell>

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patient Worklist</h1>
          <p className="text-sm text-gray-500 mt-1">{patients.length} patients</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date of Birth</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Last Visit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map(p => {
              const demo = getPatientById(p.patientId)
              return (
                <tr
                  key={p.ehrId}
                  onClick={() => navigate(`/patient/${p.ehrId}`, { state: { patientId: p.patientId } })}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{demo?.name ?? p.patientId}</td>
                  <td className="px-4 py-3 text-gray-500">{p.patientId}</td>
                  <td className="px-4 py-3 text-gray-500">{demo?.dob ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(p.lastVisit)}</td>
                  <td className="px-4 py-3">
                    {p.isOverdue
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Overdue</span>
                      : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Active</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <span className="font-semibold text-blue-700 text-lg">AmbientScribe</span>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
