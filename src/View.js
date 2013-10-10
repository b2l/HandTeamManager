var Microee = require('microee');

/* -------------------------------------------- */
/*              VIEW CLASS                      */
/* -------------------------------------------- */

function View() {
    this.children = [];
    this.events = {};
    this.$el = null;
    this.template = null;
}
View.prototype.addEvent = function(eventType, selector, callback) {
    var elmt = document.querySelector(this.$el);
    if (!selector) {
        Gator(elmt).on(eventType, callback.bind(this));
    } else {
        Gator(elmt).on(eventType, selector, callback.bind(this));
    }
};
View.prototype.removeEvent = function(eventType, selector, callback) {
    var elmt = document.querySelector(this.$el);
    Gator(elmt).off(eventType, selector, callback.bind(this));
};
View.prototype._unbind = function() {
    var elmt = document.querySelector(this.$el);
    Gator(elmt).off();
};
View.prototype.render = function() {
    this._unbind();
    for (var eventType in this.events) {
        for (var selector in this.events[eventType]) {
            var callback = this.events[eventType][selector];
            this.addEvent(eventType, selector, callback);
        }
    }

    if (this._render) {
        this._render();
    } else {
        this.children.forEach(function(childView) {
            childView.view.render();
        });
    }
    if (this.bind) {
        this.bind();
    }
};

View.prototype.addView = function(label, view) {
    this.children.push({label: label, view: view});
};

View.prototype.getView = function(label) {
    var matches = this.children.filter(function(childView) {
        return label === childView.label;
    });

    return matches ? matches[0].view : null;
};

Microee.mixin(View);

module.exports = View;