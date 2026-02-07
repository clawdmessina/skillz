# Code Map Template

Use this template when the playground is about visualizing codebase architecture: component relationships, data flow, layer diagrams, system architecture with interactive commenting for feedback.

## Layout

```
+-------------------+----------------------------------+
|                   |                                  |
|  Controls:        |  SVG Canvas                      |
|  • View presets   |  (nodes + connections)           |
|  • Layer toggles  |  with zoom controls              |
|  • Connection     |                                  |
|    type filters   |  Legend (bottom-left)            |
|                   |                                  |
|  Comments (n):    +----------------------------------+
|  • List of user   |  Prompt output                   |
|    comments with  |  [ Copy Prompt ]                 |
|    delete buttons |                                  |
+-------------------+----------------------------------+
```

Code map playgrounds use an SVG canvas for the architecture diagram. Users click components to add comments, which become part of the generated prompt. Layer and connection filters let users focus on specific parts of the system.

## Control types for code maps

| Decision | Control | Example |
|---|---|---|
| System view | Preset buttons | Full System, Chat Flow, Data Flow, Agent System |
| Visible layers | Checkboxes | Client, Server, SDK, Data, External |
| Connection types | Checkboxes with color indicators | Data Flow (blue), Tool Calls (green), Events (red) |
| Component feedback | Click-to-comment modal | Opens modal with textarea for feedback |
| Zoom level | +/-/reset buttons | Scale SVG for detail |

## Canvas rendering

Use an `<svg>` element with dynamically generated nodes and paths:

- **Nodes:** Rounded rectangles with title and subtitle (file path)
- **Connections:** Curved paths (bezier) with arrow markers, styled by type
- **Layer organization:** Group nodes by Y-position bands
- **Click-to-comment:** Click node, open modal, save comment, node gets visual indicator
- **Filtering:** Toggle visibility of nodes by layer, connections by type

```javascript
const nodes = [
  { id: 'api-client', label: 'API Client', subtitle: 'src/api/client.ts',
    x: 100, y: 50, w: 140, h: 45, layer: 'client', color: '#dbeafe' },
];

const connections = [
  { from: 'api-client', to: 'server', type: 'data-flow', label: 'HTTP' },
];

function renderDiagram() {
  const visibleNodes = nodes.filter(n => state.layers[n.layer]);
  connections.forEach(c => drawConnection(c));
  visibleNodes.forEach(n => drawNode(n));
}
```

## Connection types and styling

| Type | Color | Style | Use for |
|---|---|---|---|
| `data-flow` | Blue (#3b82f6) | Solid line | Request/response, data passing |
| `tool-call` | Green (#10b981) | Dashed (6,3) | Function calls, API invocations |
| `event` | Red (#ef4444) | Short dash (4,4) | Async events, pub/sub |
| `skill-invoke` | Orange (#f97316) | Long dash (8,4) | Plugin/skill activation |
| `dependency` | Gray (#6b7280) | Dotted | Import/require relationships |

## Prompt output for code maps

The prompt combines system context with user comments:

```
This is the [PROJECT NAME] architecture, focusing on the [visible layers].

Feedback on specific components:

**API Client** (src/api/client.ts):
I want to add retry logic with exponential backoff here.

**Database Manager** (src/db/manager.ts):
Can we add connection pooling?
```

Only include comments the user added. Mention which layers are visible if not showing the full system.

## Example topics

- Codebase architecture explorer (modules, imports, data flow)
- Microservices map (services, queues, databases, API gateways)
- React component tree (components, hooks, context, state)
- API architecture (routes, middleware, controllers, models)
- Agent system (prompts, tools, skills, subagents)
- Data pipeline (sources, transforms, sinks, scheduling)
