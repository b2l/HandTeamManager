var View = require('../View.js');
var _ = require('../lib/underscore-1.5.2.js');
var Paper = require('../lib/paper-full.min.js').exports;
var PaperTool = require('../lib/paperjs-tool.js');

CompositionView.prototype = new View();
CompositionView.constructor = CompositionView;
function CompositionView(models, selector) {
    this.models = models;
    this.$el = selector;

    this.events = {
        'click': {
            '.joueur': this.toggleSelect
        }
    }
}

CompositionView.prototype.toggleSelect = function(e) {
    e.target.classList.toggle('selected');
    var joueurId = e.target.getAttribute('data-attr-id');
    var joueur = this.models.getById(joueurId);

    joueur.selected = e.target.classList.contains('selected');

    this.renderCompo();
};

CompositionView.prototype._render = function() {
    var tpl = _.template(document.getElementById('compo-template').innerHTML);
    var html = tpl({joueurs: this.models});
    document.querySelector(this.$el).innerHTML = html;
};

CompositionView.prototype.renderCompo = function() {
    var postes = {
        'G': {
            label: "Gardien",
            joueurs: [
            ]
        },
        'AiG': {
            label: "Ailier Gauche",
            joueurs: [
            ]
        },
        'AiD': {
            label: "Ailier Droit",
            joueurs: [
            ]
        },
        'PV': {
            label: "Pivot",
            joueurs: [
            ]
        },
        'AG': {
            label: "Arrière Gauche",
            joueurs: [
            ]
        },
        'AD': {
            label: "Arrière Droite",
            joueurs: [
            ]
        },
        'DC': {
            label: "Demi-centre",
            joueurs: [
            ]
        }
    };

    var nbJoueur = 0;
    this.models.models.map(function(j) {
        if (j.selected) {
            nbJoueur++;
            _.each(j.postes, function(poste) {
                postes[poste].joueurs.push(j);
            });
        }
    });


    var tpl = _.template(document.getElementById('selection-template').innerHTML);
    var html = tpl({
        postes: postes,
        nbJoueur: nbJoueur
    });
    document.querySelector(this.$el + " .selection-list").innerHTML = html;
};

module.exports = CompositionView;