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
        var grouped = {};
        var categoryOrder = [];
        items.forEach(function (itm) {
            var category = itm.category || '';
            if (!grouped[category]) {
                grouped[category] = [];
                categoryOrder.push(category);
            }
            grouped[category].push({
                key: itm.key,
                displayName: itm.years || itm.name
            });
        });
        var groups = categoryOrder.map(function (category) {
            return {
                text: category,
                controls: grouped[category]
            };
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

var rawData = {"McD91-92":{
    "name": "1991-92 Upper Deck McDonald's All-Stars",
     "years": "1991-92", "makers": "Upper Deck", 
     "key": "McD91-92", 
          "category": "Upper Deck",

     "total-cards": 25,
      "tcdb-href": "https://www.tcdb.com/ViewSet.cfm/sid/56699/1991-92-Upper-Deck-McDonald's-All-Stars",
    "cards": [
        { "name": "Cam Neely", "number": "Mc-1", "team": "Boston Bruins", "image-front": "img/cards/McD91-92/56699-Mc-1Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-1Bk.jpg" },
        { "name": "Rick Tocchet", "number": "Mc-2", "team": "Philadelphia Flyers", "image-front": "img/cards/McD91-92/56699-2295373RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295373RepBk.jpg" },
        { "name": "Kevin Stevens", "number": "Mc-3", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD91-92/56699-2295374RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295374RepBk.jpg" },
        { "name": "Mark Recchi", "number": "Mc-4", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD91-92/56699-2295375RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295375RepBk.jpg" },
        { "name": "Joe Sakic", "number": "Mc-5", "team": "Quebec Nordiques", "image-front": "img/cards/McD91-92/56699-2295376RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295376RepBk.jpg" },
        { "name": "Pat LaFontaine", "number": "Mc-6", "team": "Buffalo Sabres", "image-front": "img/cards/McD91-92/56699-Mc-6Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-6Bk.jpg" },
        { "name": "Darren Turcotte", "number": "Mc-7", "team": "New York Rangers", "image-front": "img/cards/McD91-92/56699-2295378RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295378RepBk.jpg" },
        { "name": "Patrick Roy", "number": "Mc-8", "team": "Montreal Canadiens", "image-front": "img/cards/McD91-92/56699-Mc-8Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-8Bk.jpg" },
        { "name": "Andy Moog", "number": "Mc-9", "team": "Boston Bruins", "image-front": "img/cards/McD91-92/56699-Mc-9Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-9Bk.jpg" },
        { "name": "Ray Bourque", "number": "Mc-10", "team": "Boston Bruins", "image-front": "img/cards/McD91-92/56699-2295381RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295381RepBk.jpg" },
        { "name": "Paul Coffey", "number": "Mc-11", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD91-92/56699-2295382RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295382RepBk.jpg" },
        { "name": "Brian Leetch", "number": "Mc-12", "team": "New York Rangers", "image-front": "img/cards/McD91-92/56699-2295383RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295383RepBk.jpg" },
        { "name": "Brett Hull", "number": "Mc-13", "team": "St. Louis Blues", "image-front": "img/cards/McD91-92/56699-2295384RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295384RepBk.jpg" },
        { "name": "Luc Robitaille", "number": "Mc-14", "team": "Los Angeles Kings", "image-front": "img/cards/McD91-92/56699-Mc-14Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-14Bk.jpg" },
        { "name": "Steve Larmer", "number": "Mc-15", "team": "Chicago Blackhawks", "image-front": "img/cards/McD91-92/56699-Mc-15Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-15Bk.jpg" },
        { "name": "Vincent Damphousse", "number": "Mc-16", "team": "Edmonton Oilers", "image-front": "img/cards/McD91-92/56699-Mc-16Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-16Bk.jpg" },
        { "name": "Wayne Gretzky", "number": "Mc-17", "team": "Los Angeles Kings", "image-front": "img/cards/McD91-92/56699-Mc-17Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-17Bk.jpg" },
        { "name": "Theoren Fleury", "number": "Mc-18", "team": "Calgary Flames", "image-front": "img/cards/McD91-92/56699-Mc-18Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-18Bk.jpg" },
        { "name": "Steve Yzerman", "number": "Mc-19", "team": "Detroit Red Wings", "image-front": "img/cards/McD91-92/56699-Mc-19Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-19Bk.jpg" },
        { "name": "Mike Vernon", "number": "Mc-20", "team": "Calgary Flames", "image-front": "img/cards/McD91-92/56699-Mc-20Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-20Bk.jpg" },
        { "name": "Bill Ranford", "number": "Mc-21", "team": "Edmonton Oilers", "image-front": "img/cards/McD91-92/56699-Mc-21Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-21Bk.jpg" },
        { "name": "Chris Chelios", "number": "Mc-22", "team": "Chicago Blackhawks", "image-front": "img/cards/McD91-92/56699-Mc-22Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-22Bk.jpg" },
        { "name": "Al MacInnis", "number": "Mc-23", "team": "Calgary Flames", "image-front": "img/cards/McD91-92/56699-2295394RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295394RepBk.jpg" },
        { "name": "Scott Stevens", "number": "Mc-24", "team": "St. Louis Blues", "image-front": "img/cards/McD91-92/56699-2295395RepFr.jpg", "image-back": "img/cards/McD91-92/56699-2295395RepBk.jpg" },
        { "name": "Checklist", "number": "Mc-25", "team": "Checklist", "image-front": "img/cards/McD91-92/56699-Mc-25Fr.jpg", "image-back": "img/cards/McD91-92/56699-Mc-25Bk.jpg" }
    ],
    "inserts": [
        {
            "key": "McD91-92-Holograms",
            "name": "Holograms",
            "tcdb-href": "https://www.tcdb.com/Checklist.cfm/sid/125616/1991-92-Upper-Deck-McDonald's-All-Stars---Holograms",
            "cards": [
                { "name": "Wayne Gretzky", "number": "McH-01", "team": "Los Angeles Kings", "image-front": "img/cards/McD91-92/125616-2295397Fr.jpg" },
                { "name": "Chris Chelios", "number": "McH-02", "team": "Chicago Blackhawks", "image-front": "img/cards/McD91-92/125616-2295398Fr.jpg" },
                { "name": "Ray Bourque", "number": "McH-03", "team": "Boston Bruins", "image-front": "img/cards/McD91-92/125616-2295399Fr.jpg" },
                { "name": "Brett Hull", "number": "McH-04", "team": "St. Louis Blues", "image-front": "img/cards/McD91-92/125616-2295400Fr.jpg" },
                { "name": "Cam Neely", "number": "McH-05", "team": "Boston Bruins", "image-front": "img/cards/McD91-92/125616-2295401Fr.jpg" },
                { "name": "Patrick Roy", "number": "McH-06", "team": "Montreal Canadiens", "image-front": "img/cards/McD91-92/125616-2295402Fr.jpg" }
            ]
        }
    ]
    },"McD92-93":
    { "name": "1992-93 Upper Deck McDonald's All-Stars",
     "years": "1992-93", "makers": "Upper Deck", 
     "key": "McD92-93", 
    "category": "Upper Deck",
     "total-cards": 28,
      "tcdb-href": "https://www.tcdb.com/ViewSet.cfm/sid/62883/1992-93-Upper-Deck-McDonald's-All-Stars",
    "cards": [
        { "name": "Ed Belfour", "number": "McD-01", "team": "Chicago Blackhawks", "image-front": "img/cards/McD92-93/62883-4099224Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099224Bk.jpg" },
        { "name": "Brian Bellows", "number": "McD-02", "team": "Minnesota North Stars", "image-front": "img/cards/McD92-93/62883-4099225Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099225Bk.jpg" },
        { "name": "Chris Chelios", "number": "McD-03", "team": "Chicago Blackhawks", "image-front": "img/cards/McD92-93/62883-4099226Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099226Bk.jpg" },
        { "name": "Vincent Damphousse", "number": "McD-04", "team": "Edmonton Oilers", "image-front": "img/cards/McD92-93/62883-4099227Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099227Bk.jpg" },
        { "name": "Dave Ellett", "number": "McD-05", "team": "Toronto Maple Leafs", "image-front": "img/cards/McD92-93/62883-4099228Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099228Bk.jpg" },
        { "name": "Sergei Fedorov", "number": "McD-06", "team": "Detroit Red Wings", "image-front": "img/cards/McD92-93/62883-McD-6Fr.jpg", "image-back": "img/cards/McD92-93/62883-McD-6Bk.jpg" },
        { "name": "Theoren Fleury", "number": "McD-07", "team": "Calgary Flames", "image-front": "img/cards/McD92-93/62883-4099230RepFr.jpg", "image-back": "img/cards/McD92-93/62883-4099230RepBk.jpg" },
        { "name": "Phil Housley", "number": "McD-08", "team": "Winnipeg Jets", "image-front": "img/cards/McD92-93/62883-4099231Fr.jpg", "image-back": "img/cards/McD92-93/62883-McD-8Bk.jpg" },
        { "name": "Trevor Linden", "number": "McD-09", "team": "Vancouver Canucks", "image-front": "img/cards/McD92-93/62883-4099232Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099232Bk.jpg" },
        { "name": "Al MacInnis", "number": "McD-10", "team": "Calgary Flames", "image-front": "img/cards/McD92-93/62883-4099233RepFr.jpg", "image-back": "img/cards/McD92-93/62883-4099233RepBk.jpg" },
        { "name": "Adam Oates", "number": "McD-11", "team": "St. Louis Blues", "image-front": "img/cards/McD92-93/62883-McD-11Fr.jpg", "image-back": "img/cards/McD92-93/62883-McD-11Bk.jpg" },
        { "name": "Luc Robitaille", "number": "McD-12", "team": "Los Angeles Kings", "image-front": "img/cards/McD92-93/62883-McD-12Fr.jpg", "image-back": "img/cards/McD92-93/62883-McD-12Bk.jpg" },
        { "name": "Jeremy Roenick", "number": "McD-13", "team": "Chicago Blackhawks", "image-front": "img/cards/McD92-93/62883-4099236Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099236Bk.jpg" },
        { "name": "Steve Yzerman", "number": "McD-14", "team": "Detroit Red Wings", "image-front": "img/cards/McD92-93/62883-4099237RepFr.jpg", "image-back": "img/cards/McD92-93/62883-4099237RepBk.jpg" },
        { "name": "Don Beaupre", "number": "McD-15", "team": "Washington Capitals", "image-front": "img/cards/McD92-93/62883-McD-15Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099238RepBk.jpg" },
        { "name": "Rod Brind'Amour", "number": "McD-16", "team": "Philadelphia Flyers", "image-front": "img/cards/McD92-93/62883-4099239RepFr.jpg", "image-back": "img/cards/McD92-93/62883-4099239RepBk.jpg" },
        { "name": "Paul Coffey", "number": "McD-17", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD92-93/62883-4099240RepFr.jpg", "image-back": "img/cards/McD92-93/62883-McD-17Bk.jpg" },
        { "name": "John Cullen", "number": "McD-18", "team": "Hartford Whalers", "image-front": "img/cards/McD92-93/62883-4099241RepFr.jpg", "image-back": "img/cards/McD92-93/62883-4099241Bk.jpg" },
        { "name": "Kevin Hatcher", "number": "McD-19", "team": "Washington Capitals", "image-front": "img/cards/McD92-93/62883-4099242RepFr.jpg", "image-back": "img/cards/McD92-93/62883-4099242RepBk.jpg" },
        { "name": "Jaromir Jagr", "number": "McD-20", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD92-93/62883-McD-20Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099243RepBk.jpg" },
        { "name": "Mario Lemieux", "number": "McD-21", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD92-93/62883-4099244RepFr.jpg", "image-back": "img/cards/McD92-93/62883-4099244RepBk.jpg" },
        { "name": "Alexander Mogilny", "number": "McD-22", "team": "Buffalo Sabres", "image-front": "img/cards/McD92-93/62883-McD-22Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099245Bk.jpg" },
        { "name": "Kirk Muller", "number": "McD-23", "team": "Montreal Canadiens", "image-front": "img/cards/McD92-93/62883-4099246RepFr.jpg", "image-back": "img/cards/McD92-93/62883-4099246RepBk.jpg" },
        { "name": "Owen Nolan", "number": "McD-24", "team": "Quebec Nordiques", "image-front": "img/cards/McD92-93/62883-McD-24Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099247Bk.jpg" },
        { "name": "Mike Richter", "number": "McD-25", "team": "New York Rangers", "image-front": "img/cards/McD92-93/62883-4099248RepFr.jpg", "image-back": "img/cards/McD92-93/62883-McD-25Bk.jpg" },
        { "name": "Joe Sakic", "number": "McD-26", "team": "Quebec Nordiques", "image-front": "img/cards/McD92-93/62883-McD-26Fr.jpg", "image-back": "img/cards/McD92-93/62883-4099249RepBk.jpg" },
        { "name": "Scott Stevens", "number": "McD-27", "team": "New Jersey Devils", "image-front": "img/cards/McD92-93/62883-4099250Fr.jpg", "image-back": "img/cards/McD92-93/62883-McD-27Bk.jpg" },
        { "name": "Checklist", "number": "NNO", "team": "Checklist", "image-front": "img/cards/McD92-93/62883-NNOFr.jpg", "image-back": "img/cards/McD92-93/62883-NNOBk.jpg" }
    ],
    "inserts": [
        {
            "key": "McD92-93-Holograms",
            "name": "Holograms",
            "tcdb-href": "https://www.tcdb.com/Checklist.cfm/sid/125617/1992-93-Upper-Deck-McDonald's-All-Stars---Holograms",
            "cards": [
                { "name": "Mark Messier", "number": "McH-01", "team": "New York Rangers", "image-front": "img/cards/McD92-93/125617-4099251Fr.jpg", "image-back": "img/cards/McD92-93/125617-4099251RepBk.jpg" },
                { "name": "Brett Hull", "number": "McH-02", "team": "St. Louis Blues", "image-front": "img/cards/McD92-93/125617-4099252Fr.jpg", "image-back": "img/cards/McD92-93/125617-4099252Bk.jpg" },
                { "name": "Kevin Stevens", "number": "McH-03", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD92-93/125617-4099253Fr.jpg", "image-back": "img/cards/McD92-93/125617-4099253Bk.jpg" },
                { "name": "Brian Leetch", "number": "McH-04", "team": "New York Rangers", "image-front": "img/cards/McD92-93/125617-4099254Fr.jpg", "image-back": "img/cards/McD92-93/125617-4099254Bk.jpg" },
                { "name": "Ray Bourque", "number": "McH-05", "team": "Boston Bruins", "image-front": "img/cards/McD92-93/125617-4099255Fr.jpg", "image-back": "img/cards/McD92-93/125617-4099255Bk.jpg" },
                { "name": "Patrick Roy", "number": "McH-06", "team": "Montreal Canadiens", "image-front": "img/cards/McD92-93/125617-4099256Fr.jpg", "image-back": "img/cards/McD92-93/125617-4099256Bk.jpg" }
            ]
        }
    ]
    },"McD93-94":
    { "name": "1993-94 Upper Deck McDonald's NHL All-Stars",
     "years": "1993-94", "makers": "Upper Deck", 
     "key": "McD93-94", 
    "category": "Upper Deck",
     "total-cards": 28,
      "tcdb-href": "https://www.tcdb.com/ViewSet.cfm/sid/62885/1993-94-Upper-Deck-McDonald's-NHL-All-Stars",
    "cards": [
        { "name": "Brian Bradley", "number": "McD-01", "team": "Tampa Bay Lightning", "image-front": "img/cards/McD93-94/62885-McD-1Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-1Bk.jpg" },
        { "name": "Pavel Bure", "number": "McD-02", "team": "Vancouver Canucks", "image-front": "img/cards/McD93-94/62885-McD-2Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-2Bk.jpg" },
        { "name": "Jon Casey", "number": "McD-03", "team": "Minnesota North Stars", "image-front": "img/cards/McD93-94/62885-McD-3Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-3Bk.jpg" },
        { "name": "Paul Coffey", "number": "McD-04", "team": "Detroit Red Wings", "image-front": "img/cards/McD93-94/62885-McD-4Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-4Bk.jpg" },
        { "name": "Doug Gilmour", "number": "McD-05", "team": "Toronto Maple Leafs", "image-front": "img/cards/McD93-94/62885-McD-5Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-5Bk.jpg" },
        { "name": "Phil Housley", "number": "McD-06", "team": "Winnipeg Jets", "image-front": "img/cards/McD93-94/62885-McD-6Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-6Bk.jpg" },
        { "name": "Brett Hull", "number": "McD-07", "team": "St. Louis Blues", "image-front": "img/cards/McD93-94/62885-McD-7Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-7Bk.jpg" },
        { "name": "Jari Kurri", "number": "McD-08", "team": "Los Angeles Kings", "image-front": "img/cards/McD93-94/62885-McD-8Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-8Bk.jpg" },
        { "name": "Dave Manson", "number": "McD-09", "team": "Edmonton Oilers", "image-front": "img/cards/McD93-94/62885-McD-9Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-9Bk.jpg" },
        { "name": "Mike Modano", "number": "McD-10", "team": "Minnesota North Stars", "image-front": "img/cards/McD93-94/62885-McD-10Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-10Bk.jpg" },
        { "name": "Gary Roberts", "number": "McD-11", "team": "Calgary Flames", "image-front": "img/cards/McD93-94/62885-McD-11Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-11Bk.jpg" },
        { "name": "Jeremy Roenick", "number": "McD-12", "team": "Chicago Blackhawks", "image-front": "img/cards/McD93-94/62885-McD-12Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-12Bk.jpg" },
        { "name": "Steve Yzerman", "number": "McD-13", "team": "Detroit Red Wings", "image-front": "img/cards/McD93-94/62885-McD-13Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-13Bk.jpg" },
        { "name": "Steve Duchesne", "number": "McD-14", "team": "Quebec Nordiques", "image-front": "img/cards/McD93-94/62885-McD-14Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-14Bk.jpg" },
        { "name": "Mike Gartner", "number": "McD-15", "team": "New York Rangers", "image-front": "img/cards/McD93-94/62885-4099296RepFr.jpg", "image-back": "img/cards/McD93-94/62885-4099297Bk.jpg" },
        { "name": "Al Iafrate", "number": "McD-16", "team": "Washington Capitals", "image-front": "img/cards/McD93-94/62885-McD-16Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-16Bk.jpg" },
        { "name": "Jaromir Jagr", "number": "McD-17", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD93-94/62885-McD-17Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-17Bk.jpg" },
        { "name": "Pat LaFontaine", "number": "McD-18", "team": "Buffalo Sabres", "image-front": "img/cards/McD93-94/62885-McD-18Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-18Bk.jpg" },
        { "name": "Alexander Mogilny", "number": "McD-19", "team": "Buffalo Sabres", "image-front": "img/cards/McD93-94/62885-McD-19Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-19Bk.jpg" },
        { "name": "Kirk Muller", "number": "McD-20a", "team": "Montreal Canadiens", "image-front": "img/cards/McD93-94/62885-4099291RepFr.jpg", "image-back": "img/cards/McD93-94/62885-McD-20aBk.jpg" },
        { "name": "Kirk Muller", "number": "McD-20b", "team": "Montreal Canadiens", "image-front": "img/cards/McD93-94/62885-4099297Fr.jpg", "image-back": "img/cards/McD93-94/62885-4099291RepBk.jpg" },
        { "name": "Adam Oates", "number": "McD-21", "team": "Boston Bruins", "image-front": "img/cards/McD93-94/62885-McD-21Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-21Bk.jpg" },
        { "name": "Mark Recchi", "number": "McD-22", "team": "Philadelphia Flyers", "image-front": "img/cards/McD93-94/62885-McD-22Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-22Bk.jpg" },
        { "name": "Patrick Roy", "number": "McD-23", "team": "Montreal Canadiens", "image-front": "img/cards/McD93-94/62885-McD-23Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-23Bk.jpg" },
        { "name": "Joe Sakic", "number": "McD-24", "team": "Quebec Nordiques", "image-front": "img/cards/McD93-94/62885-McD-24Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-24Bk.jpg" },
        { "name": "Kevin Stevens", "number": "McD-25", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD93-94/62885-McD-25Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-25Bk.jpg" },
        { "name": "Scott Stevens", "number": "McD-26", "team": "New Jersey Devils", "image-front": "img/cards/McD93-94/62885-McD-26Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-26Bk.jpg" },
        { "name": "Pierre Turgeon", "number": "McD-27", "team": "New York Islanders", "image-front": "img/cards/McD93-94/62885-McD-27Fr.jpg", "image-back": "img/cards/McD93-94/62885-McD-27Bk.jpg" }
    ],
    "inserts": [
        {
            "key": "McD93-94-Holograms",
            "name": "Holograms",
            "tcdb-href": "https://www.tcdb.com/Checklist.cfm/sid/125618/1993-94-Upper-Deck-McDonald's-NHL-All-Stars---Holograms",
            "cards": [
                { "name": "Mario Lemieux", "number": "McH-01", "team": "Pittsburgh Penguins", "orientation": "landscape", "image-front": "img/cards/McD93-94/138869-4099305Fr.jpg", "image-back": "img/cards/McD93-94/138869-4099305Bk.jpg" },
                { "name": "Teemu Selanne", "number": "McH-02", "team": "Winnipeg Jets", "orientation": "landscape", "image-front": "img/cards/McD93-94/138869-4099306Fr.jpg", "image-back": "img/cards/McD93-94/138869-4099306Bk.jpg" },
                { "name": "Luc Robitaille", "number": "McH-03", "team": "Los Angeles Kings", "orientation": "landscape", "image-front": "img/cards/McD93-94/138869-4099307Fr.jpg", "image-back": "img/cards/McD93-94/138869-4099307Bk.jpg" },
                { "name": "Ray Bourque", "number": "McH-04", "team": "Boston Bruins", "orientation": "landscape", "image-front": "img/cards/McD93-94/138869-4099308Fr.jpg", "image-back": "img/cards/McD93-94/138869-4099308Bk.jpg" },
                { "name": "Chris Chelios", "number": "McH-05", "team": "Chicago Blackhawks", "orientation": "landscape", "image-front": "img/cards/McD93-94/138869-4099309RepFr.jpg", "image-back": "img/cards/McD93-94/138869-4099309RepBk.jpg" },
                { "name": "Ed Belfour", "number": "McH-06", "team": "Chicago Blackhawks", "orientation": "landscape", "image-front": "img/cards/McD93-94/138869-4099310Fr.jpg", "image-back": "img/cards/McD93-94/138869-4099310Bk.jpg" }
            ]
        }
    ]
},"McD94-95":
    { "name": "1994-95 Upper Deck McDonald's",
     "years": "1994-95", "makers": "Upper Deck", 
     "key": "McD94-95", 
    "category": "Upper Deck",
     "total-cards": 40,
            "tcdb-href": "https://www.tcdb.com/ViewSet.cfm/sid/62943/1994-95-Upper-Deck-McDonald's",
    "cards": [
                { "name": "Joe Sakic", "number": "McD-01", "team": "Quebec Nordiques", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-1Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-1Bk.jpg" },
                { "name": "Adam Graves", "number": "McD-02", "team": "New York Rangers", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-2Fr.jpg", "image-back": "img/cards/McD94-95/62943-4099871RepBk.jpg" },
                { "name": "Alexei Yashin", "number": "McD-03", "team": "Ottawa Senators", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-3Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-3Bk.jpg" },
                { "name": "Patrick Roy", "number": "McD-04", "team": "Montreal Canadiens", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-4Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-4Bk.jpg" },
                { "name": "Ray Bourque", "number": "McD-05", "team": "Boston Bruins", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-5Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-5Bk.jpg" },
                { "name": "Brian Leetch", "number": "McD-06", "team": "New York Rangers", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-6Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-6Bk.jpg" },
                { "name": "Scott Stevens", "number": "McD-07", "team": "New Jersey Devils", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-7Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-7Bk.jpg" },
                { "name": "Alexander Mogilny", "number": "McD-08", "team": "Buffalo Sabres", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-8Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-8Bk.jpg" },
                { "name": "Eric Lindros", "number": "McD-09", "team": "Philadelphia Flyers", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-9Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-9Bk.jpg" },
                { "name": "Jaromir Jagr", "number": "McD-10", "team": "Pittsburgh Penguins", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-10Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-10Bk.jpg" },
                { "name": "Sandis Ozolinsh", "number": "McD-11", "team": "San Jose Sharks", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-11Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-11Bk.jpg" },
                { "name": "Sergei Fedorov", "number": "McD-12", "team": "Detroit Red Wings", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-12Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-12Bk.jpg" },
                { "name": "Brett Hull", "number": "McD-13", "team": "St. Louis Blues", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-13Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-13Bk.jpg" },
                { "name": "Felix Potvin", "number": "McD-14", "team": "Toronto Maple Leafs", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-14Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-14Bk.jpg" },
                { "name": "Al MacInnis", "number": "McD-15", "team": "St. Louis Blues", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-15Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-15Bk.jpg" },
                { "name": "Chris Chelios", "number": "McD-16", "team": "Chicago Blackhawks", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-16Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-16Bk.jpg" },
                { "name": "Rob Blake", "number": "McD-17", "team": "Los Angeles Kings", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-17Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-17Bk.jpg" },
                { "name": "Dave Andreychuk", "number": "McD-18", "team": "Toronto Maple Leafs", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-18Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-18Bk.jpg" },
                { "name": "Paul Coffey", "number": "McD-19", "team": "Detroit Red Wings", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-19Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-19Bk.jpg" },
                { "name": "Jeremy Roenick", "number": "McD-20", "team": "Chicago Blackhawks", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-20Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-20Bk.jpg" },
                { "name": "Joe Nieuwendyk", "number": "McD-21", "team": "Calgary Flames", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-21Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-21Bk.jpg" },
                { "name": "Cam Neely", "number": "McD-22", "team": "Boston Bruins", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-22Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-22Bk.jpg" },
                { "name": "Pavel Bure", "number": "McD-23", "team": "Vancouver Canucks", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-23Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-23Bk.jpg" },
                { "name": "Wendel Clark", "number": "McD-24", "team": "Quebec Nordiques", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-24Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-24Bk.jpg" },
                { "name": "Teemu Selanne", "number": "McD-25", "team": "Winnipeg Jets", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-25Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-25Bk.jpg" },
                { "name": "Pierre Turgeon", "number": "McD-26", "team": "New York Islanders", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-26Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-26Bk.jpg" },
                { "name": "Alexei Zhamnov", "number": "McD-27", "team": "Winnipeg Jets", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-27Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-27Bk.jpg" },
                { "name": "Doug Gilmour", "number": "McD-28", "team": "Toronto Maple Leafs", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-28Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-28Bk.jpg" },
                { "name": "Vincent Damphousse", "number": "McD-29", "team": "Montreal Canadiens", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-29Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-29Bk.jpg" },
                { "name": "Brendan Shanahan", "number": "McD-30", "team": "St. Louis Blues", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-30Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-30Bk.jpg" },
                { "name": "Peter Forsberg", "number": "McD-31", "team": "Quebec Nordiques", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-31Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-31Bk.jpg" },
                { "name": "Paul Kariya", "number": "McD-32", "team": "Anaheim Mighty Ducks", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-32Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-32Bk.jpg" },
                { "name": "Viktor Kozlov", "number": "McD-33", "team": "San Jose Sharks", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-33Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-33Bk.jpg" },
                { "name": "Brett Lindros", "number": "McD-34", "team": "New York Islanders", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-34Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-34Bk.jpg" },
                { "name": "Martin Brodeur", "number": "McD-35", "team": "New Jersey Devils", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-35Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-35Bk.jpg" },
                { "name": "Alexandre Daigle", "number": "McD-36", "team": "Ottawa Senators", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-36Fr.jpg", "image-back": "img/cards/McD94-95/62943-4099905RepBk.jpg" },
                { "name": "Jason Arnott", "number": "McD-37", "team": "Edmonton Oilers", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-37Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-37Bk.jpg" },
                { "name": "Alexei Kovalev", "number": "McD-38", "team": "New York Rangers", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-38Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-38Bk.jpg" },
                { "name": "Mikael Renberg", "number": "McD-39", "team": "Philadelphia Flyers", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-McD-39Fr.jpg", "image-back": "img/cards/McD94-95/62943-McD-39Bk.jpg" },
                { "name": "Mike Richter CL", "number": "NNO", "team": "New York Rangers", "orientation": "landscape", "image-front": "img/cards/McD94-95/62943-NNOFr.jpg", "image-back": "img/cards/McD94-95/62943-NNOBk.jpg" }
    ]
},"McD95-96":
    { "name": "1995-96 Pinnacle McDonald's",
     "years": "1995-96", "makers": "Pinnacle", 
     "key": "McD95-96", 
    "category": "Pinnacle",
     "total-cards": 40,
      "tcdb-href": "https://www.tcdb.com/Checklist.cfm/sid/62768/1995-96-Pinnacle-McDonald's",
    "cards": [
        { "name": "Jaromir Jagr GW", "number": "McD-01", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD95-96/62768-McD-1Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-1Bk.jpg" },
        { "name": "Eric Lindros GW", "number": "McD-02", "team": "Philadelphia Flyers", "image-front": "img/cards/McD95-96/62768-McD-2Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-2Bk.jpg" },
        { "name": "Alexei Zhamnov GW", "number": "McD-03", "team": "Winnipeg Jets", "image-front": "img/cards/McD95-96/62768-McD-3Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-3Bk.jpg" },
        { "name": "Paul Coffey GW", "number": "McD-04", "team": "Detroit Red Wings", "image-front": "img/cards/McD95-96/62768-McD-4Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-4Bk.jpg" },
        { "name": "Mark Messier GW", "number": "McD-05", "team": "New York Rangers", "image-front": "img/cards/McD95-96/62768-McD-5Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-5Bk.jpg" },
        { "name": "Brett Hull GW", "number": "McD-06", "team": "St. Louis Blues", "image-front": "img/cards/McD95-96/62768-McD-6Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-6Bk.jpg" },
        { "name": "Peter Forsberg GW", "number": "McD-07", "team": "Colorado Avalanche", "image-front": "img/cards/McD95-96/62768-McD-7Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-7Bk.jpg" },
        { "name": "Pavel Bure GW", "number": "McD-08", "team": "Vancouver Canucks", "image-front": "img/cards/McD95-96/62768-McD-8Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-8Bk.jpg" },
        { "name": "Doug Gilmour GW", "number": "McD-09", "team": "Toronto Maple Leafs", "image-front": "img/cards/McD95-96/62768-McD-9Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-9Bk.jpg" },
        { "name": "Owen Nolan GW", "number": "McD-10", "team": "San Jose Sharks", "image-front": "img/cards/McD95-96/62768-McD-10Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-10Bk.jpg" },
        { "name": "Paul Kariya GW", "number": "McD-11", "team": "Anaheim Mighty Ducks", "image-front": "img/cards/McD95-96/62768-McD-11Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-11Bk.jpg" },
        { "name": "Joe Nieuwendyk GW", "number": "McD-12", "team": "Calgary Flames", "image-front": "img/cards/McD95-96/62768-McD-12Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-12Bk.jpg" },
        { "name": "Pierre Turgeon GW", "number": "McD-13", "team": "Montreal Canadiens", "image-front": "img/cards/McD95-96/62768-McD-13Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-13Bk.jpg" },
        { "name": "Jason Arnott GW", "number": "McD-14", "team": "Edmonton Oilers", "image-front": "img/cards/McD95-96/62768-McD-14Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-14Bk.jpg" },
        { "name": "Mario Lemieux GW", "number": "McD-15", "team": "Pittsburgh Penguins", "image-front": "img/cards/McD95-96/62768-McD-15Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-15Bk.jpg" },
        { "name": "Jeremy Roenick GW", "number": "McD-16", "team": "Chicago Blackhawks", "image-front": "img/cards/McD95-96/62768-McD-16Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-16Bk.jpg" },
        { "name": "Sergei Fedorov GW", "number": "McD-17", "team": "Detroit Red Wings", "image-front": "img/cards/McD95-96/62768-McD-17Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-17Bk.jpg" },
        { "name": "Mats Sundin GW", "number": "McD-18", "team": "Toronto Maple Leafs", "image-front": "img/cards/McD95-96/62768-McD-18Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-18Bk.jpg" },
        { "name": "Teemu Selanne GW", "number": "McD-19", "team": "Winnipeg Jets", "image-front": "img/cards/McD95-96/62768-McD-19Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-19Bk.jpg" },
        { "name": "John LeClair GW", "number": "McD-20", "team": "Philadelphia Flyers", "image-front": "img/cards/McD95-96/62768-McD-20Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-20Bk.jpg" },
        { "name": "Alexander Mogilny GW", "number": "McD-21", "team": "Vancouver Canucks", "image-front": "img/cards/McD95-96/62768-McD-21Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-21Bk.jpg" },
        { "name": "Mikael Renberg GW", "number": "McD-22", "team": "Philadelphia Flyers", "image-front": "img/cards/McD95-96/62768-McD-22Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-22Bk.jpg" },
        { "name": "Chris Chelios GW", "number": "McD-23", "team": "Chicago Blackhawks", "image-front": "img/cards/McD95-96/62768-McD-23Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-23Bk.jpg" },
        { "name": "Mark Recchi GW", "number": "McD-24", "team": "Montreal Canadiens", "image-front": "img/cards/McD95-96/62768-McD-24Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-24Bk.jpg" },
        { "name": "Patrick Roy GS", "number": "McD-25", "team": "Montreal Canadiens", "image-front": "img/cards/McD95-96/62768-McD-25Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-25Bk.jpg" },
        { "name": "Félix Potvin GS", "number": "McD-26", "team": "Toronto Maple Leafs", "image-front": "img/cards/McD95-96/62768-McD-26Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-26Bk.jpg" },
        { "name": "Martin Brodeur GS", "number": "McD-27", "team": "New Jersey Devils", "image-front": "img/cards/McD95-96/62768-McD-27Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-27Bk.jpg" },
        { "name": "Dominik Hasek GS", "number": "McD-28", "team": "Buffalo Sabres", "image-front": "img/cards/McD95-96/62768-McD-28Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-28Bk.jpg" },
        { "name": "Ed Belfour GS", "number": "McD-29", "team": "Chicago Blackhawks", "image-front": "img/cards/McD95-96/62768-McD-29Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-29Bk.jpg" },
        { "name": "Kirk McLean GS", "number": "McD-30", "team": "Vancouver Canucks", "image-front": "img/cards/McD95-96/62768-McD-30Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-30Bk.jpg" },
        { "name": "Jeff Friesen FGW", "number": "McD-31", "team": "San Jose Sharks", "image-front": "img/cards/McD95-96/62768-McD-31Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-31Bk.jpg" },
        { "name": "Todd Harvey FGW", "number": "McD-32", "team": "Dallas Stars", "image-front": "img/cards/McD95-96/62768-McD-32Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-32Bk.jpg" },
        { "name": "Brett Lindros FGW", "number": "McD-33", "team": "New York Islanders", "image-front": "img/cards/McD95-96/62768-McD-33Fr.jpg", "image-back": "img/cards/McD95-96/62768-4098961RepBk.jpg" },
        { "name": "Valeri Bure FGW", "number": "McD-34", "team": "Montreal Canadiens", "image-front": "img/cards/McD95-96/62768-4098962RepFr.jpg", "image-back": "img/cards/McD95-96/62768-4098962RepBk.jpg" },
        { "name": "Oleg Tverdovsky FGW", "number": "McD-35", "team": "Anaheim Mighty Ducks", "image-front": "img/cards/McD95-96/62768-McD-35Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-35Bk.jpg" },
        { "name": "Kenny Jonsson FGW", "number": "McD-36", "team": "Toronto Maple Leafs", "image-front": "img/cards/McD95-96/62768-McD-36Fr.jpg", "image-back": "img/cards/McD95-96/62768-McD-36Bk.jpg" },
        { "name": "Mariusz Czerkawski FGW", "number": "McD-37", "team": "Boston Bruins", "image-front": "img/cards/McD95-96/62768-4098965RepFr.jpg", "image-back": "img/cards/McD95-96/62768-4098965RepBk.jpg" },
        { "name": "Alexandre Daigle FGW", "number": "McD-38", "team": "Ottawa Senators", "image-front": "img/cards/McD95-96/62768-4098966RepFr.jpg", "image-back": "img/cards/McD95-96/62768-McD-38Bk.jpg" },
        { "name": "Saku Koivu FGW", "number": "McD-39", "team": "Montreal Canadiens", "image-front": "img/cards/McD95-96/62768-4098967RepFr.jpg", "image-back": "img/cards/McD95-96/62768-McD-39Bk.jpg" },
        { "name": "Jim Carey FGW", "number": "McD-40", "team": "Washington Capitals", "image-front": "img/cards/McD95-96/62768-4098968RepFr.jpg", "image-back": "img/cards/McD95-96/62768-4098968RepBk.jpg" }
    ]
}
};

if (rawData["McD95-96"] && rawData["McD95-96"].cards) {
    rawData["McD95-96"].cards.forEach(function (card) {
        if (/^McD-(0[1-9]|[12][0-9]|30)$/.test(card.number || '')) {
            card.orientation = 'landscape';
        }
    });
}