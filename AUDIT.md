# Repository Audit and Phased Cleanup Plan

Audit date: 2026-10-21. Baseline commit: `97eab4b`.
Status: recommendations only, agreed through the owner interview. No cleanup is authorized by this document.

## Executive Summary

Keep the static Knockout application. Prioritize faithful loading and presentation of the collection before reorganizing files or reducing repository size.

The most important confirmed findings are an owned sticker omitted by the runtime, silent partial-dataset loading, 14 missing image references, and two duplicate-ID groups. Existing IDs and duplicate records must remain unchanged pending a separate Radar compatibility review. The shared schema also conflicts with the legacy McDonald's dataset.

The cleanup should proceed in small, independently reviewed batches. Correct observable defects first, reconcile maintenance documentation next, and only then consider dependencies, assets, code organization, and reporting categories. Do not combine these into a rewrite.

## Agreed Decisions

| Topic | Decision |
| --- | --- |
| Deliverable | This audit and phased plan only. No application, data, asset, dependency, or workflow edits now. |
| Architecture | Preserve static GitHub Pages hosting, Knockout, ES5 source conventions, and no build step or package manager. |
| Primary objective | Protect collection data and simplify maintenance. |
| Radar | External consumer depends on card IDs. Its complete contract is unknown; freeze existing IDs until reviewed. |
| Duplicate records | Flag only. Do not merge, delete, deduplicate at runtime, or generate replacement IDs for existing records. |
| Public compatibility | Preserve set/subset keys, collector numbers, public hashes, and existing navigation behavior unless separately approved. |
| Data semantics | Preserve ownership, prices, season spans, wishlist entries, and current reporting exclusions. Do not infer ownership from images. |
| Assets | Keep originals. Inventory and owner review precede deletion, renaming, replacement, downloads, or conversion. |
| Imports | Preserve direct JSON editing and simple parse checks. Do not add validation gates to imports or run the manual ID validator during imports. |
| Commits | Require explicit owner approval. No automatic commits from image-update workflows. |
| Validation and CI | Recommend optional read-only checks first. CI and enforcement remain undecided and require a later decision. |
| Browser target | Current Edge/Chrome/Firefox and Safari/iOS. ES5 syntax does not imply Internet Explorer support. |
| Dependencies | Small reviewed upgrades; remove a dependency only after proving it unnecessary. No framework migration. |
| Internal structure | Incremental changes only after regression baselines; preserve behavior, public globals, and visual design. |
| Reporting categories | Plan a later, separately approved redesign of category tallies and denominators. Preserve current grouping until then. |
| Delivery | Small reviewable batches, one concern at a time, with a stop gate and rollback. No deadline assumed. |

## Scope and Evidence

Reviewed the application loader, collection builders, routing, statistics, binder, image handling, HTML templates, dependency declarations, all seven stylesheets' layout/motion patterns, schema, both PowerShell scripts, README, repository instructions, and three import skills. Inventoried every dataset and tracked card-image path, and inspected Git storage statistics and tracked maintenance files.

Performed read-only Chromium smoke checks using the existing server on an isolated port, with desktop `1440 x 900` and mobile-sized `390 x 900` viewports. This is mobile viewport emulation, not testing on an actual iPhone or Android device.

Limitations: not an exhaustive line-by-line review, penetration test, full JSON Schema validation run, accessibility certification, visual comparison of every card, image-content/hash duplicate scan, dependency-advisory scan, secrets/history scan, or deployment-configuration audit. Radar is outside the inspected workspace. Remote Actions, branch protection, Pages settings, and CDN availability were not independently verified. No performance benchmark or Firefox/Safari run was performed. No manual ID-validation script was executed.

### Data Baseline

Counts include both set cards and subset cards. Owned means explicit `inCollection: true`; these counts do not infer ownership or deduplicate records.

