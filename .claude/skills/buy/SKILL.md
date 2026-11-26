---
name: buy
description: 'Mark a Mario Lemieux (ML66) card as bought: find it in the Mario data, set "inCollection": true and set "price" in CAD. Accepts an eBay/checkout screenshot, an ML66 image filename, a TCDB URL, a card id, or a plain description. Use when the user says "buy", "/buy", "I bought this", "just bought these", or "mark as in collection and set price".'
argument-hint: 'Screenshot, image filename, TCDB URL, card id, or description; optional price (e.g. "C$2.99" or "$4 USD")'
user-invocable: true
---

# Buy (mark ML66 cards as purchased)

Turn a purchase into data edits: for each card, set `"inCollection": true` and `"price"` (CAD) on the matching card in the Mario datasets. One or many cards per call.

## Data files

- `data/mario-lemieux-data-1985-86-to-1999-00.json`
- `data/mario-lemieux-data-2000-01-to-2009-10.json`
- `data/mario-lemieux-data-2010-11-to-present.json`
- `data/mario-lemieux-data-stickers.json`

Do not run `scripts/validate-ml66-ids.ps1`.

## 1. Extract each card from the input

| Input | What to pull out |
|---|---|
| Screenshot (eBay cart, invoice, order) | One card per line item: title, selected variation ("Card #: ...", "Select Card: ..."), price and its currency, thumbnail look |
| Image filename (`img/cards/ML66/...Fr.jpg`) | Path to grep for in `image_front` / `image_back` |
| TCDB URL | Grep for it in `tcdb_href`; if absent, use the URL slug (year, set, number) as a description |
| Card id (`ml-...`) | Grep `"id": "<id>"` |
| Description | Year, product, subset/parallel, card number |

Price: use the price the user gives, otherwise the item price shown in the screenshot. Shipping is not included. If no price is visible or given, ask.

## 2. Find the card

Grep the data files for the `id`, image path, or a regex built from year + product + number (e.g. `"id": "ml-2002-03-spx.*97"`). Then pick the exact entry:

- **Base vs. subset/parallel:** a listing often names a parallel ("Spectrum Silver", "Gold", "Red", "Classics"). Match the subset by name and look at the thumbnail. Don't set the base card when a parallel is named, or the other way around.
- **Similar products:** e.g. Topps vs. Topps Chrome, BAP Memorabilia vs. Signature Series. Go with the listing title.
- **Season:** listings often give a single year or the wrong season. Search both adjacent seasons (`2026` → `2026-27`, also check `2025-26`) before saying a card is missing.
- **Numbers:** sellers write `#3`, `T-15`, `TC10`, or a point value for NNO cards. Compare loosely.
- **Variation in the listing** (e.g. "Scratched"): if the data has only one entry, update it and mention the variation. Don't add `variant_note` unless asked.

If two entries still match equally well, ask one short question. If no entry exists, say so and suggest importing it (the `ml66-add-from-tcdb` / `ml66-card-structure` skills). Don't create a card silently.

If the card is already `"inCollection": true`, say so and ask before changing its price.

## 3. Price in CAD

- `C $` / `CA$` / `CAD` means already CAD. Use it as is.
- A bare `$` / `US $` / `USD` means USD. Convert at today's rate:
  `curl -s "https://api.frankfurter.dev/v1/latest?base=USD&symbols=CAD"`
  Multiply, round to 2 decimals, and give the rate in the reply.
- Coupons/discounts: use the price shown, and mention a visible coupon so the user can correct it.

## 4. Edit

On the matched card only:
- Set `"inCollection": true` (replace `false`, or add it if missing).
- Set `"price": <number>`. Replace the existing reference price, because `price` means paid price once owned.
- Keep every other field and the 2-space indentation unchanged. Use `Edit` with enough surrounding context (image path or id) to make the match unique.

Then run a JSON parse check on each edited file:

```powershell
Get-Content -Raw <file> | ConvertFrom-Json | Out-Null; if ($?) { "OK" }
```

## 5. Report

Show a short table: card, where it lives (set → subset), price (and the USD amount and rate if converted). Then add notes only for judgement calls (which parallel, season adjustment, coupon). Don't commit unless the user asks.
