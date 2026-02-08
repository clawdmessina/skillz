import { memo, useState, useRef, useCallback } from 'react';
import { getLoadoutItems, estimateTokens, formatTokens, stitchLoadout } from '../skillData';

function LoadoutTray({ selected, nodeMap, parentMap, contents, onRemove, onClear }) {
  const [copyLabel, setCopyLabel] = useState('copy loadout');
  const copyTimerRef = useRef(null);

  const items = getLoadoutItems(selected, nodeMap, parentMap, contents);

  const copyLoadout = useCallback(async () => {
    const output = stitchLoadout(selected, nodeMap, contents);
    try {
      await navigator.clipboard.writeText(output);
      setCopyLabel('copied!');
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyLabel('copy loadout'), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }, [selected, nodeMap, contents]);

  // Don't render anything when nothing is selected
  if (items.length === 0) return null;

  let totalTokens = 0;
  const chips = items.map(item => {
    const tokens = estimateTokens(item.content);
    totalTokens += tokens;
    return (
      <div key={item.id} className="loadout-chip chip-skill">
        {item.path && <span className="chip-path">{item.path} /</span>}
        <span className="chip-name">{item.name}</span>
        <span className="chip-tokens">{formatTokens(tokens)}</span>
        <span
          className="chip-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
        >
          &times;
        </span>
      </div>
    );
  });

  return (
    <div className="loadout-tray">
      <div className="loadout-header">
        <div className="loadout-left">
          <span className="loadout-title">loadout</span>
          <span className="token-count">
            <span className="num">{formatTokens(totalTokens)}</span> tokens
          </span>
        </div>
        <div className="loadout-actions">
          <button className="btn btn-sm" onClick={onClear}>
            clear
          </button>
          <button
            className={`btn btn-sm btn-primary${copyLabel === 'copied!' ? ' copied' : ''}`}
            onClick={copyLoadout}
          >
            {copyLabel}
          </button>
        </div>
      </div>
      <div className="loadout-items">
        {chips}
      </div>
    </div>
  );
}

export default memo(LoadoutTray);
