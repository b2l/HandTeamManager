var Model = require('../Model').Model;

Joueur.prototype = new Model();
Joueur.constructor = Joueur;
function Joueur(properties) {
    for (var prop in properties) {
        this[prop] = properties[prop];
    }
}

module.exports = Joueur;