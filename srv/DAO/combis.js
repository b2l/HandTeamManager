var driver = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var Q = require('q');
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || "mongodb://localhost:27017/hand";

module.exports = {
    getCollection: function() {
        var deferred = Q.defer();

        driver.connect(mongoUri, function(err, db) {
            if (err) {
                deferred.reject(err)
            }

            deferred.resolve(db.collection('combis'));
        });
        return deferred.promise;
    },
    getAll: function() {
        return this.getCollection().then(function(collection) {
            var deferred = Q.defer();
            collection.find().toArray(function(err, items) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(items);
                }
            });
            return deferred.promise;
        });
    },
    save: function(combi) {
        return this.getCollection().then(function(collection) {
            var deferred = Q.defer();
            collection.insert(combi, function(err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        });
    },
    remove: function(id) {
        var deferred = Q.defer();

        this.getCollection().then(function(collection) {
            collection.remove({_id: ObjectID(id)}, function(err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
        });

        return deferred.promise;
    }
};