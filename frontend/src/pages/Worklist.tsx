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
        <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Patient Worklist</h1>
        <p className="text-sm text-slate-500 mt-1">
          {loading ? 'Loading…' : `${patients.length} patients · ${overdue} overdue follow-up${overdue !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stats row */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Patients"   value={patients.length}          color="indigo" />
          <StatCard label="Overdue (>12 wks)" value={overdue}                 color="rose"   />
          <StatCard label="Active"            value={patients.length - overdue} color="emerald" />
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0f0f1a] rounded-xl border border-white/[0.07] overflow-hidden">
        {loading && (
          <div className="p-16 text-center text-slate-600 text-sm">Loading patients…</div>
        )}
        {error && (
          <div className="p-16 text-center text-rose-500 text-sm">Error: {error}</div>
        )}
        {!loading && !error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 font-medium text-slate-600 uppercase tracking-widest text-[11px]">Patient</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 uppercase tracking-widest text-[11px]">ID</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 uppercase tracking-widest text-[11px]">Age</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 uppercase tracking-widest text-[11px]">Last Visit</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 uppercase tracking-widest text-[11px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {patients.map(p => {
                const demo = getPatientById(p.patientId)
                const initials = (demo?.name ?? p.patientId).slice(0, 2).toUpperCase()
                return (
                  <tr
                    key={p.ehrId}
                    onClick={() => navigate(`/patient/${p.ehrId}`, { state: { patientId: p.patientId } })}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/[0.15] text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                          {demo?.name ?? p.patientId}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{p.patientId}</td>
                    <td className="px-5 py-3.5 text-slate-400">{demo ? calcAge(demo.dob) : '—'}</td>
                    <td className="px-5 py-3.5 text-slate-400">{formatDate(p.lastVisit)}</td>
                    <td className="px-5 py-3.5">
                      {p.isOverdue ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/[0.10] text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 overdue-dot shrink-0" />
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/[0.10] text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
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

function StatCard({ label, value, color }: { label: string; value: number; color: 'indigo' | 'rose' | 'emerald' }) {
  const cfg = {
    indigo:  { bg: 'bg-indigo-500/[0.08]',  border: 'border-indigo-500/20',  val: 'text-indigo-300',  sub: 'text-indigo-400/60'  },
    rose:    { bg: 'bg-rose-500/[0.08]',    border: 'border-rose-500/20',    val: 'text-rose-300',    sub: 'text-rose-400/60'    },
    emerald: { bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/20', val: 'text-emerald-300', sub: 'text-emerald-400/60' },
  }
  const c = cfg[color]
  return (
    <div className={`rounded-xl border p-5 ${c.bg} ${c.border}`}>
      <p className={`text-3xl font-bold tabular-nums ${c.val}`}>{value}</p>
      <p className={`text-xs font-medium mt-1.5 ${c.sub}`}>{label}</p>
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
