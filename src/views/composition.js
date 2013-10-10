var View = require('../View.js');
var _ = require('../lib/underscore-1.5.2.js');
var Paper = require('../lib/paper-full.min.js').exports;

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
};

CompositionView.prototype._render = function() {
    var tpl = document.getElementById('joueurs-template').innerHTML;
    var html = _.template(tpl)({joueurs: this.models});
    document.querySelector(this.$el).innerHTML = html;

    var tpl = document.getElementById('compo-template').innerHTML;
    var html = _.template(tpl)();
    document.querySelector(this.$el + " .joueur-info").innerHTML = html;

    var canvas = document.getElementById('canvas-compo');

    var paper = new Paper.PaperScope();
    paper.setup(canvas);

    renderTerrain(400, 100, 800, 400);

    renderPlayers(400, 100, 800, 400);


    var tool = new Paper.Tool();

    var dragItem = null;
    tool.onMouseDown = function(e) {
        if (e.item && e.item.draggable ) {
            dragItem = e.item;
        }
    }

    tool.onMouseDrag = function(e) {
        if (dragItem)
            dragItem.position = e.middlePoint;
    }

    tool.onMouseUp = function(e) {
        dragItem = null;
    }
};
module.exports = CompositionView;

function largeurRatio(nb, realLargeur) {
    return nb * realLargeur / 200;
}
function longueurRatio(nb, realLongueur) {
    return nb * realLongueur / 400;
}

