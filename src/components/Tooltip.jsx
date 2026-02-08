import { memo, useRef } from 'react';
import { extractDescription } from '../skillData';

function Tooltip({ node, position, contents }) {
  const ref = useRef(null);

  if (!node || !position) return <div className="tooltip" id="tooltip"></div>;

  let desc = null;
  if (node.skillPath) {
    const raw = contents[node.skillPath] || '';
    desc = extractDescription(raw);
  } else if (node.children) {
    const childCount = node.children.length;
    desc = `click to select all ${childCount} skills`;
  }

  const pad = 12;
  let x = position.x + pad;
  let y = position.y + pad;

  // Clamp to viewport
  if (typeof window !== 'undefined') {
    if (x + 300 > window.innerWidth - pad) x = position.x - 300 - pad;
    if (y + 80 > window.innerHeight - pad) y = position.y - 80 - pad;
  }

  return (
    <div
      ref={ref}
      className="tooltip visible"
      style={{ left: x, top: y }}
    >
      <div className="tip-name">{node.label}</div>
      {desc && <div className="tip-desc">{desc}</div>}
    </div>
  );
}

export default memo(Tooltip);
