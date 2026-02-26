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

    // primary data dictionary (sets keyed by id)
    self.Data = ko.observable({});

    // routing / selection state
    self.CurrentCollectionKey = ko.observable(HCHB.App.HomeCollection);
    self.CurrentRoute = ko.observable('home');

    // when the selected collection key changes (e.g. via menu radio), push it into the route
    self.CurrentCollectionKey.subscribe(function(key) {
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
        }
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
            if (route !== 'home' && route !== 'about') {
                self.CurrentCollectionKey(route);
            }
        } else {
            window.location.hash = route;
        }
    };

    self.HandleRouteChange = function () {
        var hash = window.location.hash.slice(1) || 'home';
        self.CurrentRoute(hash);
        // if the hash looks like a collection key, update selection too
        if (hash !== 'home' && hash !== 'about') {
            self.CurrentCollectionKey(hash);
        }
    };
}
