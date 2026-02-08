import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SkillNode from './components/SkillNode';
import LoadoutTray from './components/LoadoutTray';
import Tooltip from './components/Tooltip';
import {
  loadManifest,
  loadLayout,
  preloadContent,
  buildMaps,
  buildFlowElements,
  getAllDescendants,
  getAncestors,
  buildExportLayout,
} from './skillData';

const nodeTypes = { skillNode: SkillNode };
const APP_NAME = import.meta.env.VITE_APP_NAME || 'skillz';

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(new Set());
  const [nodeMap, setNodeMap] = useState({});
  const [parentMap, setParentMap] = useState({});
  const [contents, setContents] = useState({});
  const [treeData, setTreeData] = useState(null);
  const [tooltipNode, setTooltipNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [exportLabel, setExportLabel] = useState('export layout');
  const exportTimerRef = useRef(null);

  const { fitView } = useReactFlow();

  // ---- LOAD DATA ----

  useEffect(() => {
    (async () => {
      const manifest = await loadManifest();
      const layout = await loadLayout();
      const tree = manifest?.tree || { id: 'root', type: 'root', children: [] };
      tree.label = APP_NAME;
      const { nodeMap: nm, parentMap: pm } = buildMaps(tree);
      const skillContents = await preloadContent(tree);
      const { nodes: flowNodes, edges: flowEdges } = buildFlowElements(tree, layout);

      setTreeData(tree);
      document.title = `${APP_NAME} — agent skill loadout picker`;
      setNodeMap(nm);
      setParentMap(pm);
      setContents(skillContents);
      setNodes(flowNodes);
      setEdges(flowEdges);

      setTimeout(() => fitView({ padding: 0.15 }), 100);
    })();
  }, []);

  // ---- SELECTION LOGIC (only in select mode) ----

  const handleNodeClick = useCallback((node) => {
    if (editMode) return;
    setSelected(prev => {
      const next = new Set(prev);
      const descendants = getAllDescendants(node);
      const allIds = [node.id, ...descendants.map(d => d.id)];
      const allSelected = allIds.every(id => next.has(id));

      if (allSelected) {
        allIds.forEach(id => next.delete(id));
      } else {
        allIds.forEach(id => next.add(id));
      }

      return next;
    });
  }, [editMode]);

  const handleRemoveFromLoadout = useCallback((removeId) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(removeId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  // ---- TOOLTIP ----

  const handleTooltipShow = useCallback((e, node) => {
    setTooltipNode(node);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleTooltipHide = useCallback(() => {
    setTooltipNode(null);
    setTooltipPos(null);
  }, []);

  // ---- UPDATE NODE DATA WITH SELECTION + MODE STATE ----

  const ancestorSet = useMemo(() => {
    const set = new Set();
    selected.forEach(id => {
      getAncestors(id, parentMap).forEach(a => set.add(a));
    });
    return set;
  }, [selected, parentMap]);

  useEffect(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      draggable: editMode,
      data: {
        ...n.data,
        isSelected: selected.has(n.id),
        isAncestor: !selected.has(n.id) && ancestorSet.has(n.id),
        editMode,
        onClick: handleNodeClick,
        onTooltipShow: handleTooltipShow,
        onTooltipHide: handleTooltipHide,
      },
    })));
  }, [selected, ancestorSet, editMode, handleNodeClick, handleTooltipShow, handleTooltipHide]);

  // ---- UPDATE EDGE HIGHLIGHTING ----

  useEffect(() => {
    const highlightedEdgeKeys = new Set();
    selected.forEach(id => {
      let current = id;
      while (parentMap[current]) {
        highlightedEdgeKeys.add(`e-${parentMap[current]}-${current}`);
        current = parentMap[current];
      }
    });

    setEdges(eds => eds.map(e => ({
      ...e,
      className: highlightedEdgeKeys.has(e.id) ? 'highlighted' : '',
    })));
  }, [selected, parentMap]);

  // ---- EXPORT LAYOUT ----

  const exportLayout = useCallback(async () => {
    const layout = buildExportLayout(nodes);
    const json = JSON.stringify(layout, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setExportLabel('copied!');
      if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
      exportTimerRef.current = setTimeout(() => setExportLabel('export layout'), 2000);
    } catch (e) {
      console.error('Export copy failed:', e);
    }
  }, [nodes]);

  // ---- RESET VIEW ----

  const resetView = useCallback(() => {
    fitView({ padding: 0.15, duration: 300 });
  }, [fitView]);

  // ---- MODE TOGGLE ----

  const toggleMode = useCallback(() => {
    setEditMode(prev => !prev);
  }, []);

  const hasSelection = selected.size > 0;

  // Split the app name for styling: last char gets accent color
  const nameMain = APP_NAME.slice(0, -1);
  const nameAccent = APP_NAME.slice(-1);

  return (
    <div className={`app ${editMode ? 'edit-mode' : 'select-mode'}`}>
      <header>
        <div className="logo">
          <h1>{nameMain}<span>{nameAccent}</span></h1>
          <span className="tagline">agent skill loadout picker</span>
        </div>
        <div className="header-actions" />
      </header>

      {!editMode && hasSelection && (
        <LoadoutTray
          selected={selected}
          nodeMap={nodeMap}
          parentMap={parentMap}
          contents={contents}
          onRemove={handleRemoveFromLoadout}
          onClear={clearSelection}
        />
      )}

      <div className="graph-area">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={4}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: 'var(--border-medium)', strokeWidth: 1.5 },
          }}
          proOptions={{ hideAttribution: true }}
          selectNodesOnDrag={editMode}
          nodesDraggable={editMode}
          selectionOnDrag={editMode}
          zoomOnDoubleClick={false}
        >
        </ReactFlow>

        <div className="edit-panel">
          {editMode ? (
            <>
              <button
                className={`btn btn-sm btn-export${exportLabel === 'copied!' ? ' copied' : ''}`}
                onClick={exportLayout}
              >
                {exportLabel}
              </button>
              <button className="btn btn-sm" onClick={resetView}>
                reset view
              </button>
              <button className="btn btn-sm btn-mode-active" onClick={toggleMode}>
                done editing
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-mode" onClick={toggleMode}>
              edit layout
            </button>
          )}
        </div>
      </div>

      <Tooltip node={tooltipNode} position={tooltipPos} contents={contents} />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
