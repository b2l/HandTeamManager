var Microee = require('microee');
var _ = require('./lib/underscore-1.5.2.js');

/* -------------------------------------------- */
/*             MODEL CLASS                      */
/* -------------------------------------------- */

function Model() {};
Model.prototype.save = function() {
    this.emit('saved');
};

Microee.mixin(Model);

/* -------------------------------------------- */
/*            MODEL LIST CLASS                  */
/* -------------------------------------------- */
function ModelList() {
    this.models = [];
}
ModelList.prototype.load = function() {};
ModelList.prototype.add = function(model) {
    this.models.push(model);
};
ModelList.prototype.forEach = function(fn) {
    this.models.forEach(fn);
};
ModelList.prototype.getById = function(id) {
    var matches = _.filter(this.models, function(model) {
        return Number(id) === Number(model.id);
    });

    return matches ? matches[0] : null;
};

Microee.mixin(ModelList);

module.exports = {
    ModelList: ModelList,
    Model: Model
};