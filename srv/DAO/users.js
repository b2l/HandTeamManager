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

            deferred.resolve(db.collection('users'));
        });
        return deferred.promise;
    },
    find: function(query) {
        var deferred = Q.defer();
        this.getCollection().then(function(collection) {
            collection.find(query).toArray(function(err, items) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(items);
                }
            });
        });

        return deferred.promise;
    },
    getAll: function() {
        var deferred = Q.defer();
        this.getCollection().then(function(collection) {
            collection.find().toArray(function(err, items) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(items);
                }
            });
        });

        return deferred.promise;
    },
    save: function(user) {
        var deferred = Q.defer();

        this.getCollection().then(function(collection) {
            collection.count(function(err, nbUser) {
                if (nbUser === 0 ){
                    user.admin = true;
                }

                collection.find({login: user.login}).toArray(function(err, result) {
                    if (result.length > 0) {
                        collection.update({user: user.login}, user, function(err, result) {
                            if (err) {
                                deferred.reject(err);
                            } else {
                                deferred.resolve(result);
                            }
                        });
                    } else {
                        collection.insert(user, function(err, result) {
                            if (err) {
                                deferred.reject(err);
                            } else {
                                deferred.resolve(result);
                            }
                        });
                    }
                });
            });


        });

        return deferred.promise;
    },
    remove: function(userId) {
        var deferred = Q.defer();
        this.getCollection().then(function(collection) {
            collection.remove({_id: ObjectID(userId)}, function(err, result) {
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