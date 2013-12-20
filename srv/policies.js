var UsersDAO = require('./DAO/users');
module.exports = {
    isAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login')
    },
    isAdmin: function(req, res, next) {
        UsersDAO.find({login: req.user.login}).then(function(user) {
            if (user[0].admin) {
                next();
            } else {
                // 403 forgiven
                res.send(403);
            }
        }).fail(function(reason) {
            res.send(500, reason);
        });
    },
    isCoach: function(req, res, next) {
        UsersDAO.find({login: req.user.login}).then(function(user) {
            if (user[0].coach || user[0].admin) {
                next();
            } else {
                // 403 forgiven
                res.send(403);
            }
        }).fail(function(reason) {
            res.send(500, reason);
        });
    },

    canViewCombi: function(req, res, next) {
        var team = req.params.team;
        var user = UsersDao.findByLogin(req.user.login).then(function() {
            if (user.team === team) {
                next()
            } else {
                res.send(403);
            }
        });
    }
}