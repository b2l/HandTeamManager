var AppView= require('./views/app');
var Joueurs = require('./models/joueurs');
var JoueurView = require('./views/joueur');
var CompositionView = require('./views/composition');

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
    init: function() {
        var appView = new AppView('#app-wrapper');
        appView.events = {
            'click': {
                'li.joueurs': App.joueurs,
                'li.compo': App.compo,
                'li.strategie': App.strat
            }
        };
        appView.render();

        // Go to
        App.joueurs();
    },
    joueurs: function() {
        var joueurs = new Joueurs();
        joueurs.load();
        var joueurView = new JoueurView(joueurs, '#content');
        joueurView.render();
    },
    compo: function() {
        var joueurs = new Joueurs();
        joueurs.load();
        var compoView = new CompositionView(joueurs, '#content');
        compoView.render();
    },
    strat: function() {

    }
};

window.onload = function() {
    App.init();
}