#!/usr/bin/env node
/**
 * Dependency audit that fails only on advisories we have not already seen.
 *
 * `yarn audit` exits non-zero whenever any advisory exists at all. This repo
 * carries a set of them that cannot be cleared without a colyseus major
 * upgrade, so a plain `yarn audit` in CI would be red on every run and everyone
 * would learn to ignore it. Instead the accepted ones are recorded in
 * .audit-baseline.json, and only something new fails the build.
 *
 *   yarn audit:check    compare against the baseline
 *   yarn audit:update   re-record the baseline (review the diff before commit)
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const WORKSPACES = ['.', 'types', 'client']
const FAIL_ON = new Set(['high', 'critical'])
const ROOT = path.join(__dirname, '..')
const BASELINE_PATH = path.join(ROOT, '.audit-baseline.json')

const updating = process.argv.includes('--update')

/** yarn is on PATH in CI; locally it may only be reachable through npx */
function findYarn() {
  for (const command of ['yarn', 'npx --yes yarn']) {
    try {
      execSync(command + ' --version', { stdio: 'ignore' })
      return command
    } catch {
      // try the next one
    }
  }
  throw new Error('could not find yarn, directly or through npx')
}

const yarn = findYarn()

function advisoriesIn(workspace) {
  let output = ''

  try {
    output = execSync(yarn + ' audit --json --groups dependencies', {
      cwd: path.join(ROOT, workspace),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (error) {
    // a non-zero exit just means advisories were found, which is the normal case
    output = error.stdout || ''
    if (!output) throw error
  }

  // one advisory is reported once per dependency path, so dedupe by id
  const byId = new Map()

  for (const line of output.split('\n')) {
    if (!line.trim()) continue

    let record
    try {
      record = JSON.parse(line)
    } catch {
      continue
    }

    if (record.type !== 'auditAdvisory') continue
    const advisory = record.data.advisory
    if (!FAIL_ON.has(advisory.severity)) continue

    byId.set(advisory.id, {
      id: advisory.id,
      module: advisory.module_name,
      severity: advisory.severity,
      title: advisory.title,
      via: record.data.resolution.path,
    })
  }

  return [...byId.values()].sort((a, b) => a.id - b.id)
}

const current = {}
for (const workspace of WORKSPACES) current[workspace] = advisoriesIn(workspace)

if (updating) {
  const baseline = {
    $comment:
      'Advisories already known and accepted. scripts/audit.js fails CI only on advisories ' +
      'missing from this file. Regenerate with: yarn audit:update',
    accepted: Object.fromEntries(
      WORKSPACES.map((workspace) => [
        workspace,
        current[workspace].map(({ id, module, severity, title }) => ({
          id,
          module,
          severity,
          title,
        })),
      ])
    ),
  }

  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n')
  const total = WORKSPACES.reduce((count, workspace) => count + current[workspace].length, 0)
  console.log('recorded ' + total + ' accepted advisories in .audit-baseline.json')
  process.exit(0)
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.error('.audit-baseline.json is missing - create it with: yarn audit:update')
  process.exit(1)
}

const accepted = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')).accepted || {}

const summary = []
let added = 0
let resolved = 0

for (const workspace of WORKSPACES) {
  const known = new Set((accepted[workspace] || []).map((entry) => entry.id))
  const seen = new Set(current[workspace].map((entry) => entry.id))

  const fresh = current[workspace].filter((entry) => !known.has(entry.id))
  const gone = (accepted[workspace] || []).filter((entry) => !seen.has(entry.id))

  added += fresh.length
  resolved += gone.length

  summary.push(
    '### ' +
      workspace +
      ' - ' +
      current[workspace].length +
      ' accepted, ' +
      fresh.length +
      ' new, ' +
      gone.length +
      ' resolved'
  )

  for (const entry of fresh) {
    console.error(
      'NEW  ' + entry.severity.padEnd(9) + entry.module + ' - ' + entry.title + '\n     via ' + entry.via
    )
    summary.push('- **new** `' + entry.module + '` (' + entry.severity + ') - ' + entry.title)
  }

  for (const entry of gone) {
    console.log('gone ' + entry.severity.padEnd(9) + entry.module + ' - ' + entry.title)
    summary.push('- resolved: `' + entry.module + '` (' + entry.severity + ')')
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n')
}

if (resolved > 0) {
  console.log(
    '\n' + resolved + ' baseline entries are no longer reported. Tidy up with: yarn audit:update'
  )
}

if (added > 0) {
  console.error(
    '\n' +
      added +
      ' advisories are not in the baseline. Upgrade the dependency, or accept them with: yarn audit:update'
  )
  process.exit(1)
}

console.log('\nno new advisories')
