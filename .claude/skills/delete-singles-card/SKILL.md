---
name: delete-singles-card
description: 'Delete a card from data/single-cards.json and its associated front/back images in img/cards/Singles. Use when asked to remove a Singles card, delete a single card entry, or clean up its Singles images. Never modify ML66 data or images.'
argument-hint: 'Identify the Singles card by set/subset and card ID, number, name, or TCDB link'
user-invocable: true
---

# Delete a Singles card

This skill applies **only** to `data/single-cards.json` and image files directly under `img/cards/Singles/`. Never edit or delete anything in `img/cards/ML66/`, any Mario Lemieux dataset, or an ML66 skill or script.

## Procedure

1. Inspect `git status --short` and the relevant portion of `data/single-cards.json`. Locate the card in a top-level set's `cards` array or one of its `subsets[].cards` arrays. Match the user's identifier to exactly one card, using the parent set/subset and `id`, `base_number`, `name`, or `tcdb_href` to resolve ambiguity. If there are multiple matches or no match, stop and ask for clarification; do not guess from a filename alone.
2. Record that card's `image_front` and `image_back` values before editing. Only consider nonempty paths that are directly under `img/cards/Singles/`; do not infer extra files by globbing or filename similarity. If either nonempty image path is outside that directory, stop and ask how to handle it. Confirm each path resolves to a regular file within that directory, not a symlink or a path containing traversal (`..`).
3. Check whether either image path is referenced by another card in `data/single-cards.json`. Do not delete a shared image; if sharing is unexpected, ask before proceeding. Do not overwrite or delete locally modified or untracked image files without the user's explicit approval. Preserve any pre-existing edits to the JSON.
4. Remove only the matched card object. If its subset is now empty, remove that subset. If its parent set has no cards and no subsets left, remove the set. Leave all other sets, subsets, card data, and image paths unchanged. Keep the JSON valid with its existing 2-space indentation.
5. Delete only the recorded, existing, unshared Singles image files, using literal fully resolved file paths (no wildcards or recursive deletion). If an image path is empty or the file is already missing, report that explicitly rather than treating it as a deletion.
6. Parse `data/single-cards.json` to validate syntax. Confirm that the targeted card, empty subset/set as applicable, and deleted image files are gone, and that any shared image remains. Check `git status --short` for the intended JSON and Singles image changes only. Do not run ML66 validation scripts.

Report the card identity, removed set/subset if applicable, images deleted or missing, and any images retained because they are shared. Do not commit unless the user requests a commit.
