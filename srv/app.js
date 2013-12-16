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
        return done(null, profile)
    })
);
passport.use(
    new TwitterStrategy({
        consumerKey: "WcDW8EIiWE9XLia0MT3nqw",
        consumerSecret: "OQzV7AhPoHaPPbfk6J25sJEzWcEezq92MEXi05XQqvw",
        callbackURL: "http://localhost:3000/auth/twitter/return"
    },function(token, tokenSecret, profile, done) {
        done(null, profile);
    })
);

/** CREATE SERVER */
var express = require('express');
var app = express();

/** MIDDLEWARE */
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

/** ROUTES */
app.get('/', ensureAuthenticated, controller.index);
app.get('/combis', ensureAuthenticated, controller.allCombi);
app.post('/combis', ensureAuthenticated, controller.saveCombi);
app.del('/combis/:id', ensureAuthenticated, controller.deleteCombi);

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

app.listen(process.env.PORT || 3000);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}