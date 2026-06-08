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
        <div className="bg-[#0f0f1a] rounded-xl border border-white/[0.07] p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-indigo-500/[0.15] flex items-center justify-center text-indigo-300 font-bold text-xl shrink-0">
              {demo.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-slate-100">{demo.name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{demo.id} · {demo.gender}</p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs text-slate-600 uppercase tracking-wider font-medium">Date of Birth</div>
              <div className="font-medium text-slate-200 text-sm">{demo.dob}</div>
              <div className="text-xs text-slate-500">{calcAge(demo.dob)} yrs</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f0f1a] rounded-xl border border-white/[0.07] p-6 mb-6">
          <p className="text-slate-600 text-sm font-mono">{ehrId}</p>
        </div>
      )}

      {/* Encounter history */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Encounter History</h2>
        <span className="text-xs text-slate-600">
          {!loading ? `${encounters.length} encounter${encounters.length !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      <div className="bg-[#0f0f1a] rounded-xl border border-white/[0.07] overflow-hidden">
        {loading && <div className="p-12 text-center text-slate-600 text-sm">Loading encounters…</div>}
        {error   && <div className="p-12 text-center text-rose-500 text-sm">Error: {error}</div>}
        {!loading && !error && encounters.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-600 text-sm">No encounters recorded yet.</p>
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
                <th className="text-left px-5 py-3 font-medium text-slate-600 uppercase tracking-widest text-[11px]">Date</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 uppercase tracking-widest text-[11px]">Presenting Problem</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600 uppercase tracking-widest text-[11px]">Diagnosis</th>
                <th className="px-5 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {encounters.map(enc => (
                <tr
                  key={enc.compositionId}
                  onClick={() => navigate(`/encounter/${encodeURIComponent(enc.compositionId)}`, {
                    state: { patientId, ehrId }
                  })}
                  className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap font-medium text-xs">
                    {formatDate(enc.visitDate)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-200">{enc.presentingProblem || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{enc.diagnosis || '—'}</td>
                  <td className="px-5 py-3.5 text-right">
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
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
