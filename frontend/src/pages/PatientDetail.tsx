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
    <Layout breadcrumbs={breadcrumbs}>

      {/* Patient card — avatar, demographics, and action all in one row */}
      <div className="bg-[#0f0f1a] rounded-xl border border-white/[0.07] p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/[0.15] flex items-center justify-center
            text-indigo-300 font-bold text-lg shrink-0">
            {(demo?.name ?? ehrId ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-slate-100 leading-tight">
              {demo?.name ?? <span className="font-mono text-sm text-slate-400">{ehrId}</span>}
            </h1>
            {demo && (
              <p className="text-sm text-slate-500 mt-0.5">
                {demo.id}
                <span className="mx-2 text-slate-700">·</span>
                {demo.gender}
                <span className="mx-2 text-slate-700">·</span>
                DOB {formatDate(demo.dob)}
                <span className="mx-2 text-slate-700">·</span>
                {calcAge(demo.dob)} yrs
              </p>
            )}
          </div>
          <Button onClick={() => navigate(`/patient/${ehrId}/new-encounter`, { state: { patientId, ehrId } })}>
            + New Encounter
          </Button>
        </div>
      </div>

      {/* Encounter history header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-0.5 h-4 rounded-full bg-indigo-500 shrink-0" />
          <h2 className="text-sm font-semibold text-slate-300">Encounter History</h2>
        </div>
        {!loading && (
          <span className="text-xs text-slate-500 tabular-nums">
            {encounters.length} encounter{encounters.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Encounter table */}
      <div className="bg-[#0f0f1a] rounded-xl border border-white/[0.07] overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-slate-600 text-sm">Loading encounters…</div>
        )}
        {error && (
          <div className="p-12 text-center text-rose-500 text-sm">Error: {error}</div>
        )}
        {!loading && !error && encounters.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm">No encounters recorded yet.</p>
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
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-600 uppercase tracking-widest w-36">Date</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-600 uppercase tracking-widest">Presenting Problem</th>
                <th className="text-left px-5 py-3 text-[11px] font-medium text-slate-600 uppercase tracking-widest w-56">Diagnosis</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {encounters.map(enc => (
                <tr
                  key={enc.compositionId}
                  onClick={() => navigate(`/encounter/${encodeURIComponent(enc.compositionId)}`, {
                    state: { patientId, ehrId }
                  })}
                  className="hover:bg-white/[0.05] cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap text-xs tabular-nums">
                    {formatDate(enc.visitDate)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-200 max-w-xs">
                    <span className="line-clamp-2 leading-snug">{enc.presentingProblem || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{enc.diagnosis || '—'}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-slate-700 group-hover:text-indigo-400 transition-colors text-base">›</span>
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
  if (today.getMonth() < birth.getMonth() ||
     (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
