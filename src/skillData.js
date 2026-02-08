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
  try {
    const res = await fetch('skills.json');
    if (res.ok) return res.json();
  } catch (e) { /* manifest unavailable */ }
  return {};
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
 * Interpolate ${baseUrl} and ${skillPath} in skill content.
 * baseUrl = origin + base path (e.g. "http://localhost:5173/skillz")
 * skillPath = directory path of the skill (e.g. "/skills/playground/playground")
 */
export function interpolateContent(text, baseUrl, skillFilePath) {
  const skillDir = skillFilePath.replace(/\/[^/]+$/, '');
  return text
    .replace(/\$\{baseUrl\}/g, baseUrl)
    .replace(/\$\{skillPath\}/g, `/${skillDir}`);
}

/**
 * Preload all skill markdown content into a path->text map.
 * If overviewPath is provided, fetches it too.
 */
export async function preloadContent(tree, overviewPath) {
  const paths = new Set();
  function collect(node) {
    if (node.skillPath) paths.add(node.skillPath);
    if (node.children) node.children.forEach(collect);
  }
  collect(tree);
  if (overviewPath) paths.add(overviewPath);

  const baseUrl = window.location.origin;

  const contents = {};
  await Promise.all([...paths].map(async (skillPath) => {
    try {
      const res = await fetch(skillPath);
      if (!res.ok) return;
      const text = await res.text();
      contents[skillPath] = interpolateContent(text, baseUrl, skillPath);
    } catch (e) { console.warn('Failed to load:', skillPath); }
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

  const size = GRAPH_SIZE;
  const cx = size / 2;
  const cy = size / 2;

  function getPosition(id, fallbackX, fallbackY) {
    if (layout[id]) {
      return { x: layout[id].x, y: layout[id].y };
    }
    return { x: fallbackX, y: fallbackY };
  }

  // Recursively walk the tree and create nodes + edges at any depth.
  function walk(node, parent, depth, fallbackX, fallbackY) {
    const isRoot = depth === 0;
    const nodeType = isRoot ? 'root' : node.type;
    const pos = getPosition(node.id, fallbackX, fallbackY);

    nodes.push({
      id: node.id,
      type: 'skillNode',
      position: pos,
      data: { label: node.label, nodeType, node },
    });

    if (parent) {
      edges.push({
        id: `e-${parent.id}-${node.id}`,
        source: parent.id,
        target: node.id,
        type: 'smoothstep',
      });
    }

    if (node.children && node.children.length > 0) {
      const ringRadius = size * (0.15 + depth * 0.18);
      const spreadAngle = Math.PI * 0.8;
      const count = node.children.length;

      node.children.forEach((child, i) => {
        const angle = -Math.PI / 2 + (i - (count - 1) / 2) * (spreadAngle / Math.max(count - 1, 1));
        const childFallbackX = fallbackX + Math.cos(angle) * ringRadius;
        const childFallbackY = fallbackY + Math.sin(angle) * ringRadius + ringRadius;
        walk(child, node, depth + 1, childFallbackX, childFallbackY);
      });
    }
  }

  walk(tree, null, 0, cx, cy);
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
 * Build the list of loadout items from the selected set.
 */
export function getLoadoutItems(selected, nodeMap, parentMap, contents) {
  const items = [];
  selected.forEach(id => {
    const node = nodeMap[id];
    if (node.skillPath) {
      items.push({
        id: node.id,
        name: node.label,
        path: getCategoryPath(id, parentMap, nodeMap),
        type: 'skill',
        content: contents[node.skillPath] || '',
      });
    }
  });
  return items;
}

/**
 * Stitch selected skills into a single output string.
 * If overviewPath is provided and content exists, it's prepended.
 */
export function stitchLoadout(selected, nodeMap, contents, overviewPath) {
  const parts = [];
  if (overviewPath && contents[overviewPath]) {
    parts.push(contents[overviewPath]);
  }
  selected.forEach(id => {
    const node = nodeMap[id];
    if (node.skillPath) {
      parts.push(contents[node.skillPath] || '');
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
