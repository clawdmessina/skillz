// ============================================================
// Skill data loading, tree processing, and stitching logic.
// Pure functions — no React dependency.
// ============================================================

const APPROX_TOKENS_PER_CHAR = 0.25;
const GRAPH_SIZE = 1000;

/**
 * Fetch and parse skills.json manifest.
 */
export async function loadManifest() {
  const res = await fetch('skills.json');
  return res.json();
}

/**
 * Fetch layout.json (optional — returns empty object if missing).
 * Layout stores raw { x, y } positions per node id.
 */
export async function loadLayout() {
  try {
    const res = await fetch('layout.json');
    if (res.ok) return res.json();
  } catch (e) { /* no layout file */ }
  return {};
}

/**
 * Preload all skill/template markdown content into a path->text map.
 */
export async function preloadContent(tree) {
  const paths = new Set();
  function collect(node) {
    if (node.skillPath) paths.add(node.skillPath);
    if (node.templatePath) paths.add(node.templatePath);
    if (node.children) node.children.forEach(collect);
  }
  collect(tree);

  const contents = {};
  await Promise.all([...paths].map(async (path) => {
    try {
      const res = await fetch(path);
      if (res.ok) contents[path] = await res.text();
    } catch (e) { console.warn('Failed to load:', path); }
  }));
  return contents;
}

/**
 * Build flat lookup maps from the tree.
 * Returns { nodeMap, parentMap }.
 */
export function buildMaps(tree) {
  const nodeMap = {};
  const parentMap = {};
  function walk(node, parent) {
    nodeMap[node.id] = node;
    if (parent) parentMap[node.id] = parent.id;
    if (node.children) node.children.forEach(child => walk(child, node));
  }
  walk(tree, null);
  return { nodeMap, parentMap };
}

/**
 * Convert the skill tree + layout into React Flow nodes and edges.
 * Layout stores raw { x, y } — if present, uses those directly.
 * Otherwise, computes radial positions as fallback.
 */
export function buildFlowElements(tree, layout) {
  const nodes = [];
  const edges = [];

  function computeLeafCount(node) {
    if (!node.children || node.children.length === 0) return 1;
    return node.children.reduce((sum, c) => sum + computeLeafCount(c), 0);
  }

  const size = GRAPH_SIZE;
  const cx = size / 2;
  const cy = size / 2;
  const ringRadii = [0, size * 0.2, size * 0.42];

  function getPosition(id, fallbackX, fallbackY) {
    if (layout[id]) {
      return { x: layout[id].x, y: layout[id].y };
    }
    return { x: fallbackX, y: fallbackY };
  }

  // Root
  const rootPos = getPosition(tree.id, cx, cy);
  nodes.push({
    id: tree.id,
    type: 'skillNode',
    position: rootPos,
    data: { label: tree.label, nodeType: 'root', node: tree },
  });

  if (!tree.children) return { nodes, edges };

  const totalLeaves = computeLeafCount(tree);
  let angleOffset = -Math.PI / 2;
  const fullArc = Math.PI * 2;
  const ring1Gap = 0.06;

  tree.children.forEach((cat) => {
    const catLeaves = computeLeafCount(cat);
    const catArc = (catLeaves / totalLeaves) * (fullArc - ring1Gap * tree.children.length);

    const catAngle = angleOffset + catArc / 2;
    const catFallbackX = cx + Math.cos(catAngle) * ringRadii[1];
    const catFallbackY = cy + Math.sin(catAngle) * ringRadii[1];
    const catPos = getPosition(cat.id, catFallbackX, catFallbackY);

    nodes.push({
      id: cat.id,
      type: 'skillNode',
      position: catPos,
      data: { label: cat.label, nodeType: 'category', node: cat },
    });

    edges.push({
      id: `e-${tree.id}-${cat.id}`,
      source: tree.id,
      target: cat.id,
      type: 'smoothstep',
    });

    if (cat.children && cat.children.length > 0) {
      const childCount = cat.children.length;
      const childArcStart = angleOffset;
      const childArcPer = catArc / childCount;

      cat.children.forEach((child, j) => {
        const childAngle = childArcStart + childArcPer * (j + 0.5);
        const childFallbackX = cx + Math.cos(childAngle) * ringRadii[2];
        const childFallbackY = cy + Math.sin(childAngle) * ringRadii[2];
        const childPos = getPosition(child.id, childFallbackX, childFallbackY);

        nodes.push({
          id: child.id,
          type: 'skillNode',
          position: childPos,
          data: { label: child.label, nodeType: child.type, node: child },
        });

        edges.push({
          id: `e-${cat.id}-${child.id}`,
          source: cat.id,
          target: child.id,
          type: 'smoothstep',
        });
      });
    }

    angleOffset += catArc + ring1Gap;
  });

  return { nodes, edges };
}

