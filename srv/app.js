/** AUTH */
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(
    new GoogleStrategy({
        returnURL: 'http://localhost:3000/auth/google/return',
        realm: 'http://localhost:3000'
    }, function(identifier, profile, done) {
        profile.identifier = identifier;
        var user = createOrGetUserFromGoogle(profile);
        return done(null, user)
    })
);
passport.use(
    new TwitterStrategy({
        consumerKey: "WcDW8EIiWE9XLia0MT3nqw",
        consumerSecret: "OQzV7AhPoHaPPbfk6J25sJEzWcEezq92MEXi05XQqvw",
        callbackURL: "http://localhost:3000/auth/twitter/return"
    },function(token, tokenSecret, profile, done) {
        var user = createOrGetUserFromTwitter(profile);
        done(null, user);
    })
);

/** CREATE SERVER */
var express = require('express');
var app = express();

/** MIDDLEWARE */
// Data as json
app.use(express.json());
app.use(express.urlencoded());
// Gzip
app.use(express.compress());
// Method override
app.use(express.methodOverride());
// Cookie
app.use(express.cookieParser());
// Session
app.use(express.session({secret: 'The hand team manager'}));
// Static
app.use('/public', express.static(__dirname + '/../public/'));
// Authentication
app.use(passport.initialize());
app.use(passport.session());

var controller = require('./controllers/app');
var policies = require('./policies');

/** ROUTES */

/* Combinaisons API */
app.get('/', controller.index);
app.get('/combis', policies.isAuthenticated, controller.allCombi);
app.post('/combis', policies.isAuthenticated, controller.saveCombi);
app.del('/combis/:id', policies.isAuthenticated, controller.deleteCombi);

/* Équipe API */
var teamRoutes = {
    'GET /teams': 'Listes des équipes',

    'GET /teams/:teamName': "Information sur l'équipe",
    'PUT /teams/:teamName': "Mise à jour des données de l'équipe",
    'DELETE /teams/:teamName': "Supprime l'équipe",

    'GET /teams/:teamName/members': 'Listes des membres',
    'POST /teams/:teamName/members': 'Ajout de membres',
    'DELELE /teams/:teamName/members': 'Supprime un membre'
};
var userRoutes = {
    /* As user */
    'GET /users/me': "affiche le profile de l'utilisateur",
    'PUT /users/me': "Mise à jour des données de l'utilisateur",

    /* As admin */
    'GET /users': 'Affice la liste des utilisateurs',
    'POST /users': 'Ajoute un utilisateur',
    'PUT /users/:id': 'Modifie un utilisateur',
    'DELETE /users/:id': 'Supprime un utilisateur'
};

app.post('/team/invite', policies.isCoach, controller.sendInvite);

app.get('/users', [policies.isAuthenticated, policies.isAdmin], function(req, res) {
    UsersDAO.getAll().then(function(users) {
        res.json(users);
    }).fail(function(reason) {
        res.json(reason);
    });
});
app.get('/user', function(req, res) {
    if (req.isAuthenticated())
        res.json(req.user)
    else
        res.send(403);
});

app.post('/users', [policies.isAuthenticated, policies.isAdmin], function(req, res) {
    console.log(req.body);
});

app.get('/invite/:teamName', controller.createUserFromInvitation);

app.get('/login', controller.showLoginForm);

app.get('/auth/google', passport.authenticate('google', {failureRedirect: '/login'}), function(req, res) {
    res.redirect('/');
});
app.get('/auth/google/return', passport.authenticate('google', {failureRedirect: '/login'}), function(req, res) {
    res.redirect('/');
});

app.get('/auth/twitter', passport.authenticate('twitter', {failureRedirect: '/login'}), function(req, res) {
    res.redirect('/');
});
app.get('/auth/twitter/return', passport.authenticate('twitter', {failureRedirect: '/login'}), function(req, res) {
    res.redirect('/');
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

/** A dégager dans un service de login, pour créer le profile adapter a la volé */
var UsersDAO = require('./DAO/users');
function createOrGetUserFromGoogle(profile) {
    var user = {
        login: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName
    };

    UsersDAO.save(user);
    return user;
}
function createOrGetUserFromTwitter(profile) {
    var user = {
        login: profile.username,
        firstName: profile.displayName.split(' ')[0],
        lastName: profile.displayName.split(' ')[1]
    };

    UsersDAO.save(user);
    return user;
}

app.listen(process.env.PORT || 3000);

/* REST API */
//var prefix = "/rest";
//
//// --- users
//app.get(prefix+'/user', function(req,res) {});
//app.get(prefix+'/users', function(req,res) {});
//
//// --- team
//var teamPrefix = prefix+'/teams';
//app.get(teamPrefix, function(req,res) {}); // list
//app.post(teamPrefix, function(req,res) {}); // create
//app.get(teamPrefix + '/:team', function(req, res) {})
//app.put(teamPrefix + '/:team', function(req,res) {}); // update
//app.del(teamPrefix + '/:team', function(req,res) {}); // delete
//
//// --- team members
//app.get(teamPrefix + '/:team/members', function(req,res) {}); // list
//app.post(teamPrefix + '/:team/members', function(req,res) {}); // create
//app.del(teamPrefix + '/:team/members/:members', function(req,res) {}); // delete
//
//// --- combis
//var combisPrefix = teamPrefix + '/:team/combis';
//app.get(combisPrefix, function(req,res) {}); // list
//app.post(combisPrefix, function(req,res) {}); // create
//app.get(combisPrefix + '/:combis', function(req,res) {}); // read
//app.put(combisPrefix + '/:combis', function(req,res) {}); // update
//app.del(combisPrefix + '/:combis', function(req,res) {}); // delete