| Dataset | Card records | Explicitly owned |
| --- | ---: | ---: |
| [Collector's Choice](data/96-97-cc-data.json) | 412 | 0 |
| [Mario 1985-86 through 1999-00](data/mario-lemieux-data-1985-86-to-1999-00.json) | 617 | 513 |
| [Mario 2000-01 through 2009-10](data/mario-lemieux-data-2000-01-to-2009-10.json) | 602 | 455 |
| [Mario 2010-11 onward](data/mario-lemieux-data-2010-11-to-present.json) | 392 | 227 |
| [Chase](data/mario-lemieux-data-chase.json) | 40 | 1 |
| [Stickers](data/mario-lemieux-data-stickers.json) | 82 | 60 |
| [McDonald's](data/mcdonalds-data.json) | 325 | 235 |
| [Singles](data/single-cards.json) | 23 | 23 |
| **Total** | **2,493** | **1,514** |

All eight JSON files parsed successfully. All top-level set season labels matched `YYYY-YY`; this does not establish complete semantic year consistency. Missing ownership flags remain meaningful legacy data, not an instruction to mark Collector's Choice unowned.

Other measurements:

- Runtime global statistics: 2,492 total and 1,513 owned, one owned sticker fewer than source records.
- 4,066 tracked card-image files, approximately 236.3 MiB on disk; largest approximately 1.28 MiB.
- 3,983 distinct nonempty local image-reference strings in JSON, including four root-relative strings.
- 14 relative image-reference strings have no matching tracked file and no file at the referenced local path.
- Four root-relative strings resolve to tracked files after removing the leading slash; these are portability risks, not missing-file findings.
- 97 tracked card-image files have no direct JSON reference after leading-slash normalization. This includes code-referenced placeholders and is not an unused-file count.
- Two duplicate nonempty card-ID groups. All 325 McDonald's card records omit `id`.
- [app.js](app.js) has 2,812 lines; [index.html](index.html) has 1,036 lines; seven CSS files total approximately 59 KiB.
- No tracked automated test suite or workflow YAML was found. The local workflows directory was empty; this does not establish remote repository settings.

## Findings

Severity here describes collection correctness and maintenance risk, not a CVSS rating. High findings should precede structural cleanup; frozen data findings remain blocked regardless of severity.

### ~~F01 - High: Sticker Subsets Are Omitted at Runtime~~ (Resolved)

~~Evidence: [BuildStickerCollections](app.js#L362) processed only each set's direct `cards` and emitted empty subsets. The sticker dataset contains the owned card `ml-sticker-1989-90-opc-stickers-future-star-all-star-backs-24` in a subset. Browser comparison confirmed that this ID was absent from the runtime collection.~~

~~Impact: one owned sticker was missing from runtime browsing. Source totals are 82 stickers / 60 owned; runtime showed 81 / 59.~~

~~Recommendation: teach the sticker builder to preserve and expose subset cards and their routes without changing source records or IDs. Add a focused subset-card fixture and count comparison. Do not change category definitions or deduplicate other records as part of this fix.~~

Resolution: the sticker and regular Mario builders now share set/subset construction logic. The subset card is included in the sticker collections and routes correctly; browser verification confirmed 82 stickers and the expected subset-card detail view.

### ~~F02 - High: Dataset Failures Look Like a Smaller Collection~~ (Resolved)

~~Evidence: [loader error handling](app.js#L13) catches individual fetch failures, logs a console warning, and substitutes missing data. Blocking the late Mario dataset in Chromium reduced the global total from 2,492 to 2,100. There was no visible dataset-failure message or live alert. Unblocking and reloading restored 2,492.~~

~~Impact: apparently valid totals can silently describe an incomplete collection.~~

~~Recommendation: retain healthy datasets, expose loading/partial/failure states, identify unavailable collections, and distinguish incomplete statistics from complete statistics. A retry should not produce duplicate bindings. Verify one failed request, malformed JSON, and successful recovery.~~

Resolution: healthy datasets still load, and any dataset that fails to fetch or parse is now named in a red `role="alert"` banner above the header, stating that collections and counts may be incomplete. The console warning is kept. Recovery is a page reload, so there is no in-app retry and no risk of duplicate bindings. Browser verification covered a normal load (no banner), a blocked late Mario dataset (banner; `ML-all` 1,219 instead of 1,611), malformed sticker JSON (banner), and recovery after reload (no banner, 1,611).

### ~~F03 - High: Missing Image Paths and Deployment-Path Inconsistency~~ (Resolved)

~~Evidence: the full UTF-8-aware reference inventory found 14 absent local paths listed in the appendix. Four additional strings begin with `/img/` in the late Mario and singles datasets. Their files exist under repository-relative paths.~~

~~Impact: affected images fall back rather than showing the intended card. Root-relative URLs work at a domain root but can fail when the application is hosted under a repository subpath. [CNAME](CNAME) names a custom domain, while the README also advertises a GitHub Pages URL.~~

~~Recommendation: inspect nearby assets for extension/naming mismatches, and propose exact path-only corrections for owner review. Do not invent scans, fetch replacements, relabel seasons, or rename IDs. Preserve fallbacks for genuinely unavailable images. Test both domain-root and project-subpath URL resolution before approving path normalization.~~

Resolution: normalized all four root-relative `/img/...` paths to repository-relative `img/...` paths in `data/mario-lemieux-data-2010-11-to-present.json` and `data/single-cards.json`. Renamed the two existing `2011-12-In-The-Game-Captain-C-50` files to `2011-12-In-The-Game---Captain-C-50...` to match the subset `---` naming convention, corrected the `POEE97-8` → `POE97-8` back-image typo in `data/mario-lemieux-data-2010-11-to-present.json`, and cleared the remaining 11 genuinely absent scan references to `""` (empty string) so they cleanly use the placeholder fallback without 404s. Verified 0 root-relative paths and 0 missing files across all 3,985 non-empty image references.

### F04 - High, Frozen: Two Duplicate-ID Groups

Evidence:

- In [early Mario data](data/mario-lemieux-data-1985-86-to-1999-00.json#L9138), `ml-1996-97-pinnacle-mint-mint-collection-1` appears twice in the same subset with the same collector number and image path.
- In [late Mario data](data/mario-lemieux-data-2010-11-to-present.json#L8472), `ml-2026-27-upper-deck-team-canada-representing-the-flag-rf-8` is used by both a base entry and a Pink parallel.

Impact: ID-based external consumers can conflate records. The two cases require different domain decisions; a generic deduplication pass would be unsafe.

Recommendation agreed with owner: flag both, preserve all current records and IDs, and require Radar review before any repair proposal. Do not quietly deduplicate statistics or binder entries. Any future enforcement should baseline these exceptions rather than demand immediate repair.

### ~~F05 - Medium: Shared Schema Does Not Match All Existing Data~~ (Resolved)

~~Evidence: [card requirements](hockey-card.schema.json) require `id` and `base_number`, but the 325 McDonald's cards do not have IDs. The schema's `datasetDocument` definition is not selected as an exclusive root alternative. The schema also permits a specific `serial_number` field while repository instructions say only total print runs are tracked.~~

~~Impact: applying this schema uniformly would reject existing legacy data, while its root shape and domain descriptions do not fully enforce the intended model.~~

~~Recommendation: decide and document separate legacy and wrapped-dataset contracts before enabling validation. Preserve McDonald's identities; do not manufacture IDs to satisfy the schema. Tighten root alternatives and season rules only against representative valid fixtures. Reconcile serial-number and price descriptions without changing stored values.~~

Resolution: [hockey-card.schema.json](hockey-card.schema.json) now uses an exclusive root `oneOf` between `datasetDocument` (wrapped datasets, where cards require both `id` and `base_number`) and `setMap` (legacy set-map datasets, where cards require `base_number` and `id` is optional, preserving McDonald's identities without synthetic IDs). Legacy subset fields (`set_category`, `set_total_cards`) and `YYYY-YY` season-span patterns on `set_year_label` are enforced. Per owner direction, legacy `position` fields were removed from dataset JSON and documentation examples, the single redundant `serial_number` entry (already paired with `serial_total: 600`) and its schema property were removed in favor of `serial_total`, and `price` descriptions were aligned across schema and instructions. All eight datasets and six negative fixtures were validated against the updated schema.

### F06 - Medium: Maintenance Workflows Have Drifted

Evidence: [TCDB helper](scripts/add-ml66-from-tcdb.ps1) accepts the obsolete `2000-01-to-present` target, defaults to Chase unlike the current skill, contains an absolute developer-machine image path, and defines unused rename/insertion helpers. Its main loop extracts URL IDs and prints a next-step message; it does not perform the full import its heading suggests.

[Image-update skill](.claude/skills/ml66-image-update/SKILL.md) says to commit and refers to "all four regular files" while listing three. [TCDB skill](.claude/skills/ml66-add-from-tcdb/SKILL.md) and [structure skill](.claude/skills/ml66-card-structure/SKILL.md) differ in filename, price, and insertion-order details. Repository instructions still mention the obsolete regular-dataset filename in placeholder guidance and incorrectly say no local storage is used.

Recommendation: establish one authoritative policy and make helpers/skills consistent with it. Document the TCDB helper honestly or retire it only after owner approval. Require explicit commits and image replacement approval; preserve direct imports and parse-only import checks. Use script-relative paths if the helper remains. Clarify placeholder naming variants without mass renaming historical files.

### F07 - Medium: Local Server Safety Needs Narrow Hardening

Evidence: [Stop-StaleServeProcess](_serve.ps1#L42) accepts a `ScriptPath` argument but does not verify the listening process actually runs that script; a PowerShell process name is sufficient for forced termination. The request handler joins decoded request paths to the repository root without an explicit canonical-path containment check.

Impact: local development can terminate an unrelated PowerShell-hosted server on the selected port. The path handling lacks a defense against serving outside the intended root; request-level exploitability was not tested.

Recommendation: default to reporting a port conflict instead of terminating a process, or verify the exact script invocation before any explicitly approved replacement. Canonicalize and enforce the serving root, including a defined policy for links/reparse points. Keep the listener local. Test conflict handling and outside-root rejection without killing unrelated processes.

### F08 - Medium: Dependency and Loading Policy Is Unmaintained

Evidence: [dependency declarations](index.html#L29) load Bootstrap 4.4.1, jQuery 3.4.1, Knockout 3.5.0, and Underscore 1.8.3 from CDNs. Bootstrap CSS has an integrity hash; the JavaScript CDN tags do not. No direct jQuery or Underscore API use was found in the application files reviewed. No Bootstrap JavaScript is loaded.

Recommendation: verify jQuery and Underscore removal in isolated browser runs before deleting either tag. Retain Knockout and Bootstrap styling. Evaluate small compatible upgrades with release notes and applicable security advisories; age alone is not proof of an exploitable vulnerability. Pin reviewed resources, add appropriate integrity/cross-origin attributes, and define a deliberate cache-version update policy. Do not introduce a package manager or vendored dependency tree without a new decision.

### F09 - Medium: Related-Card Labels Discard Collector Numbers

Evidence: [related-card template](index.html#L418) displays `card.number || 'NNO'`, while routing and normal labels prefer `base_number`. Chromium displayed `NNO` for related entries whose numbers were known, including O-Pee-Chee 262 and Topps 9.

Recommendation: use the existing canonical number fallback in the display binding, with a focused known-number / genuine-NNO check. Do not change records or routes to fix a label.

### F10 - Medium, Policy-Gated: Reporting Categories Are Misleading

Evidence: [IsMarioSource](app.js#L358) includes Collector's Choice and other cards, and [GlobalStats](app.js#L2352) uses that grouping for its Mario tally. The broad label is not a pure Mario Lemieux count. Image coverage counts nonempty path strings, not successful image loads. Prices are summed as recorded; other code distinguishes a US location without a currency-normalized accounting model.

Recommendation: after correctness fixes, separately agree category membership, record-versus-unique-card counting, ownership denominators, unavailable-dataset handling, image coverage meaning, and price/currency semantics. Do not introduce currency conversion or reinterpret values during cleanup. Exclusion choices such as Giant Eagle base versus all variants need explicit scope; never hard-code an ad hoc reporting request into global statistics.

### F11 - Medium: Documentation and Accessibility Follow-Up

Evidence: [README](README.md) lists approximately 67 Mario cards and contradicts itself about opening the page directly versus requiring a server. Its route example uses an obsolete Mario key prefix. [HTML metadata](index.html#L1) describes an outdated collection span and does not declare a document language. Motion is used in card flips, scrolling, and theme transitions; no reduced-motion rule was found in the stylesheet search. Existing labels and focus styling are present, so this is not a claim that accessibility support is absent.

Recommendation: update the README, site descriptions, route examples, and local server instructions. Add document language and reduced-motion support, then manually check keyboard navigation, flip state announcements, contrast in both themes, and mobile controls. Preserve visual design. Link the authoritative policies instead of duplicating fast-changing counts across documents.

### F12 - Low: Asset and Source Cleanup Need Evidence Before Action

Evidence: card images occupy about 236.3 MiB; 97 have no direct normalized JSON reference. Grid images have no explicit native lazy-loading attribute. Large collection views can render many cards, and [FindCardsByName](app.js#L1373) scans physical and virtual collections. CSS contains repeated vendor-prefixed declarations and overlapping responsibilities, but this does not prove individual rules are unused.

Recommendation: inventory code/template references, planned imports, placeholders, exact-content duplicates, dimensions, and encoding before any asset removal. Measure the all-cards view before introducing thumbnails or pagination. Evaluate lazy loading for below-fold images only, preserving above-fold/detail loading and image dimensions. Split source responsibilities only where measured maintenance complexity justifies it. Do not rewrite Git history or delete originals to achieve an arbitrary size target.

## Phased Plan

Each phase requires owner review before implementation. Completing a phase does not authorize the next. Effort is relative: S means a narrow batch; M means several independently checked batches, not a calendar estimate.

### Phase 0 - Freeze Contracts and Capture Baselines (S)

Dependencies: none. Findings: F04, F05, F10.

1. Record the audited revision, current ID multiset, full duplicate records, source counts, representative hashes, and binder ordering/exclusions.
2. Record Radar as an unresolved external contract. Request its code/documentation before proposing any ID-related change.
3. Agree how optional read-only checks will be invoked. Do not enable CI or change imports yet.
4. Keep a known-good browser smoke checklist and make expected failures explicit, including the missing sticker.

Exit gate: owner accepts the baseline and protected-field list. Duplicate records and IDs remain byte-for-byte unchanged. CI approval is not required to proceed with manual checks.

Rollback: remove only newly approved baseline/check artifacts; no collection or runtime behavior changes in this phase.

### Phase 1 - Correct Runtime Integrity and Display (M)

Dependencies: Phase 0. Findings: F01, F02, F03, F09. Use a separate reviewable batch for each finding.

1. Preserve sticker subset cards through collection construction, route context, binder, and statistics.
2. Add visible partial-load/error status and recovery without hiding healthy collections or presenting incomplete totals as complete.
3. Fix the related-card collector-number fallback in the template.
4. Present a reviewed mapping for the 14 missing image references and four root-relative paths. Apply only approved, verified path corrections; leave unresolved scans explicitly unavailable.

Exit gate: with the current data revision and no data changes, runtime totals become 2,493 / 1,514 owned, stickers 82 / 60 owned. The omitted sticker has a working subset route. Base/subset/encoded/unknown hashes work. One blocked or malformed dataset produces an accessible visible warning and accurately identified incomplete statistics. Known related-card numbers render correctly. No ID, duplicate record, ownership, price, or season value changes.

Rollback: revert the specific code/template batch or approved image-path mapping. Do not revert unrelated card imports made after the baseline; rebase expected counts on their reviewed source delta.

### Phase 2 - Align Documentation, Scripts, and Schema (M)

Dependencies: Phase 0; reflect Phase 1 behavior as it lands. Findings: F05, F06, F07, F11.

1. Update README and metadata; document the real collection inventory, hash formats, fetch/server requirement, and theme-only local storage.
2. Reconcile repository instructions and import skills with the interview decisions. Require explicit commits and image replacement approval. Keep validation scripts out of imports.
3. Decide whether the partial TCDB helper should remain, be clearly labeled, or be retired. If retained, remove obsolete targets and machine-specific paths without silently turning it into a new importer.
4. Reconcile schema variants and field semantics using representative legacy, wrapped, subset, and serial-numbered fixtures; do not add IDs or rewrite data to satisfy validation.
5. Harden local serving root containment and port-conflict behavior in its own batch.

Exit gate: no contradictory import/commit rules, accurate supported dataset paths, valid representative schema cases and deliberate invalid cases, no changes to collection identities, and safe server conflict/path tests. Schema changes are not proof of full dataset validation unless actually run and reported.

Rollback: revert only the changed documentation/schema/script batch. No bulk JSON formatting or data migrations.

### Phase 3 - Add Optional Checks; Reevaluate CI (M)

Dependencies: Phases 0 and 2; use corrected Phase 1 behavior as expected output. Findings: F01-F07, F09.

1. Propose dependency-free, read-only checks for JSON parsing, protected-field drift, exact-case tracked image references, duplicate/set-key collisions, and raw-to-runtime counts. Use explicit UTF-8 and literal filesystem paths.
2. Report legacy duplicate IDs as acknowledged baseline exceptions; do not require repair. Distinguish empty image fields, root-relative paths, missing files, and dynamically referenced assets.
3. Reuse the existing manual ID tool where appropriate for the owner's manual workflow; do not run it automatically or expand its import role.
4. Revisit three choices with the owner: manual checklist only; optional local checks; optional local checks plus GitHub Actions. Recommendation: optional local checks first, then CI only after low-noise results and separate approval.
5. If CI is later approved, decide triggers and whether it reports or blocks merges. Do not introduce automatic fixes, commits, a build step, or a package manager.

Exit gate: checks leave the worktree unchanged, flag deliberately introduced fixture defects, and do not block known exceptions or routine imports. CI remains disabled until explicitly approved. No full JSON Schema validator is selected by implication; agree its installation/runtime requirements first.

Rollback: disable the new check entry point or approved workflow. Keep documented manual recovery steps.

### Phase 4 - Dependencies, Accessibility, and Asset Review (M)

Dependencies: Phase 1 and usable regression baselines from Phases 0/3; optional CI is not a prerequisite. Findings: F03, F08, F11, F12.

1. Verify unused-library candidates in isolation, then review compatible updates and integrity attributes one dependency at a time.
2. Add language and reduced-motion support; test keyboard operation, focus visibility, named controls, contrast, and mobile navigation without redesigning the interface.
3. Produce an owner-reviewed asset inventory with reasons to retain/remove each candidate. Exclude code-referenced placeholders and pending imports from deletion candidates.
4. Measure large-grid requests, transferred bytes, and rendering before proposing lazy loading, thumbnails, or caching changes. Preserve scan quality, originals, route behavior, and fallback handling.

Exit gate: desktop/mobile smoke matrix passes, reviewed third-party notices remain available, CDN failure behavior is understood, and each asset change has explicit approval and a reference check. Verify Firefox and Safari/iOS before declaring cross-browser completion.

Rollback: restore the individual dependency tag/version or asset from its reviewed mapping. No history rewriting or wholesale image re-encoding.

### Phase 5 - Incremental Source Organization (M, Optional)

Dependencies: stable Phases 1-4 and recorded behavior checks. Findings: F06, F12.

1. Identify a demonstrated maintenance problem before choosing a split. Candidates are collection builders, routing, reporting helpers, and binder logic, not a new framework.
2. If justified, move one responsibility at a time into ordinary ordered browser scripts, retaining `window.HCHB`, public ViewModel methods, ES5 syntax, and no-build execution.
3. Consolidate proven duplicate CSS rules only after checking both themes, orientation classes, breakpoints, binder, detail flips, and print behavior where applicable.

Exit gate: representative route generation/resolution, counts, menu behavior, ownership overlays, binder slot order, and visual layouts are unchanged. Source splitting is optional; skip it if it adds indirection without reducing real complexity.

Rollback: restore the previous script order/file organization in one focused reversal. Do not combine with dependency upgrades or data edits.

### Phase 6 - Reporting Definitions (M, Separately Approved)

Dependencies: Phase 1 integrity fixes, stable regression checks, and a new reporting interview. Finding: F10.

1. Agree explicit Mario, McDonald's, Collector's Choice, singles, stickers, and Chase category membership and whether combined rollups are needed.
2. Agree raw-record versus unique-card counts, ownership denominators, Giant Eagle/variant exclusions, image coverage meaning, partial-dataset status, and price/currency labels. Frozen duplicate records do not authorize deduplication here.
3. Implement approved presentation/grouping changes without altering stored ownership, price, season, identity, or image provenance. Keep Radar compatibility a prerequisite for any newly proposed identity operation.

Exit gate: each displayed total reconciles with its approved membership and denominator; excluded groups are visible in the reporting definition. Existing raw records remain intact. No silent currency conversion or market/paid-price reinterpretation.

Rollback: restore prior reporting/grouping code and labels, not collection data.

## Regression Checklist

- Data: all eight JSON documents parse with UTF-8; approved ID multiset and duplicate records remain unchanged; compare source counts against runtime projections.
- Routes: home, McDonald's, Mario year, physical set, subset, encoded collector number, invalid encoding, unknown set/card, browser back/forward, and copied deep links.
- Images: front/back, landscape/square/extra-tall, genuine missing scans, placeholders, default back face, filename-copy action, custom-domain and project-subpath resolution.
- Collection controls: owned/off/wish, known ownership badges, counts, loading/partial/failure/retry state, and external-link URL generation.
- Binder: all three Mario binders, merged early years, stickers, McDonald's, page boundaries, year jump, exclusions, slot order, and next/previous state.
- Presentation: current desktop and mobile browsers, light/dark themes, keyboard focus, reduced motion, navigation sizing, and no unintended document overflow.
- Maintenance: no automatic commits, no downloads/replacements/deletions without approval, no new import validation gates, and no destructive Git operations.

## Checks Performed During This Audit

- Clean initial worktree; tracked-file inventory and baseline revision recorded.
- Parsed all eight datasets; traversed both direct and subset cards; checked duplicate nonempty IDs and exact-case tracked image references using explicit UTF-8.
- `node --check app.js` passed. Node was already available; no packages were installed and this does not create a Node requirement for the application.
- Chromium resolved McDonald's, Mario year, O-Pee-Chee card detail, binder, and unknown-card routes. Sampled desktop/mobile views had no document-level horizontal overflow; this is not a complete visual or accessibility pass.
- Chromium label-click wishlist filtering produced one visible unowned card in the sampled three-card Mario year. Theme changed to dark and back; binder next advanced to 1989-90 and previous returned; front/back controls changed the observable face and were restored.
- Direct radio-input automation was intercepted by its label icon; clicking the enclosing visible label succeeded. This was not classified as a user-facing control failure.
- Dataset-failure simulation produced 2,100 cards without a visible warning; restoring the request restored 2,492. No page exception occurred in that failure/recovery check.
- Existing too-thick and memorabilia virtual collections are already excluded from global tally duplication; no defect is claimed there.

## Appendix: Missing Relative Image References

These 14 paths were absent both from the tracked inventory and at the referenced local location. The table gives filename stems under `img/cards/ML66/`; append the listed face suffix and `.jpg`. It does not authorize downloading or guessing replacement scans.

| Filename stem | Missing faces |
| --- | --- |
| `2009-10-Upper-Deck-Black-Diamond---Horizontal-BD28-Mario-Lemieux` | `Fr`, `Bk` |
| `2011-12-In-The-Game---Captain-C-50-Mario-Lemieux` | `Fr`, `Bk` |
| `2017-18-Upper-Deck-Team-Canada---UD-Exclusives-Silver-133-Mario-Lemieux` | `Bk` |
| `2017-Upper-Deck-Team-Canada-Juniors---Program-of-Excellence-1997-98-Retro-POEE97-8-Mario-Lemieux` | `Bk` |
| `2017-Upper-Deck-Team-Canada-Juniors---Red-Exclusives-99-Mario-Lemieux` | `Bk` |
| `2018-Upper-Deck-Team-Canada-Juniors---Blue-100-Mario-Lemieux` | `Fr`, `Bk` |
| `2022-23-Upper-Deck-Synergy---Cranked-Up-Red-CU-ML-Mario-Lemieux` | `Bk` |
| `2023-24-Upper-Deck-Synergy---Fearless-Leaders-LD-6-Mario-Lemieux` | `Fr`, `Bk` |
| `2024-25-Upper-Deck-Synergy---Colorways-Neon-Yellow-L-60-Mario-Lemieux` | `Fr`, `Bk` |

The four separate root-relative references are the front/back pairs for Team Canada Deluxe 167 and Stadium Club First Day Issue Arturs Irbe 190. Their corresponding repository-relative tracked files exist.

## Deferred Decisions

- Radar's full identity contract and whether any duplicate repair can ever be made safely. Until then, existing records and IDs remain frozen.
- Whether optional checks should become CI, their triggers, and whether failures should block merges.
- Approval of individual missing-image corrections, asset removals, dependency changes, and any file splitting.
- Reporting taxonomy, denominator rules, price/currency presentation, and treatment of duplicate identities in any future unique-card metric.

Recommended starting batch after separate approval: Phase 0 baseline, followed by the sticker-subset runtime fix from Phase 1. Do not start with broad renaming, deduplication, or framework migration.