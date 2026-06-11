---
name: ml66-add-from-tcdb
description: 'Fetch card metadata from a TCDB URL and write a new card entry into the correct Mario Lemieux dataset JSON, or move an existing card from Chase to Regular. Use when user says: "add a card from TCDB", "fetch card info from tcdb.com", "add this TCDB card", provides a tcdb.com/ViewCard.cfm URL, or says "move from chase to regular".'
argument-hint: 'Provide the TCDB card URL (ViewCard.cfm). Default dataset is Chase. Optionally override dataset (gems|stickers|regular) and inCollection (default false).'
user-invocable: true
---

# ML66 Add Card From TCDB

Use this skill to fetch card metadata from a `tcdb.com/ViewCard.cfm/...` URL and write the resulting card entry into the correct Mario Lemieux dataset JSON file. Does **not** commit and does **not** add images (use `ml66-image-update` for images).

## Inputs
- TCDB card URL (`https://www.tcdb.com/ViewCard.cfm/sid/{subsetSID}/cid/{cardID}/...`) — **required**
- Target dataset hint: `gems`, `stickers`, `regular` — optional; **defaults to `chase`** when omitted
- `inCollection` value: `true` or `false` (default `false`) — optional

## Target Dataset Routing
| Condition | File |
|---|---|
| Default (no hint) | `data/mario-lemieux-data-chase.json` |
| User says `chase` | `data/mario-lemieux-data-chase.json` |
| User says `gems` | `data/mario-lemieux-data-gems.json` |
| User says `stickers` | `data/mario-lemieux-data-stickers.json` |
| User says `regular`, year < 2000 | `data/mario-lemieux-data-1985-86-to-1999-00.json` |
| User says `regular`, year ≥ 2000 | `data/mario-lemieux-data-2000-01-to-present.json` |

## Procedure

### Step 1 — Fetch the TCDB card page
- Fetch the URL provided by the user (it will be a `/ViewCard.cfm/sid/{sid}/cid/{cid}/...` page).
- Extract the following from the fetched content:
  - **Card number** (`base_number`): from the `#CC1` / `#9` style heading near the player name
  - **Player name**: confirm it is "Mario Lemieux" (warn if not)
  - **Team**: from the team link (e.g. "Pittsburgh Penguins")
  - **Full set name**: from the page title or breadcrumb (e.g. "2002-03 Topps - Coast to Coast")
  - **Price**: from "Med. Price: $X.XX" (extract numeric value only, e.g. `1.50`)
  - **Parent set SID**: from the "Overview" link in the Set Links section (`/ViewSet.cfm/sid/{parentSID}/...`)
  - **Subset SID**: the `{sid}` from the URL itself
  - **TCDB card href**: the full URL provided by the user

### Step 2 — Derive set and card identifiers

**Year label** — extract "YYYY-YY" prefix from full set name (e.g. "2002-03 Topps - Coast to Coast" → `"2002-03"`).

**Year start / year end** — split year label integers (e.g. `"2002-03"` → `set_year_start: 2002`, `set_year_end: 2003`).

**Is subset?** — the card is in a subset if the full set name contains ` - ` after removing the "YYYY-YY " prefix (e.g. "2002-03 Topps - Coast to Coast" has " - " → it is a subset of "2002-03 Topps").

**Parent set name** — remove year prefix, take the part before ` - ` (e.g. "Topps").

**Subset name** — the part after ` - ` (e.g. "Coast to Coast"). If not a subset, there is no subset.

**Slugification rules** (apply to build `set_key` and `id`):
- Lowercase the entire string
- Replace ` - ` (space-dash-space) with `-`
- Replace spaces with `-`
- Strip apostrophes (`'`) and other non-alphanumeric, non-hyphen characters
- Collapse consecutive hyphens (`--`) into a single `-`
- Examples:
  - `"2002-03 Topps"` → `"2002-03-topps"`
  - `"2002-03 Topps - Coast to Coast"` → `"2002-03-topps-coast-to-coast"`
  - `"1992-93 O-Pee-Chee"` → `"1992-93-o-pee-chee"`
  - `"1990-91 Score"` → `"1990-91-score"`

**Parent `set_key`** — slugify "YYYY-YY ParentSetName" (e.g. `"2002-03-topps"`).

**Subset `set_key`** — slugify the full set name (e.g. `"2002-03-topps-coast-to-coast"`).

**Card `id`** — `"ml-" + effective_set_key + "-" + base_number.toLowerCase()`
- If card is in a subset: use the subset `set_key` (e.g. `"ml-2002-03-topps-coast-to-coast-cc1"`)
- If card is a base card: use the parent `set_key` (e.g. `"ml-2002-03-topps-2"`)

**`set_tcdb_href`** for a new parent set entry — construct from parent SID:
`"https://www.tcdb.com/ViewSet.cfm/sid/{parentSID}/"` + slug of full set name

