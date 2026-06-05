/**
 * Uploads an OPT file to EHRbase.
 * Usage: npm run upload-template -- ../templates/outpatient_encounter.opt
 */
import { readFileSync } from 'fs'
import { EHRBASE_URL, AUTH_HEADER } from './config.ts'

const filePath = process.argv[2] ?? '../templates/outpatient_encounter.opt'

let optContent: string
try {
  optContent = readFileSync(filePath, 'utf-8')
} catch {
  console.error(`Cannot read file: ${filePath}`)
  console.error('Export the OPT from Archetype Designer and pass the path as an argument.')
  process.exit(1)
}

console.log(`Uploading template from: ${filePath}`)

const res = await fetch(`${EHRBASE_URL}/definition/template/adl1.4`, {
  method: 'POST',
  headers: {
    Authorization: AUTH_HEADER,
    'Content-Type': 'application/xml',
    Accept: 'application/json',
  },
  body: optContent,
})

if (res.ok) {
  console.log('Template uploaded successfully.')
  const body = await res.text()
  if (body) console.log('Response:', body)
} else {
  const body = await res.text()
  console.error(`Upload failed — HTTP ${res.status}`)
  console.error(body)
  process.exit(1)
}
