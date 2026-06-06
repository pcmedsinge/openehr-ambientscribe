import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { EHRbaseService } from '../services/EHRbaseService'
import { getPatientById } from '../data/patients'

interface LocationState { patientId?: string }

interface FormData {
  presentingProblem: string
  history: string
  examFindings: string
  diagnosisName: string
  diagnosisCode: string
  managementPlan: string
}

const EMPTY: FormData = {
  presentingProblem: '',
  history: '',
  examFindings: '',
  diagnosisName: '',
  diagnosisCode: '',
  managementPlan: '',
}

const STEPS = [
  { number: 1, title: 'History',     subtitle: 'Reason for visit and clinical history'  },
  { number: 2, title: 'Examination', subtitle: 'Physical examination findings'          },
  { number: 3, title: 'Diagnosis',   subtitle: 'Diagnosis and coding'                  },
  { number: 4, title: 'Plan',        subtitle: 'Management plan and review'             },
]

export default function NewEncounter() {
  const { ehrId } = useParams<{ ehrId: string }>()
  const { state } = useLocation()
  const patientId = (state as LocationState)?.patientId
  const demo = patientId ? getPatientById(patientId) : undefined

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }))
  }

  function validate(): boolean {
    const e: Partial<FormData> = {}
    if (step === 1) {
      if (!form.presentingProblem.trim()) e.presentingProblem = 'Required'
      if (!form.history.trim()) e.history = 'Required'
    }
    if (step === 2) {
      if (!form.examFindings.trim()) e.examFindings = 'Required'
    }
    if (step === 3) {
      if (!form.diagnosisName.trim()) e.diagnosisName = 'Required'
    }
    if (step === 4) {
      if (!form.managementPlan.trim()) e.managementPlan = 'Required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (validate()) setStep(s => s + 1)
  }

  function back() {
    setErrors({})
    setStep(s => s - 1)
  }

  async function submit() {
    if (!validate() || !ehrId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const uid = await EHRbaseService.createEncounter(ehrId, {
        visitDate:        new Date().toISOString(),
        presentingProblem: form.presentingProblem,
        history:          form.history,
        examFindings:     form.examFindings,
        diagnosisName:    form.diagnosisName,
        diagnosisCode:    form.diagnosisCode,
        managementPlan:   form.managementPlan,
        composerName:     'AmbientScribe',
      })
      navigate(`/encounter/${encodeURIComponent(uid)}`, { state: { patientId, ehrId } })
    } catch (e) {
      setSubmitError(String(e))
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: 'Worklist', to: '/' },
    { label: demo?.name ?? 'Patient', to: ehrId ? `/patient/${ehrId}` : undefined },
    { label: 'New Encounter' },
  ]

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <div className="max-w-2xl mx-auto">

        {/* Patient banner */}
        {demo && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3.5 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
              {demo.name.charAt(0)}
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">{demo.name}</span>
              <span className="text-gray-400 text-sm mx-2">·</span>
              <span className="text-gray-500 text-sm">{demo.id} · {demo.gender}</span>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > s.number  ? 'bg-blue-600 text-white' :
                  step === s.number ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step > s.number ? '✓' : s.number}
                </div>
                <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                  step === s.number ? 'text-blue-700' : step > s.number ? 'text-gray-500' : 'text-gray-300'
                }`}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${step > s.number ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-900">{STEPS[step - 1].title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{STEPS[step - 1].subtitle}</p>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <Field
                label="Presenting Problem"
                hint="Why is the patient here today?"
                required
                error={errors.presentingProblem}
              >
                <textarea
                  rows={2}
                  placeholder="e.g. Hypertension review, chest pain, follow-up for diabetes"
                  value={form.presentingProblem}
                  onChange={set('presentingProblem')}
                  className={fieldClass(!!errors.presentingProblem)}
                />
              </Field>
              <Field
                label="Clinical History"
                hint="The patient's own account of their symptoms"
                required
                error={errors.history}
              >
                <textarea
                  rows={5}
                  placeholder="Describe the history of presenting complaint, relevant background, medications, allergies…"
                  value={form.history}
                  onChange={set('history')}
                  className={fieldClass(!!errors.history)}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <Field
              label="Examination Findings"
              hint="What did you find on physical examination?"
              required
              error={errors.examFindings}
            >
              <textarea
                rows={7}
                placeholder="Vital signs, relevant system examination findings, investigations reviewed…"
                value={form.examFindings}
                onChange={set('examFindings')}
                className={fieldClass(!!errors.examFindings)}
              />
            </Field>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Field
                label="Diagnosis"
                hint="Primary diagnosis for this encounter"
                required
                error={errors.diagnosisName}
              >
                <input
                  type="text"
                  placeholder="e.g. Essential hypertension, Type 2 diabetes mellitus"
                  value={form.diagnosisName}
                  onChange={set('diagnosisName')}
                  className={fieldClass(!!errors.diagnosisName)}
                />
              </Field>
              <Field
                label="ICD-11 Code"
                hint="Optional — enter the ICD-11 code if known"
              >
                <input
                  type="text"
                  placeholder="e.g. BA00, 5A11, CA23"
                  value={form.diagnosisCode}
                  onChange={set('diagnosisCode')}
                  className={fieldClass(false)}
                />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <Field
                label="Management Plan"
                hint="What was decided — medications, referrals, follow-up"
                required
                error={errors.managementPlan}
              >
                <textarea
                  rows={5}
                  placeholder="Treatment decisions, prescriptions, referrals, patient education, follow-up timing…"
                  value={form.managementPlan}
                  onChange={set('managementPlan')}
                  className={fieldClass(!!errors.managementPlan)}
                />
              </Field>

              {/* Review summary */}
              <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Review before submitting</p>
                {[
                  { label: 'Presenting Problem', value: form.presentingProblem },
                  { label: 'History',            value: form.history },
                  { label: 'Examination',        value: form.examFindings },
                  { label: 'Diagnosis',          value: form.diagnosisName + (form.diagnosisCode ? ` (${form.diagnosisCode})` : '') },
                  { label: 'Plan',               value: form.managementPlan },
                ].map(row => (
                  <div key={row.label} className="flex gap-3 text-sm">
                    <span className="text-gray-400 w-28 shrink-0">{row.label}</span>
                    <span className="text-gray-700 line-clamp-2">{row.value || <span className="text-gray-300 italic">—</span>}</span>
                  </div>
                ))}
              </div>

              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {submitError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? navigate(`/patient/${ehrId}`, { state: { patientId } }) : back()}
          >
            {step === 1 ? '← Cancel' : '← Back'}
          </Button>

          {step < 4 ? (
            <Button onClick={next}>
              Next →
            </Button>
          ) : (
            <Button loading={submitting} onClick={submit}>
              Submit Encounter
            </Button>
          )}
        </div>
      </div>
    </Layout>
  )
}

function Field({
  label, hint, required, error, children,
}: {
  label: string
  hint?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        {required && <span className="text-red-500 text-xs">*</span>}
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function fieldClass(hasError: boolean) {
  return `w-full rounded-lg border text-sm text-gray-900 px-3 py-2.5 resize-none
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    placeholder:text-gray-300 transition-colors
    ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'}`
}
