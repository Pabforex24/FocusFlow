// Vérifie qu'aucune trace de TypeScript n'existe dans le projet.
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const IGNORED = new Set(['node_modules', 'dist', '.git'])
const FORBIDDEN_FILES = [/\.tsx?$/, /^tsconfig.*\.json$/, /\.d\.ts$/]
const problems = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (IGNORED.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) { walk(path); continue }
    if (FORBIDDEN_FILES.some((re) => re.test(name))) problems.push(path)
  }
}
walk(process.cwd())

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const all = { ...pkg.dependencies, ...pkg.devDependencies }
for (const dep of Object.keys(all)) {
  if (dep === 'typescript' || dep.startsWith('@types/')) problems.push(`dépendance : ${dep}`)
}

if (problems.length) {
  console.error('TypeScript détecté :\n' + problems.map((p) => ' - ' + p).join('\n'))
  process.exit(1)
}
console.log('OK : aucune trace de TypeScript.')
