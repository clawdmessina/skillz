# Document Critique Template

Use this template when the playground helps review and critique documents: SKILL.md files, READMEs, specs, proposals, or any text that needs structured feedback with approve/reject/comment workflow.

## Layout

```
+---------------------------+--------------------+
|                           |                    |
|  Document content         |  Suggestions panel |
|  with line numbers        |  (filterable list) |
|  and suggestion           |  • Approve         |
|  highlighting             |  • Reject          |
|                           |  • Comment         |
|                           |                    |
+---------------------------+--------------------+
|  Prompt output (approved + commented items)    |
|  [ Copy Prompt ]                               |
+------------------------------------------------+
```

## Key components

### Document panel (left)
- Display full document with line numbers
- Highlight lines with suggestions using a colored left border
- Color-code by status: pending (amber), approved (green), rejected (red with opacity)
- Click a suggestion card to scroll to the relevant line

### Suggestions panel (right)
- Filter tabs: All / Pending / Approved / Rejected
- Stats in header showing counts for each status
- Each suggestion card shows:
  - Line reference (e.g., "Line 3" or "Lines 17-24")
  - The suggestion text
  - Action buttons: Approve / Reject / Comment (or Reset if already decided)
  - Optional textarea for user comments

### Prompt output (bottom)
- Generates a prompt only from approved suggestions and user comments
- Groups by: Approved Improvements, Additional Feedback, Rejected (for context)
- Copy button with "Copied!" feedback

## State structure

```javascript
const suggestions = [
  {
    id: 1,
    lineRef: "Line 3",
    targetText: "description: Creates interactive...",
    suggestion: "The description is too long. Consider shortening.",
    category: "clarity",
    status: "pending",
    userComment: ""
  },
];

let state = {
  suggestions: [...],
  activeFilter: "all",
  activeSuggestionId: null
};
```

## Prompt output generation

Only include actionable items:

```javascript
function updatePrompt() {
  const approved = state.suggestions.filter(s => s.status === 'approved');
  const withComments = state.suggestions.filter(s => s.userComment?.trim());

  if (approved.length === 0 && withComments.length === 0) {
    return;
  }

  let prompt = 'Please update [DOCUMENT] with the following changes:\n\n';

  if (approved.length > 0) {
    prompt += '## Approved Improvements\n\n';
    for (const s of approved) {
      prompt += `**${s.lineRef}:** ${s.suggestion}`;
      if (s.userComment?.trim()) {
        prompt += `\n  User note: ${s.userComment.trim()}`;
      }
      prompt += '\n\n';
    }
  }
}
```

## Example use cases

- SKILL.md review (skill definition quality, completeness, clarity)
- README critique (documentation quality, missing sections, unclear explanations)
- Spec review (requirements clarity, missing edge cases, ambiguity)
- Proposal feedback (structure, argumentation, missing context)
- Code comment review (docstring quality, inline comment usefulness)
