/* COMBINAISONS CONTROLLER */
module.exports = {
    /* GET: liste des combis */
    index: function(req) {
        console.log('combis controller index!', req);
    },

    /* POST: ajout d'une combis */
    create: function(req) {
        console.log('combis controller create!', req);
    },

    /* GET: détail d'une combis */
    read: function(req) {
        console.log('combis controller read!', req);
    },

    /* PUT: modification d'une combis */
    update: function(req) {
        console.log('combis controller update!', req);
    },

    /* DELETE: suppression d'une combis */
    del: function(req) {
        console.log('combis controller del!', req);
    }
}

