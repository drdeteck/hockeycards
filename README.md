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
- **Deep-link routing** — every card and set has its own shareable URL (`#{setKey}/{cardKey}`)
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
│   ├── mcdonalds-data.json     # McDonald's sets
│   ├── mario-lemieux-data.json # Mario Lemieux cards
│   ├── 96-97-cc-data.json      # 1996-97 Collector's Choice
│   └── other-cards.json        # Other cards / singles
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

> **Note:** Opening `index.html` via `file://` is not supported now that datasets are loaded via `fetch` from `data/*.json`. Use a local server.

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
| `#{setKey}/{cardKey}` | Card detail view (e.g. `#McD91-92/Mc-1`, `#ml-1985-86-o-pee-chee/9`) |

---

## Data Format

### McDonald's data (`data/mcdonalds-data.json`)

Stores a JSON object keyed by `set_key`. Set-level attributes live on the set; cards carry only card-level data. Nested subsets (inserts/holograms) are in the `subsets` array:

```js
{
  "McD91-92": {
    "set_key": "McD91-92",
    "set_name": "Upper Deck McDonald's All-Stars",
    "set_year_label": "1991-92",
    "set_year_start": 1991,
    "set_year_end": 1992,
    "set_category": "Upper Deck",   // used for menu grouping
    "set_total_cards": 25,
    "set_tcdb_href": "https://www.tcdb.com/…",
    "set_display_name": "1991-92 Upper Deck McDonald's All-Stars",
    "cards": [
      {
        "name": "Cam Neely",
        "base_number": "Mc-1",
        "team": "Boston Bruins",
        "position": "",
        "orientation": "portrait",    // "portrait" | "landscape"
        "image_front": "img/cards/McD91-92/56699-Mc-1Fr.jpg",
        "image_back":  "img/cards/McD91-92/56699-Mc-1Bk.jpg",
        "tcdb_href": "https://www.tcdb.com/…"   // card/set TCDB link (optional)
      }
      // …
    ],
    "subsets": [
      // optional: nested insert/hologram sets (same schema as top-level sets)
    ]
  }
}
```

### Mario Lemieux data (`data/mario-lemieux-data.json`)

Stores dataset metadata plus a `sets` object. Each set carries its own attributes and a `cards` array. Cards with a distinct subset name are grouped under a `subsets` array on their parent set. `app.js` builds per-year virtual collections at runtime via `BuildMarioCollections()`:

```js
{
  "dataset": "mario-lemieux",
  "version": "0.4.0",
  "player": "Mario Lemieux",
  "updated_at": "2026-03-03",
  "image_folder": "img/cards/ML66",
  "sets": {
    "ml-1985-86-o-pee-chee": {
      "set_key": "ml-1985-86-o-pee-chee",
      "set_name": "O-Pee-Chee",
      "set_year_label": "1985-86",
      "set_year_start": 1985,
      "set_year_end": 1986,
      "set_display_name": "1985-86 O-Pee-Chee",
      "set_tcdb_href": "",
      "cards": [
        {
          "id": "ml-1985-86-opc-9",
          "base_number": "9",
          "variant_note": "Rookie",   // optional
          "orientation": "portrait",
          "image_front": "img/cards/ML66/1985-86-O-Pee-Chee-9-Mario-Lemieux-FR.jpg",
          "image_back":  "img/cards/ML66/1985-86-O-Pee-Chee-9-Mario-Lemieux-BK.jpg",
          "tcdb_href": "https://www.tcdb.com/…",
          "team": "Pittsburgh Penguins",
          "position": "Center"
        }
      ]
      // "subsets": [ … ]  // optional — for insert/parallel subsets within this set
    }
    // …
  }
}
```

---

## Adding a New Collection

### Adding a McDonald's-style set

1. Add card images under `img/cards/<SET_KEY>/`.
2. Add a new entry to `data/mcdonalds-data.json` following the schema above.
3. The navigation menu and grid update automatically — no changes to `app.js` or `index.html` are needed.

### Adding a new player (Mario Lemieux-style)

1. Add card images under `img/cards/<PLAYER_FOLDER>/`.
2. Create a new data file `data/<player>-data.json` with the `marioLemieuxData` schema (a `sets` object keyed by set_key).
3. In `app.js`, load that JSON dataset in `App.Init()` and merge it into `mergedData`.
4. Add a `Build<Player>Collections()` function modelled on `BuildMarioCollections()` if you need per-year virtual collections.

---

## Key `app.js` Concepts

| Symbol | Purpose |
|---|---|
| `HCHB.App` | Top-level namespace; `HCHB.App.Init()` bootstraps the page |
| `DataViewModel` | Knockout ViewModel — all observables, computed properties, and route logic live here |
| `self.Data` | `ko.observable({})` — master dictionary of all collections keyed by `set_key` |
| `self.CurrentCollectionKey` | Currently selected set; drives the card grid |
| `self.CurrentRoute` | Raw hash value (e.g. `"McD91-92"`, `"about"`, `"McD91-92/Mc-1"`) |
| `self.HandleRouteChange` | Parses the URL hash and updates observables accordingly |
| `self.BuildMarioCollections` | Transforms `marioLemieuxData.sets` into per-year virtual collections + individual proper sets |
| `self.MenuRows` | Computed array that generates the top navigation from `self.Data` |
| `self.BuildCardRoute(card, collection)` | Returns the `#{setKey}/{cardKey}` hash for a card link |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding cards, fixing bugs, and opening pull requests.