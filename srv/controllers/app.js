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
    },

    createUserFromInvitation: function(req, res) {
        var teamName = req.params.teamName;
    },

    sendInvite: function(req, res) {
        var body = req.body;
        var teamName = body.teamName;
        var mails = body.mails;
        var link = 'http://localhost:3000/invite/' + teamName;
        console.log('sending invitation mail to : ' + mails.join(', '));


        var mailer = require('nodemailer');
        var transport = mailer.createTransport('SMTP', {
            host: 'smtp.free.fr',
            port: 587,
            secureConnection: false
        });

        transport.sendMail({
            to: mails.join(', '),
            from: 'noreply@ling.fr',
            subject: "Hand Team Manager - Rejoignez votre équipe",
            text: "Votre coach vous invite à rejoindre votre équipe sur Hand Team Manager, copier le lien suivant puis coller le dans la barre d'adresse de votre navigateur : " + link,
            html: "<h2>Hand Team Manager</h2> <p>Votre coach vous invite à rejoindre votre équipe, cliquer sur le lien suivant : <a href='" + link + "'>" + link + "</a></p>"
        }, function(error, response) {
            if (error) {
                console.log(error);
                return;
            }

            console.log(response);
        });
        res.json({success: 'Invitations send with success'});
    }
};
