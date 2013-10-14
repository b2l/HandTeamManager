module.exports = {
    index: function() {
        console.log('serve the home page');
    },
    saveCombi: function(combi) {
        console.log('save a Combi', combi);
    },

    getCombi: function(combiId) {
        console.log('Get the combi with id ' + combiId);
    },

    deleteCombi: function(combiId) {
        console.log('Delete the combi with id ' + combiId);
    }
};