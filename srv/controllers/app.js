var storage = require('node-persist');

storage.initSync({
    dir: '../data'
});

module.exports = {
    index: function(req, res) {
        res.sendfile( __dirname + '/../views/index.html', {root: '/'});
    },

    allCombi: function(req, res) {
        res.json(storage.getItem('combis'));
    },

    saveCombi: function(req, res) {
        var body = '';
        req.on('data', function(data) {
            body += data;
        });

        req.on('end', function() {
            var params = JSON.parse(body);
            var combis = storage.getItem('combis') || [];
            var id = combis.length;
            params.id = id;

            var unique = combis.filter(function(combi) {
                return combi.name === params.name;
            });

            if (unique.length === 0) {
                combis.push(params);
                storage.setItem('combis', combis);
            } else {
                res.json(500, {error: "une combinaison avec ce nom existe déjà"});
            }
        });
    },

    getCombi: function(req, res) {
        var combiId = req.params.combiId;
        console.log('Get the combi with id ' + combiId);
    },

    deleteCombi: function(req, res) {
        req.params.id



        console.log('Delete the combi with id ' + combiId);
    }
};