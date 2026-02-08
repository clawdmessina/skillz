import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';

function SkillNode({ id, data }) {
  const { label, nodeType, node, isSelected, isAncestor, editMode, onClick, onTooltipShow, onTooltipHide } = data;

  const isRoot = nodeType === 'root';

  let className = 'skillz-node';
  if (isRoot) className += ' root-node';
  if (isSelected) className += ' selected';
  else if (isAncestor) className += ' ancestor';
  if (editMode) className += ' edit-mode';

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (onClick) onClick(node);
  }, [onClick, node]);

  const handleMouseEnter = useCallback((e) => {
    if (onTooltipShow) onTooltipShow(e, node);
  }, [onTooltipShow, node]);

  const handleMouseLeave = useCallback(() => {
    if (onTooltipHide) onTooltipHide();
  }, [onTooltipHide]);

  const truncate = (str, max) => str.length > max ? str.slice(0, max - 2) + '..' : str;

  return (
    <div
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Handles for edges — invisible */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />

      {!isRoot && nodeType !== 'category' && (
        <span className={`node-type-badge badge-${nodeType}`}>
          {nodeType}
        </span>
      )}
      <span className="node-label">
        {truncate(label, isRoot ? 20 : 15)}
      </span>
    </div>
  );
}

export default memo(SkillNode);
