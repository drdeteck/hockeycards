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
            if (window.marioCleanData) {
                var marioCollections = App.ViewModel.BuildMarioCollections(window.marioCleanData);
                mergedData = Object.assign(mergedData, marioCollections);
            } else {
                // TODO: Implement a robust data strategy (versioned loader + schema validation + fallback sources).
                console.warn('Mario dataset not loaded. Expected window.marioCleanData from data/mario-lemieux-data.js');
            }

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

    self.GetBrandCode = function (brand) {
        var normalized = (brand || '').toString().trim().toLowerCase();
        if (!normalized) {
            return 'SET';
        }

        var known = {
            'topps': 'TOPPS',
            'o-pee-chee': 'OPC',
            'upper deck': 'UD',
            'pro set': 'PRO',
            'score': 'SC',
            'pinnacle': 'PIN',
            'fleer': 'FL',
            'parkhurst': 'PH',
            'leaf': 'LEAF',
            'donruss': 'DON',
            'ultra': 'ULT'
        };

        if (known[normalized]) {
            return known[normalized];
        }

        return normalized.replace(/[^a-z0-9]/g, '').toUpperCase().slice(0, 5) || 'SET';
    };

    self.GetSetRouteCode = function (value, maxLength) {
        var token = (value || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');
        if (!token) {
            return '';
        }
        return token.slice(0, maxLength || 8);
    };

    self.ComposeSetDisplayName = function (setYearLabel, setName) {
        var yearText = (setYearLabel || '').toString().trim();
        var nameText = self.StripYearFromText(setName || '').toString().trim();

        if (yearText && nameText) {
            return yearText + ' ' + nameText;
        }

        return yearText || nameText || '';
    };

    self.BuildMarioCollections = function (marioClean) {
        var cards = (marioClean && marioClean.cards) || [];
        if (!Array.isArray(cards) || cards.length === 0) {
            return {};
        }

        var byYear = {};
        var allCards = [];

        cards.forEach(function (row) {
            var yearLabel = row.set_year_label || 'Unknown';
            var yearKey = 'ML-' + yearLabel;
            var parsedYearStart = parseInt(row.set_year_start, 10);
            var seasonStart = !isNaN(parsedYearStart) ? parsedYearStart : (self.GetSeasonStartYear(yearLabel) || 0);
            var parsedYearEnd = parseInt(row.set_year_end, 10);
            var seasonEnd = !isNaN(parsedYearEnd) ? parsedYearEnd : (self.GetSeasonEndYear(yearLabel) || null);
            var brand = row.set_brand || 'Unknown';
            var baseNumber = row.base_number || 'NNO';
            var setRouteCode = self.GetSetRouteCode(row.set_name || brand, 8) || self.GetBrandCode(brand);
            var subsetRouteCode = self.GetSetRouteCode(row.insert_subset || '', 8);
            var uniqueNumber = subsetRouteCode
                ? (setRouteCode + '-' + subsetRouteCode + '-' + baseNumber)
                : (setRouteCode + '-' + baseNumber);
            var cardItem = {
                name: row.player_name || 'Mario Lemieux',
                number: uniqueNumber,
                team: row.team || 'Pittsburgh Penguins',
                position: row.position || 'Center',
                orientation: row.orientation || 'unknown',
                set_name: row.set_name || brand,
                set_year_label: yearLabel,
                set_year_start: seasonStart,
                set_year_end: seasonEnd,
                set_brand: brand,
                set_display_name: self.ComposeSetDisplayName(yearLabel, row.set_name || brand),
                insert_subset: row.insert_subset || '',
                base_number: baseNumber,
                image_front: row.image_front || '',
                image_back: row.image_back || '',
                set_tcdb_href: row.set_tcdb_href || row.tcdb_href || '#',
                tcdb_href: (function () {
                    var url = row.tcdb_href || row.set_tcdb_href || '';
                    return (url && url !== '#' && url.indexOf('http') === 0) ? url : '';
                }()),
                'mario-id': row.id || ''
            };

            if (!byYear[yearKey]) {
                byYear[yearKey] = {
                    set_key: yearKey,
                    set_name: 'Mario Lemieux Cards',
                    set_year_label: yearLabel,
                    set_year_start: seasonStart,
                    set_year_end: seasonEnd,
                    set_brand: 'Mixed',
                    set_category: self.GetDecadeLabel(yearLabel),
                    set_total_cards: 0,
                    set_tcdb_href: '#',
                    set_display_name: yearLabel + ' Mario Lemieux Cards',
                    source: 'mario',
                    cards: [],
                    inserts: []
                };
            }

            byYear[yearKey].cards.push(cardItem);
            allCards.push(cardItem);
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
                return (left.number || '').toString().localeCompare((right.number || '').toString(), undefined, { numeric: true, sensitivity: 'base' });
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
            return (left.number || '').toString().localeCompare((right.number || '').toString(), undefined, { numeric: true, sensitivity: 'base' });
        });

        var allCollection = {
            set_key: 'ML-all',
            set_name: 'All Mario Lemieux Cards',
            set_year_label: 'All ML Cards',
            set_year_start: null,
            set_year_end: null,
            set_brand: 'Mixed',
            set_category: 'All',
            set_total_cards: allCards.length,
            set_tcdb_href: '#',
            set_display_name: 'All Mario Lemieux Cards',
            source: 'mario',
            cards: allCards,
            inserts: []
        };

        return Object.assign({ 'ML-all': allCollection }, byYear);
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
        var parts = hash.split('/');
        if (parts[0] !== 'card') {
            return null;
        }
        if (parts.length < 3) {
            return { invalid: true, reason: 'Route is missing key or card number.' };
        }

        var decodedKey = '';
        var decodedNumber = '';
        try {
            decodedKey = decodeURIComponent(parts[1] || '');
            decodedNumber = decodeURIComponent(parts.slice(2).join('/') || '');
        } catch (e) {
            return { invalid: true, reason: 'Route contains invalid encoded values.' };
        }

        return {
            key: decodedKey,
            number: decodedNumber
        };
    };

    self.FindCardInData = function (collectionOrInsertKey, cardNumber) {
        var data = self.Data() || {};
        var normalizedNumber = (cardNumber || '').toString().trim().toUpperCase();
        var setKeys = Object.keys(data);

        for (var i = 0; i < setKeys.length; i++) {
            var setKey = setKeys[i];
            var setData = data[setKey] || {};

            if (setData.set_key === collectionOrInsertKey) {
                var setCards = setData.cards || [];
                for (var j = 0; j < setCards.length; j++) {
                    var setCard = setCards[j];
                    if (((setCard.number || '').toString().trim().toUpperCase()) === normalizedNumber) {
                        return {
                            card: setCard,
                            collection: setData,
                            insert: null
                        };
                    }
                }
            }

            var inserts = setData.inserts || [];
            for (var k = 0; k < inserts.length; k++) {
                var insert = inserts[k] || {};
                if (insert.set_key !== collectionOrInsertKey) {
                    continue;
                }
                var insertCards = insert.cards || [];
                for (var m = 0; m < insertCards.length; m++) {
                    var insertCard = insertCards[m];
                    if (((insertCard.number || '').toString().trim().toUpperCase()) === normalizedNumber) {
                        return {
                            card: insertCard,
                            collection: setData,
                            insert: insert
                        };
                    }
                }
            }
        }

        return null;
    };

    self.BuildCardRoute = function (card, collectionOrInsert) {
        var parentKey = collectionOrInsert && collectionOrInsert.set_key;
        if (!parentKey) {
            var currentCollection = self.CurrentCollection();
            parentKey = currentCollection && currentCollection.set_key;
        }
        var number = card && card.number;
        if (!parentKey || !number) {
            return '#';
        }
        return '#card/' + encodeURIComponent(parentKey) + '/' + encodeURIComponent(number);
    };

    self.CardExternalHref = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return '#';
        }
        return ctx.card.set_tcdb_href || ctx.collection.set_tcdb_href || '#';
    });

    self.CardBackHref = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.collection || !ctx.collection.set_key) {
            return '#home';
        }
        return '#' + ctx.collection.set_key;
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

            var inserts = setData.inserts || [];
            for (var k = 0; k < inserts.length; k++) {
                var insert = inserts[k] || {};
                var insertCards = insert.cards || [];
                for (var m = 0; m < insertCards.length; m++) {
                    var insertCard = insertCards[m] || {};
                    if (self.NormalizeText(insertCard.name) === normalizedName) {
                        matches.push({
                            card: insertCard,
                            collection: setData,
                            insert: insert
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
            var sameNumber = self.NormalizeText(item.card.number) === self.NormalizeText(ctx.card.number);
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
            var leftNumber = (leftCard && leftCard.number) || '';
            var rightNumber = (rightCard && rightCard.number) || '';
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

        return (ctx.card.set_name || ctx.collection.set_name || '').toString().trim();
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

            return (left.number || '').toString().localeCompare((right.number || '').toString(), undefined, { numeric: true, sensitivity: 'base' });
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
                    cards: groupsByYear[label]
                };
            });
    });

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

        return self.StripYearFromText(rawSet);
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
        var name = (card.name || '').toString().trim();
        var displayName = (card.set_display_name || card.set_name || '').toString().trim();
        var baseNumber = (card.base_number || card.number || '').toString().trim();
        if (name) { parts.push(name); }
        if (displayName) { parts.push(displayName); }
        if (baseNumber) { parts.push(baseNumber); }
        if (!parts.length) { return '#'; }
        return 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(parts.join(' ')) + '&_sacat=212';
    };

    // build menu rows automatically whenever the data changes
    self.MenuRows = ko.computed(function () {
        var d = self.Data() || {};
        var items = Object.values(d);
        if (items.length === 0) return [];

        var mcdItems = items.filter(function (itm) { return itm && itm.source !== 'mario'; });
        var marioItems = items.filter(function (itm) { return itm && itm.source === 'mario'; });

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
                if (result.collection && result.collection.set_key) {
                    self.CurrentCollectionKey(result.collection.set_key);
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
        self.RouteType(hash === 'about' ? 'about' : (hash === 'home' ? 'home' : 'collection'));

        // if the hash looks like a collection key, update selection too
        if (hash !== 'home' && hash !== 'about') {
            self.CurrentCollectionKey(hash);
        }
        self.IsHandlingRoute = false;
    };
}
