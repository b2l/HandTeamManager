var CombisDAO = require('../DAO/combis');

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
        CombisDAO.getAll().then(function(combis) {
            res.json(combis);
        }).fail(function(reason) {
            res.json(reason)
        });
    },

    saveCombi: function(req, res) {
        var body = '';
        req.on('data', function(data) {
            body += data;
        });

        req.on('end', function() {
            var combi = JSON.parse(body);
            CombisDAO.save(combi).then(function(result) {
                res.json(result[0]);
            }).fail(function(reason) {
               res.json(reason);
            });
        });
    },

    deleteCombi: function(req, res) {
        var combiId = req.params.id;

        CombisDAO.remove(combiId).then(function(removedCombi) {
            res.json(removedCombi);
        }).fail(function(reason) {
            res.json(reason);
        });
    }
};
