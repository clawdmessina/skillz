import { describe, it, expect } from 'vitest'
import {
  buildMaps,
  buildFlowElements,
  getAllDescendants,
  getAncestors,
  getCategoryPath,
  getLoadoutItems,
  stitchLoadout,
  estimateTokens,
  formatTokens,
  extractDescription,
  buildExportLayout,
  interpolateContent,
} from './skillData'

// -- Test fixtures --

const tree = {
  id: 'root',
  type: 'root',
  label: 'skillz',
  children: [
    {
      id: 'cat-frontend',
      label: 'frontend',
      type: 'category',
      children: [
        { id: 'skill-a', label: 'skill a', type: 'skill', skillPath: 'skills/frontend/a/SKILL.md' },
        { id: 'skill-b', label: 'skill b', type: 'skill', skillPath: 'skills/frontend/b/SKILL.md' },
      ],
    },
    {
      id: 'skill-solo',
      label: 'solo',
      type: 'skill',
      skillPath: 'skills/misc/solo/SKILL.md',
    },
  ],
}

const contents = {
  'skills/frontend/a/SKILL.md': '---\nname: a\ndescription: Skill A does things\n---\n# Skill A\nContent A',
  'skills/frontend/b/SKILL.md': '# Skill B\nContent B',
  'skills/misc/solo/SKILL.md': '---\nname: solo\ndescription: A solo skill\n---\n# Solo\nSolo content',
}

// -- buildMaps --

describe('buildMaps', () => {
  const { nodeMap, parentMap } = buildMaps(tree)

  it('creates nodeMap with all nodes', () => {
    expect(Object.keys(nodeMap)).toHaveLength(5)
    expect(nodeMap['root']).toBe(tree)
    expect(nodeMap['skill-a'].label).toBe('skill a')
  })

  it('creates parentMap with correct parent references', () => {
    expect(parentMap['root']).toBeUndefined()
    expect(parentMap['cat-frontend']).toBe('root')
    expect(parentMap['skill-a']).toBe('cat-frontend')
    expect(parentMap['skill-solo']).toBe('root')
  })
})

// -- getAllDescendants --

describe('getAllDescendants', () => {
  it('returns all descendants of a node', () => {
    const desc = getAllDescendants(tree)
    expect(desc.map(d => d.id)).toEqual(['cat-frontend', 'skill-a', 'skill-b', 'skill-solo'])
  })

  it('returns empty array for leaf nodes', () => {
    expect(getAllDescendants({ id: 'leaf', type: 'skill' })).toEqual([])
  })

  it('returns direct children for single-level node', () => {
    const { nodeMap } = buildMaps(tree)
    const desc = getAllDescendants(nodeMap['cat-frontend'])
    expect(desc.map(d => d.id)).toEqual(['skill-a', 'skill-b'])
  })
})

// -- getAncestors --

describe('getAncestors', () => {
  const { parentMap } = buildMaps(tree)

  it('returns ancestors from leaf to root', () => {
    expect(getAncestors('skill-a', parentMap)).toEqual(['cat-frontend', 'root'])
  })

  it('returns empty array for root', () => {
    expect(getAncestors('root', parentMap)).toEqual([])
  })

  it('returns just root for top-level skill', () => {
    expect(getAncestors('skill-solo', parentMap)).toEqual(['root'])
  })
})

// -- getCategoryPath --

describe('getCategoryPath', () => {
  const { nodeMap, parentMap } = buildMaps(tree)

  it('returns breadcrumb path for nested skill', () => {
    expect(getCategoryPath('skill-a', parentMap, nodeMap)).toBe('frontend')
  })

  it('returns empty string for top-level skill', () => {
    expect(getCategoryPath('skill-solo', parentMap, nodeMap)).toBe('')
  })
})

// -- getLoadoutItems --

describe('getLoadoutItems', () => {
  const { nodeMap, parentMap } = buildMaps(tree)

  it('returns items for selected skills', () => {
    const selected = new Set(['skill-a'])
    const items = getLoadoutItems(selected, nodeMap, parentMap, contents)
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('skill a')
    expect(items[0].path).toBe('frontend')
    expect(items[0].content).toContain('Skill A')
  })

  it('skips category nodes (no skillPath)', () => {
    const selected = new Set(['cat-frontend', 'skill-a'])
    const items = getLoadoutItems(selected, nodeMap, parentMap, contents)
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('skill-a')
  })

  it('returns empty array when nothing selected', () => {
    const items = getLoadoutItems(new Set(), nodeMap, parentMap, contents)
    expect(items).toEqual([])
  })

  it('returns empty content for missing skill content', () => {
    const selected = new Set(['skill-a'])
    const items = getLoadoutItems(selected, nodeMap, parentMap, {})
    expect(items[0].content).toBe('')
  })
})