### Step 3 — Determine target dataset file
- If no hint is given, **default to `data/mario-lemieux-data-chase.json`**.
- If user says `gems` → `mario-lemieux-data-gems.json`.
- If user says `stickers` → `mario-lemieux-data-stickers.json`.
- If user says `regular` → route by year: year < 2000 → `1985-86-to-1999-00.json`; year ≥ 2000 → `2000-01-to-present.json`.
- Never ask about the dataset unless the user explicitly requests an unknown target.

### Step 4 — Locate or create parent set entry
Open the target JSON file and look for `sets[parentSetKey]`.

If the parent set is **missing**, create it with this shape:
```json
"2002-03-topps": {
  "set_key": "2002-03-topps",
  "set_name": "Topps",
  "set_year_label": "2002-03",
  "set_year_start": 2002,
  "set_year_end": 2003,
  "set_display_name": "2002-03 Topps",
  "set_tcdb_href": "",
  "cards": [],
  "subsets": []
}
```
Insert the new set in alphabetical order by `set_key`.

### Step 5 — Locate or create subset entry (if applicable)
If the card is in a subset, look for the matching entry inside `sets[parentSetKey].subsets`.

If the **subset is missing**, add it to the `subsets` array:
```json
{
  "set_key": "2002-03-topps-coast-to-coast",
  "set_name": "Coast to Coast",
  "set_display_name": "2002-03 Topps - Coast to Coast",
  "set_tcdb_href": "",
  "cards": []
}
```

### Step 6 — Check for duplicate
Before inserting, scan `cards` in the target location for an existing entry whose `id` matches the derived card `id`.

If a match is found: **warn the user and stop** — do not overwrite.

### Step 7 — Detect and rename TCDB-named images in Chase folder

When images are downloaded from TCDB they are saved with a `{sid}-{cid}` filename. Before writing the card entry, check `img/cards/ML66/Chase/` for files matching that pattern and rename them.

**TCDB filename pattern** (derived from the card URL `sid/{sid}/cid/{cid}`):
- Front: `{sid}-{cid}Fr.jpg`
- Back: `{sid}-{cid}Bk.jpg`

**Standard ML66 Chase filename convention**:
1. Start with the full set display name.
2. Replace ` - ` (space-dash-space, the parent/subset separator) with `---`.
3. Replace all remaining spaces with `-`.
4. Append `-{CardNumber}-Mario-Lemieux{Fr|Bk}.jpg`.

Examples:
| Full set display name | Card # | Result |
|---|---|---|
| `1995-96 Select Certified - Gold Team` | `3` | `1995-96-Select-Certified---Gold-Team-3-Mario-LemieuxFr.jpg` |
| `2002-03 Topps - Coast to Coast` | `CC1` | `2002-03-Topps---Coast-to-Coast-CC1-Mario-LemieuxFr.jpg` |
| `2002-03 Topps` | `2` | `2002-03-Topps-2-Mario-LemieuxFr.jpg` |

**Detection and rename procedure**:
1. Extract `{sid}` and `{cid}` from the TCDB URL.
2. Check if `img/cards/ML66/Chase/{sid}-{cid}Fr.jpg` exists.
3. If found: rename it to `img/cards/ML66/Chase/{standardName}Fr.jpg` using the rules above.
4. Check if `img/cards/ML66/Chase/{sid}-{cid}Bk.jpg` exists.
5. If found: rename it to `img/cards/ML66/Chase/{standardName}Bk.jpg`.
6. Use PowerShell `Rename-Item` to rename: `Rename-Item -Path "img/cards/ML66/Chase/{old}" -NewName "{new}"`
7. If neither TCDB-named file exists, leave `image_front` and `image_back` as `""`.

### Step 8 — Build and insert the card object
Use this field order (omit `price` if not available):
```json
{
  "id": "ml-2002-03-topps-coast-to-coast-cc1",
  "base_number": "CC1",
  "orientation_front": "portrait",
  "orientation_back": "portrait",
  "image_front": "img/cards/ML66/Chase/2002-03-Topps---Coast-to-Coast-CC1-Mario-LemieuxFr.jpg",
  "image_back": "img/cards/ML66/Chase/2002-03-Topps---Coast-to-Coast-CC1-Mario-LemieuxBk.jpg",
  "tcdb_href": "https://www.tcdb.com/ViewCard.cfm/sid/50684/cid/1734485/2002-03-Topps-CC1-Mario-Lemieux",
  "team": "Pittsburgh Penguins",
  "position": "Center",
  "inCollection": false,
  "price": 1.50
}
```

Hardcoded / defaulted values:
- `orientation_front` / `orientation_back`: always `"portrait"`
- `image_front` / `image_back`: populated with renamed Chase path if image was found in step 7; otherwise `""` 
- `position`: always `"Center"` (Mario Lemieux only skill)
- `inCollection`: `false` unless user specified `true`
- `price`: float parsed from TCDB price; omit if not present on page

