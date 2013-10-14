function Router(controllers) {
    this._controllers = controllers;
}

Router.prototype = {
    dispatch: function(req, res) {
        var controller = this.getMatchingController(req.url);
    },
    getMatchingController: function(url) {
        return this._controllers.filter(function(controller) {
            return controller.matchRoute(url);
        })[0];
    }
};


module.exports = Router;