// -- stitchLoadout --

describe('stitchLoadout', () => {
  const { nodeMap } = buildMaps(tree)

  it('stitches multiple skills with double newline separator', () => {
    const selected = new Set(['skill-a', 'skill-solo'])
    const result = stitchLoadout(selected, nodeMap, contents)
    expect(result).toContain('Skill A')
    expect(result).toContain('Solo content')
    expect(result).toContain('\n\n')
  })

  it('skips nodes without skillPath', () => {
    const selected = new Set(['cat-frontend'])
    const result = stitchLoadout(selected, nodeMap, contents)
    expect(result).toBe('')
  })

  it('returns empty string for empty selection', () => {
    expect(stitchLoadout(new Set(), nodeMap, contents)).toBe('')
  })
})

// -- buildFlowElements --

describe('buildFlowElements', () => {
  it('creates nodes and edges from tree', () => {
    const { nodes, edges } = buildFlowElements(tree, {})
    expect(nodes).toHaveLength(5)
    expect(edges).toHaveLength(4)
  })

  it('uses layout positions when provided', () => {
    const layout = { 'root': { x: 100, y: 200 } }
    const { nodes } = buildFlowElements(tree, layout)
    const rootNode = nodes.find(n => n.id === 'root')
    expect(rootNode.position).toEqual({ x: 100, y: 200 })
  })

  it('sets root nodeType to root', () => {
    const { nodes } = buildFlowElements(tree, {})
    const rootNode = nodes.find(n => n.id === 'root')
    expect(rootNode.data.nodeType).toBe('root')
  })

  it('creates correct edge structure', () => {
    const { edges } = buildFlowElements(tree, {})
    const edge = edges.find(e => e.target === 'skill-a')
    expect(edge.source).toBe('cat-frontend')
    expect(edge.id).toBe('e-cat-frontend-skill-a')
  })
})

// -- estimateTokens --

describe('estimateTokens', () => {
  it('estimates tokens at ~0.25 per char', () => {
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('a'.repeat(100))).toBe(25)
  })

  it('returns 0 for empty/null input', () => {
    expect(estimateTokens('')).toBe(0)
    expect(estimateTokens(null)).toBe(0)
    expect(estimateTokens(undefined)).toBe(0)
  })
})

// -- formatTokens --

describe('formatTokens', () => {
  it('formats small numbers as-is', () => {
    expect(formatTokens(500)).toBe('500')
  })

  it('formats thousands with k suffix', () => {
    expect(formatTokens(1500)).toBe('1.5k')
    expect(formatTokens(10000)).toBe('10.0k')
  })
})

// -- extractDescription --

describe('extractDescription', () => {
  it('extracts description from YAML frontmatter', () => {
    const md = '---\nname: test\ndescription: This is a test skill\n---\n# Content'
    expect(extractDescription(md)).toBe('This is a test skill')
  })

  it('returns null when no frontmatter', () => {
    expect(extractDescription('# Just a heading')).toBeNull()
  })

  it('returns null when no description field', () => {
    const md = '---\nname: test\n---\n# Content'
    expect(extractDescription(md)).toBeNull()
  })

  it('truncates long descriptions to 250 chars', () => {
    const md = `---\nname: test\ndescription: ${'a'.repeat(300)}\n---\n# Content`
    expect(extractDescription(md).length).toBe(250)
  })
})

// -- buildExportLayout --

describe('buildExportLayout', () => {
  it('extracts positions from React Flow nodes', () => {
    const rfNodes = [
      { id: 'a', position: { x: 100.123, y: 200.456 } },
      { id: 'b', position: { x: 0, y: 0 } },
    ]
    const layout = buildExportLayout(rfNodes)
    expect(layout.a).toEqual({ x: 100.1, y: 200.5 })
    expect(layout.b).toEqual({ x: 0, y: 0 })
  })
})

// -- stitchLoadout with overview --

