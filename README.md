# skillz

Agent skill loadout picker. A static web app for browsing, selecting, and copying agent skills into any AI coding tool.

## What is this?

Skills are markdown files with instructions, scripts, and resources that coding agents (Claude Code, GitHub Copilot, Cursor, etc.) use to perform specialized tasks. This app lets you:

1. **Browse** your team's skill library as a visual tree
2. **Select** the skills you need for your current task (your "loadout")
3. **Copy** the stitched-together skill content to your clipboard
4. **Paste** into any agent CLI or chat interface

No auto-discovery, no magic. You choose what the agent gets.

### Why not just use the built-in skills system?

Most agent skill systems auto-discover and auto-load skills based on fuzzy matching. That's clever engineering, but it means:

- You don't know when a skill fired
- You don't know what instructions the agent is following
- The agent's behavior changes based on opaque heuristics

Skillz takes the opposite approach: **deliberate disclosure**. You pick your loadout, you know exactly what context the agent receives, zero surprises.

## How skills with sub-content work

Some skills have selectable sub-content (like templates). In the `SKILL.md`, a `<!-- skillz:select -->` HTML comment marker separates the always-included core instructions from the optional dispatch section.

When you select a template in the UI, the app stitches the core content + your selected template(s) into one coherent block. The dispatch table listing all options is removed — the agent only sees what you chose.

## Setup

### Quick start (public)

1. Fork this repository
2. Enable GitHub Pages (Settings > Pages > Source: `main`, folder: `/ (root)`)
3. Add your skills to the `skills/` directory
4. Update `skills.json` to reflect your tree structure
5. Visit `https://yourusername.github.io/skillz`

### Private / internal (GitHub Enterprise or Team/Pro plans)

Same steps as above, but:

1. Fork to your org as a **private** repository
2. Enable GitHub Pages — on Enterprise/Team/Pro plans, private repo Pages are only accessible to org members
3. GitHub handles auth automatically. Only your org can see the site.

### Self-hosted

If you can't use GitHub Pages for private repos (e.g., free plan), serve it yourself:

```bash
# Clone the repo
git clone https://github.com/yourorg/skillz.git
cd skillz

# Serve with any static file server
python3 -m http.server 8080
# or
npx serve .
# or put behind nginx, Caddy, etc.
```

It's just static HTML/JS/CSS. No build step, no dependencies, runs anywhere.

## Adding skills

### Simple skill (no sub-content)

1. Create a directory: `skills/<category>/<skill-name>/`
2. Add a `SKILL.md` file following the [Agent Skills format](https://agentskills.io/specification)
3. Update `skills.json` to add the node to the tree

### Skill with selectable sub-content

1. Create a directory with a `SKILL.md` and a `templates/` subdirectory
2. Add the `<!-- skillz:select -->` marker in `SKILL.md` to separate core instructions from the dispatch section
3. Put each template as a `.md` file in `templates/`
4. Update `skills.json` with `hasSelectMarker: true` and template child nodes

### skills.json structure

```json
{
  "tree": {
    "id": "root",
    "label": "skillz",
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
            "type": "skill",
            "skillPath": "skills/my-category/my-skill/SKILL.md"
          }
        ]
      }
    ]
  }
}
```

Node types:
- `root` — the top-level node (one per tree)
- `category` — a grouping node (can also have `skillPath` if it's a skill+category hybrid)
- `skill` — a selectable skill leaf with a `skillPath`
- `template` — selectable sub-content under a skill, with `templatePath` and `parentSkill`

## Token counting

The loadout tray shows an estimated token count for each selected skill. This uses a rough character-based estimate (~0.25 tokens per character) to help you gauge how much context you're about to consume. Actual token counts will vary by model and tokenizer.

## License

MIT
