var _ = require('./underscore-1.5.2.js');

function XHR() {
    var httpRequest;
    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
        httpRequest = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // IE 8 and older
        httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
    }

    this._xhr = httpRequest;
    this.data = null;
}
XHR.prototype = {
    post: function(url, params) {
        this._xhr.open('POST', url);
        this.data = params;
        this.url = url;

        return this;
    },

    get: function(url) {
        this._xhr.open('GET', url);
        this.url = url;
        return this;
    },

    success: function(cb){
        this.successCallback = cb;
        return this;
    },

    error: function(cb){
        this.errorCallback = cb;
        return this;
    },

    send: function(data){
        this.data = data;
        var that=this;
        this._xhr.onreadystatechange = function() {
            if (this.readyState === 4) {
                switch (this.status) {
                    case 200:
                        that.successCallback(this.responseText);
                        break;
                    default:
                        if (that.errorCallback) {
                            that.errorCallback(this);
                        } else {
                            throw new Error("Request error ! url " + that.url + " send " + this.status);
                        }
                        break;
                }
            }
        };

        this._xhr.send(this.serialize(this.data));
    },

    serialize: function(obj, prefix) {
        return JSON.stringify(obj);

        var str = [];
        for(var p in obj) {
            var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
            str.push(typeof v == "object" ?
                this.serialize(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
        return str.join("&");
    },

    put: function(url, params) {
        this._xhr.open('PUT', url);
		this.data = params;
        this.url = url;
        return this;
    },

    //TODO DELETE ou xhrDelete, delete est un mot réservé, à discuter
    DELETE: function(url) {
        var xhr = this;

        this._xhr.open('DELETE', url);
        this.url = url;
        return this;
    }
};

module.exports = XHR;