# Diff Review Template

Use this template when the playground is about reviewing code diffs: git commits, pull requests, code changes with interactive line-by-line commenting for feedback.

## Layout

```
+-------------------+----------------------------------+
|                   |                                  |
|  Commit Header:   |  Diff Content                    |
|  • Hash           |  (files with hunks)              |
|  • Message        |  with line numbers               |
|  • Author/Date    |  and +/- indicators              |
|                   |                                  |
+-------------------+----------------------------------+
|  Prompt Output Panel (fixed bottom-right)            |
|  [ Copy All ]                                        |
|  Shows all comments formatted for prompt             |
+------------------------------------------------------+
```

Diff review playgrounds display git diffs with syntax highlighting. Users click lines to add comments, which become part of the generated prompt for code review feedback.

## Control types for diff review

| Feature | Control | Behavior |
|---|---|---|
| Line commenting | Click any diff line | Opens textarea below the line |
| Comment indicator | Badge on commented lines | Shows which lines have feedback |
| Save/Cancel | Buttons in comment box | Persist or discard comment |
| Copy prompt | Button in prompt panel | Copies all comments to clipboard |

## Diff rendering

Parse diff data into structured format for rendering:

```javascript
const diffData = [
  {
    file: "path/to/file.py",
    hunks: [
      {
        header: "@@ -41,13 +41,13 @@ function context",
        lines: [
          { type: "context", oldNum: 41, newNum: 41, content: "unchanged line" },
          { type: "deletion", oldNum: 42, newNum: null, content: "removed line" },
          { type: "addition", oldNum: null, newNum: 42, content: "added line" },
        ]
      }
    ]
  }
];
```

## Prompt output format

Generate a structured code review format:

```javascript
function updatePromptOutput() {
  const commentKeys = Object.keys(comments);

  if (commentKeys.length === 0) {
    promptContent.innerHTML = '<span class="no-comments">Click on any line to add a comment...</span>';
    return;
  }

  let output = 'Code Review Comments:\n\n';

  commentKeys.forEach(lineId => {
    const lineEl = document.querySelector(`[data-line-id="${lineId}"]`);
    const file = lineEl.dataset.file;
    const lineNum = lineEl.dataset.lineNum;
    const content = lineEl.dataset.content;

    output += `${file}:${lineNum}\n`;
    output += `   Code: ${content.trim()}\n`;
    output += `   Comment: ${comments[lineId]}\n\n`;
  });

  promptContent.textContent = output;
}
```

## Example topics

- Git commit review (single commit diff with line comments)
- Pull request review (multiple commits, file-level and line-level comments)
- Code diff comparison (before/after refactoring)
- Merge conflict resolution (showing both versions with annotations)
- Code audit (security review with findings per line)
