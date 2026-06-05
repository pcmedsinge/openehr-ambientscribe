export const EHRBASE_URL =
  process.env.EHRBASE_URL ?? 'http://localhost:8086/ehrbase/rest/openehr/v1'
export const EHRBASE_USER = process.env.EHRBASE_USER ?? 'ehrbase-user'
export const EHRBASE_PASSWORD = process.env.EHRBASE_PASSWORD ?? 'SuperSecretPassword1'

export const TEMPLATE_ID = 'outpatient_encounter'
export const PATIENT_NAMESPACE = 'ambient_patients'

export const AUTH_HEADER = `Basic ${Buffer.from(`${EHRBASE_USER}:${EHRBASE_PASSWORD}`).toString('base64')}`

export function jsonHeaders(extra?: Record<string, string>) {
  return {
    Authorization: AUTH_HEADER,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  }
}
