(function (root) {
    'use strict';

    var files = [
        'data/mario-lemieux-data-1985-86-to-1999-00.json',
        'data/mario-lemieux-data-2000-01-to-2009-10.json',
        'data/mario-lemieux-data-2010-11-to-present.json',
        'data/mario-lemieux-data-stickers.json'
    ];
    var historySource = 'https://en.wikipedia.org/wiki/Mario_Lemieux#Playing_career';
    var eras = [
        { key: 'early', title: 'The early issues', short: 'Early issues', start: 0, end: 1989, label: '1985-86 / 1989-90', note: 'O-Pee-Chee, Topps, and the beginnings of a collection.' },
        { key: 'expansion', title: 'An expanding world', short: 'Expansion', start: 1990, end: 1994, label: '1990-91 / 1994-95', note: 'More releases. More interpretations of number 66.' },
        { key: 'inserts', title: 'Beyond the base card', short: 'Inserts & foil', start: 1995, end: 1999, label: '1995-96 / 1999-00', note: 'Inserts and parallels give familiar subjects new identities.' },
        { key: 'premium', title: 'The collectible becomes an object', short: 'Premium years', start: 2000, end: 2009, label: '2000-01 / 2009-10', note: 'Premium releases, memorabilia, and a new generation of cards.' },
        { key: 'modern', title: 'A legacy in print', short: 'Modern legacy', start: 2010, end: 9999, label: '2010-11 / present', note: 'New designs keep returning to a career that still resonates.' }
    ];
    var career = [
        { key: 'arrival', title: 'An extraordinary arrival', short: 'Arrival', start: 0, end: 1987, label: '1985-86 / 1987-88', milestone: '1984', note: 'Lemieux made his NHL debut on October 11, 1984, and won the Calder Trophy after his rookie season.' },
        { key: 'scoring', title: 'The scoring years', short: '199 points', start: 1988, end: 1989, label: '1988-89 / 1989-90', milestone: '1988-89', note: 'In 1988-89, Lemieux recorded 85 goals and 114 assists: 199 points in one season.' },
        { key: 'champion', title: 'Back-to-back champion', short: 'Two Cups', start: 1990, end: 1991, label: '1990-91 / 1991-92', milestone: '1991 / 1992', note: 'Pittsburgh won consecutive Stanley Cups. Lemieux received the Conn Smythe Trophy in both championship runs.' },
        { key: 'resilience', title: 'The game, and beyond it', short: 'Resilience', start: 1992, end: 1996, label: '1992-93 / 1996-97', milestone: '1993', note: 'Lemieux announced his Hodgkin lymphoma diagnosis in January 1993. He returned that March and finished the season with the scoring title.' },
        { key: 'hall', title: 'A different kind of presence', short: 'First retirement', start: 1997, end: 1999, label: '1997-98 / 1999-00', milestone: '1997', note: 'Following his first retirement in 1997, Lemieux entered the Hockey Hall of Fame that November. He became an owner of the Penguins in 1999.' },
        { key: 'return', title: 'Number 66 returns', short: 'Comeback', start: 2000, end: 2005, label: '2000-01 / 2005-06', milestone: '27 DEC 2000', note: 'Lemieux returned against Toronto on December 27, 2000. He later captained Canada to Olympic gold in 2002 and announced his final retirement on January 24, 2006.' },
        { key: 'legacy', title: 'The career lives on', short: 'Legacy', start: 2006, end: 9999, label: '2006-07 / present', milestone: 'AFTER THE ICE', note: 'After his playing career, Lemieux remained part of the Penguins ownership group as the club won the Stanley Cup in 2009, 2016, and 2017.' }
    ];
    var personal = [
        { key: 'before', title: 'Before the Stanley Cup', short: 'Pre-Cup', start: 0, end: 1989, label: '1985-86 / 1989-90' },
        { key: 'cups', title: 'The Stanley Cup era', short: 'Cup era', start: 1990, end: 1991, label: '1990-91 / 1991-92' },
        { key: 'health', title: 'Health & the first retirement', short: 'First retirement', start: 1992, end: 1999, label: '1992-93 / 1999-00' },
        { key: 'comeback', title: 'The comeback', short: 'Comeback', start: 2000, end: 2004, label: '2000-01 / 2004-05' },
        { key: 'retirement', title: 'The second retirement', short: 'Second retirement', start: 2005, end: 2009, label: '2005-06 / 2009-10' },
        { key: 'legend', title: 'Legend status', short: 'Legend', start: 2010, end: 9999, label: '2010-11 / present' }
    ];
    var variants = {
        1: { name: 'The design archive', eyebrow: '01 / THE DESIGN ARCHIVE', subtitle: 'Four decades. One unmistakable number.', chapters: eras },
        2: { name: 'A career in cards', eyebrow: '02 / A CAREER IN CARDS', subtitle: 'The player. The returns. The legacy.', chapters: career },
        3: { name: 'The family lines', eyebrow: '03 / THE FAMILY LINES', subtitle: 'One player, seen through different lenses.' },
        4: { name: 'My six chapters', eyebrow: '04 / MY SIX CHAPTERS', subtitle: 'A collection, in six acts.', chapters: personal }
    };

    function flatten(documents) {
        var cards = [];
        documents.forEach(function (document, fileIndex) {
            Object.keys(document.sets || {}).forEach(function (setKey) {
                var set = document.sets[setKey];
                function addRows(node, subsetName) {
                    (node.cards || []).forEach(function (row, rowIndex) {
                        var card = {
                            key: fileIndex + ':' + setKey + ':' + (node.set_key || '') + ':' + rowIndex,
                            id: row.id || '',
                            season: set.set_year_label,
                            year: Number(set.set_year_start),
                            family: set.set_name,
                            variation: set.set_variation || '',
                            subset: subsetName || '',
                            number: row.base_number || 'NNO',
                            name: row.name || 'Mario Lemieux',
                            team: row.team || 'Pittsburgh Penguins',
                            front: row.image_front || '',
                            back: row.image_back || '',
                            owned: row.inCollection === true,
                            source: fileIndex === 3 ? 'stickers' : 'regular',
                            note: row.variant_note || row.card_note || '',
                            serial: row.serial_total || null,
                            tcdb: /^https?:\/\//i.test(row.tcdb_href || '') ? row.tcdb_href : '',
                            rookie: row.isRookieCard === true || /rookie/i.test(row.variant_note || ''),
                            memorabilia: row.isMemorabilia === true
                        };
                        card.title = [card.family, card.variation, card.subset].filter(Boolean).join(' / ');
                        card.search = [card.season, card.title, card.number, card.name, card.note, card.team].join(' ').toLowerCase();
                        cards.push(card);
                    });
                    (node.subsets || []).forEach(function (subset) { addRows(subset, subset.set_name); });
                }
                addRows(set, '');
            });
        });
        return cards.sort(function (left, right) {
            return left.year - right.year || left.family.localeCompare(right.family) || left.number.localeCompare(right.number, undefined, { numeric: true });
        });
    }

    function chaptersFor(variant, cards) {
        var definitions = variants[variant].chapters;
        if (variant === 3) {
            var names = [];
            cards.forEach(function (card) { if (names.indexOf(card.family) === -1) { names.push(card.family); } });
            var leading = ['O-Pee-Chee', 'Topps', 'Upper Deck', 'Pinnacle', 'SPx', 'Upper Deck Black Diamond'];
            names.sort(function (left, right) {
                var leftIndex = leading.indexOf(left);
                var rightIndex = leading.indexOf(right);
                return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex) || left.localeCompare(right);
            });
            definitions = names.map(function (name, index) { return { key: 'family-' + index, title: name, short: name, family: name }; });
        }
        return definitions.map(function (definition, index) {
            var chapter = Object.assign({}, definition);
            chapter.note = chapter.note || '';
            chapter.milestone = chapter.milestone || '';
            chapter.index = index + 1;
            chapter.cards = cards.filter(function (card) {
                return chapter.family ? card.family === chapter.family : card.year >= chapter.start && card.year <= chapter.end;
            });
            chapter.owned = chapter.cards.filter(function (card) { return card.owned; }).length;
            chapter.missing = chapter.cards.length - chapter.owned;
            if (chapter.family && chapter.cards.length) {
                chapter.label = chapter.cards[0].season + ' / ' + chapter.cards[chapter.cards.length - 1].season;
                chapter.note = '';
            }
            return chapter;
        });
    }

    function matches(card, filters) {
        var terms = (filters.query || '').toLowerCase().trim().split(/\s+/);
        return (!filters.source || card.source === filters.source) &&
            (!filters.season || card.season === filters.season) &&
            (!filters.ownership || card.owned === (filters.ownership === 'owned')) &&
            terms.every(function (term) { return card.search.indexOf(term) !== -1; });
    }

    function highlights(cards, variant) {
        var candidates = cards.filter(function (card) { return !!card.front; });
        if (!candidates.length) { candidates = cards.slice(); }
        var chosen = [];
        var families = [];
        if (variant === 3) {
            var seasonCards = [];
            candidates.forEach(function (card) {
                if (!seasonCards.some(function (entry) { return entry.season === card.season; })) {
                    seasonCards.push(card);
                }
            });
            var count = Math.min(5, seasonCards.length);
            for (var index = 0; index < count; index++) {
                chosen.push(seasonCards[count === 1 ? 0 : Math.round(index * (seasonCards.length - 1) / (count - 1))]);
            }
        } else {
            var ranked = candidates.slice().sort(function (left, right) {
                function score(card) { return (card.owned ? 10 : 0) + (card.rookie ? 8 : 0) + (card.source === 'regular' ? 2 : 0); }
                return score(right) - score(left) || left.year - right.year;
            });
            ranked.forEach(function (card) {
                if (chosen.length < 3 && families.indexOf(card.family) === -1) {
                    families.push(card.family);
                    chosen.push(card);
                }
            });
            ranked.forEach(function (card) {
                if (chosen.length < 3 && chosen.indexOf(card) === -1) { chosen.push(card); }
            });
        }
        return chosen;
    }

    function csv(cards) {
        var rows = [['Season', 'Product', 'Variation', 'Subset', 'Number', 'Player', 'Source', 'Ownership', 'TCDB']];
        cards.forEach(function (card) {
            rows.push([card.season, card.family, card.variation, card.subset, card.number, card.name, card.source, card.owned ? 'Owned' : 'Missing', card.tcdb]);
        });
        return '\uFEFF' + rows.map(function (row) {
            return row.map(function (value) {
                var text = String(value || '');
                if (/^[=+@\-\t\r\n]/.test(text)) { text = "'" + text; }
                return '"' + text.replace(/"/g, '""') + '"';
            }).join(',');
        }).join('\r\n');
    }

    var model = { files: files, variants: variants, flatten: flatten, chaptersFor: chaptersFor, matches: matches, highlights: highlights, csv: csv, historySource: historySource };
    if (typeof module !== 'undefined' && module.exports) { module.exports = model; }
    root.HCHB = root.HCHB || {};
    root.HCHB.Beta = model;

    if (!root.document || !root.ko) { return; }

    var ko = root.ko;
    var variant = Number(root.document.body.getAttribute('data-beta')) || 1;

    ko.bindingHandlers.icon = {
        init: function (element, valueAccessor) {
            if (root.lucide && root.lucide.icons[valueAccessor()]) {
                var icon = root.lucide.createElement(root.lucide.icons[valueAccessor()]);
                icon.setAttribute('aria-hidden', 'true');
                element.appendChild(icon);
            }
        }
    };
    ko.bindingHandlers.cardImage = {
        update: function (element, valueAccessor) {
            var path = ko.unwrap(valueAccessor());
            element.hidden = !path;
            element.parentElement.classList.toggle('image-unavailable', !path);
            element.onerror = function () {
                element.hidden = true;
                element.parentElement.classList.add('image-unavailable');
            };
            if (path) { element.src = path; } else { element.removeAttribute('src'); }
        }
    };
    ko.bindingHandlers.dialogOpen = {
        update: function (element, valueAccessor) {
            var open = !!ko.unwrap(valueAccessor());
            if (open && !element.open) { element.showModal(); }
            if (!open && element.open) { element.close(); }
        }
    };

    function ExhibitionViewModel(cards) {
        var self = this;
        self.Variant = variant;
        self.Config = variants[variant];
        self.AllCards = cards;
        self.Chapters = chaptersFor(variant, cards);
        self.Query = ko.observable('').extend({ rateLimit: { timeout: 180, method: 'notifyWhenChangesStop' } });
        self.Source = ko.observable('');
        self.FiltersOpen = ko.observable(false);
        self.Ownership = ko.observable('');
        self.Season = ko.observable('');
        self.ChapterKey = ko.observable(variant === 3 ? self.Chapters[0].key : '');
        self.FamilyQuery = ko.observable('');
        self.Selected = ko.observable(null);
        self.Face = ko.observable('front');
        self.ViewerCards = [];
        self.Announcement = ko.observable('');
        self.HistorySource = historySource;
        self.TotalOwned = cards.filter(function (card) { return card.owned; }).length;
        self.TotalMissing = cards.length - self.TotalOwned;
        self.Seasons = cards.map(function (card) { return card.season; }).filter(function (season, index, values) { return values.indexOf(season) === index; });
        self.VersionLinks = Object.keys(variants).map(function (key) {
            return { number: key, name: variants[key].name, href: 'beta' + key + '.html', current: Number(key) === variant };
        });
        self.FamilyOptions = ko.pureComputed(function () {
            var query = self.FamilyQuery().toLowerCase();
            return self.Chapters.filter(function (chapter) { return chapter.title.toLowerCase().indexOf(query) !== -1 || chapter.key === self.ChapterKey(); });
        });
        self.FilterState = ko.pureComputed(function () {
            return { query: self.Query(), source: self.Source(), ownership: self.Ownership(), season: self.Season() };
        });
        self.FilteredCards = ko.pureComputed(function () {
            return cards.filter(function (card) { return matches(card, self.FilterState()); });
        });
        self.Chapters.forEach(function (chapter) {
            chapter.Expanded = ko.observable(false);
            chapter.Limit = ko.observable(36);
            chapter.MissingExpanded = ko.observable(false);
            chapter.MissingLimit = ko.observable(24);
            chapter.Filtered = ko.pureComputed(function () {
                return chapter.cards.filter(function (card) { return matches(card, self.FilterState()); });
            });
            chapter.Highlights = ko.pureComputed(function () { return highlights(chapter.Filtered(), variant); });
            chapter.VisibleCards = ko.pureComputed(function () { return chapter.Filtered().slice(0, chapter.Limit()); });
            chapter.MissingCards = ko.pureComputed(function () { return chapter.Filtered().filter(function (card) { return !card.owned; }); });
            chapter.VisibleMissing = ko.pureComputed(function () { return chapter.MissingCards().slice(0, chapter.MissingLimit()); });
            chapter.FilteredOwned = ko.pureComputed(function () { return chapter.Filtered().filter(function (card) { return card.owned; }).length; });
            chapter.ToggleCollection = function () { chapter.Expanded(!chapter.Expanded()); };
            chapter.ToggleMissing = function () { chapter.MissingExpanded(!chapter.MissingExpanded()); };
            chapter.MoreCards = function () { chapter.Limit(chapter.Limit() + 36); };
            chapter.MoreMissing = function () { chapter.MissingLimit(chapter.MissingLimit() + 24); };
        });
        self.VisibleChapters = ko.pureComputed(function () {
            return self.Chapters.filter(function (chapter) {
                return (!self.ChapterKey() || chapter.key === self.ChapterKey()) && chapter.Filtered().length > 0;
            });
        });
        self.ScopeCards = ko.pureComputed(function () {
            var result = [];
            self.VisibleChapters().forEach(function (chapter) { result = result.concat(chapter.Filtered()); });
            return result;
        });
        self.ScopeMissing = ko.pureComputed(function () { return self.ScopeCards().filter(function (card) { return !card.owned; }); });
        self.HasFilters = ko.pureComputed(function () { return !!(self.Query() || self.Source() || self.Ownership() || self.Season()); });
        self.Reset = function () { self.Query(''); self.Source(''); self.Ownership(''); self.Season(''); self.FamilyQuery(''); };
        self.ShowAllChapters = function () { self.ChapterKey(''); };
        self.OpenCard = function (card) {
            self.ViewerCards = self.ScopeCards();
            self.Face('front');
            self.Selected(card);
        };
        self.CloseViewer = function () { self.Selected(null); };
        self.BackdropClick = function (data, event) { if (event.target === event.currentTarget) { self.CloseViewer(); } return true; };
        self.ViewerIndex = ko.pureComputed(function () { return self.ViewerCards.indexOf(self.Selected()); });
        self.PreviousCard = function () {
            var index = self.ViewerIndex();
            if (index > 0) { self.Face('front'); self.Selected(self.ViewerCards[index - 1]); }
        };
        self.NextCard = function () {
            var index = self.ViewerIndex();
            if (index < self.ViewerCards.length - 1) { self.Face('front'); self.Selected(self.ViewerCards[index + 1]); }
        };
        self.ViewerKey = function (data, event) {
            if (event.key === 'Escape') { self.CloseViewer(); }
            if (event.key === 'ArrowLeft') { self.PreviousCard(); }
            if (event.key === 'ArrowRight') { self.NextCard(); }
            return true;
        };
        self.SelectedImage = ko.pureComputed(function () {
            var card = self.Selected();
            return card ? (self.Face() === 'front' ? card.front : card.back) : '';
        });
        self.SelectedEbay = ko.pureComputed(function () {
            var card = self.Selected();
            return card ? 'https://www.ebay.ca/sch/i.html?_sacat=212&_nkw=' + encodeURIComponent([card.season, card.title, card.number, card.name].join(' ')) : '';
        });
        self.ExportMissing = function (selection) {
            var missing = (Array.isArray(selection) ? selection : self.ScopeMissing()).filter(function (card) { return !card.owned; });
            if (!missing.length) { return; }
            var blob = new Blob([csv(missing)], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var link = root.document.createElement('a');
            link.href = url;
            link.download = 'mario-lemieux-beta' + variant + '-missing.csv';
            link.click();
            root.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            self.Announcement(missing.length + ' missing cards exported.');
        };
        self.FilterState.subscribe(function () {
            self.Chapters.forEach(function (chapter) { chapter.Limit(36); chapter.MissingLimit(24); });
        });
    }

    var shell = { status: ko.observable('Loading the Mario Lemieux collection...'), ready: ko.observable(false) };
    ko.applyBindings(shell, root.document.getElementById('beta-app'));
    var localTemplate = root.document.getElementById('exhibition-template');
    var templateRequest = localTemplate ? Promise.resolve(localTemplate.innerHTML) : fetch('beta.html').then(function (response) {
        if (!response.ok) { throw new Error('The exhibition template could not be loaded.'); }
        return response.text();
    }).then(function (html) {
        return new DOMParser().parseFromString(html, 'text/html').getElementById('exhibition-template').innerHTML;
    });
    Promise.all([templateRequest, Promise.all(files.map(function (file) {
        return fetch(file).then(function (response) {
            if (!response.ok) { throw new Error('Could not load ' + file + '.'); }
            return response.json();
        });
    }))]).then(function (results) {
        var viewModel = new ExhibitionViewModel(flatten(results[1]));
        root.HCHB.Beta.viewModel = viewModel;
        ko.components.register('beta-exhibition', { viewModel: { instance: viewModel }, template: results[0] });
        shell.ready(true);
    }).catch(function (error) {
        shell.status('The exhibition could not open. ' + error.message + ' Refresh to retry. This page requires a static web server.');
    });
}(typeof window !== 'undefined' ? window : globalThis));