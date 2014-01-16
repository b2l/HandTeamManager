var _ = require('../lib/underscore-1.5.2.js');

module.exports = {

    tpl: function(tplName, data) {
        if (!this._tpl) {
            this._tpl = [];
        }
        if (this._tpl[tplName]) {
            return this._tpl[tplName](data);
        }

        var tplNode = document.querySelector('#' + tplName + "[type='text/x-template']");
        if (!tplNode) {
            throw new Error("Can't find template with name " + tplName);
        }
        var template = tplNode.innerHTML;
        this._tpl[tplName] = _.template(template);
        return _.template(template)(data);
    }
}