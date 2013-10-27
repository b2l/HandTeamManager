var Paper = require('./paper-full.min.js').exports;
var _ = require('./underscore-1.5.2.js');

function Terrain(paper, longueur, largeur, offsetLeft, offsetTop) {
    this.longueur = longueur;
    this.largeur = largeur;
    this.offsetLeft = offsetLeft || 0;
    this.offsetTop = offsetTop || 0;
    this.paper = paper;
};

Terrain.prototype.draw = function() {
    renderTerrain(this.offsetLeft, this.offsetTop, this.longueur, this.largeur);
    renderPlayers(this.offsetLeft, this.offsetTop, this.longueur, this.largeur);

    this.placePlayers();

    this.getItemByName('ball').position = this.getItemByName('t1DC').position.subtract(new Paper.Point(15, 0));
};

Terrain.prototype.placePlayers = function() {
    var positionAttaque = placePlayer(this.longueur, this.largeur, this.offsetLeft, this.offsetTop);

    _.each(positionAttaque, function(pos, poste) {
        return this.getItemByName("t1" + poste).position = pos;
    }, this);
};

Terrain.prototype.placeDefence = function(defenseType) {
    var positionDefense = getDefensePosition(defenseType, this.longueur, this.largeur, this.offsetLeft, this.offsetTop);

    _.each(positionDefense, function(pos, poste) {
        return this.getItemByName("t2" + poste).position = pos;
    }, this);
}

Terrain.prototype.getItemByName = function(itemName) {
    return this.paper.project.layers[0].children[itemName];
}

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

    var ball = createPlayer.call(this, new Paper.Point(160, 25), ballColor, 5);
    ball.name = 'ball';

    var t1G = createPlayer.call(this, new Paper.Point(20, 10), team1color);
    t1G.name = 't1G';
    var t1AiD = createPlayer.call(this, new Paper.Point(40, 10), team1color);
    t1AiD.name = 't1AiD';
    var t1AiG = createPlayer.call(this, new Paper.Point(60, 10), team1color);
    t1AiG.name = 't1AiG';
    var t1PV = createPlayer.call(this, new Paper.Point(80, 10), team1color);
    t1PV.name = 't1PV';
    var t1AD = createPlayer.call(this, new Paper.Point(100, 10), team1color);
    t1AD.name = 't1AD';
    var t1AG = createPlayer.call(this, new Paper.Point(120, 10), team1color);
    t1AG.name = 't1AG';
    var t1DC = createPlayer.call(this, new Paper.Point(140, 10), team1color);
    t1DC.name = "t1DC";

    var t2G = createPlayer.call(this, new Paper.Point(20, 40), team2color);
    t2G.name = 't2G'
    var t2AiD = createPlayer.call(this, new Paper.Point(40, 40), team2color);
    t2AiD.name = 't2AiD'
    var t2AiG = createPlayer.call(this, new Paper.Point(60, 40), team2color);
    t2AiG.name = 't2AiG'
    var t2PV = createPlayer.call(this, new Paper.Point(80, 40), team2color);
    t2PV.name = 't2PV'
    var t2AD = createPlayer.call(this, new Paper.Point(100, 40), team2color);
    t2AD.name = 't2AD'
    var t2AG = createPlayer.call(this, new Paper.Point(120, 40), team2color);
    t2AG.name = 't2AG'
    var t2DC = createPlayer.call(this, new Paper.Point(140, 40), team2color);
    t2DC.name = 't2DC'

}

function placePlayer(longueur, largeur, offsetLeft, offsetTop) {
    return {
        'G': {x: longueurRatio(390, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'PV': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'AiG': {x: longueurRatio(10, longueur) + offsetLeft, y: largeurRatio(190, largeur) + offsetTop},
        'AiD': {x: longueurRatio(10, longueur) + offsetLeft, y: largeurRatio(10, largeur) + offsetTop},
        'AG': {x: longueurRatio(115, longueur) + offsetLeft, y: largeurRatio(175, largeur) + offsetTop},
        'DC': {x: longueurRatio(150, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'AD': {x: longueurRatio(115, longueur) + offsetLeft, y: largeurRatio(25, largeur) + offsetTop}
    };
}

function getDefensePosition(typeDefense, longueur, largeur, offsetLeft, offsetTop) {
    var defense = {
        '1-5': {
            'G': {x: longueurRatio(0, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
            'PV': {x: longueurRatio(100, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
            'AiG': {x: longueurRatio(20, longueur) + offsetLeft, y: largeurRatio(23, largeur) + offsetTop},
            'AiD': {x: longueurRatio(20, longueur) + offsetLeft, y: largeurRatio(177, largeur) + offsetTop},
            'AG': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(45, largeur) + offsetTop},
            'DC': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(90, largeur) + offsetTop},
            'AD': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(155, largeur) + offsetTop}
        }
    }

    return defense[typeDefense] || null;
}

function createPlayer(position, color, radius) {
    radius = radius || 10;
    var j = new Paper.Path.Circle({
        center: position,
        radius: radius
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

    var rect = new Paper.Rectangle(new Paper.Point(0, 0), new Paper.Point(offsetLeft + longueur + 10, offsetTop));
    var p = new Paper.Path.Rectangle(rect);
    p.fillColor = 'white';

    rect = new Paper.Rectangle(new Paper.Point(0, offsetTop + largeur), new Paper.Point(offsetLeft + longueur + 10, offsetTop + largeur + 20));
    p = new Paper.Path.Rectangle(rect);
    p.fillColor = 'white';
}

module.exports = Terrain;
