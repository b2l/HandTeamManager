module.exports = function(app) {
    return function(a, route){
        route = route || '';
        for (var key in a) {
            switch (typeof a[key]) {
                // { '/path': { ... }}
                case 'object':
                    app.map(a[key], route + key);
                    break;
                // get: function(){ ... } - del: function() { ... } - post: function() { ... }
                case 'function':
                    app[key](route, a[key]);
                    break;
            }
        }
    }
};