/**
 * Get all descendant nodes of a given node.
 */
export function getAllDescendants(node) {
  if (!node.children) return [];
  let result = [];
  node.children.forEach(child => {
    result.push(child);
    result = result.concat(getAllDescendants(child));
  });
  return result;
}

/**
 * Get ancestor chain for a node id.
 */
export function getAncestors(id, parentMap) {
  const ancestors = [];
  let current = parentMap[id];
  while (current) {
    ancestors.push(current);
    current = parentMap[current];
  }
  return ancestors;
}

/**
 * Get the category breadcrumb path for a node.
 */
export function getCategoryPath(id, parentMap, nodeMap) {
  const parts = [];
  let current = parentMap[id];
  while (current && nodeMap[current].type !== 'root') {
    parts.unshift(nodeMap[current].label);
    current = parentMap[current];
  }
  return parts.join(' / ');
}

/**
 * Get the core content of a skill (above the <!-- skillz:select --> marker).
 */
export function getSkillCoreContent(path, contents) {
  const content = contents[path] || '';
  const marker = '<!-- skillz:select -->';
  const idx = content.indexOf(marker);
  if (idx !== -1) return content.substring(0, idx).trimEnd();
  return content;
}

/**
 * Build the list of loadout items from the selected set.
 */
export function getLoadoutItems(selected, nodeMap, parentMap, contents) {
  const items = [];
  selected.forEach(id => {
    const node = nodeMap[id];
    if (node.type === 'skill') {
      items.push({
        id: node.id,
        name: node.label,
        path: getCategoryPath(id, parentMap, nodeMap),
        type: 'skill',
        content: contents[node.skillPath] || '',
      });
    } else if (node.type === 'template') {
      items.push({
        id: node.id,
        name: node.label,
        path: getCategoryPath(id, parentMap, nodeMap),
        type: 'template',
        content: contents[node.templatePath] || '',
      });
    } else if (node.type === 'category' && node.skillPath) {
      items.push({
        id: node.id,
        name: node.label + ' (core)',
        path: '',
        type: 'skill',
        content: getSkillCoreContent(node.skillPath, contents),
      });
    }
  });
  return items;
}

/**
 * Stitch selected skills into a single output string.
 */
export function stitchLoadout(selected, nodeMap, contents) {
  const parts = [];

  // Standalone skills
  selected.forEach(id => {
    const node = nodeMap[id];
    if (node.type === 'skill' && node.skillPath) {
      parts.push(contents[node.skillPath] || '');
    }
  });

  // Category-skills with their selected templates
  selected.forEach(id => {
    const node = nodeMap[id];
    if (node.type === 'category' && node.skillPath && node.hasSelectMarker) {
      const core = getSkillCoreContent(node.skillPath, contents);
      parts.push(core);
      if (node.children) {
        node.children.forEach(child => {
          if (child.type === 'template' && selected.has(child.id)) {
            parts.push(contents[child.templatePath] || '');
          }
        });
      }
    }
  });

  return parts.join('\n\n');
}

/**
 * Token estimation.
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.round(text.length * APPROX_TOKENS_PER_CHAR);
}

export function formatTokens(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

/**
 * Extract description from markdown YAML frontmatter.
 */
export function extractDescription(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---/);
  if (match) {
    const fm = match[1];
    const descMatch = fm.match(/description:\s*([^\n]+(?:\n\s+[^\n]+)*)/);
    if (descMatch) return descMatch[1].trim().replace(/\n\s*/g, ' ').slice(0, 250);
  }
  return null;
}

/**
 * Build an export-ready layout object from React Flow nodes.
 * Stores raw { x, y } positions — React Flow's fitView handles scaling.
 */
export function buildExportLayout(rfNodes) {
  const layout = {};
  rfNodes.forEach(node => {
    layout[node.id] = {
      x: Math.round(node.position.x * 10) / 10,
      y: Math.round(node.position.y * 10) / 10,
    };
  });
  return layout;
}
