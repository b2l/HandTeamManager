var page = require('page');

var AppView= require('./views/app');
var StrategieView = require('./views/strategie');
var TeamView = require('./views/team');
var UsersView = require('./views/users');
var Users = require('./models/users');
var XHR = require('./lib/xhr');

var currentView = null;

function clean(ctx, next) {
    if (currentView) {
        currentView.destroy.call(currentView);
        next();
    }
}

function transition(ctx, next) {
    next();
}

function index(ctx) {
    currentView = new AppView('#app-wrapper');
    currentView.render();
}

function combis(ctx) {
    var xhr = new XHR();
    currentView = new StrategieView('#content');
    xhr.get('/combis').success(function(data) {
        if (data.length > 0)
            currentView.setModel(JSON.parse(data));
        else
            currentView.setModel();
    }).send();
}

function team(ctx) {
    currentView = new TeamView('#content');
    currentView.render();
}

function users(ctx) {
    currentView = new UsersView('#content', Users.all());
}

page('/', index);
page('/team', team);
page('/_combis', combis);
page('/_users', users);
page('*', transition);
page('*', clean);
page();