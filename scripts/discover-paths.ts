/**
 * Task 1.5 helper — prints every FLAT path in the outpatient_encounter template.
 *
 * Run AFTER the template has been uploaded (task 1.4):
 *   npm run discover-paths
 *
 * Copy the printed paths into the FLAT_PATHS block in seed.ts.
 */
import { EHRBASE_URL, TEMPLATE_ID, AUTH_HEADER } from './config.ts'

// ── Step 1: fetch the web template (describes all FLAT paths) ──────────────
// Try web template with flat schema accept header first
const wtAccept = [
  'application/openehr.wt.flat.schema+json',
  'application/openehr.wt+json',
  'application/json',
]

let wt: Record<string, unknown> | null = null
for (const accept of wtAccept) {
  const r = await fetch(`${EHRBASE_URL}/definition/template/adl1.4/${TEMPLATE_ID}`, {
    headers: { Authorization: AUTH_HEADER, Accept: accept },
  })
  if (r.ok) {
    wt = await r.json() as Record<string, unknown>
    console.log(`Web template fetched with Accept: ${accept}`)
    break
  }
}

// ── Step 2: fetch an example FLAT composition ─────────────────────────────
const exRes = await fetch(
  `${EHRBASE_URL}/definition/template/adl1.4/${TEMPLATE_ID}/example?format=FLAT`,
  {
    headers: {
      Authorization: AUTH_HEADER,
      Accept: 'application/json, */*',
    },
  }
)

if (exRes.ok) {
  const example = await exRes.json() as Record<string, unknown>
  const paths = Object.keys(example).sort()
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`FLAT paths from example composition — ${TEMPLATE_ID}`)
  console.log(`${'═'.repeat(60)}`)
  paths.forEach(p => console.log(` ${p}`))
  console.log(`\nTotal: ${paths.length} paths`)
} else {
  console.warn(`Example endpoint not available (HTTP ${exRes.status})`)
  if (wt) {
    printWebTemplateTree(wt)
  } else {
    console.error('Neither example nor web template endpoint available on this EHRbase version.')
    console.log('\nFalling back: manually verify paths by running seed.ts and checking the EHRbase logs.')
  }
}

function printWebTemplateTree(wt: Record<string, unknown>) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`Web template structure — ${TEMPLATE_ID}`)
  console.log(`${'═'.repeat(60)}`)
  const tree = wt['tree'] as Record<string, unknown> | undefined
  if (!tree) {
    console.log('Raw response:')
    console.log(JSON.stringify(wt, null, 2))
    return
  }
  walkNode(tree, '')
}

function walkNode(node: Record<string, unknown>, prefix: string) {
  const id = node['id'] as string ?? ''
  const rmType = node['rmType'] as string ?? ''
  const path = prefix ? `${prefix}/${id}` : id
  const children = node['children'] as Record<string, unknown>[] | undefined
  const inputs = node['inputs']

  if (inputs || !children || children.length === 0) {
    console.log(` ${path}  [${rmType}]`)
  }

  if (children) {
    for (const child of children) {
      walkNode(child, path)
    }
  }
}

console.log(`\n→ Copy the paths above into FLAT_PATHS in seed.ts`)
