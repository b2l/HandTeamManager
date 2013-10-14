var View = require('../View.js');
var _ = require('../lib/underscore-1.5.2.js');
var Paper = require('../lib/paper-full.min.js').exports;
var Terrain = require('../lib/paperjs-tool.js');

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

    this.events = {
        'click': {
            '.record': this.record,
            '.play': this.play
        }
    };
}


StrategieView.prototype._render = function() {
    var tplContent = document.getElementById('strat-template').innerHTML;
    var tpl = _.template(tplContent);
    document.querySelector(this.$el).innerHTML = tpl();

    var canvas = document.getElementById('canvas-compo');

    this.paper = new Paper.PaperScope();
    this.paper.setup(canvas);

    var terrain = new Terrain(this.paper, 1200, 600, 100, 100);
    terrain.draw();
    terrain.placeDefence('1-5');

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
        }
    }
};

StrategieView.prototype.paperOnMouseUp = function(e) {
    this.dragItem = null;
};

StrategieView.prototype.paperOnFrame = function(e) {
    if (this.combi.length > 0 && !this.recording) {
        this._play();
    }
};

StrategieView.prototype.record = function() {
    this.recording = !this.recording;

    if (!this.recording) {
        sessionStorage.setItem('combi', JSON.stringify(this.combi));
    } else {
        sessionStorage.removeItem('combi');
    }
};

StrategieView.prototype.play = function() {
    this.combi = JSON.parse(sessionStorage.getItem('combi'));
};

StrategieView.prototype.getItemByNodeName = function(nodeName) {
    return this.paper.project.layers[0].children[nodeName];
}

StrategieView.prototype._play = function() {
    var step = this.combi.shift();
    var item = this.getItemByNodeName(step.name);
    item.position = new Paper.Point(step.x, step.y);
}
module.exports = StrategieView;