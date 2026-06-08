import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
  dangerouslyAllowBrowser: true,
})

export interface ExtractedFields {
  presentingProblem: string
  history: string
  examFindings: string
  diagnosisName: string
  diagnosisCode: string
  managementPlan: string
}

const SYSTEM_PROMPT = `You are a clinical documentation assistant. Extract structured fields from the clinical note and return a JSON object with exactly these keys:
- presentingProblem: why the patient came in (1–2 sentences)
- history: the patient's account of their symptoms, relevant background, medications, allergies
- examFindings: physical examination findings and vital signs
- diagnosisName: primary clinical diagnosis
- diagnosisCode: ICD-11 code if explicitly stated in the note, otherwise empty string
- managementPlan: treatment decisions, prescriptions, referrals, follow-up timing

Return an empty string for any field not found in the note. Do not infer or fabricate clinical information.`

export async function extractEncounterFields(note: string): Promise<ExtractedFields> {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: note },
    ],
  })

  const raw = JSON.parse(completion.choices[0].message.content ?? '{}')
  return {
    presentingProblem: String(raw.presentingProblem ?? ''),
    history:           String(raw.history ?? ''),
    examFindings:      String(raw.examFindings ?? ''),
    diagnosisName:     String(raw.diagnosisName ?? ''),
    diagnosisCode:     String(raw.diagnosisCode ?? ''),
    managementPlan:    String(raw.managementPlan ?? ''),
  }
}