function renderPlayers(offsetLeft, offsetTop, longueur, largeur) {
    var team1color = 'blue';
    var team2color = 'red';
    var ballColor = 'black';

    var POS = {
        'GB': {x: longueurRatio(390, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'PV': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'AiG': {x: longueurRatio(10, longueur) + offsetLeft, y: largeurRatio(190, largeur) + offsetTop},
        'AiD': {x: longueurRatio(10, longueur) + offsetLeft, y: largeurRatio(10, largeur) + offsetTop},
        'AG': {x: longueurRatio(115, longueur) + offsetLeft, y: largeurRatio(175, largeur) + offsetTop},
        'DC': {x: longueurRatio(150, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'AD': {x: longueurRatio(115, longueur) + offsetLeft, y: largeurRatio(25, largeur) + offsetTop}
    };

    console.log(POS.GB);

    createPlayer.call(this, new Paper.Point(160, 20), ballColor);

    var t1 = [];
    var t2 = [];

    t1.push(createPlayer.call(this, new Paper.Point(POS.GB), team1color));
    t1.push(createPlayer.call(this, new Paper.Point(POS.AiD), team1color));
    t1.push(createPlayer.call(this, new Paper.Point(POS.AiG), team1color));
    t1.push(createPlayer.call(this, new Paper.Point(POS.PV), team1color));
    t1.push(createPlayer.call(this, new Paper.Point(POS.AD), team1color));
    t1.push(createPlayer.call(this, new Paper.Point(POS.AG), team1color));
    t1.push(createPlayer.call(this, new Paper.Point(POS.DC), team1color));

    t2.push(createPlayer.call(this, new Paper.Point(20, 30), team2color));
    t2.push(createPlayer.call(this, new Paper.Point(40, 30), team2color));
    t2.push(createPlayer.call(this, new Paper.Point(60, 30), team2color));
    t2.push(createPlayer.call(this, new Paper.Point(80, 30), team2color));
    t2.push(createPlayer.call(this, new Paper.Point(100, 30), team2color));
    t2.push(createPlayer.call(this, new Paper.Point(120, 30), team2color));
    t2.push(createPlayer.call(this, new Paper.Point(140, 30), team2color));
}

function createPlayer(position, color) {
    var j = new Paper.Path.Circle({
        center: position,
        radius: 7
    });
    j.fillColor = color;
    j.draggable = true;
    return j;
}

function renderTerrain(x, y, longueur, largeur) {
    var longueur = longueur;
    var largeur = largeur;

    var offsetLeft = x;
    var offsetTop = y;

    // Le terrain
    var rect = new Paper.Rectangle(new Paper.Point(offsetLeft, offsetTop), new Paper.Size(longueur, largeur));
    var terrain = new Paper.Path.Rectangle(rect);
    terrain.strokeColor = 'black';

    // La zone de gauche
    var zoneRayon = largeurRatio(60, largeur);
    var largeurCage = largeurRatio(30, largeur);
    var longueurCage = longueurRatio(20, longueur);
    var zoneLargeurTotal = zoneRayon * 2 + largeurCage;
    var zoneRect = new Paper.Rectangle(new Paper.Point(offsetLeft -zoneRayon, offsetTop + (largeur - zoneLargeurTotal) / 2), new Paper.Size(zoneRayon*2, zoneLargeurTotal));
    var radius = new Paper.Size(zoneRayon);
    var zoneGauche = new Paper.Path.RoundRectangle(zoneRect, radius);
    zoneGauche.removeSegment(0);
    zoneGauche.removeSegment(0);
    zoneGauche.removeSegment(0);
    zoneGauche.removeSegment(0);
    zoneGauche.fillColor = 'yellow';
    zoneGauche.strokeColor = 'black';

    // La zone de droite
    var zoneDroiteRect = zoneRect.clone();
    zoneDroiteRect.left += longueur;
    zoneDroiteRect.right += longueur;
    var zoneDroite = new Paper.Path.RoundRectangle(zoneDroiteRect, radius);
    zoneDroite.removeSegment(4);
    zoneDroite.removeSegment(4);
    zoneDroite.removeSegment(4);
    zoneDroite.removeSegment(4);
    zoneDroite.fillColor = 'yellow';
    zoneDroite.strokeColor = 'black';

    // Les 9m de gauche
    var neufMRayon = largeurRatio(90, largeur);
    var neufMLargeutTotal = neufMRayon * 2 + largeurCage;
    var neufMGaucheRect= new Paper.Rectangle(new Paper.Point(offsetLeft - neufMRayon, offsetTop + (largeur - neufMLargeutTotal) / 2), new Paper.Size(neufMRayon * 2, neufMLargeutTotal));
    radius = new Paper.Size(neufMRayon);
    var neufMGauche = new Paper.Path.RoundRectangle(neufMGaucheRect, radius);
    neufMGauche.removeSegment(0);
    neufMGauche.removeSegment(0);
    neufMGauche.removeSegment(0);
    neufMGauche.removeSegment(0);
    neufMGauche.strokeColor = 'black';

    // Les 9m de droite
    var neufMDroiteRect = neufMGaucheRect.clone();
    neufMDroiteRect.left += longueur;
    neufMDroiteRect.right += longueur;
    var neufMDroite = new Paper.Path.RoundRectangle(neufMDroiteRect, radius);
    neufMDroite.removeSegment(4);
    neufMDroite.removeSegment(4);
    neufMDroite.removeSegment(4);
    neufMDroite.removeSegment(4);
    neufMDroite.strokeColor = 'black';

    // Ligne de 7m de gauche
    var distance = 70 * longueur / 400;
    var longeurSeptM = 20 * largeur / 200;
    var septMGauche = new Paper.Path(new Paper.Point(offsetLeft + distance, offsetTop + (largeur / 2) - (longeurSeptM / 2)), new Paper.Point(offsetLeft + distance, offsetTop + (largeur / 2) + (longeurSeptM / 2)));
    septMGauche.strokeColor = 'black';

    // Ligne de 7m de droite
    var septMDroite = new Paper.Path(new Paper.Point(offsetLeft + longueur - distance, offsetTop + (largeur / 2) - (longeurSeptM / 2)), new Paper.Point(offsetLeft + longueur - distance, offsetTop + (largeur / 2) + (longeurSeptM / 2)));
    septMDroite.strokeColor = 'black';

    // Ligne mediane
    var mediane= new Paper.Path(new Paper.Point(offsetLeft + (longueur / 2), offsetTop), new Paper.Point(offsetLeft + (longueur / 2), largeur + offsetTop));
    mediane.strokeColor = 'black';

    // Cage gauche
    var topLeft = {
        x: offsetLeft - longueurCage,
        y: offsetTop + (largeur / 2) - (largeurCage / 2)
    }
    var cageGaucheRect = new Paper.Rectangle(new Paper.Point(topLeft), new Paper.Size(longueurCage, largeurCage));
    var cageGauche = new Paper.Path.Rectangle(cageGaucheRect);
    cageGauche.strokeColor = 'black';

    // Cage droite
    var cageDroiteRect = cageGaucheRect.clone();
    cageDroiteRect.left += longueur + longueurCage;
    cageDroiteRect.right += longueur + longueurCage;
    var cageDroite = new Paper.Path.Rectangle(cageDroiteRect);
    cageDroite.strokeColor = 'black';

    var rect = new Paper.Rectangle(new Paper.Point(0, 0), new Paper.Point(offsetLeft + longueur + 10, offsetTop - 1));
    var p = new Paper.Path.Rectangle(rect);
    p.fillColor = 'white';

    rect = new Paper.Rectangle(new Paper.Point(0, offsetTop + largeur + 1), new Paper.Point(offsetLeft + longueur + 10, offsetTop + largeur + 20));
    p = new Paper.Path.Rectangle(rect);
    p.fillColor = 'white';
}