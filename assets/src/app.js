var AppView= require('./views/app');
var Joueurs = require('./models/joueurs');
var JoueurView = require('./views/joueur');
var CompositionView = require('./views/composition');
var StrategieView = require('./views/strategie');
var XHR = require('./lib/xhr');

function startEdit(e) {

    var value = e.target.innerHTML;
    var property = e.target.getAttribute('data-property-name');
    var tpl = "<input class='editing' type='text' name='" + property + "' value='" + value + "'/>";
    e.target.setAttribute('data-old-value', value);
    e.target.innerHTML = tpl;
}
function editKeyListener(e) {
    if (e.keyCode === 13) {
        var property = e.target.getAttribute('name');
        var oldValue = e.target.parentNode.getAttribute('data-old-value');
        var newValue = e.target.value;
        var event = new CustomEvent('edited', {bubbles: true, 'detail': {property: property, oldValue: oldValue, newValue: newValue}})
        e.target.dispatchEvent(event);

        _endEdit(e.target);
    }
    else if (e.keyCode === 27) {
        e.target.value = e.target.parentNode.getAttribute('data-old-value');
        _endEdit(e.target);
    }
}
function _endEdit(element) {
    element.parentNode.innerHTML = element.value;
}
Gator(document).on('click', '.editable', startEdit);
Gator(document).on('keydown', '.editable .editing', editKeyListener);

var App = {
    currentView: null,
    _goto: function(routes) {

        if (App[routes]) {
            if (this.currentView) {
                this.currentView.destroy.call(this.currentView);
            }

            App[routes].call(this);
        }
    },
    init: function() {
        var appView = new AppView('#app-wrapper');
        appView.events = {
            'click': {
                'li.joueurs': function () {
                    this._goto('joueurs');
                }.bind(this),
                'li.compo': function () {
                    this._goto('compo');
                }.bind(this),
                'li.strategie': function () {
                    this._goto('strat');
                }.bind(this)
            }
        };
        appView.render();

        this._goto('joueurs');
    },
    joueurs: function () {
        var joueurs = new Joueurs();
        joueurs.load();
        var joueurView = new JoueurView(joueurs, '#content');
        joueurView.render();
        this.currentView = joueurView;
    },
    compo: function() {
        var joueurs = new Joueurs();
        joueurs.load();
        var compoView = new CompositionView(joueurs, '#content');
        compoView.render();
        this.currentView = compoView;
    },
    strat: function() {
        var xhr = new XHR();
        var stratView = new StrategieView('#content');
        xhr.get('/combis').success(function(data) {
            if (data.length > 0)
                stratView.setModel(JSON.parse(data));
            else
                stratView.setModel();
        }).send();
        this.currentView = stratView;
    }
};

App.init();