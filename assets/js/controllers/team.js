/* TEAM CONTROLLER */
var tpl = require('../lib/_template').tpl;

var $wrapper = document.getElementById('content');
module.exports = {
    /* GET: List des équipes */
    index: function(req) {
        console.log('team controller index!', req);
    },

    /* POST: Ajout d'ume équipe */
    create: function(req) {
        console.log('team controller create!', req);
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