describe('stitchLoadout with overviewPath', () => {
  const { nodeMap } = buildMaps(tree)
  const overviewContents = {
    ...contents,
    'skills/OVERVIEW.md': '# Overview\nCross-cutting instructions here.',
  }

  it('prepends overview content when overviewPath is provided', () => {
    const selected = new Set(['skill-a'])
    const result = stitchLoadout(selected, nodeMap, overviewContents, 'skills/OVERVIEW.md')
    expect(result).toMatch(/^# Overview/)
    expect(result).toContain('Cross-cutting instructions here.')
    expect(result).toContain('Skill A')
  })

  it('overview comes before skill content', () => {
    const selected = new Set(['skill-a'])
    const result = stitchLoadout(selected, nodeMap, overviewContents, 'skills/OVERVIEW.md')
    const overviewIdx = result.indexOf('Overview')
    const skillIdx = result.indexOf('Skill A')
    expect(overviewIdx).toBeLessThan(skillIdx)
  })

  it('does not prepend when overviewPath is null', () => {
    const selected = new Set(['skill-a'])
    const result = stitchLoadout(selected, nodeMap, overviewContents, null)
    expect(result).not.toContain('Overview')
    expect(result).toContain('Skill A')
  })

  it('does not prepend when overview content is missing', () => {
    const selected = new Set(['skill-a'])
    const result = stitchLoadout(selected, nodeMap, contents, 'skills/OVERVIEW.md')
    expect(result).not.toContain('Overview')
    expect(result).toContain('Skill A')
  })

  it('returns only overview when no skills selected', () => {
    const result = stitchLoadout(new Set(), nodeMap, overviewContents, 'skills/OVERVIEW.md')
    expect(result).toBe('# Overview\nCross-cutting instructions here.')
  })
})

// -- interpolateContent --

describe('interpolateContent', () => {
  const baseUrl = 'http://localhost:5173'

  it('replaces ${baseUrl} with the origin', () => {
    const result = interpolateContent('Go to ${baseUrl}/docs', baseUrl, 'skills/cat/name/SKILL.md')
    expect(result).toBe('Go to http://localhost:5173/docs')
  })

  it('replaces ${skillPath} with the skill directory path', () => {
    const result = interpolateContent('Fetch ${skillPath}/ref.md', baseUrl, 'skills/cat/name/SKILL.md')
    expect(result).toBe('Fetch /skills/cat/name/ref.md')
  })

  it('produces correct URL when ${baseUrl}${skillPath} are combined', () => {
    const result = interpolateContent(
      '[link](${baseUrl}${skillPath}/templates/foo.md)',
      baseUrl,
      'skills/playground/playground/SKILL.md'
    )
    expect(result).toBe('[link](http://localhost:5173/skills/playground/playground/templates/foo.md)')
  })

  it('does not double the origin', () => {
    const result = interpolateContent('${baseUrl}${skillPath}/file.md', baseUrl, 'skills/a/b/SKILL.md')
    expect(result).not.toContain('http://localhost:5173http://')
    expect(result).toBe('http://localhost:5173/skills/a/b/file.md')
  })

  it('handles content with no variables', () => {
    const result = interpolateContent('just plain text', baseUrl, 'skills/a/b/SKILL.md')
    expect(result).toBe('just plain text')
  })

  it('replaces multiple occurrences', () => {
    const result = interpolateContent('${baseUrl}/a ${baseUrl}/b', baseUrl, 'skills/x/y/SKILL.md')
    expect(result).toBe('http://localhost:5173/a http://localhost:5173/b')
  })

  it('works with production origin', () => {
    const prodBase = 'https://example.github.io'
    const result = interpolateContent(
      '${baseUrl}${skillPath}/templates/foo.md',
      prodBase,
      'skills/playground/playground/SKILL.md'
    )
    expect(result).toBe('https://example.github.io/skills/playground/playground/templates/foo.md')
  })

  it('works with base path included in baseUrl', () => {
    const baseWithPath = 'https://clawdmessina.github.io/skillz'
    const result = interpolateContent(
      '${baseUrl}${skillPath}/templates/foo.md',
      baseWithPath,
      'skills/playground/playground/SKILL.md'
    )
    expect(result).toBe('https://clawdmessina.github.io/skillz/skills/playground/playground/templates/foo.md')
  })
})
