var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var EE = require('events').EventEmitter;

var Events = new EE();
Events.setMaxListeners(0);

var db = {
    connect: function() {
        var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || "mongodb://localhost:27017/hand";

        MongoClient.connect(mongoUri, function(err, db) {
            if (err) {
                Events.emit('db.err', err);
            } else {
                Events.emit('db.connected', db);
            }
        });
    },
    find: function(collection) {
        Events.on('db.connected', function callback(db) {
            var coll = db.collection(collection);
            coll.find().toArray(function (err, items) {
                if (err) {
                    Events.emit('db.err', err);
                } else {
                    Events.emit('db.found', items);
                }
            });

            Events.removeListener('db.connected', callback);
        });
        this.connect();
    },
    insert: function(item, collection) {
        Events.on("db.connected", function callback(db) {
            var coll = db.collection(collection);
            coll.insert(item, function(err, result) {
                if (err) {
                    Events.emit('db.err', err);
                } else {
                    Events.emit('db.inserted', result[0]);
                }
            });

            Events.removeListener('db.connected', callback);
        });
        this.connect();
    },
    remove: function(id, collection) {
        Events.on("db.connected", function callback(db) {
            var coll = db.collection(collection);
            coll.remove({_id: ObjectID(id)}, function(err, result) {
                if (err) {
                    Events.emit('db.err', err);
                } else {
                    console.log('removed');
                    Events.emit('db.removed');
                }
            });

            Events.removeListener('db.connected', callback);
        });
        this.connect();
    }
};

module.exports = {
    showLoginForm: function(req, res) {
        res.sendfile( __dirname + '/../views/login.html', {root: '/'});
    },
    login: function(req, res) {
        res.redirect('/');
    },

    index: function(req, res) {
        res.sendfile( __dirname + '/../views/index.html', {root: '/'});
    },

    allCombi: function(req, res) {
        Events.on('db.found', function onSuccess(combis) {
            res.json(combis);

            Events.removeListener('db.found', onSuccess);
        });
        Events.on("db.err", function onError(err) {
            console.log(err);
            res.json(err);

            Events.removeListener('db.err', onError);
        });

        db.find('combis');
    },

    saveCombi: function(req, res) {
        var body = '';
        req.on('data', function(data) {
            body += data;
        });

        req.on('end', function() {
            var combi = JSON.parse(body);
            Events.on('db.inserted', function onSuccess(savedCombi) {
                res.json(savedCombi);

                Events.removeListener('db.inserted', onSuccess);
            });

            Events.on("db.err", function onError(err) {
                console.log(err);
                res.json(err);

                Events.removeListener   ('db.err', onError);
            });

            db.insert(combi, 'combis');
        });
    },

    getCombi: function(req, res) {
        var combiId = req.params.combiId;
    },

    deleteCombi: function(req, res) {
        var combiId = req.params.id;

        Events.on('db.removed', function onSuccess() {
            Events.removeListener('db.inserted', onSuccess);
            res.end();
        });


        Events.on("db.err", function onError(err) {
            Events.removeListener('db.err', onError);
            res.json(err);
        });

        db.remove(combiId, 'combis');
    }
};
