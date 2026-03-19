# GitHub Copilot Instructions — Hockey Cards Collection

This is a static single-page web application for browsing and tracking a personal hockey card collection. There is **no backend, no build step, and no package manager**. All code runs in the browser.

---

## Technology Stack

- **UI Framework:** [Knockout.js](https://knockoutjs.com/) 3.5.0 — MVVM data-binding for all dynamic UI
- **CSS Framework:** Bootstrap 4.4.1 — responsive grid and base styles
- **Utilities:** jQuery 3.4.1, Underscore.js 1.8.3
- **Routing:** Hash-based URL routing (e.g. `#McD91-92`, `#McD91-92/Mc-1`)
- **Data storage:** Plain JavaScript files loaded via `<script>` tags — no database, no API, no fetch calls
- **Hosting:** GitHub Pages (static files only, Jekyll disabled via `.nojekyll`)
- **JavaScript style:** ES5, no modules, no transpiler, no bundler

All dependencies are loaded from CDN. There is no `package.json` or `node_modules`.

---

## File & Folder Paths

### Data Files (`/data/`)

Each dataset is a JSON file loaded at runtime from `app.js`:

| File | Root Shape | Contents |
|------|-----------|----------|
| `data/mcdonalds-data.json` | set map (`{ [set_key]: Set }`) | McDonald's sets 1991–92 through 1998–99 (~325 cards) |
| `data/mario-lemieux-data.json` | metadata + `sets` object | Mario Lemieux cards 1985–1999 (30+ sets, 437+ cards) |
| `data/96-97-cc-data.json` | set map (`{ [set_key]: Set }`) | 1996–97 Upper Deck Collector's Choice (412 cards) |
| `data/other-cards.json` | set map (`{ [set_key]: Set }`) | Rookies & singles collections |

### Image Files (`/img/cards/`)

Card images are stored in subfolders named after the set key:

```
img/cards/
├── McD91-92/      ← McDonald's 1991-92
├── McD92-93/      ← McDonald's 1992-93
├── McD93-94/      ← McDonald's 1993-94
├── McD94-95/      ← McDonald's 1994-95
├── McD95-96/      ← McDonald's 1995-96
├── McD96-97/      ← McDonald's 1996-97
├── McD97-98/      ← McDonald's 1997-98
├── McD98-99/      ← McDonald's 1998-99
├── ML66/          ← All Mario Lemieux cards (multi-year, multi-brand)
├── CC96-97/       ← 1996-97 Collector's Choice (partial)
└── Singles/       ← Rookie & other individual cards
```

Each card has a front image and a back image. Paths are stored directly in the card object (e.g. `"image_front": "img/cards/McD91-92/56699-Mc-1Fr.jpg"`). Empty string means no image yet.

---

## Information Architecture

The hierarchy is: **Set → Subset → Card**

```
Dataset (global window variable)
└── sets: { [set_key]: Set }
    └── Set
        ├── cards: Card[]          ← base/regular cards
        └── subsets: Subset[]      ← insert sets, parallels, holograms
            └── Subset
                └── cards: Card[]
```

- A **Set** is a complete card release (e.g. "1991-92 McDonald's Upper Deck All-Stars")
- A **Subset** is a secondary set within a parent set (e.g. "Wayne Gretzky Teammates" inserts inside McDonald's 1998-99)
- A **Card** is an individual collectible card

### URL Routing

| URL Pattern | Meaning |
|-------------|---------|
| `#McD91-92` | View set `McD91-92` |
| `#McD91-92/Mc-1` | View card `Mc-1` in set `McD91-92` |
| `#McD98-99/WayneGretzkyTeammates/T12` | View card `T12` in subset `WayneGretzkyTeammates` of set `McD98-99` |

---

## Data Schema

### Set Object

```js
{
  "set_key":          "McD91-92",                          // unique identifier
  "set_name":         "Upper Deck McDonald's All-Stars",   // brand/product name
  "set_year_label":   "1991-92",                           // display year
  "set_year_start":   1991,
  "set_year_end":     1992,
  "set_display_name": "1991-92 Upper Deck McDonald's All-Stars",
  "set_category":     "Upper Deck",                        // used for menu grouping
  "set_total_cards":  25,
  "set_tcdb_href":    "https://www.tcdb.com/...",          // optional external link
  "cards":            [ /* Card[] */ ],
  "subsets":          [ /* Subset[] — optional */ ]
}
```

For the Mario Lemieux dataset, the root object also includes dataset-level metadata:
```js
window.marioLemieuxData = {
  "dataset":      "mario-lemieux",
  "version":      "0.14.1",
  "player":       "Mario Lemieux",
  "updated_at":   "2026-03-13",
  "image_folder": "img/cards/ML66",
  "sets": { /* ... */ }
}
```

Mario Lemieux set keys have **no prefix** (e.g. `"1985-86-o-pee-chee"`), not `"ml-1985-86-o-pee-chee"`.

### Subset Object

```js
{
  "set_key":          "McD98-99-WayneGretzkyTeammates",    // "{parentKey}-{subsetName}"
  "set_name":         "Wayne Gretzky Teammates",
  "set_display_name": "Wayne Gretzky Teammates",
  "cards":            [ /* Card[] */ ]
}
```

### Card Object

```js
{
  // --- Identity ---
  "id":               "ml-1985-86-opc-9",    // unique card id (ML and CC datasets)
  "base_number":      "9",                   // card number as printed; used as the canonical key
  "name":             "Mario Lemieux",       // player name

  // --- Card details ---
  "team":             "Pittsburgh Penguins",
  "position":         "Center",
  "variant_note":     "Rookie",              // optional: variant label (e.g. "Rookie", "French")

  // --- Images ---
  "orientation_front": "portrait",           // "portrait" | "landscape" | "square"
  "orientation_back":  "portrait",
  "image_front":      "img/cards/ML66/1985-86-O-Pee-Chee-9-Mario-Lemieux-FR.jpg",
  "image_back":       "img/cards/ML66/1985-86-O-Pee-Chee-9-Mario-Lemieux-BK.jpg",

  // --- External links ---
  "tcdb_href":        "https://www.tcdb.com/...",   // optional: Trading Card Database link

  // --- Collection tracking ---
  "inCollection":     true,                  // true = owned; false or absent = not owned
  "price":            32.09                  // optional: estimated market value (float)
}
```

**Key fields for collection features:**
- `inCollection` — boolean; drives the "in collection" badge/filter
- `price` — float; displayed on card detail view; used for collection value calculations
- `base_number` — canonical card identifier used in URLs and data lookups
- `image_front` / `image_back` — relative paths from repo root; empty string if image not yet added

---

## App Architecture Notes

- **`app.js`** contains the entire application: Knockout ViewModel, routing logic (`BuildCardRoute`, `CardRouteParts`), and helper functions (`FindCardInData`)
- **`window.HCHB`** is the global namespace for all app code
- Data files are loaded asynchronously via `fetch` in `app.js` during `HCHB.App.Init()`
- All UI is rendered via Knockout `data-bind` attributes and `<script type="text/html">` templates in `index.html`
- Card front/back flipping is done with CSS 3D transforms (see `styles/card-detail.css`)
- No local storage, no cookies, no user accounts — collection state is entirely defined in the data JSON files
