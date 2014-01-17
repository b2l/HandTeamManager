var IDB = require('../lib/IDB');
var Q = require('q');

var DB_NAME = 'hand-team-manager';

function Team(name) {
    this.name = name;
    this.dataStore = new IDB({dbName: DB_NAME});
}

Team.create = function(name) {
    return new Team(name);
};

Team.all = function(cb) {
    var deferred = Q.defer();
    var store = new IDB({dbName: DB_NAME});
    store.all('team').then(function(items) {
        deferred.resolve(items);
    });

    return deferred.promise;
}

Team.prototype.save = function() {
    var deferred = Q.defer();

    this.dataStore.create('team', this.expose()).then(function(newItemId) {
        this.id = newItemId;
        deferred.resolve(this);
    });

    return deferred.promise;
};

Team.prototype.expose = function() {
    return {
        name: this.name
    };
};



module.exports = Team;