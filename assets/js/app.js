var page = require('page');

var XHR = require('./lib/xhr');

var applicationController = require('./controllers/application');
var teamController = require('./controllers/team');
var combisController = require('./controllers/combis');

page('/',                                   getUser, applicationController.index);

page('/team*', getUser);

page('/team/create',                        teamController.create.bind(teamController));
page('/team/:team/edit',                    teamController.update.bind(teamController));
page('/team/:team/delete',                  teamController.del.bind(teamController));
page('/team/:team/addMembers',              teamController.addMembers.bind(teamController));
page('/team/:team/removeMembers',           teamController.removeMembers.bind(teamController))

page('/team/:team/combis',                  combisController.index.bind(combisController));
page('/team/:team/combis/create',           combisController.create.bind(combisController));
page('/team/:team/combis/:combis',          combisController.read.bind(combisController));
page('/team/:team/combis/:combis/edit',     combisController.update.bind(combisController));
page('/team/:team/combis/:combis/delete',   combisController.del.bind(combisController));

page('/team/:team',                         teamController.read.bind(teamController));
page('/team',                               teamController.index.bind(teamController));

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

if (window.location.hostname === 'localhost') {
    var clearBtn = document.createElement('button');
    clearBtn.innerHTML = 'clear db';
    clearBtn.setAttribute('id', 'clear-db');
    document.querySelector('.header').appendChild(clearBtn);
    clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var IDB = require('./lib/IDB');
        var iDB = new IDB('hand-team-manager');
        iDB.clear('team');
    }, false);
}