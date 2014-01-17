/* TEAM CONTROLLER */
var Team = require('../models/Team');
var TeamView = require('../views/TeamView');
module.exports = {
    view: new TeamView(Team.all()),

    /* GET: List des équipes */
    index: function(req) {
        this.view.render();
    },

    /* POST: Ajout d'ume équipe */
    create: function(req) {
        var team = Team.create(JSON.parse(req.state.formData).name);
        var that = this;
        team.save().then(function() {
            req.page('/team');
        });
    },

    /* GET: détail d'une équipe */
    read: function(req) {
        console.log('team controller read!', req);
    },

    /* PUT: modif d'une équipe */
    update: function(req) {
        console.log('team controller update!', req);
    },

    /* DELETE: suppression d'une équipe */
    del: function(req) {
        console.log('team controller del!', req);
    },

    /* POST: ajout de membre(s) */
    addMembers: function(req) {
        console.log('team controller addMembers!', req);
    },

    /* DELETE: suppression d'un membre */
    removeMembers: function(req) {
        console.log('team controller removeMembers!', req);
    }
}

