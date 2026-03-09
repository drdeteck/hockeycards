// Root namespace definition
window.HCHB = window.HCHB || {};

(function (App, $, undefined) {

    // Public property
    App.HomeCollection = "McD91-92";
    App.ViewModel = new DataViewModel();

    // Public function
    App.Init = function (args) {
        document.addEventListener('DOMContentLoaded', function () {

            // supply the rawData before applying bindings
            var mergedData = Object.assign({}, rawData || {});
            if (window.marioLemieuxData) {
                var marioCollections = App.ViewModel.BuildMarioCollections(window.marioLemieuxData);
                mergedData = Object.assign(mergedData, marioCollections);
            } else {
                // TODO: Implement a robust data strategy (versioned loader + schema validation + fallback sources).
                console.warn('Mario dataset not loaded. Expected window.marioLemieuxData from data/mario-lemieux-data.js');
            }

            // Add _parent_key to all subsets so BuildCardRoute can emit Set/Subset/number URLs
            // Also normalize orientation_front/orientation_back from orientation for any card missing them
            Object.keys(mergedData).forEach(function (setKey) {
                var setData = mergedData[setKey];
                if (!setData) { return; }

                function normalizeCardOrientation(card) {
                    var base = card.orientation || 'portrait';
                    if (!card.orientation_front) {
                        card.orientation_front = base;
                    }
                    if (!card.orientation_back) {
                        card.orientation_back = base;
                    }
                }

                if (Array.isArray(setData.cards)) {
                    setData.cards.forEach(normalizeCardOrientation);
                }

                if (Array.isArray(setData.subsets)) {
                    setData.subsets.forEach(function (subset) {
                        if (!subset._parent_key) {
                            subset._parent_key = setKey;
                        }
                        if (Array.isArray(subset.cards)) {
                            subset.cards.forEach(normalizeCardOrientation);
                        }
                    });
                }
            });

            App.ViewModel.Data(mergedData);

            App.ViewModel.Root = App.ViewModel.MenuRows;

            ko.applyBindings(App.ViewModel);

            // Setup routing
            window.addEventListener('hashchange', App.ViewModel.HandleRouteChange);
            App.ViewModel.HandleRouteChange(); // Set initial route
        });
    };

}(HCHB.App = HCHB.App || {}, $));

