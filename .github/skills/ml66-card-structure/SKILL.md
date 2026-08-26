---
name: ml66-card-structure
description: 'Map ML66 image filenames to the correct set/subset hierarchy in the Mario Lemieux JSON dataset and validate the parent before inserting or moving a card. Use when the user provides a filename, says "import this card", or asks to add a card under a specific set/subset.'
argument-hint: 'Describe the ML66 filename(s), parent set, and requested collection state (owned or not).'
user-invocable: true
---

# ML66 Card Structure Resolver

Use this skill before inserting or moving a Mario Lemieux card in the dataset.

## Inputs
- One or more ML66 image filenames from `img/cards/ML66/...`
- Optional collection state: `inCollection: true|false`
- Optional price value
- Optional target dataset file if the user provides it

## Critical rule: parse hierarchy before editing
- The filename often contains year + product set + subset.
- Triple dashes `---` in the filename indicate a subset boundary.
- Example: `2001-02-Pacific---North-America-All-Stars-Die-Cuts-10-Mario-LemieuxFr.jpg`
  - year: `2001-02`
  - parent set: `Pacific`
  - subset: `North America All-Stars Die Cuts`
  - card number: `10`
- If the filename has no `---`, treat it as a direct set card unless the existing dataset proves otherwise.

## Required workflow
1. Parse year, parent set, subset, and card number from the filename.
2. Map the parsed values to the correct dataset file:
   - `data/mario-lemieux-data-1985-86-to-1999-00.json`
   - `data/mario-lemieux-data-2000-01-to-2009-10.json`
   - `data/mario-lemieux-data-2010-11-to-present.json`
   - `data/mario-lemieux-data-gems.json`
   - `data/mario-lemieux-data-stickers.json`
3. Check the existing JSON hierarchy before editing.
   - Confirm whether the item already exists as a set or a subset under a parent set.
   - Never promote a subset to a top-level set without evidence.
   - Never move a set under another set unless the existing data shows it belongs there.
4. Insert or update only inside the correct parent set/subset.
5. Preserve dataset conventions:
   - `Set → Subset → Card`
   - Use season spans such as `2001-02`, never a single year in the set key or display fields
   - Use relative image paths from repo root
   - Keep valid JSON and 2-space indentation
   - Keep `inCollection` as requested, default to `false` unless told otherwise
   - Add `price` only when explicitly requested or already present on the card lineage
6. Validate after editing:
   - JSON parse check only; do not run `scripts/validate-ml66-ids.ps1`
   - confirm set/subset placement matches the filename context
   - if ambiguous, ask one concise clarifying question before editing

## Guardrails
- Do not run `scripts/validate-ml66-ids.ps1` during card import or moves. That script is a manual user-side validation step, not part of the import workflow.
- Do not infer hierarchy from product name alone; confirm against the existing dataset structure.
- A filename with `---` is a subset signal; use it to attach to the correct parent set.
- If a subset is already under a parent set, keep it there.
- If a card is in a product line with a known parent set, do not create a duplicate top-level set.
- Do not change existing IDs unless they are clearly wrong.

## Short user prompt examples
- “Import this card, set inCollection:true and price:11.49. [filename]”
- “Import this card, set inCollection:false and price:11.49. [tcdb url]”

## Expected output to user
- Which dataset file was updated
- Which set and subset were used
- Whether the item was inserted as a set or a subset
- The `inCollection` value applied
- Any price applied
