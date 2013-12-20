var Q = require('q');
var XHR = require('../lib/xhr');

function Users(users) {
    this.models = users || [];
}

Users.all = function() {
    var deferred = Q.defer();

    var xhr = new XHR();
    xhr.get('/users')
        .success(function(data) {
            deferred.resolve(new Users(JSON.parse(data)));
        })
        .send();


    return deferred.promise;
};

Users.prototype.add = function(user) {
    var deferred = Q.defer();

    var xhr = new XHR();
    xhr.post('/users')
        .header('Content-Type', 'application/json')
        .success(function(data) {
            deferred.resolve(data);
        })
        .send(user);

    return deferred.promise;
};

module.exports = Users;