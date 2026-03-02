# Contributing to Phil's Hockey Cards Collection

Thank you for your interest in contributing! This document covers everything you need to add cards, fix bugs, or improve the codebase — whether you are a human or a coding agent.

---

## Quick-start checklist

- [ ] Read the [README](README.md) to understand the project structure and data format
- [ ] Run the project locally (`python -m http.server 8080` then open http://localhost:8080)
- [ ] Make your change in a branch and open a pull request against `main`

---

## What can I contribute?

| Type | Where to look |
|---|---|
| Add / correct card data | `data/mcdonalds-data.js` or `data/mario-lemieux-data.js` |
| Add card images | `img/cards/<SET_KEY>/` |
| Fix UI / layout bugs | `styles/` CSS files |
| Add a new collection or player | See *Adding a New Collection* in the README |
| Fix JavaScript behaviour | `app.js` |
| Improve documentation | `README.md`, `CONTRIBUTING.md`, code comments |

---

## Adding or correcting card data

1. **Card images** must be placed in the appropriate subfolder under `img/cards/`. Use JPEG and follow the existing naming convention: `<setId>-<number>Fr.jpg` (front) and `<setId>-<number>Bk.jpg` (back).
2. **Data files** are plain JavaScript files loaded as `<script>` tags — no bundler required.
3. Use the schemas in the README as your reference. Keep field names consistent with existing entries.
4. Prefer [TCDB (Trading Card Database)](https://www.tcdb.com) as the authoritative source for card numbers, set names, and years.

---

## Code style

- **JavaScript**: ES5 (no arrow functions, no `const`/`let`, no modules). This keeps the code compatible with the existing codebase and avoids a build step.
- **CSS**: Follow the custom property (variable) conventions in `styles/style.css`. Avoid inline styles in `index.html` unless absolutely necessary.
- **HTML**: Knockout `data-bind` attributes are the primary way to connect data to the DOM. Avoid direct DOM manipulation in JavaScript outside of the ViewModel.
- Keep changes minimal and surgical — do not refactor unrelated code in the same PR.

---

## For coding agents

The following facts help you navigate the codebase efficiently:

- **No build step.** Changes to `.js`, `.css`, or `.html` files are immediately reflected when you reload the page.
- **Global namespace.** All app code lives under `window.HCHB`. Data files expose `window.rawData` and `window.marioCleanData`.
- **Knockout.js MVVM.** The single `DataViewModel` in `app.js` holds all observables. Templates in `index.html` use `data-bind` attributes.
- **Hash routing.** Navigation is entirely driven by `window.location.hash`. The `HandleRouteChange` function is the single entry point for all routing logic.
- **Static hosting.** The app is deployed to GitHub Pages from the repository root. No server-side code exists.
- **Data is loaded synchronously** via `<script src="data/…">` tags before `app.js` runs.
- When adding a new collection, the navigation menu (`MenuRows` computed) regenerates automatically from `self.Data`.

---

## Pull request guidelines

- Keep the PR focused on a single concern.
- Test your changes by running the app locally and verifying the affected views.
- Describe what you changed and why in the PR description.
- If you add card images, confirm they are correctly referenced in the data file.
