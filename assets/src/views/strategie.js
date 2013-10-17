var View = require('../View.js');
var _ = require('../lib/underscore-1.5.2.js');
var Paper = require('../lib/paper-full.min.js').exports;
var Terrain = require('../lib/paperjs-tool.js');
var XHR = require('../lib/xhr');

StrategieView.prototype = new View();
StrategieView.constructor = StrategieView;
function StrategieView(selector) {
    this.$el = selector
    this.dragItem = null;
    this.recording = false;
    this.paper;
    this.combi = [];
    this.tool;
    this.playersNode = null;
    this.playing = false;

    this.events = {
        'click': {
            '.record': this.record,
            '.save': this.saveCombi,
            '.combi': this.play
        }
    };
}

StrategieView.prototype.setModel = function setModel(model) {
    this.combis = model;
    this.render();
};

StrategieView.prototype._render = function() {
    var tplContent = document.getElementById('strat-template').innerHTML;
    var tpl = _.template(tplContent);
    document.querySelector(this.$el).innerHTML = tpl({combis: this.combis});

    var canvas = document.getElementById('canvas-compo');

    this.paper = new Paper.PaperScope();
    this.paper.setup(canvas);

    this.terrain = new Terrain(this.paper, 1200, 600, 100, 100);
    this.terrain.draw();
    this.terrain.placeDefence('1-5');

    this.tool = new Paper.Tool();

    this.tool.onMouseDown = this.paperOnMouseDown.bind(this);

    this.tool.onMouseDrag = this.paperOnMouseDrag.bind(this);

    this.tool.onMouseUp = this.paperOnMouseUp.bind(this);

    this.paper.view.onFrame = this.paperOnFrame.bind(this);
};

StrategieView.prototype.paperOnMouseDown = function(e) {
    if (e.item && e.item.draggable ) {
        this.dragItem = e.item;
    }
};

StrategieView.prototype.paperOnMouseDrag = function(e) {
    if (this.dragItem) {
        var ball = this.getItemByNodeName('ball');

        if (this.dragItem !== ball) {
            var intersections = this.dragItem.getIntersections(ball);

            if (intersections.length > 0 ) {
                var vector = ball.position.subtract(this.dragItem.position);
            }
        }

        this.dragItem.position = e.middlePoint;

        if (vector) {
            ball.position = this.dragItem.position.add(vector);
        }
        if (this.recording) {
            this.combi.push({
                x: e.middlePoint.x,
                y: e.middlePoint.y,
                name: this.dragItem.name
            });

            var ballPos = this.getItemByNodeName('ball').position;
            this.combi.push({
                x: ballPos.x,
                y: ballPos.y,
                name: 'ball'
            });

        }
    }
};

StrategieView.prototype.paperOnMouseUp = function(e) {
    this.dragItem = null;
};

StrategieView.prototype.paperOnFrame = function(e) {
    if (this.combi && this.combi.length > 0 && this.playing) {
        this._play();
    }
};

StrategieView.prototype.record = function() {
    this.recording = !this.recording;

    if (!this.recording) {
        sessionStorage.setItem('combi', JSON.stringify(this.combi));
        this.renderSaveBox();
    } else {
        sessionStorage.removeItem('combi');
    }
};

StrategieView.prototype.play = function(e) {
    this.terrain.placePlayers();
    this.terrain.placeDefence('1-5');

    this.combi = this.combis.filter(function(combi) {
        console.log(Number(combi.id), Number(e.target.getAttribute('data-combi-id')));
        return Number(combi.id) === Number(e.target.getAttribute('data-combi-id'));
    })[0].combi.slice(0);
    this.playing = true;
};

StrategieView.prototype.getItemByNodeName = function(nodeName) {
    return this.paper.project.layers[0].children[nodeName];
};

StrategieView.prototype._play = function() {
    var step = this.combi.shift();
    var item = this.getItemByNodeName(step.name);
    item.position = new Paper.Point(step.x, step.y);

    if (this.combi.length === 0) {
        this.playing = false;
    }

    step = this.combi.shift();
    item = this.getItemByNodeName(step.name);
    item.position = new Paper.Point(step.x, step.y);
};

StrategieView.prototype.renderSaveBox = function renderSaveBox() {
    document.querySelector(this.$el + ' .save-box').style.display = "block";
};

StrategieView.prototype.saveCombi = function saveCombi(e) {
    var xhr = new XHR();
    var name = document.querySelector(this.$el + " input[name='name']").value;
    var data = {
        name: name,
        combi: this.combi
    };
    xhr.post('/combis').success(
        function(xhrData) {
            console.log('Combi saved');
        }
    ).send(data);
};

module.exports = StrategieView;