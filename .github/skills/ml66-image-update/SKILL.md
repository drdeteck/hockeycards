---
name: ml66-image-update
description: 'Add newly uploaded ML66 card images into Mario Lemieux data JSON, set inCollection to false when requested, and commit. Use when user says: "I added a card image", "add image to ML66 dataset", "mark not inCollection", or "commit this card update".'
argument-hint: 'Describe the new ML66 image file names and desired collection status (default false)'
user-invocable: true
---

# ML66 Image To Dataset Update

Use this skill for repeat updates where new Mario Lemieux card images are added under `img/cards/ML66` and the matching card entry must be created or updated in the Mario JSON dataset.

## Inputs
- New image files in `img/cards/ML66` (usually one front `*Fr.*` and one back `*Bk.*`)
- Collection status request (default to `inCollection: false` if user asks "not in collection")
- Optional: explicit target dataset file if user provides it

## Procedure
1. Identify new ML66 files.
- Run `git status --short` and capture new `img/cards/ML66/...` files.
- Pair front/back images by base filename (`...Fr` and `...Bk`).

2. Parse card identity from filename.
- Filename convention example: `1994-95-Stadium-Club---Finest-1-Mario-LemieuxFr.jpg`
- Derive: year, set/subset name, and card number (`base_number`).

3. Locate target Mario dataset file.
- Search both files:
  - `data/mario-lemieux-data-1985-86-to-1999-00.json`
  - `data/mario-lemieux-data-2000-01-to-present.json`
- Choose the file matching the card year.

4. Find or create the record.
- If card already exists: update `image_front`, `image_back`, and `inCollection` if requested.
- If card does not exist: add the card object in the correct set/subset with existing schema style.
- Preserve key ordering used nearby:
  - `id`, `base_number`, `orientation_front`, `orientation_back`, `image_front`, `image_back`, `tcdb_href`, `team`, `position`, `inCollection`, optional `price`

5. Follow repository conventions.
- Keep valid JSON only (no trailing commas, no comments).
- Keep 2-space indentation.
- Use relative image paths from repo root.
- Use empty string for unknown optional values (for example `tcdb_href`).

6. Validate and commit.
- Validate JSON parses.
- Stage only intended files (dataset JSON and added image files).
- Commit with a clear message, for example:
  - `Add 1994-95 Stadium Club Finest #1 image and collection status`

## Guardrails
- Do not modify unrelated sets/cards.
- Do not change existing IDs unless they are clearly wrong.
- If filename parsing is ambiguous, ask one concise clarifying question before editing.

## Expected Output To User
- What file was updated
- Which card/set/subset was created or modified
- `inCollection` value applied
- Commit hash and message
