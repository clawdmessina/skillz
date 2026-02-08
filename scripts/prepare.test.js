import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const script = path.join(root, 'scripts/prepare.js')

// Use a temp directory for each test
let tmpDir

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(root, '.test-prepare-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function createSkillsDir(skills) {
  const skillsDir = path.join(tmpDir, 'skills')
  for (const [cat, skillNames] of Object.entries(skills)) {
    for (const name of skillNames) {
      const dir = path.join(skillsDir, cat, name)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${name} skill\n---\n# ${name}`)
    }
  }
  return skillsDir
}

function createPublicDir() {
  const publicDir = path.join(tmpDir, 'public')
  fs.mkdirSync(publicDir, { recursive: true })
  return publicDir
}

function runPrepare(env = {}) {
  // We can't run the script directly since it hardcodes paths relative to __dirname.
  // Instead, test the logic by reimplementing the core functions inline.
  // This is a integration-style test using the actual skills directory.
  const result = execSync(`node ${script}`, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf-8',
  })
  return result
}

describe('prepare script', () => {
  it('generates manifest with skillPath injected from filesystem', () => {
    // Run using the real project files
    runPrepare()

    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/skills.json'), 'utf-8'))

    // Should have a tree
    expect(manifest.tree).toBeDefined()
    expect(manifest.tree.id).toBe('root')

    // All skill nodes should have skillPath
    function checkSkillPaths(node) {
      if (node.type === 'skill') {
        expect(node.skillPath, `${node.id} missing skillPath`).toBeDefined()
        expect(node.skillPath).toMatch(/^skills\/.*\/SKILL\.md$/)
      }
      if (node.children) node.children.forEach(checkSkillPaths)
    }
    checkSkillPaths(manifest.tree)
  })

  it('creates symlink from public/skills to skills directory', () => {
    runPrepare()

    const publicSkills = path.join(root, 'public/skills')
    const stat = fs.lstatSync(publicSkills)
    expect(stat.isSymbolicLink()).toBe(true)

    const target = fs.readlinkSync(publicSkills)
    expect(fs.existsSync(target)).toBe(true)
  })

  it('preserves tree structure from skills.json', () => {
    runPrepare()

    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/skills.json'), 'utf-8'))

    // Should preserve the custom grouping from skills.json
    const topLevelIds = manifest.tree.children.map(c => c.id)
    expect(topLevelIds).toContain('cat-frontend')
    expect(topLevelIds).toContain('cat-documents')
    expect(topLevelIds).toContain('cat-marketing')
    expect(topLevelIds).toContain('skill-playground')
  })

  it('includes overviewPath when skills/OVERVIEW.md exists', () => {
    runPrepare()

    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/skills.json'), 'utf-8'))

    // OVERVIEW.md exists in the skills directory, so overviewPath should be set
    const overviewExists = fs.existsSync(path.join(root, 'skills', 'OVERVIEW.md'))
    if (overviewExists) {
      expect(manifest.overviewPath).toBe('skills/OVERVIEW.md')
    } else {
      expect(manifest.overviewPath).toBeUndefined()
    }
  })

  it('skillPath points to actual files', () => {
    runPrepare()

    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/skills.json'), 'utf-8'))
    const skillsDir = path.resolve(root, process.env.SKILLZ_DIR || './skills')

    function checkFiles(node) {
      if (node.skillPath) {
        // skillPath is "skills/cat/name/SKILL.md", actual file is at skillsDir/cat/name/SKILL.md
        const relPath = node.skillPath.replace(/^skills\//, '')
        const fullPath = path.join(skillsDir, relPath)
        expect(fs.existsSync(fullPath), `${node.skillPath} does not exist at ${fullPath}`).toBe(true)
      }
      if (node.children) node.children.forEach(checkFiles)
    }
    checkFiles(manifest.tree)
  })
})