### Step 9 — Validate and write
- Validate that the modified JSON parses cleanly (no trailing commas, correct nesting).
- Write the updated file.
- Do **not** commit (no `git` commands).

## Guardrails
- Only write to Mario Lemieux dataset files (`data/mario-lemieux-data-*.json`).
- Do not modify unrelated sets or cards.
- Do not overwrite an existing card `id` — warn and stop.
- Treat filenames ending in `-placeholder` as temporary, non-official Chase images.
- Keep `-placeholder` images in Chase entries; when moving a card from Chase to a regular dataset, replace placeholder images with refreshed official images and update `image_front`/`image_back`.
- If the player on the TCDB page is not Mario Lemieux, warn the user before proceeding.
- If slugification of the set name is ambiguous (e.g. unusual punctuation), show the derived keys to the user and ask for confirmation before writing.

## Card Schema Reference
Key ordering for card objects in all Mario Lemieux dataset files:
`id`, `base_number`, `orientation_front`, `orientation_back`, `image_front`, `image_back`, `tcdb_href`, `team`, `position`, `inCollection`, `price` (optional)

For `mario-lemieux-data-gems.json` entries, also include `card_type` (e.g. `"memorabilia"`, `"autograph"`, `"numbered"`) before `orientation_front`.

## Expected Output To User
- Which file was updated
- What parent set / subset was created or already existed
- Card `id` inserted and its `inCollection` value
- Price recorded (or note that none was found)
- Whether images were found in `img/cards/ML66/Chase/` and renamed (old TCDB name → new standard name), or note that no images were found

---

## Move Card: Chase → Regular

Use this procedure when the user says "move this card from Chase to Regular", "promote to regular dataset", or similar.

### Inputs
- Card identifier: either a card `id` (e.g. `ml-2002-03-topps-coast-to-coast-cc1`) or a description the agent can match to a card in `mario-lemieux-data-chase.json`
- `inCollection` value to set in the destination — optional; preserve the existing value if omitted

### Move Procedure

**Step M1 — Locate the card in Chase**
- Open `data/mario-lemieux-data-chase.json`.
- Find the card by `id` in any set or subset `cards` array.
- If not found: warn the user and stop.
- Capture the full card object exactly as stored.

**Step M2 — Determine destination Regular file**
- Read `set_year_start` from the card (or parse from `set_year_label` if missing).
- If `set_year_start < 2000` → destination is `data/mario-lemieux-data-1985-86-to-1999-00.json`.
- If `set_year_start ≥ 2000` → destination is `data/mario-lemieux-data-2000-01-to-present.json`.

**Step M3 — Check for duplicate in destination**
- Open the destination Regular file.
- Search all sets and subsets for an entry whose `id` matches.
- If found: warn the user and stop — do not write a duplicate.

**Step M4 — Identify destination set/subset**
- Derive the parent `set_key` and subset `set_key` from the card's `id` using the same slugification rules as above.
- If the parent set does not exist in the destination: create it (same shape as Step 4 of the Add procedure).
- If the card belongs to a subset and the subset does not exist: create it (same shape as Step 5 of the Add procedure).

**Step M4b — Check for TCDB-named images in Chase folder**
- Using the `tcdb_href` stored on the card, extract `{sid}` and `{cid}`.
- Check if `img/cards/ML66/Chase/{sid}-{cid}Fr.jpg` or `{sid}-{cid}Bk.jpg` exist.
- If found: rename them using the standard ML66 filename convention (same rules as Step 7 of the Add procedure — replace ` - ` with `---`, spaces with `-`, append `-{CardNumber}-Mario-Lemieux{Fr|Bk}.jpg`).
- Use `Rename-Item` in PowerShell to perform the rename.
- Update the card object's `image_front` / `image_back` fields to the new Chase paths before writing to the destination.

**Step M5 — Write card to destination**
- Copy the full card object to the correct `cards` array in the destination file.
- If the user specified an `inCollection` override, apply it; otherwise preserve the original value.
- Preserve all other fields exactly (including `tcdb_href`, `price`, etc.).
- Exception: if `image_front` or `image_back` uses a filename ending in `-placeholder`, refresh to official non-placeholder images before writing to the regular dataset and update both image path fields.
- Validate JSON; write the destination file.

**Step M6 — Remove card from Chase**
- Remove the card object from its `cards` array in `data/mario-lemieux-data-chase.json`.
- If the parent set's `cards` array (and all subsets' `cards` arrays) are now empty after removal, **remove the entire set entry** from `sets` to keep the Chase file tidy.
- If a subset's `cards` array is empty but the parent set still has other non-empty subsets or base cards, remove only the empty subset.
- Validate JSON; write the Chase file.

**Step M7 — Report**
- Card `id` moved
- Source: `mario-lemieux-data-chase.json` (set/subset that was cleaned up, if any)
- Destination: which Regular file, which set/subset (created or existing)
- `inCollection` value in destination
- Whether images were found and renamed in `img/cards/ML66/Chase/` (old TCDB name → new standard name), or note that no images were found
