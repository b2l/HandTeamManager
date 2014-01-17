/* APPLICATION CONTROLLER */
var $wrapper = document.getElementById('content');
var page = require('page');

module.exports = {
    index: function(req) {
        console.log('app controller index !', req);

        if (!req.user) {
            // Render login form
            $wrapper.innerHTML = tpl('login', {});
        } else {
            page('/team');
        }
    }
}

