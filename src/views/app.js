var View = require('../View.js');
var _ = require('../lib/underscore-1.5.2.js');

AppView.prototype = new View();
AppView.constructor = AppView;
function AppView(selector) {
    this.$el = selector;
    this.template = 'app-template'
}

AppView.prototype._render = function() {
    var tpl = document.getElementById(this.template).innerHTML;
    var html = _.template(tpl)();
    document.querySelector(this.$el).innerHTML = html;
};

module.exports = AppView;
