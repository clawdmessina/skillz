#!/usr/bin/env node

/**
 * Prepares the public directory for serving:
 * 1. Symlinks the skills directory into public/skills
 * 2. Reads skills.json, injects skillPath by scanning the skills directory, writes to public/skills.json
 *
 * Run before `vite dev` or `vite build`.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const skillsDir = path.resolve(root, process.env.SKILLZ_DIR || './skills')
const manifestPath = path.resolve(root, process.env.SKILLZ_MANIFEST || './skills.json')
const publicDir = path.join(root, 'public')

// ---- Symlink skills into public ----

const publicSkills = path.join(publicDir, 'skills')

if (fs.existsSync(publicSkills)) {
  const stat = fs.lstatSync(publicSkills)
  if (stat.isSymbolicLink()) {
    fs.unlinkSync(publicSkills)
  } else {
    fs.rmSync(publicSkills, { recursive: true })
  }
}

if (fs.existsSync(skillsDir)) {
  fs.symlinkSync(skillsDir, publicSkills)
}

// ---- Build skill path map from filesystem ----

function buildSkillPathMap() {
  const map = {}
  if (!fs.existsSync(skillsDir)) return map

  for (const cat of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue
    const catPath = path.join(skillsDir, cat.name)
    for (const skill of fs.readdirSync(catPath, { withFileTypes: true })) {
      if (!skill.isDirectory()) continue
      if (fs.existsSync(path.join(catPath, skill.name, 'SKILL.md'))) {
        map[skill.name] = `skills/${cat.name}/${skill.name}/SKILL.md`
      }
    }
  }
  return map
}

// ---- Inject skillPath into tree nodes ----

function injectSkillPaths(node, pathMap) {
  if (node.type === 'skill') {
    const name = node.id.replace(/^skill-/, '')
    if (pathMap[name]) {
      node.skillPath = pathMap[name]
    }
  }
  if (node.children) {
    node.children.forEach(child => injectSkillPaths(child, pathMap))
  }
}

// ---- Generate manifest from directory if needed ----

function generateManifest(pathMap) {
  const children = []

  for (const cat of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue
    const catPath = path.join(skillsDir, cat.name)
    const catChildren = []

    for (const skill of fs.readdirSync(catPath, { withFileTypes: true })) {
      if (!skill.isDirectory()) continue
      if (!pathMap[skill.name]) continue

      catChildren.push({
        id: `skill-${skill.name}`,
        label: skill.name.replace(/-/g, ' '),
        type: 'skill',
        skillPath: pathMap[skill.name],
      })
    }

    if (catChildren.length > 0) {
      children.push({
        id: `cat-${cat.name}`,
        label: cat.name.replace(/-/g, ' '),
        type: 'category',
        children: catChildren,
      })
    }
  }

  return { tree: { id: 'root', type: 'root', children } }
}

// ---- Main ----

const pathMap = buildSkillPathMap()
let manifest

if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    if (manifest.tree) {
      injectSkillPaths(manifest.tree, pathMap)
    }
  } catch (e) {
    console.warn(`Failed to parse ${manifestPath}, generating from skills directory`)
    manifest = null
  }
}

if (!manifest || !manifest.tree) {
  manifest = fs.existsSync(skillsDir) ? generateManifest(pathMap) : { tree: { id: 'root', type: 'root', children: [] } }
}

fs.writeFileSync(path.join(publicDir, 'skills.json'), JSON.stringify(manifest, null, 2))
console.log(`Prepared: ${Object.keys(pathMap).length} skills found, manifest written to public/skills.json`)
