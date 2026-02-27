// Root namespace definition
window.HCHB = window.HCHB || {};

(function (App, $, undefined) {

    // Public property
    App.HomeCollection = "McD91-92";
    App.ViewModel = new DataViewModel();

    // Public function
    App.Init = function (args) {
        document.addEventListener('DOMContentLoaded', async function () {

            // supply the rawData before applying bindings
            App.ViewModel.Data(rawData);

            App.ViewModel.Root = App.ViewModel.MenuRows;

            ko.applyBindings(App.ViewModel);
            console.log('MenuRows at bind:', App.ViewModel.MenuRows());
            console.log('Menu HTML:', document.querySelector('.main-inner')?.innerHTML);

            // Setup routing
            window.addEventListener('hashchange', App.ViewModel.HandleRouteChange);
            App.ViewModel.HandleRouteChange(); // Set initial route
        });
    };

}(HCHB.App = HCHB.App || {}, $));

function DataViewModel() {
    var self = this;
    self.IsHandlingRoute = false;

    // primary data dictionary (sets keyed by id)
    self.Data = ko.observable({});

    // routing / selection state
    self.CurrentCollectionKey = ko.observable(HCHB.App.HomeCollection);
    self.CurrentRoute = ko.observable('home');
    self.RouteType = ko.observable('home');
    self.CurrentCardContext = ko.observable(null);
    self.CardRouteError = ko.observable('');
    self.ShowAllSetCards = ko.observable(false);

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

            if (setData.key === collectionOrInsertKey) {
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
                if (insert.key !== collectionOrInsertKey) {
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
        var parentKey = collectionOrInsert && collectionOrInsert.key;
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
        return ctx.card['tcdb-href'] || ctx.collection['tcdb-href'] || '#';
    });

    self.CardBackHref = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.collection || !ctx.collection.key) {
            return '#home';
        }
        return '#' + ctx.collection.key;
    });

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
            var sameContainer = (item.insert ? item.insert.key : item.collection.key) === (ctx.insert ? ctx.insert.key : ctx.collection.key);
            return !(sameNumber && sameContainer);
        });

        return items.slice(0, 5);
    });

    self.CardPrints = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card || !ctx.collection) {
            return [];
        }

        return self.FindCardsByName(ctx.card.name);
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
        if (!ctx || !ctx.collection) {
            return '';
        }
        var parts = [];
        if (ctx.collection.years) {
            parts.push(ctx.collection.years);
        }
        if (ctx.collection.makers) {
            parts.push(ctx.collection.makers);
        }
        return parts.join(' · ');
    });

    self.CardTypeLine = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return '';
        }

        if (ctx.card.team) {
            return 'Team: ' + ctx.card.team;
        }

        if (ctx.insert && ctx.insert.name) {
            return 'Team: ' + ctx.insert.name;
        }

        return 'Team: Unknown';
    });

    self.CardTeamValue = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'Unknown';
        }

        if (ctx.card.team) {
            return ctx.card.team;
        }

        if (ctx.insert && ctx.insert.name) {
            return ctx.insert.name;
        }

        return 'Unknown';
    });

    self.CardPositionLine = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'Position: Unknown';
        }

        return 'Position: ' + (ctx.card.position || 'Unknown');
    });

    self.CardPositionValue = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'Unknown';
        }

        return ctx.card.position || 'Unknown';
    });

    self.CardInsertLine = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'Insert: None';
        }

        if (ctx.insert && ctx.insert['name-no-years']) {
            return 'Insert: ' + ctx.insert['name-no-years'];
        }

        if (ctx.insert && ctx.insert.name) {
            return 'Insert: ' + ctx.insert.name;
        }

        return 'Insert: None';
    });

    self.CardInsertValue = ko.pureComputed(function () {
        var ctx = self.CurrentCardContext();
        if (!ctx || !ctx.card) {
            return 'None';
        }

        if (ctx.insert && ctx.insert['name-no-years']) {
            return ctx.insert['name-no-years'];
        }

        if (ctx.insert && ctx.insert.name) {
            return ctx.insert.name;
        }

        return 'None';
    });

    // computed access to the currently-selected collection
    self.CurrentCollection = ko.pureComputed(function () {
        var d = self.Data() || {};
        return d[self.CurrentCollectionKey()];
    });

    // log changes for debugging during development
    self.CurrentCollection.subscribe(function(col) {
        console.log('CurrentCollection changed', col && col.name, 'cards=', col && col.cards && col.cards.length, 'inserts=', col && col.inserts && col.inserts.length);
        if (col && col.inserts) {
            console.log('Inserts array:', col.inserts);
        }
    });

    // helper used by the card template to pick an image URL
    // (template uses $root.ParseImageUri so it must live on the root viewmodel)
    self.ParseImageUri = function (card) {
        if (!card) return '';
        // hockey dataset uses explicit front/back properties
        if (card['image-front']) {
            return card['image-front'];
        }
        return '';
    };

    // build menu rows automatically whenever the data changes
    self.MenuRows = ko.computed(function () {
        var d = self.Data() || {};
        var items = Object.values(d);
        if (items.length === 0) return [];
        var groups = [];
        var currentGroup = null;
        items.forEach(function (itm) {
            var category = itm.category || '';
            if (!currentGroup || currentGroup.text !== category) {
                currentGroup = {
                    text: category,
                    controls: []
                };
                groups.push(currentGroup);
            }
            currentGroup.controls.push({
                key: itm.key,
                displayName: itm.years || itm.name
            });
        });
        return [{
            name: 'McDonald\'s',            // matches menu-row-template expectation
            template: 'button-text-template',  // layout for controls in groups
            groups: groups
        }];
    });

    // menu rows serve as the root collection for binding
    self.Root = self.MenuRows;

    // Route change handler
    self.SetRoute = function (route) {
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', '#' + route);
            self.CurrentRoute(route);
            if (route !== 'home' && route !== 'about' && route.indexOf('card/') !== 0) {
                self.CurrentCollectionKey(route);
            }
        } else {
            window.location.hash = route;
        }
    };

    self.HandleRouteChange = function () {
        var hash = window.location.hash.slice(1) || 'home';
        self.IsHandlingRoute = true;
        self.CurrentRoute(hash);

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
                if (result.collection && result.collection.key) {
                    self.CurrentCollectionKey(result.collection.key);
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
