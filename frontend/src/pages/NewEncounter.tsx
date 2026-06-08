import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { EHRbaseService } from '../services/EHRbaseService'
import { extractEncounterFields } from '../services/OpenAIService'
import { getPatientById } from '../data/patients'

interface FormData {
  presentingProblem: string
  history: string
  examFindings: string
  diagnosisName: string
  diagnosisCode: string
  managementPlan: string
}

interface LocationState {
  patientId?: string
  ehrId?: string
  mode?: 'edit'
  compositionId?: string
  etag?: string
  visitDate?: string
  prefill?: Partial<FormData>
}

const EMPTY: FormData = {
  presentingProblem: '',
  history: '',
  examFindings: '',
  diagnosisName: '',
  diagnosisCode: '',
  managementPlan: '',
}

const GLOW_DELAY: Record<keyof FormData, string> = {
  presentingProblem: '0ms',
  history:           '160ms',
  examFindings:      '320ms',
  diagnosisName:     '480ms',
  diagnosisCode:     '560ms',
  managementPlan:    '660ms',
}

export default function NewEncounter() {
  const { ehrId } = useParams<{ ehrId: string }>()
  const { state } = useLocation()
  const nav = (state as LocationState) ?? {}
  const patientId = nav.patientId
  const editMode = nav.mode === 'edit'
  const demo = patientId ? getPatientById(patientId) : undefined

  const [form, setForm] = useState<FormData>(nav.prefill ? { ...EMPTY, ...nav.prefill } : EMPTY)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()

  const [note, setNote] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState<'idle' | 'done' | 'error'>('idle')
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractionTick, setExtractionTick] = useState(0)

  const noteRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = noteRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [note])

  useEffect(() => {
    if (extractionTick === 0) return
    document.querySelectorAll<HTMLTextAreaElement>('[data-autoresize]').forEach(el => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    })
  }, [extractionTick])

  const set = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
      if (e.target instanceof HTMLTextAreaElement) {
        e.target.style.height = 'auto'
        e.target.style.height = `${e.target.scrollHeight}px`
      }
    },
    [errors]
  )

  async function handleExtract() {
    if (!note.trim()) return
    setExtracting(true)
    setExtractStatus('idle')
    setExtractError(null)
    try {
      const fields = await extractEncounterFields(note)
      setForm(f => ({
        ...f,
        ...Object.fromEntries(
          Object.entries(fields).filter(([, v]) => (v as string).trim() !== '')
        ) as Partial<FormData>,
      }))
      setExtractionTick(t => t + 1)
      setExtractStatus('done')
    } catch (e) {
      setExtractStatus('error')
      setExtractError(e instanceof Error ? e.message : String(e))
    } finally {
      setExtracting(false)
    }
  }

  function validate(): boolean {
    const e: Partial<FormData> = {}
    if (!form.presentingProblem.trim()) e.presentingProblem = 'Required'
    if (!form.history.trim())           e.history           = 'Required'
    if (!form.examFindings.trim())      e.examFindings      = 'Required'
    if (!form.diagnosisName.trim())     e.diagnosisName     = 'Required'
    if (!form.managementPlan.trim())    e.managementPlan    = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate() || !ehrId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        visitDate:         nav.visitDate ?? new Date().toISOString(),
        presentingProblem: form.presentingProblem,
        history:           form.history,
        examFindings:      form.examFindings,
        diagnosisName:     form.diagnosisName,
        diagnosisCode:     form.diagnosisCode,
        managementPlan:    form.managementPlan,
        composerName:      'AmbientScribe',
      }
      let uid: string
      if (editMode && nav.compositionId && nav.etag) {
        uid = await EHRbaseService.updateEncounter(nav.compositionId, nav.etag, payload)
      } else {
        uid = await EHRbaseService.createEncounter(ehrId, payload)
      }
      navigate(`/encounter/${encodeURIComponent(uid)}`, { state: { patientId, ehrId } })
    } catch (e) {
      setSubmitError(String(e))
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: 'Worklist', to: '/' },
    { label: demo?.name ?? 'Patient', to: ehrId ? `/patient/${ehrId}` : undefined },
    { label: editMode ? 'Edit Encounter' : 'New Encounter' },
  ]

  const glow = (field: keyof FormData, val: string) =>
    extractionTick > 0 && val.trim()
      ? { extraClass: 'field-glow', style: { animationDelay: GLOW_DELAY[field] } as React.CSSProperties }
      : { extraClass: '', style: undefined }

  return (
    <Layout breadcrumbs={breadcrumbs}>

      {/* ── Patient context strip ───────────────────────────────────── */}
      {demo && (
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-9 h-9 rounded-full bg-indigo-500/[0.18] text-indigo-300
            font-bold text-sm flex items-center justify-center shrink-0">
            {demo.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-100 text-sm leading-none">{demo.name}</p>
            <p className="text-slate-500 text-xs mt-0.5">{demo.id} · {demo.gender}</p>
          </div>
        </div>
      )}

      {/* ── Two-column body ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 items-start pb-20">

        {/* ════ LEFT — Clinical Note input ═══════════════════════════ */}
        <div className="sticky top-20 flex flex-col gap-4">

          {/* Panel header */}
          <div>
            <h2 className="text-base font-semibold text-slate-200">Clinical Note</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Paste a transcript or dictation below
            </p>
          </div>

          {/* Note textarea card */}
          <div className={`rounded-xl border transition-all duration-300
            bg-[#0d0d1c]
            ${extracting
              ? 'ai-extracting'
              : 'border-white/[0.09] focus-within:border-indigo-500/40'
            }`}>
            <textarea
              ref={noteRef}
              rows={10}
              placeholder="e.g. 62-year-old female presenting with worsening shortness of breath…

Include history, examination findings, diagnosis and plan for best results."
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={extracting}
              className="w-full bg-transparent text-[13px] leading-relaxed text-slate-200
                px-4 pt-4 pb-3 resize-none overflow-hidden
                focus:outline-none placeholder:text-slate-600
                disabled:opacity-60"
            />

            {/* Extract button row — inside the card */}
            <div className="px-4 pb-4 flex items-center justify-between gap-3">
              <div className="text-xs">
                {extractStatus === 'done' && (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Fields extracted — review &amp; edit on the right
                  </span>
                )}
                {extractStatus === 'error' && (
                  <span className="text-rose-400 text-xs">{extractError}</span>
                )}
              </div>
              <Button
                variant="ai"
                size="sm"
                loading={extracting}
                disabled={!note.trim() || extracting}
                onClick={handleExtract}
              >
                {extracting ? 'Extracting…' : 'Extract with AI'}
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-700 text-center">
            All extracted fields are editable
          </p>
        </div>

        {/* ════ RIGHT — Editable structured fields ═══════════════════ */}
        <div className="space-y-5">

          {/* History */}
          <Section title="History">
            <Field label="Presenting Problem" required error={errors.presentingProblem}>
              <textarea
                key={`pp-${extractionTick}`}
                data-autoresize
                rows={2}
                placeholder="Why is the patient here today?"
                value={form.presentingProblem}
                onChange={set('presentingProblem')}
                className={`${fc(!!errors.presentingProblem)} ${glow('presentingProblem', form.presentingProblem).extraClass}`}
                style={glow('presentingProblem', form.presentingProblem).style}
              />
            </Field>
            <Field label="Clinical History" required error={errors.history}>
              <textarea
                key={`hist-${extractionTick}`}
                data-autoresize
                rows={3}
                placeholder="History of presenting complaint, background, medications, allergies…"
                value={form.history}
                onChange={set('history')}
                className={`${fc(!!errors.history)} ${glow('history', form.history).extraClass}`}
                style={glow('history', form.history).style}
              />
            </Field>
          </Section>

          <Divider />

          {/* Examination */}
          <Section title="Examination">
            <Field label="Examination Findings" required error={errors.examFindings}>
              <textarea
                key={`exam-${extractionTick}`}
                data-autoresize
                rows={3}
                placeholder="Vital signs, system examination findings, investigations reviewed…"
                value={form.examFindings}
                onChange={set('examFindings')}
                className={`${fc(!!errors.examFindings)} ${glow('examFindings', form.examFindings).extraClass}`}
                style={glow('examFindings', form.examFindings).style}
              />
            </Field>
          </Section>

          <Divider />

          {/* Diagnosis */}
          <Section title="Diagnosis">
            <div className="grid grid-cols-[1fr_148px] gap-3">
              <Field label="Diagnosis" required error={errors.diagnosisName}>
                <input
                  key={`diag-${extractionTick}`}
                  type="text"
                  placeholder="e.g. Hypertensive heart disease"
                  value={form.diagnosisName}
                  onChange={set('diagnosisName')}
                  className={`${fc(!!errors.diagnosisName)} ${glow('diagnosisName', form.diagnosisName).extraClass}`}
                  style={glow('diagnosisName', form.diagnosisName).style}
                />
              </Field>
              <Field label="ICD-11 Code">
                <input
                  key={`code-${extractionTick}`}
                  type="text"
                  placeholder="e.g. BA80"
                  value={form.diagnosisCode}
                  onChange={set('diagnosisCode')}
                  className={`${fc(false)} ${glow('diagnosisCode', form.diagnosisCode).extraClass}`}
                  style={glow('diagnosisCode', form.diagnosisCode).style}
                />
              </Field>
            </div>
          </Section>

          <Divider />

          {/* Management Plan */}
          <Section title="Management Plan">
            <Field label="Plan" required error={errors.managementPlan}>
              <textarea
                key={`plan-${extractionTick}`}
                data-autoresize
                rows={3}
                placeholder="Medications, referrals, investigations, follow-up timing…"
                value={form.managementPlan}
                onChange={set('managementPlan')}
                className={`${fc(!!errors.managementPlan)} ${glow('managementPlan', form.managementPlan).extraClass}`}
                style={glow('managementPlan', form.managementPlan).style}
              />
            </Field>
          </Section>

        </div>
      </div>

      {/* ── Fixed bottom action bar — always visible ────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.07]
        bg-[#07070f]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/patient/${ehrId}`, { state: { patientId } })}
          >
            ← Cancel
          </Button>
          {submitError && (
            <p className="text-xs text-rose-400 truncate flex-1 text-center">{submitError}</p>
          )}
          <Button loading={submitting} onClick={submit}>
            {editMode ? 'Save Changes' : 'Submit Encounter'}
          </Button>
        </div>
      </div>

    </Layout>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-0.5 h-4 rounded-full bg-indigo-500 shrink-0" />
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-white/[0.05]" />
}

function Field({
  label, required, error, children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
        {required && <span className="text-rose-500 text-xs">*</span>}
      </div>
      {children}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

function fc(hasError: boolean) {
  return [
    'w-full rounded-lg border text-sm text-slate-100 px-3 py-2.5',
    'resize-none overflow-hidden',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50',
    'placeholder:text-slate-600 transition-all duration-200',
    hasError
      ? 'border-rose-500/40 bg-rose-500/[0.05]'
      : 'border-white/[0.08] bg-[#141420] hover:border-white/[0.16]',
  ].join(' ')
}
