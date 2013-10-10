var View = require('../View.js');
var Joueur = require('../models/joueur.js');
var _ = require('../lib/underscore-1.5.2.js');

JoueurView.prototype = new View();
JoueurView.constructor = JoueurView;
function JoueurView(model, selector) {
    this.model = model;
    this.currentJoueur = null;
    this.$el = selector;

    this.events = {
        'click': {
            '.joueur': this.displayJoueurInfo,
            '.add-joueur': this.showAddJoueurForm
        },
        'submit': {
            '.add-joueur-form': this.addJoueur
        },
        'edited': {
            'input': this.updateJoueurInfo
        }
    };

    this.model.on('change', this.render.bind(this));
}

JoueurView.prototype._render = function() {
    var tpl = document.getElementById('joueurs-template').innerHTML;
    var html = _.template(tpl)({joueurs: this.model});
    document.querySelector(this.$el).innerHTML = html;
};

function _displayJoueurInfo(joueur) {
    this.currentJoueur = joueur;
    var tpl = document.getElementById('joueur-info-template').innerHTML;
    var html = _.template(tpl)({joueur: joueur});
    document.querySelector(this.$el + " .joueur-info").innerHTML = html;
}
JoueurView.prototype.displayJoueurInfo = function(e) {
    var joueurId = e.target.getAttribute('data-attr-id');
    var joueur = this.model.getById(joueurId);
    _displayJoueurInfo.call(this, joueur);
};

JoueurView.prototype.showAddJoueurForm = function(e) {
    var joueur = new Joueur();
    _displayJoueurInfo.call(this, joueur);
};

JoueurView.prototype.updateJoueurInfo = function updateJoueurInfo(e) {
    var prop = e.detail.property;
    this.currentJoueur[prop] = e.detail.newValue;
    this.currentJoueur.save();
};

JoueurView.prototype.addJoueur = function(e) {
};

module.exports = JoueurView;
