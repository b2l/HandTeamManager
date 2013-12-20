var _ = require('../lib/underscore-1.5.2.js');

function UsersView(element, modelPromise) {
    this.$el = document.querySelector(element);
    this.preRender();

    modelPromise.then(function(users) {
        this.model = users;
        this.render();
    }.bind(this));
}

UsersView.prototype.preRender = function() {
    this.$el.innerHTML = "Loading data...";
};

UsersView.prototype.destroy = function() {
    this.unbind();
    this.$el = null;
    this.model = null;
}

UsersView.prototype.render = function() {
    var tplContent = document.getElementById('users-template').innerHTML;
    var tpl = _.template(tplContent);
    this.$el.innerHTML = tpl({_users: this.model.models});
    this.bindEvents();
};

UsersView.prototype.displayAddUserForm = function () {
    this.$el.querySelector('.add-form').classList.remove('height0');
};
UsersView.prototype.hideAddUserForm = function() {
    this.$el.querySelector('.add-form').classList.add('height0');
};

/* DOM EVENT HANDLER */
UsersView.prototype.bindEvents = function () {
    Gator(this.$el).on('click', '.add', this.showAddHandler.bind(this));
    Gator(this.$el).on('click', '.add-form .cancel', this.cancelAddHandler.bind(this));
    Gator(this.$el).on('submit', '.add-form', this.addUserHandler.bind(this));
};
UsersView.prototype.unbind = function() {
    Gator(this.$el).off();
};

UsersView.prototype.showAddHandler = function(e) {
    this.displayAddUserForm();
};

UsersView.prototype.cancelAddHandler = function(e) {
    this.hideAddUserForm();
};

UsersView.prototype.addUserHandler = function(e) {
    e.preventDefault();
    var user = {
        login: e.target.querySelector('[name="login"]').value,
        password: e.target.querySelector('[name="password"]').value
    };
    this.model.add(user);
};

module.exports = UsersView;
