# skillz

Agent skill loadout picker. A web app for browsing, selecting, and copying [agent skills](https://agentskills.io/specification) into any AI coding tool.

## What is this?

Skills are markdown files with instructions that coding agents (Claude Code, GitHub Copilot, Cursor, etc.) use to perform specialized tasks. This app lets you:

1. **Browse** your skill library as a visual node graph
2. **Select** the skills you need for your current task (your "loadout")
3. **Copy** the combined skill content to your clipboard
4. **Paste** into any agent CLI or chat interface

No auto-discovery, no magic. You choose what the agent gets.

### Why not just use the built-in skills system?

Most agent skill systems auto-discover and auto-load skills based on fuzzy matching. That means:

- You don't know when a skill fired
- You don't know what instructions the agent is following
- The agent's behavior changes based on opaque heuristics

Skillz takes the opposite approach: **deliberate disclosure**. You pick your loadout, you know exactly what context the agent receives.

## Setup

```bash
git clone https://github.com/yourorg/skillz.git
cd skillz
npm install
npm run dev
```

That's it. Open `http://localhost:5173`.

### Configuration

Copy `.env.example` to `.env` to customize:

```bash
# App name — displayed in the header and browser tab
VITE_APP_NAME=skillz

# Path to the skills directory (relative or absolute)
SKILLZ_DIR=./skills

# Path to the skill tree manifest (relative or absolute)
SKILLZ_MANIFEST=./skills.json
```

All values have sensible defaults. You don't need a `.env` file to get started.

### Deploy

```bash
npm run build
```

Outputs to `dist/`. Serve it with any static file server, or use the included GitHub Actions workflow for GitHub Pages.

## Adding skills

1. Create a directory: `skills/<category>/<skill-name>/`
2. Add a `SKILL.md` file following the [Agent Skills spec](https://agentskills.io/specification)
3. Add the skill to `skills.json`

The `skills.json` manifest defines the tree structure for the graph. Skill file paths are resolved automatically from the filesystem — you only need to specify IDs, labels, and types:

```json
{
  "tree": {
    "id": "root",
    "type": "root",
    "children": [
      {
        "id": "cat-my-category",
        "label": "my category",
        "type": "category",
        "children": [
          {
            "id": "skill-my-skill",
            "label": "my skill",
            "type": "skill"
          }
        ]
      }
    ]
  }
}
```

Skill IDs must match directory names (`skill-my-skill` resolves to `skills/*/my-skill/SKILL.md`).

Node types:
- `root` — the top-level node (one per tree)
- `category` — a grouping node (click to select all children)
- `skill` — a selectable skill

If `skills.json` is missing or invalid, the app generates a manifest by scanning the `skills/` directory.

### URL interpolation

Skills can reference their own sub-resources using variables that get resolved at runtime:

- `${baseUrl}` — the origin (e.g. `http://localhost:5173`)
- `${skillPath}` — the skill's directory path (e.g. `/skills/playground/playground`)

Example in a SKILL.md:

```markdown
Fetch the template: [design playground](${baseUrl}${skillPath}/templates/design-playground.md)
```

This lets agents fetch additional resources from the skill via HTTP.

## How it works

- `skills/` — Your skill markdown files (the actual content)
- `skills.json` — Tree structure for the graph (IDs, labels, types)
- `public/layout.json` — Node positions for the graph
- `scripts/prepare.js` — Runs before dev/build: symlinks skills into `public/`, resolves skill paths, writes enriched manifest to `public/skills.json`
- `src/skillData.js` — Pure functions for tree processing, content loading, and loadout stitching
- `src/App.jsx` — React app with [React Flow](https://reactflow.dev/) graph

## Tests

```bash
npm test
```

## License

MIT
