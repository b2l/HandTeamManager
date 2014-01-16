/* APPLICATION CONTROLLER */
var tpl = require('../lib/_template').tpl;
var $wrapper = document.getElementById('content');

module.exports = {
    index: function(req) {
        console.log('app controller index !', req);

        if (!req.user) {
            // Render login form
            $wrapper.innerHTML = tpl('login', {});
        } else {
            // Render dashboard

            // Ici, on récupère toutes les données que l'on doit transmettre au dashboard
            var data = {user: req.user, team: []};

            // On transmet les données à la vue :
            // var view = new DashboardView($wrapper?, data);
            // ou
            // var view = new DashboardView(data);
            // puis
            // view.render();

            /* Extraire dans la vue */
            $wrapper.innerHTML = tpl('dashboard', data);
            $wrapper.innerHTML += tpl('create-team', {});
            $wrapper.querySelector('form').addEventListener('submit', function(e) {
                e.preventDefault();
                var formData = e.target.formData
                req.state.formData = formData;
                req.page('/team/create');

            }, false);
        }
    }
}