function DataViewModel() {
    var self = this;
    self.IsHandlingRoute = false;

    self.GetSeasonStartYear = function (yearLabel) {
        var text = (yearLabel || '').toString().trim();
        var match = text.match(/^(\d{4})/);
        return match ? parseInt(match[1], 10) : null;
    };

    self.GetSeasonEndYear = function (yearLabel) {
        var text = (yearLabel || '').toString().trim();
        var match = text.match(/^(\d{4})\s*[-\/]\s*(\d{2,4})/);
        if (!match) {
            return null;
        }

        var start = parseInt(match[1], 10);
        var endToken = match[2] || '';
        if (endToken.length === 2) {
            var century = Math.floor(start / 100) * 100;
            return century + parseInt(endToken, 10);
        }

        var end = parseInt(endToken, 10);
        return isNaN(end) ? null : end;
    };

    self.GetDecadeLabel = function (yearLabel) {
        var seasonStart = self.GetSeasonStartYear(yearLabel);
        if (!seasonStart) {
            return 'Unknown';
        }
        return Math.floor(seasonStart / 10) * 10 + 's';
    };

    self.ComposeSetDisplayName = function (setYearLabel, setName, setVariation) {
        var yearText = (setYearLabel || '').toString().trim();
        var nameText = self.StripYearFromText(setName || '').toString().trim();
        var variationText = (setVariation || '').toString().trim();

        var baseName = '';
        if (yearText && nameText) {
            baseName = yearText + ' ' + nameText;
        } else {
            baseName = yearText || nameText || '';
        }

        if (baseName && variationText) {
            return baseName + ' (' + variationText + ')';
        }

        return baseName;
    };

    self.BuildMarioCollections = function (marioData) {
        var sets = (marioData && marioData.sets) || {};
        var setKeys = Object.keys(sets);
        if (setKeys.length === 0) {
            return {};
        }

        var byYear = {};
        var allCards = [];
        var result = {};

        setKeys.forEach(function (setKey) {
            var setData = sets[setKey];
            var yearLabel = setData.set_year_label || 'Unknown';
            var yearKey = 'ML-' + yearLabel;
            var parsedYearStart = parseInt(setData.set_year_start, 10);
            var seasonStart = !isNaN(parsedYearStart) ? parsedYearStart : (self.GetSeasonStartYear(yearLabel) || 0);
            var parsedYearEnd = parseInt(setData.set_year_end, 10);
            var seasonEnd = !isNaN(parsedYearEnd) ? parsedYearEnd : (self.GetSeasonEndYear(yearLabel) || null);
            var setName = setData.set_name || 'Unknown';
            var setVariation = setData.set_variation || '';
            var setDisplayName = setData.set_display_name || self.ComposeSetDisplayName(yearLabel, setName, setVariation);

            // Build the proper set entry (with all cards from base + subsets)
            var properSetCards = [];
            var properSetSubsets = [];

            (setData.cards || []).forEach(function (row) {
                var cardItem = self._buildMarioCardItem(row, setKey, yearLabel, seasonStart, seasonEnd, setName, setVariation, setDisplayName, '');
                properSetCards.push(cardItem);
                allCards.push(cardItem);
            });

            (setData.subsets || []).forEach(function (subset) {
                var subCards = [];
                (subset.cards || []).forEach(function (row) {
                    var cardItem = self._buildMarioCardItem(row, subset.set_key, yearLabel, seasonStart, seasonEnd, setName, setVariation, setDisplayName, subset.set_name, setKey);
                    subCards.push(cardItem);
                    allCards.push(cardItem);
                });
                properSetSubsets.push({
                    _parent_key: setKey,
                    set_key: subset.set_key,
                    set_name: subset.set_name,
                    set_display_name: subset.set_display_name || (setDisplayName + ' - ' + subset.set_name),
                    set_tcdb_href: subset.set_tcdb_href || '',
                    set_year_label: yearLabel,
                    set_year_start: seasonStart,
                    set_year_end: seasonEnd,
                    source: 'mario',
                    cards: subCards
                });
            });

            // Add proper set to result
            result[setKey] = {
                set_key: setKey,
                set_name: setName,
                set_variation: setVariation || null,
                set_year_label: yearLabel,
                set_year_start: seasonStart,
                set_year_end: seasonEnd,
                set_category: self.GetDecadeLabel(yearLabel),
                set_total_cards: properSetCards.length,
                set_tcdb_href: setData.set_tcdb_href || '',
                set_display_name: setDisplayName,
                menu_key: yearKey,
                source: 'mario',
                cards: properSetCards,
                subsets: properSetSubsets
            };

            // Build/update virtual year collection
            if (!byYear[yearKey]) {
                byYear[yearKey] = {
                    set_key: yearKey,
                    set_name: 'Mario Lemieux Cards',
                    set_year_label: yearLabel,
                    set_year_start: seasonStart,
                    set_year_end: seasonEnd,
                    set_category: self.GetDecadeLabel(yearLabel),
                    set_total_cards: 0,
                    set_tcdb_href: '',
                    set_display_name: yearLabel + ' Mario Lemieux Cards',
                    source: 'mario',
                    cards: [],
                    subsets: []
                };
            }

            var yearCollection = byYear[yearKey];
            properSetCards.forEach(function (c) { yearCollection.cards.push(c); });
            properSetSubsets.forEach(function (sub) { yearCollection.subsets.push(sub); });
        });

        Object.keys(byYear).forEach(function (key) {
            var yearCards = byYear[key].cards;
            yearCards.sort(function (left, right) {
                var leftSet = (left.set_name || '').toString();
                var rightSet = (right.set_name || '').toString();
                var setCompare = leftSet.localeCompare(rightSet, undefined, { sensitivity: 'base' });
                if (setCompare !== 0) {
                    return setCompare;
                }
                var leftVariation = (left.set_variation || '').toString();
                var rightVariation = (right.set_variation || '').toString();
                var variationCompare = leftVariation.localeCompare(rightVariation, undefined, { sensitivity: 'base' });
                if (variationCompare !== 0) {
                    return variationCompare;
                }
                var leftSubset = (left.insert_subset || '').toString();
                var rightSubset = (right.insert_subset || '').toString();
                var subsetCompare = leftSubset.localeCompare(rightSubset, undefined, { sensitivity: 'base' });
                if (subsetCompare !== 0) {
                    return subsetCompare;
                }
                return (left.base_number || '').toString().localeCompare((right.base_number || '').toString(), undefined, { numeric: true, sensitivity: 'base' });
            });
            byYear[key].set_total_cards = yearCards.length;
        });

        allCards.sort(function (left, right) {
            var leftYearStart = parseInt(left.set_year_start, 10) || 0;
            var rightYearStart = parseInt(right.set_year_start, 10) || 0;
            if (leftYearStart !== rightYearStart) {
                return leftYearStart - rightYearStart;
            }

            var leftSet = (left.set_name || '').toString();
            var rightSet = (right.set_name || '').toString();
            var setCompare = leftSet.localeCompare(rightSet, undefined, { sensitivity: 'base' });
            if (setCompare !== 0) {
                return setCompare;
            }
            var leftVariation = (left.set_variation || '').toString();
            var rightVariation = (right.set_variation || '').toString();
            var variationCompare = leftVariation.localeCompare(rightVariation, undefined, { sensitivity: 'base' });
            if (variationCompare !== 0) {
                return variationCompare;
            }
            var leftSubset = (left.insert_subset || '').toString();
            var rightSubset = (right.insert_subset || '').toString();
            var subsetCompare = leftSubset.localeCompare(rightSubset, undefined, { sensitivity: 'base' });
            if (subsetCompare !== 0) {
                return subsetCompare;
            }
            return (left.base_number || '').toString().localeCompare((right.base_number || '').toString(), undefined, { numeric: true, sensitivity: 'base' });
        });

        var allCollection = {
            set_key: 'ML-all',
            set_name: 'All Mario Lemieux Cards',
            set_year_label: 'All ML Cards',
            set_year_start: null,
            set_year_end: null,
            set_category: 'All',
            set_total_cards: allCards.length,
            set_tcdb_href: '',
            set_display_name: 'All Mario Lemieux Cards',
            source: 'mario',
            cards: allCards,
            subsets: []
        };

        result['ML-all'] = allCollection;
        Object.assign(result, byYear);
        return result;
    };

    self._buildMarioCardItem = function (row, routingSetKey, yearLabel, seasonStart, seasonEnd, setName, setVariation, setDisplayName, subsetName, parentSetKey) {
        var baseNumber = row.base_number || 'NNO';
        var tcdbHref = row.tcdb_href || '';
        return {
            id: row.id || '',
            name: 'Mario Lemieux',
            base_number: baseNumber,
            team: row.team || 'Pittsburgh Penguins',
            position: row.position || 'Center',
            orientation: row.orientation || 'unknown',
            orientation_front: row.orientation_front || row.orientation || 'unknown',
            orientation_back: row.orientation_back || row.orientation || 'unknown',
            variant_note: row.variant_note || null,
            set_name: setName,
            set_variation: setVariation || null,
            set_year_label: yearLabel,
            set_year_start: seasonStart,
            set_year_end: seasonEnd,
            set_display_name: setDisplayName,
            insert_subset: subsetName || '',
            image_front: row.image_front || '',
            image_back: row.image_back || '',
            tcdb_href: (tcdbHref && tcdbHref.indexOf('http') === 0) ? tcdbHref : '',
            inCollection: !!(row.inCollection),
            _set_key: routingSetKey,
            _parent_key: parentSetKey || null
        };
    };

    // primary data dictionary (sets keyed by id)
    self.Data = ko.observable({});

    // routing / selection state
    self.CurrentCollectionKey = ko.observable(HCHB.App.HomeCollection);
    self.CurrentRoute = ko.observable('home');
    self.RouteType = ko.observable('home');
    self.CurrentCardContext = ko.observable(null);
    self.CardRouteError = ko.observable('');
    self.ShowAllSetCards = ko.observable(false);
    self.CardImageFace = ko.observable('front');
    self.ShowExportOverlay = ko.observable(false);
    self.ExportCopied = ko.observable(false);
    self.BinderPageIndex = ko.observable(0);
    self.BinderSelectedYearKey = ko.observable('');
    self.IsSyncingBinderYearSelect = false;
    // 'off' | 'owned' | 'missing'
    self.CollectionOverlayMode = ko.observable('owned');
    self.ShowCollectionOverlay = ko.pureComputed(function () {
        return self.CollectionOverlayMode() !== 'off';
    });

    // when the selected collection key changes (e.g. via menu radio), push it into the route
    self.CurrentCollectionKey.subscribe(function(key) {
        if (self.IsHandlingRoute) {
            return;
        }
        if (key) {
            // avoid infinite loop by checking current hash
            var hash = window.location.hash.slice(1);
            if (hash !== key) {
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', '#' + key);
                } else {
                    window.location.hash = key;
                }
            }
            self.CurrentRoute(key);
            self.RouteType('collection');
            self.CurrentCardContext(null);
            self.CardRouteError('');
            self.ShowAllSetCards(false);
        }
    });

    self.IsCardView = ko.pureComputed(function () {
        return self.RouteType() === 'card';
    });

    self.HasCardRouteError = ko.pureComputed(function () {
        return self.RouteType() === 'card' && !!self.CardRouteError();
    });

    self.CardRouteParts = function () {
        var hash = window.location.hash.slice(1) || 'home';
        var slashIdx = hash.indexOf('/');
        if (slashIdx === -1) {
            return null;
        }

        var decodedKey = '';
        var decodedNumber = '';
        try {
            var rawKey = hash.slice(0, slashIdx);
            var rawRest = hash.slice(slashIdx + 1);
            var subSlashIdx = rawRest.indexOf('/');
            if (subSlashIdx !== -1) {
                // 3-part URL: setKey/subsetSlug/cardNumber — reconstruct full subset key
                decodedKey = decodeURIComponent(rawKey) + '-' + decodeURIComponent(rawRest.slice(0, subSlashIdx));
                decodedNumber = decodeURIComponent(rawRest.slice(subSlashIdx + 1));
            } else {
                decodedKey = decodeURIComponent(rawKey);
                decodedNumber = decodeURIComponent(rawRest);
            }
        } catch (e) {
            return { invalid: true, reason: 'Route contains invalid encoded values.' };
        }

        if (!decodedKey || !decodedNumber) {
            return { invalid: true, reason: 'Route is missing set key or card key.' };
        }

        return {
            key: decodedKey,
            number: decodedNumber
        };
    };

    self.FindCardInData = function (collectionOrSubsetKey, cardKey) {
        var data = self.Data() || {};
        var normalizedKey = (cardKey || '').toString().trim().toUpperCase();
        var setKeys = Object.keys(data);

        for (var i = 0; i < setKeys.length; i++) {
            var setKey = setKeys[i];
            var setData = data[setKey] || {};

            if (setData.set_key === collectionOrSubsetKey) {
                var setCards = setData.cards || [];
                for (var j = 0; j < setCards.length; j++) {
                    var setCard = setCards[j];
                    var cardId = ((setCard.base_number || setCard.number || '').toString().trim().toUpperCase());
                    if (cardId === normalizedKey) {
                        return {
                            card: setCard,
                            collection: setData,
                            insert: null
                        };
                    }
                }
            }

            var subsets = setData.subsets || [];
            for (var k = 0; k < subsets.length; k++) {
                var subset = subsets[k] || {};
                if (subset.set_key !== collectionOrSubsetKey) {
                    continue;
                }
                var subsetCards = subset.cards || [];
                for (var m = 0; m < subsetCards.length; m++) {
                    var subCard = subsetCards[m];
                    var subCardId = ((subCard.base_number || subCard.number || '').toString().trim().toUpperCase());
                    if (subCardId === normalizedKey) {
                        return {
                            card: subCard,
                            collection: setData,
                            insert: subset
                        };
                    }
                }
            }
        }

        return null;
    };

    self.BuildCardRoute = function (card, collectionOrSubset) {
        var cardKey = card && (card.base_number || card.number);
        if (!cardKey) {
            return '#';
        }

        // 3-part URL for subset cards: #parentSetKey/subsetSlug/cardNumber
        if (collectionOrSubset && collectionOrSubset._parent_key) {
            var parentKey = collectionOrSubset._parent_key;
            var subsetSetKey = collectionOrSubset.set_key || '';
            var prefix = parentKey + '-';
            if (subsetSetKey.indexOf(prefix) === 0) {
                var subsetSlug = subsetSetKey.slice(prefix.length);
                return '#' + encodeURIComponent(parentKey) + '/' + encodeURIComponent(subsetSlug) + '/' + encodeURIComponent(cardKey);
            }
        }

        // Fallback: use the card's own _parent_key when rendered outside a subset context
        if (card && card._parent_key && card._set_key) {
            var cardParentKey = card._parent_key;
            var cardSubsetKey = card._set_key;
            var cardPrefix = cardParentKey + '-';
            if (cardSubsetKey.indexOf(cardPrefix) === 0) {
                var cardSubsetSlug = cardSubsetKey.slice(cardPrefix.length);
                return '#' + encodeURIComponent(cardParentKey) + '/' + encodeURIComponent(cardSubsetSlug) + '/' + encodeURIComponent(cardKey);
            }
        }

        var setKey = (card && card._set_key) || (collectionOrSubset && collectionOrSubset.set_key);
        if (!setKey) {
            var currentCollection = self.CurrentCollection();
            setKey = currentCollection && currentCollection.set_key;
        }
        if (!setKey) {
            return '#';
        }
        return '#' + encodeURIComponent(setKey) + '/' + encodeURIComponent(cardKey);
    };

    self.CardExternalHref = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return '#';
        }
        return (ctx.card.tcdb_href) || ctx.collection.set_tcdb_href || '#';
    });

    self.CardBackHref = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.collection || !ctx.collection.set_key) {
            return '#home';
        }
        var key = ctx.collection.menu_key || ctx.collection.set_key;
        return '#' + key;
    });

    self.CardBrandLogoSymbol = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.collection) {
            return '';
        }

        var haystack = [
            ctx.collection.set_brand || '',
            ctx.collection.set_category || '',
            ctx.collection.set_name || ''
        ].join(' ').toLowerCase();

        if (haystack.indexOf('upper deck') !== -1) {
            return '#logo-upperdeck';
        }

        if (haystack.indexOf('pinnacle') !== -1) {
            return '#logo-pinnacle';
        }

        return '';
    });

    self.HasCardBrandLogo = ko.pureComputed(function () {
        return !!self.CardBrandLogoSymbol();
    });

    self.CanTransformCard = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        return !!(ctx && ctx.card && ctx.card.image_back);
    });

    self.ToggleCardFace = function () {
        if (!self.CanTransformCard()) {
            return;
        }

        self.CardImageFace(self.CardImageFace() === 'front' ? 'back' : 'front');
    };

    self.ToggleCollectionOverlay = function () {
        self.ShowCollectionOverlay(!self.ShowCollectionOverlay());
    };

    self.ToggleExportOverlay = function () {
        self.ShowExportOverlay(!self.ShowExportOverlay());
    };

    self.CloseExportOverlay = function () {
        self.ShowExportOverlay(false);
    };

    self.NormalizeText = function (value) {
        return (value || '').toString().trim().toLowerCase();
    };

    self.IsCurrentCardRoute = function (route) {
        return ('#' + (self.CurrentRoute() || '')) === route;
    };

    self.FindCardsByName = function (name) {
        var normalizedName = self.NormalizeText(name);
        var data = self.Data() || {};
        var setKeys = Object.keys(data);
        var matches = [];

        for (var i = 0; i < setKeys.length; i++) {
            var setData = data[setKeys[i]] || {};
            var setCards = setData.cards || [];

            for (var j = 0; j < setCards.length; j++) {
                var setCard = setCards[j] || {};
                if (self.NormalizeText(setCard.name) === normalizedName) {
                    matches.push({
                        card: setCard,
                        collection: setData,
                        insert: null
                    });
                }
            }

            var subsets = setData.subsets || [];
            for (var k = 0; k < subsets.length; k++) {
                var subset = subsets[k] || {};
                var subsetCards = subset.cards || [];
                for (var m = 0; m < subsetCards.length; m++) {
                    var subCard = subsetCards[m] || {};
                    if (self.NormalizeText(subCard.name) === normalizedName) {
                        matches.push({
                            card: subCard,
                            collection: setData,
                            insert: subset
                        });
                    }
                }
            }
        }

        return matches;
    };

    self.CardFacesParts = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card || !ctx.collection) {
            return [];
        }

        var items = self.FindCardsByName(ctx.card.name).filter(function (item) {
            var ctxKey = (ctx.card.base_number || ctx.card.number || '').toString().toLowerCase();
            var itemKey = (item.card.base_number || item.card.number || '').toString().toLowerCase();
            var sameNumber = itemKey === ctxKey;
            var sameContainer = (item.insert ? item.insert.set_key : item.collection.set_key) === (ctx.insert ? ctx.insert.set_key : ctx.collection.set_key);
            return !(sameNumber && sameContainer);
        });

        return items.slice(0, 5);
    });

    self.CardSetCards = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.collection) {
            return [];
        }

        var listContainer = ctx.insert || ctx.collection;
        var sourceCards = (listContainer.cards || []).slice();

        var filteredCards = sourceCards;

        filteredCards.sort(function (leftCard, rightCard) {
            var leftNumber = (leftCard && (leftCard.base_number || leftCard.number)) || '';
            var rightNumber = (rightCard && (rightCard.base_number || rightCard.number)) || '';
            return leftNumber.localeCompare(rightNumber, undefined, { numeric: true, sensitivity: 'base' });
        });

        return filteredCards;
    });

    self.CardSetListContainer = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.collection) {
            return null;
        }
        return ctx.insert || ctx.collection;
    });

    self.VisibleCardSetCards = ko.pureComputed(function () {
        var cards = self.CardSetCards();
        if (self.ShowAllSetCards()) {
            return cards;
        }
        return cards.slice(0, 5);
    });

    self.HasMoreSetCards = ko.pureComputed(function () {
        return self.CardSetCards().length > 5;
    });

    self.ToggleShowAllSetCards = function () {
        self.ShowAllSetCards(!self.ShowAllSetCards());
    };

    self.CardSetDisplay = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card || !ctx.collection) {
            return '';
        }

        var setName = (ctx.card.set_name || ctx.collection.set_name || '').toString().trim();
        var variation = (ctx.card.set_variation || ctx.collection.set_variation || '').toString().trim();

        if (setName && variation) {
            return setName + ' (' + variation + ')';
        }

        return setName;
    });

    self.NormalizeTeamName = function (team) {
        var normalized = (team || '').toString().trim();
        if (!normalized) {
            return 'Unknown';
        }

        return normalized;
    };

    self.CardTeamValue = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'Unknown';
        }

        if (ctx.card.team) {
            return self.NormalizeTeamName(ctx.card.team);
        }

        return 'Unknown';
    });

    self.CardCollectorNumberValue = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'NNO';
        }

        return (ctx.card.base_number || ctx.card.number || 'NNO').toString().trim();
    });

    self.CardPositionValue = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'Unknown';
        }

        return ctx.card.position || 'Unknown';
    });

    self.CardInsertValue = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'None';
        }

        if (ctx.card.insert_subset) {
            return ctx.card.insert_subset;
        }

        if (ctx.insert && ctx.insert.set_name) {
            return ctx.insert.set_name;
        }

        return 'None';
    });

    self.CardHasInsert = ko.pureComputed(function () {
        return self.CardInsertValue() !== 'None';
    });

    // computed access to the currently-selected collection
    self.CurrentCollection = ko.pureComputed(function () {
        var d = self.Data() || {};
        return d[self.CurrentCollectionKey()];
    });

    self.CurrentCollectionYearGroups = ko.pureComputed(function () {
        var collection = self.CurrentCollection();
        if (!collection || collection.set_key !== 'ML-all') {
            return [];
        }

        var cards = (collection.cards || []).slice();
        cards.sort(function (left, right) {
            var leftYearStart = parseInt(left.set_year_start, 10) || 0;
            var rightYearStart = parseInt(right.set_year_start, 10) || 0;
            if (leftYearStart !== rightYearStart) {
                return leftYearStart - rightYearStart;
            }

            var leftSet = (left.set_name || '').toString();
            var rightSet = (right.set_name || '').toString();
            var setCompare = leftSet.localeCompare(rightSet, undefined, { sensitivity: 'base' });
            if (setCompare !== 0) {
                return setCompare;
            }

            var leftVariation = (left.set_variation || '').toString();
            var rightVariation = (right.set_variation || '').toString();
            var variationCompare = leftVariation.localeCompare(rightVariation, undefined, { sensitivity: 'base' });
            if (variationCompare !== 0) {
                return variationCompare;
            }

            var leftSubset = (left.insert_subset || '').toString();
            var rightSubset = (right.insert_subset || '').toString();
            var subsetCompare = leftSubset.localeCompare(rightSubset, undefined, { sensitivity: 'base' });
            if (subsetCompare !== 0) {
                return subsetCompare;
            }

            return (left.base_number || left.number || '').toString().localeCompare((right.base_number || right.number || '').toString(), undefined, { numeric: true, sensitivity: 'base' });
        });

        var groupsByYear = {};
        cards.forEach(function (card) {
            var label = (card.set_year_label || '').toString().trim() || 'Unknown Year';
            if (!groupsByYear[label]) {
                groupsByYear[label] = [];
            }
            groupsByYear[label].push(card);
        });

        return Object.keys(groupsByYear)
            .sort(function (left, right) {
                var leftYear = self.GetSeasonStartYear(left) || 0;
                var rightYear = self.GetSeasonStartYear(right) || 0;
                return leftYear - rightYear;
            })
            .map(function (label) {
                return {
                    label: label,
                    yearKey: 'ML-' + label,
                    cards: groupsByYear[label]
                };
            });
    });

    self.IsMLYearView = ko.pureComputed(function () {
        var collection = self.CurrentCollection();
        if (!collection) { return false; }
        var key = collection.set_key || '';
        return key !== 'ML-all' && key.indexOf('ML-') === 0;
    });

    self.CurrentCollectionYearSetGroups = ko.pureComputed(function () {
        var collection = self.CurrentCollection();
        if (!collection) { return []; }
        var key = collection.set_key || '';
        if (key === 'ML-all' || key.indexOf('ML-') !== 0) { return []; }

        var allCards = [];
        (collection.cards || []).forEach(function (card) { allCards.push(card); });
        (collection.subsets || []).forEach(function (subset) {
            (subset.cards || []).forEach(function (card) { allCards.push(card); });
        });

        var groupsBySet = {};
        var setOrderKeys = [];
        allCards.forEach(function (card) {
            var setName = (card.set_name || '').toString();
            var variation = (card.set_variation || '').toString();
            var groupKey = variation ? (setName + '|||' + variation) : setName;
            if (!groupsBySet[groupKey]) {
                groupsBySet[groupKey] = { setName: setName, variation: variation, cards: [] };
                setOrderKeys.push(groupKey);
            }
            groupsBySet[groupKey].cards.push(card);
        });

        setOrderKeys.sort(function (a, b) {
            return a.localeCompare(b, undefined, { sensitivity: 'base' });
        });

        return setOrderKeys.map(function (groupKey) {
            var group = groupsBySet[groupKey];
            group.cards.sort(function (left, right) {
                var leftSubset = (left.insert_subset || '').toString();
                var rightSubset = (right.insert_subset || '').toString();
                if (!leftSubset && rightSubset) { return -1; }
                if (leftSubset && !rightSubset) { return 1; }
                var subsetCompare = leftSubset.localeCompare(rightSubset, undefined, { sensitivity: 'base' });
                if (subsetCompare !== 0) { return subsetCompare; }
                return (left.base_number || '').toString().localeCompare(
                    (right.base_number || '').toString(),
                    undefined,
                    { numeric: true, sensitivity: 'base' }
                );
            });
            var label = group.variation ? (group.setName + ' (' + group.variation + ')') : group.setName;
            return { label: label, cards: group.cards };
        });
    });

    // Binder view: all ML cards grouped by year with pages of 9 cards
    self.BinderYearGroups = ko.pureComputed(function () {
        var data = self.Data() || {};
        var allCollection = data['ML-all'];
        if (!allCollection) { return []; }

        var cards = (allCollection.cards || []).slice();

        var groupsByYear = {};
        cards.forEach(function (card) {
            var label = (card.set_year_label || 'Unknown').toString().trim();
            if (!groupsByYear[label]) {
                groupsByYear[label] = [];
            }
            groupsByYear[label].push(card);
        });

        var orderedLabels = Object.keys(groupsByYear)
            .sort(function (a, b) {
                var aYear = self.GetSeasonStartYear(a) || 0;
                var bYear = self.GetSeasonStartYear(b) || 0;
                return aYear - bYear;
            });

        var mergedStartYears = ['1985-86', '1986-87', '1987-88', '1988-89'];
        var mergedYearLabel = '1985-86 to 1988-89';
        var mergedYearKey = 'ML-1985-86_to_1988-89';

        var groupedEntries = [];
        var mergedCards = [];

        mergedStartYears.forEach(function (yearLabel) {
            if (groupsByYear[yearLabel]) {
                mergedCards = mergedCards.concat(groupsByYear[yearLabel]);
            }
        });

        if (mergedCards.length) {
            mergedCards.sort(function (left, right) {
                var leftYear = left.set_year_start || 0;
                var rightYear = right.set_year_start || 0;
                if (leftYear !== rightYear) {
                    return leftYear - rightYear;
                }

                var leftSet = (left.set_display_name || left.set_name || '').toString();
                var rightSet = (right.set_display_name || right.set_name || '').toString();
                var setCompare = leftSet.localeCompare(rightSet, undefined, { sensitivity: 'base' });
                if (setCompare !== 0) {
                    return setCompare;
                }

                return (left.base_number || '').toString().localeCompare(
                    (right.base_number || '').toString(),
                    undefined,
                    { numeric: true, sensitivity: 'base' }
                );
            });

            groupedEntries.push({
                label: mergedYearLabel,
                yearKey: mergedYearKey,
                cards: mergedCards
            });
        }

        orderedLabels.forEach(function (label) {
            if (mergedStartYears.indexOf(label) !== -1) {
                return;
            }

            groupedEntries.push({
                label: label,
                yearKey: 'ML-' + label,
                cards: groupsByYear[label]
            });
        });

        return groupedEntries.map(function (entry) {
                var yearCards = entry.cards;
                var owned = yearCards.filter(function (c) { return c.inCollection; }).length;
                var ownedPct = yearCards.length > 0 ? Math.round(owned / yearCards.length * 100) : 0;

                var pages = [];
                for (var i = 0; i < yearCards.length; i += 9) {
                    var slots = yearCards.slice(i, i + 9);
                    while (slots.length < 9) { slots.push(null); }
                    pages.push({ slots: slots, pageNum: Math.floor(i / 9) + 1 });
                }

                return {
                    label: entry.label,
                    yearKey: entry.yearKey,
                    allCards: yearCards,
                    owned: owned,
                    total: yearCards.length,
                    ownedPct: ownedPct,
                    pages: pages
                };
            });
    });

    self.BinderPages = ko.pureComputed(function () {
        var groups = self.BinderYearGroups() || [];
        var pages = [];
        var globalPage = 0;

        groups.forEach(function (group) {
            var groupPages = group.pages || [];
            var pagesInYear = groupPages.length;

            groupPages.forEach(function (page) {
                globalPage += 1;
                pages.push({
                    label: group.label,
                    yearKey: group.yearKey,
                    allCards: group.allCards,
                    owned: group.owned,
                    total: group.total,
                    ownedPct: group.ownedPct,
                    pageNum: page.pageNum,
                    pagesInYear: pagesInYear,
                    slots: page.slots,
                    globalPage: globalPage
                });
            });
        });

        var globalTotal = pages.length;
        pages.forEach(function (item) {
            item.globalTotal = globalTotal;
        });

        return pages;
    });

    self.BinderYearJumpOptions = ko.pureComputed(function () {
        var groups = self.BinderYearGroups() || [];
        return groups.map(function (group) {
            var count = (group.pages || []).length;
            return {
                value: group.yearKey,
                label: group.label + ' · ' + count + ' page' + (count === 1 ? '' : 's')
            };
        });
    });

    self.BinderHasPages = ko.pureComputed(function () {
        return self.BinderPages().length > 0;
    });

    self.BinderCurrentEntry = ko.pureComputed(function () {
        var pages = self.BinderPages();
        if (!pages.length) { return null; }

        var idx = self.BinderPageIndex();
        if (idx < 0) { idx = 0; }
        if (idx >= pages.length) { idx = pages.length - 1; }
        return pages[idx];
    });

    self.BinderCanPrev = ko.pureComputed(function () {
        return self.BinderPageIndex() > 0;
    });

    self.BinderCanNext = ko.pureComputed(function () {
        return self.BinderPageIndex() < (self.BinderPages().length - 1);
    });

    self.BinderPrevPage = function () {
        if (!self.BinderCanPrev()) { return; }
        self.BinderPageIndex(self.BinderPageIndex() - 1);
    };

    self.BinderNextPage = function () {
        if (!self.BinderCanNext()) { return; }
        self.BinderPageIndex(self.BinderPageIndex() + 1);
    };

    self.BinderSyncSelectedYearFromEntry = function () {
        var entry = self.BinderCurrentEntry();
        var targetYearKey = entry ? entry.yearKey : '';
        if (self.BinderSelectedYearKey() === targetYearKey) {
            return;
        }
        self.IsSyncingBinderYearSelect = true;
        self.BinderSelectedYearKey(targetYearKey);
        self.IsSyncingBinderYearSelect = false;
    };

    self.BinderCurrentEntry.subscribe(function () {
        self.BinderSyncSelectedYearFromEntry();
    });

    self.BinderSelectedYearKey.subscribe(function (yearKey) {
        if (self.IsSyncingBinderYearSelect || !yearKey) {
            return;
        }

        var pages = self.BinderPages();
        for (var i = 0; i < pages.length; i++) {
            if (pages[i].yearKey === yearKey) {
                if (self.BinderPageIndex() !== i) {
                    self.BinderPageIndex(i);
                }
                return;
            }
        }
    });

    self.BinderYearGroups.subscribe(function () {
        var pageCount = self.BinderPages().length;
        if (!pageCount) {
            if (self.BinderPageIndex() !== 0) {
                self.BinderPageIndex(0);
            }
            if (self.BinderSelectedYearKey() !== '') {
                self.IsSyncingBinderYearSelect = true;
                self.BinderSelectedYearKey('');
                self.IsSyncingBinderYearSelect = false;
            }
            return;
        }

        var idx = self.BinderPageIndex();
        if (idx < 0 || idx >= pageCount) {
            self.BinderPageIndex(Math.max(0, Math.min(idx, pageCount - 1)));
        }

        self.BinderSyncSelectedYearFromEntry();
    });

    self.BinderSyncSelectedYearFromEntry();

    // helper used by the card template to pick an image URL
    // (template uses $root.ParseImageUri so it must live on the root viewmodel)
    self.ParseImageUri = function (card) {
        if (!card) return '';
        return card.image_front || card.image_back || '';
    };

    self.GetGridCardSetName = function (card) {
        if (!card) {
            return '';
        }

        var rawSet = (card.set_name || '').toString();
        if (!rawSet) {
            return '';
        }

        var setName = self.StripYearFromText(rawSet);
        var variation = (card.set_variation || '').toString().trim();

        if (setName && variation) {
            return setName + ' (' + variation + ')';
        }

        return setName;
    };

    self.StripYearFromText = function (value) {
        var text = (value || '').toString();
        if (!text) {
            return '';
        }

        var withoutYear = text
            .replace(/\b\d{4}\s*[-\/]\s*\d{2,4}\b/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return withoutYear || text;
    };

    self.GetGridCardMeta = function (card) {
        if (!card) {
            return '';
        }

        var setName = self.GetGridCardSetName(card);
        var subset = (card.insert_subset || '').toString().trim();
        var collectorNumber = (card.base_number || card.number || 'NNO').toString().trim();
        var setWithSubset = setName;

        if (subset) {
            setWithSubset = (setName ? (setName + ' · ' + subset) : subset);
        }

        if (!setWithSubset) {
            return collectorNumber;
        }

        return (setWithSubset + ' · ' + collectorNumber).trim();
    };

    self.GetGridCardMetaMcDo = function (card) {
        if (!card) {
            return '';
        }

        var subset = (card.insert_subset || '').toString().trim();
        var collectorNumber = (card.base_number || card.number || 'NNO').toString().trim();

        if (!subset) {
            return collectorNumber;
        }

        return (subset + ' · ' + collectorNumber).trim();
    };

    // unified dispatcher for the card-template: uses set name for mario, omits it for McD
    self.GetCardGridMeta = function (card) {
        var col = self.CurrentCollection();
        if (col && col.source === 'mario') {
            return self.GetGridCardMeta(card);
        }
        return self.GetGridCardMetaMcDo(card);
    };

    self.IsCurrentCollectionMario = ko.pureComputed(function () {
        var col = self.CurrentCollection();
        return !!(col && col.source === 'mario');
    });

    self.GetEbaySearchUrl = function (card) {
        if (!card) { return '#'; }
        var parts = [];
        var displayName = (card.set_display_name || card.set_name || '').toString().trim();
        var insertSubset = (card.insert_subset || '').toString().trim();
        var baseNumber = (card.base_number || card.number || '').toString().trim();
        var name = (card.name || '').toString().trim();
        if (displayName) { parts.push(displayName); }
        if (insertSubset) { parts.push(insertSubset); }
        if (baseNumber) { parts.push(baseNumber); }
        if (name) { parts.push(name); }
        if (!parts.length) { return '#'; }
        return 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(parts.join(' ')) + '&_sacat=212';
    };

    // Returns the eBay search query string for a card (year+set + subset + number + name)
    self.GetEbaySearchText = function (card) {
        if (!card) { return ''; }
        var parts = [];
        var displayName = (card.set_display_name || card.set_name || '').toString().trim();
        var insertSubset = (card.insert_subset || '').toString().trim();
        var baseNumber = (card.base_number || card.number || '').toString().trim();
        var name = (card.name || '').toString().trim();
        if (displayName) { parts.push(displayName); }
        if (insertSubset) { parts.push(insertSubset); }
        if (baseNumber) { parts.push(baseNumber); }
        if (name) { parts.push(name); }
        return parts.join(' ');
    };

    // Flat list of all cards currently visible in the collection grid
    self.CurrentViewCards = ko.pureComputed(function () {
        var collection = self.CurrentCollection();
        if (!collection) { return []; }

        var cards = [];

        if (collection.set_key === 'ML-all') {
            self.CurrentCollectionYearGroups().forEach(function (group) {
                (group.cards || []).forEach(function (card) { cards.push(card); });
            });
            return cards;
        }

        if (self.IsMLYearView()) {
            self.CurrentCollectionYearSetGroups().forEach(function (group) {
                (group.cards || []).forEach(function (card) { cards.push(card); });
            });
            return cards;
        }

        (collection.cards || []).forEach(function (card) { cards.push(card); });
        (collection.subsets || []).forEach(function (subset) {
            (subset.cards || []).forEach(function (card) { cards.push(card); });
        });
        return cards;
    });

    // Text content for the export overlay: one eBay search line per card
    // When the collection overlay is active (mode !== 'off'), only export cards not in collection
    self.ExportCurrentViewText = ko.pureComputed(function () {
        var mode = self.CollectionOverlayMode();
        var cards = self.CurrentViewCards();
        if (mode !== 'off') {
            cards = cards.filter(function (card) { return !card.inCollection; });
        }
        return cards
            .map(function (card) { return self.GetEbaySearchText(card); })
            .filter(function (line) { return !!line; })
            .join('\n');
    });

    self.ExportCurrentViewCount = ko.pureComputed(function () {
        var text = self.ExportCurrentViewText();
        return text ? text.split('\n').length : 0;
    });

    self.CopyExportText = function () {
        var text = self.ExportCurrentViewText();
        if (!text) { return; }

        var onCopied = function () {
            self.ExportCopied(true);
            setTimeout(function () { self.ExportCopied(false); }, 2000);
        };

        var fallbackCopy = function () {
            var textarea = document.getElementById('export-textarea');
            if (textarea) {
                textarea.select();
                try { document.execCommand('copy'); onCopied(); } catch (e) { }
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onCopied, fallbackCopy);
        } else {
            fallbackCopy();
        }
    };

    // global stats across all card data
    self.GlobalStats = ko.pureComputed(function () {
        var data = self.Data() || {};

        function makeTally() {
            return { totalCards: 0, cardsWithFront: 0, cardsInCollection: 0 };
        }

        function countCards(cards, tally) {
            if (!Array.isArray(cards)) { return; }
            cards.forEach(function (card) {
                tally.totalCards++;
                if (card.image_front) { tally.cardsWithFront++; }
                if (card.inCollection) { tally.cardsInCollection++; }
            });
        }

        function pct(n, total) {
            return total > 0 ? Math.round(n / total * 100) : 0;
        }

        function toStats(tally) {
            return {
                totalCards: tally.totalCards,
                cardsWithFront: tally.cardsWithFront,
                cardsInCollection: tally.cardsInCollection,
                pctWithFront: pct(tally.cardsWithFront, tally.totalCards),
                pctInCollection: pct(tally.cardsInCollection, tally.totalCards)
            };
        }

        var overall = makeTally();
        var mcd = makeTally();
        var mario = makeTally();

        Object.values(data).forEach(function (set) {
            if (!set) { return; }
            // For Mario virtual collections, only count from ML-all to avoid double-counting
            if (set.source === 'mario' && set.set_key !== 'ML-all') { return; }

            var tally = set.source === 'mario' ? mario : mcd;
            countCards(set.cards, tally);
            countCards(set.cards, overall);

            // For McDonald's, also count subset cards
            if (set.source !== 'mario' && Array.isArray(set.subsets)) {
                set.subsets.forEach(function (subset) {
                    countCards(subset.cards, mcd);
                    countCards(subset.cards, overall);
                });
            }
        });

        var result = toStats(overall);
        result.mcd = toStats(mcd);
        result.mario = toStats(mario);
        return result;
    });

    // build menu rows automatically whenever the data changes
    self.MenuRows = ko.computed(function () {
        var d = self.Data() || {};
        var items = Object.values(d);
        if (items.length === 0) return [];

        var mcdItems = items.filter(function (itm) { return itm && itm.source !== 'mario'; });
        // Only show virtual year collections (ML-*) in the menu, not individual proper sets
        var marioItems = items.filter(function (itm) {
            return itm && itm.source === 'mario' && /^ML(-|$)/.test(itm.set_key || '');
        });

        var groups = [];
        var currentGroup = null;
        mcdItems.forEach(function (itm) {
            var category = itm.set_category || '';
            if (!currentGroup || currentGroup.text !== category) {
                currentGroup = {
                    text: category,
                    controls: []
                };
                groups.push(currentGroup);
            }
            currentGroup.controls.push({
                key: itm.set_key,
                displayName: itm.set_year_label || itm.set_name
            });
        });

        var menuRows = [{
            name: 'McDonald\'s',            // matches menu-row-template expectation
            template: 'button-text-template',  // layout for controls in groups
            groups: groups
        }];

        if (marioItems.length > 0) {
            var marioAll = marioItems.find(function (item) { return item.set_key === 'ML-all'; });
            var marioYears = marioItems
                .filter(function (item) { return item.set_key !== 'ML-all'; })
                .sort(function (left, right) {
                    var leftYear = self.GetSeasonStartYear(left.set_year_label) || 0;
                    var rightYear = self.GetSeasonStartYear(right.set_year_label) || 0;
                    return leftYear - rightYear;
                });

            var marioGroupMap = {};
            if (marioAll) {
                marioGroupMap['All'] = [{
                    key: marioAll.set_key,
                    displayName: 'All ML Cards'
                }];
            }

            marioYears.forEach(function (item) {
                var decade = item.set_category || self.GetDecadeLabel(item.set_year_label);
                if (!marioGroupMap[decade]) {
                    marioGroupMap[decade] = [];
                }
                marioGroupMap[decade].push({
                    key: item.set_key,
                    displayName: item.set_year_label || item.set_name
                });
            });

            var orderedMarioGroups = Object.keys(marioGroupMap)
                .sort(function (left, right) {
                    if (left === 'All') return -1;
                    if (right === 'All') return 1;
                    var leftNum = parseInt(left, 10);
                    var rightNum = parseInt(right, 10);
                    if (!isNaN(leftNum) && !isNaN(rightNum)) {
                        return leftNum - rightNum;
                    }
                    return left.localeCompare(right);
                })
                .map(function (label) {
                    return {
                        text: label,
                        controls: marioGroupMap[label]
                    };
                });

            menuRows.push({
                name: 'Mario Lemieux',
                template: 'button-text-template',
                groups: orderedMarioGroups
            });
        }

        return menuRows;
    });

    // menu rows serve as the root collection for binding
    self.Root = self.MenuRows;

    // Route change handler
    self.HandleRouteChange = function () {
        var hash = window.location.hash.slice(1) || 'home';
        self.IsHandlingRoute = true;
        self.CurrentRoute(hash);
        self.CardImageFace('front');

        var cardParts = self.CardRouteParts();
        if (cardParts) {
            self.RouteType('card');
            if (cardParts.invalid) {
                self.CurrentCardContext(null);
                self.CardRouteError(cardParts.reason || 'Invalid card route.');
                self.IsHandlingRoute = false;
                return;
            }

            var result = self.FindCardInData(cardParts.key, cardParts.number);
            if (result) {
                self.CurrentCardContext(result);
                self.CardRouteError('');
                self.ShowAllSetCards(false);
                self.CardImageFace('front');
                if (result.collection) {
                    var menuKey = result.collection.menu_key || result.collection.set_key;
                    if (menuKey) {
                        self.CurrentCollectionKey(menuKey);
                    }
                }
            } else {
                self.CurrentCardContext(null);
                self.CardRouteError('Card not found.');
                self.ShowAllSetCards(false);
            }

            self.IsHandlingRoute = false;
            return;
        }

        self.CurrentCardContext(null);
        self.CardRouteError('');
        self.ShowAllSetCards(false);
        self.RouteType(hash === 'about' ? 'about' : (hash === 'home' ? 'home' : (hash === 'binder' ? 'binder' : 'collection')));

        if (hash === 'binder') {
            self.BinderPageIndex(0);
        }

        // if the hash looks like a collection key, update selection too
        if (hash !== 'home' && hash !== 'about' && hash !== 'binder') {
            self.CurrentCollectionKey(hash);
        }
        self.IsHandlingRoute = false;
    };
}
