var ModelList = require('../Model').ModelList;
var Joueur = require('./joueur');

Joueurs.prototype = new ModelList();
Joueurs.constructor = Joueurs;
function Joueurs() {}

Joueurs.prototype.load = function() {
    this.models = [];
    joueurs.forEach(function(joueur) {
        var j = new Joueur({
            id: joueur.id,
            firstname: joueur.firstname,
            lastname: joueur.lastname,
            postes: joueur.postes
        });
        this.add(j)
        j.on('saved', this.changed.bind(this));
    }, this);
};
Joueurs.prototype.changed = function() {
    console.log('changed');
    this.emit('change');
}

var joueurs = [
    { id: 0, firstname: "Jean-Luc", lastname: "Rouyet", postes: ['AD', 'AiD'] },
    { id: 1, firstname: "Louison", lastname: "ONIMUS", postes: ['AG', 'AiG'] },
    { id: 2, firstname: "Matthieux", lastname: "LAHEUX", postes: ['AG', 'DC', 'AD'] },
    { id: 3, firstname: "Julien", lastname: "FREMONT", postes: ['DC'] },
    { id: 4, firstname: "Xaymana", lastname: "Maokhamphiou", postes: ['PV', 'DC'] },
    { id: 5, firstname: "Daniel", lastname: "SANCHEZ", postes: ['G'] },
    { id: 6, firstname: "Emilien", lastname: "YVRARD", postes: ['PV'] },
    { id: 7, firstname: "Ronan", lastname: "LAVIGNE", postes: ['AiD'] },
    { id: 8, firstname: "Jean-Marc", lastname: "WAEYTENS", postes: ['G'] },
    { id: 9, firstname: "Benjamin", lastname: "DARRENOUGUE", postes: ['AG', 'AD', 'AiG'] },
    { id: 10, firstname: "Jérome", lastname: "DOMANGE", postes: ['AG', 'DC', 'AD'] },
    { id: 11, firstname: "Christophe", lastname: "GENOT", postes: ['PV', 'AiG'] },
    { id: 12, firstname: "Franck", lastname: "PERPIGNAN", postes: ['AiG'] },
    { id: 13, firstname: "Camille", lastname: "DOMINIQUE", postes: ['AiG'] },
    { id: 14, firstname: "Yannick", lastname: "BADIE", postes: ['AiG', 'AiD'] },
    { id: 15, firstname: "Mickael", lastname: "EDMOND", postes: ['AiG', 'PV', 'AiD'] },
    { id: 16, firstname: "Sylvain", lastname: "CAMPAGNE", postes: ['AG', 'DC', 'AD'] },
    { id: 17, firstname: "Jean", lastname: "UNG", postes: ['AG', 'DC', 'AD'] },
];

module.exports = Joueurs;

