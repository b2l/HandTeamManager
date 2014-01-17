var page = require('page');
var tpl = require('../lib/_template').tpl;

function TeamView(modelPromise) {

    modelPromise.then(function(model) {
        this.model = model;
        this.bindModelEvent();
        this.render();
    }.bind(this));
}

TeamView.prototype.bindModelEvent = function() {
    this.model.on('change', function(model) {
        this.model = model;
        this.render();
    });
};

TeamView.prototype.render = function() {
    var $wrapper = document.getElementById('content');
    var data = {teams: this.model};

    /* Extraire dans la vue */
    $wrapper.innerHTML = tpl('team-list-tpl', data);
    $wrapper.innerHTML += tpl('create-team', {});
    $wrapper.querySelector('form').addEventListener('submit', function(e) {
        e.preventDefault();
        var data = {
            name: e.target.querySelector('[name="team-name"]').value
        };
        page('/team/create', {formData: JSON.stringify(data)});

    }, false);
}

module.exports = TeamView;