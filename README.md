# Phil's Hockey Cards Collection

A static single-page web application for browsing a personal hockey card collection. Built with vanilla JavaScript (Knockout.js), Bootstrap 4, and plain CSS — no build step required.

**Live site →** https://drdeteck.github.io/hockeycards/

---

## Collections

| Section | Sets | Cards |
|---|---|---|
| **McDonald's All-Stars** | 1991-92 through 1998-99 (Upper Deck promotionals, with inserts/holograms) | ~325 |
| **Mario Lemieux** | 1985-86 rookie through late 1990s (multi-brand) | ~67 |

---

## Features

- **Card grid** — browse a set by thumbnail with collector number and insert label
- **Card detail view** — full-size front/back image with a CSS flip animation
- **Deep-link routing** — every card and set has its own shareable URL (`#card/{setKey}/{cardNumber}`)
- **eBay search** — one-click search for a card in eBay's Sports Trading Cards category (Mario Lemieux collection)
- **TCDB links** — direct links to the [Trading Card Database](https://www.tcdb.com) for each set and card
- **Brand logos** — SVG logos for Upper Deck and Pinnacle inline in the page (no external image requests)
- **Responsive layout** — mobile-friendly card grid via Bootstrap 4

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data binding / MVVM | [Knockout.js 3.5](https://knockoutjs.com) |
| UI framework | [Bootstrap 4.4.1](https://getbootstrap.com/docs/4.4/) |
| DOM helpers | [jQuery 3.4.1](https://jquery.com) |
| Utilities | [Underscore.js 1.8.3](https://underscorejs.org) |
| Fonts | [Lato via Google Fonts](https://fonts.google.com/specimen/Lato) |
| Hosting | GitHub Pages (static, no server) |

All dependencies are loaded from public CDNs. There is **no build system, no npm, and no compilation step**.

---

## Project Structure

```
hockeycards/
├── index.html              # Single HTML shell — markup, Knockout templates, SVG icons
├── app.js                  # DataViewModel (Knockout) + routing + data helpers
├── data/
│   ├── mcdonalds-data.js   # McDonald's sets (exposes window.rawData)
│   └── mario-lemieux-data.js  # Mario Lemieux cards (exposes window.marioCleanData)
├── img/
│   └── cards/
│       ├── McD91-92/       # Card images for each McDonald's set
│       ├── McD92-93/
│       ├── …
│       └── ML66/           # Mario Lemieux card images
├── styles/
│   ├── style.css           # Global variables, body, header, footer
│   ├── card-grid.css       # Thumbnail grid layout
│   ├── card-grid-header.css # Year/set section headings in the grid
│   ├── card-detail.css     # Card profile / detail view
│   ├── controls.css        # Top navigation, set-selector buttons
│   └── main-header.css     # Site header bar
└── .nojekyll               # Disables GitHub Pages Jekyll processing
```

---

## Running Locally

No installation required. Open `index.html` directly in a browser, **or** use any static file server:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Install the "Live Server" extension, then click "Go Live"
```

Then open **http://localhost:8080** in your browser.

> **Note:** Opening `index.html` via `file://` works in most browsers but may have cross-origin restrictions for card images depending on your browser settings. A local server is recommended.

---

## URL / Routing Reference

The app uses hash-based routing. All routes are bookmarkable.

| URL hash | View |
|---|---|
| `#home` | Default landing page (McDonald's 1991-92 set) |
| `#about` | About page |
| `#McD91-92` | McDonald's 1991-92 set grid |
| `#McD97-98` | McDonald's 1997-98 set grid |
| `#ML-all` | All Mario Lemieux cards grouped by year |
| `#ML-1985-86` | Mario Lemieux cards for a specific season |
| `#card/{setKey}/{cardNumber}` | Card detail view (e.g. `#card/McD91-92/Mc-1`) |

---

## Data Format

### McDonald's data (`data/mcdonalds-data.js`)

Exports a global `window.rawData` object keyed by `set_key`:

```js
var rawData = {
  "McD91-92": {
    "set_key": "McD91-92",
    "set_name": "Upper Deck McDonald's All-Stars",
    "set_year_label": "1991-92",
    "set_year_start": 1991,
    "set_year_end": 1992,
    "set_brand": "Upper Deck",
    "set_category": "Upper Deck",   // used for menu grouping
    "set_total_cards": 25,
    "set_tcdb_href": "https://www.tcdb.com/…",
    "set_display_name": "1991-92 Upper Deck McDonald's All-Stars",
    "cards": [
      {
        "name": "Cam Neely",
        "number": "Mc-1",
        "base_number": "Mc-1",
        "team": "Boston Bruins",
        "position": "",
        "orientation": "portrait",    // "portrait" | "landscape"
        "image_front": "img/cards/McD91-92/56699-Mc-1Fr.jpg",
        "image_back":  "img/cards/McD91-92/56699-Mc-1Bk.jpg",
        "tcdb_href": "https://www.tcdb.com/…"
      }
      // …
    ],
    "inserts": [
      // optional: nested insert/hologram sets (same schema as top-level sets)
    ]
  }
};
```

### Mario Lemieux data (`data/mario-lemieux-data.js`)

Exports `window.marioCleanData` with a flat `cards` array; `app.js` builds per-year collections at runtime via `BuildMarioCollections()`:

```js
window.marioCleanData = {
  "dataset": "mario-lemieux-clean",
  "version": "0.2.0",
  "player": "Mario Lemieux",
  "updated_at": "2026-02-27",
  "cards": [
    {
      "id": "ml-1985-86-opc-9",
      "player_name": "Mario Lemieux",
      "set_year_label": "1985-86",
      "set_year_start": 1985,
      "set_year_end": 1986,
      "set_brand": "O-Pee-Chee",
      "set_name": "O-Pee-Chee",
      "set_display_name": "1985-86 O-Pee-Chee",
      "set_variant_note": "Rookie",
      "insert_subset": "",
      "base_number": "9",
      "orientation": "portrait",
      "image_front": "img/cards/ML66/1985-86-O-Pee-Chee-9-Mario-Lemieux-FR.jpg",
      "image_back":  "img/cards/ML66/1985-86-O-Pee-Chee-9-Mario-Lemieux-BK.jpg",
      "tcdb_href": "https://www.tcdb.com/…",
      "team": "Pittsburgh Penguins",
      "position": "Center"
    }
  ]
};
```

---

## Adding a New Collection

### Adding a McDonald's-style set

1. Add card images under `img/cards/<SET_KEY>/`.
2. Add a new entry to `window.rawData` in `data/mcdonalds-data.js` following the schema above.
3. The navigation menu and grid update automatically — no changes to `app.js` or `index.html` are needed.

### Adding a new player (Mario Lemieux-style)

1. Add card images under `img/cards/<PLAYER_FOLDER>/`.
2. Create a new data file `data/<player>-data.js` that exports a `window.<player>CleanData` object with the `marioCleanData` schema.
3. Load the script in `index.html` (before `app.js`).
4. In `app.js`, add a `BuildPlayerCollections()` function modelled on `BuildMarioCollections()` and merge the result into `mergedData` inside `App.Init`.

---

## Key `app.js` Concepts

| Symbol | Purpose |
|---|---|
| `HCHB.App` | Top-level namespace; `HCHB.App.Init()` bootstraps the page |
| `DataViewModel` | Knockout ViewModel — all observables, computed properties, and route logic live here |
| `self.Data` | `ko.observable({})` — master dictionary of all collections keyed by `set_key` |
| `self.CurrentCollectionKey` | Currently selected set; drives the card grid |
| `self.CurrentRoute` | Raw hash value (e.g. `"McD91-92"`, `"about"`, `"card/…"`) |
| `self.HandleRouteChange` | Parses the URL hash and updates observables accordingly |
| `self.BuildMarioCollections` | Transforms the flat `marioCleanData.cards` array into per-year collection objects |
| `self.MenuRows` | Computed array that generates the top navigation from `self.Data` |
| `self.BuildCardRoute(card, collection)` | Returns the `#card/{key}/{number}` hash for a card link |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding cards, fixing bugs, and opening pull requests.