import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
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

  const overdue = patients.filter(p => p.isOverdue).length

  return (
    <Layout>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Worklist</h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? 'Loading…' : `${patients.length} patients · ${overdue} overdue follow-up${overdue !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stats row */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Patients" value={patients.length} color="blue" />
          <StatCard label="Overdue (>12 wks)" value={overdue} color="red" />
          <StatCard label="Active" value={patients.length - overdue} color="green" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-gray-400 text-sm">Loading patients…</div>
        )}
        {error && (
          <div className="p-12 text-center text-red-500 text-sm">Error: {error}</div>
        )}
        {!loading && !error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Patient</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">ID</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Age</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Last Visit</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map(p => {
                const demo = getPatientById(p.patientId)
                return (
                  <tr
                    key={p.ehrId}
                    onClick={() => navigate(`/patient/${p.ehrId}`, { state: { patientId: p.patientId } })}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {demo?.name ?? p.patientId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{p.patientId}</td>
                    <td className="px-5 py-3.5 text-gray-600">{demo ? calcAge(demo.dob) : '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatDate(p.lastVisit)}</td>
                    <td className="px-5 py-3.5">
                      {p.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'red' | 'green' }) {
  const colors = {
    blue:  'bg-blue-50  border-blue-100  text-blue-700',
    red:   'bg-red-50   border-red-100   text-red-700',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
    </div>
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
