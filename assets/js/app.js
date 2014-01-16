var page = require('page');

var XHR = require('./lib/xhr');

var applicationController = require('./controllers/application');
var teamController = require('./controllers/team');
var combisController = require('./controllers/combis');

page('/',                                   getUser, getPage, applicationController.index);

page('/team/*', getUser, getPage);

page('/team/create',                        teamController.create);
page('/team/:team/edit',                    teamController.update);
page('/team/:team/delete',                  teamController.del);
page('/team/:team/addMembers',              teamController.addMembers);
page('/team/:team/removeMembers',           teamController.removeMembers)

page('/team/:team/combis',                  combisController.index);
page('/team/:team/combis/create',           combisController.create);
page('/team/:team/combis/:combis',          combisController.read);
page('/team/:team/combis/:combis/edit',     combisController.update);
page('/team/:team/combis/:combis/delete',   combisController.del);

page('/team/:team',                         teamController.read);
page('/team',                               teamController.index);

function getPage(req, next) {
    req.page = page;
    next();
}

function getUser(req, next) {
    if (getUser.user) {
        req.user = getUser.user;
    }
    if(undefined === req.user) {
        new XHR().get('/user')
            .success(function(data) {
                getUser.user = req.user = JSON.parse(data);
                next();
            })
            .error(function(data) {
                next();
            })
            .send();
    } else {
        next();
    }
};

page();