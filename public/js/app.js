;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var View = require('../View.js');
var _ = require('../lib/underscore-1.5.2.js');

AppView.prototype = new View();
AppView.constructor = AppView;
function AppView(selector) {
    this.$el = selector;
    this.template = 'app-template'
}

AppView.prototype._render = function() {
    var tpl = document.getElementById(this.template).innerHTML;
    var html = _.template(tpl)();
    document.querySelector(this.$el).innerHTML = html;
};

module.exports = AppView;

},{"../View.js":2,"../lib/underscore-1.5.2.js":3}],4:[function(require,module,exports){
var _ = require('../lib/underscore-1.5.2.js');

function UsersView(element, modelPromise) {
    this.$el = document.querySelector(element);
    this.preRender();

    modelPromise.then(function(users) {
        this.model = users;
        this.render();
    }.bind(this));
}

UsersView.prototype.preRender = function() {
    this.$el.innerHTML = "Loading data...";
};

UsersView.prototype.destroy = function() {
    this.unbind();
    this.$el = null;
    this.model = null;
}

UsersView.prototype.render = function() {
    var tplContent = document.getElementById('users-template').innerHTML;
    var tpl = _.template(tplContent);
    this.$el.innerHTML = tpl({_users: this.model.models});
    this.bindEvents();
};

UsersView.prototype.displayAddUserForm = function () {
    this.$el.querySelector('.add-form').classList.remove('height0');
};
UsersView.prototype.hideAddUserForm = function() {
    this.$el.querySelector('.add-form').classList.add('height0');
};

/* DOM EVENT HANDLER */
UsersView.prototype.bindEvents = function () {
    Gator(this.$el).on('click', '.add', this.showAddHandler.bind(this));
    Gator(this.$el).on('click', '.add-form .cancel', this.cancelAddHandler.bind(this));
    Gator(this.$el).on('submit', '.add-form', this.addUserHandler.bind(this));
};
UsersView.prototype.unbind = function() {
    Gator(this.$el).off();
};

UsersView.prototype.showAddHandler = function(e) {
    this.displayAddUserForm();
};

UsersView.prototype.cancelAddHandler = function(e) {
    this.hideAddUserForm();
};

UsersView.prototype.addUserHandler = function(e) {
    e.preventDefault();
    var user = {
        login: e.target.querySelector('[name="login"]').value,
        password: e.target.querySelector('[name="password"]').value
    };
    this.model.add(user);
};

module.exports = UsersView;

},{"../lib/underscore-1.5.2.js":3}],5:[function(require,module,exports){
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

    header: function(key, value) {
        this.header[key] = value;
        return this;
    },

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

        for (var header in this.header) {
            this._xhr.setRequestHeader(header, this.header[header]);
        }

        this._xhr.send(this.data);
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
},{"./underscore-1.5.2.js":3}],6:[function(require,module,exports){
var View = require('../View.js');
var _ = require('../lib/underscore-1.5.2.js');
var Paper = require('../lib/paper-full.min.js').exports;
var Terrain = require('../lib/paperjs-tool.js');
var XHR = require('../lib/xhr');

StrategieView.prototype = new View();
StrategieView.constructor = StrategieView;
function StrategieView(selector) {
    this.$el = selector
    this.dragItem = null;
    this.recording = false;
    this.paper;
    this.combi = [];
    this.tool;
    this.playersNode = null;
    this.playing = false;

    this.events = {
        'click': {
            '.record': this.record,
            '.save': this.saveCombi,
            '.combi': this.play,
            '.btn-delete': this.removeCombi,
            '.btn.reset': this.resetPosition
        }
    };
}

StrategieView.prototype.setModel = function setModel(model) {
    this.combis = model;
    this.render();
};

StrategieView.prototype._render = function() {
    var tplContent = document.getElementById('strat-template').innerHTML;
    var tpl = _.template(tplContent);
    document.querySelector(this.$el).innerHTML = tpl({combis: this.combis});

    var canvas = document.getElementById('canvas-compo');

    this.paper = new Paper.PaperScope();
    this.paper.setup(canvas);

    this.terrain = new Terrain(this.paper, 900, 450, 50, 50);
    this.terrain.draw();
    this.terrain.placeDefence('1-5');

    this.tool = new Paper.Tool();

    this.tool.onMouseDown = this.paperOnMouseDown.bind(this);

    this.tool.onMouseDrag = this.paperOnMouseDrag.bind(this);

    this.tool.onMouseUp = this.paperOnMouseUp.bind(this);

    this.paper.view.onFrame = this.paperOnFrame.bind(this);
};

StrategieView.prototype.resetPosition = function () {
    this.terrain.placePlayers();
    this.terrain.placeDefence('1-5');
    this.terrain.placeBall();
};

StrategieView.prototype.paperOnMouseDown = function(e) {
    if (e.item && e.item.draggable ) {
        this.dragItem = e.item;
    }
};

StrategieView.prototype.paperOnMouseDrag = function(e) {
    if (this.dragItem) {
        var ball = this.getItemByNodeName('ball');

        if (this.dragItem !== ball) {
            var intersections = this.dragItem.getIntersections(ball);

            if (intersections.length > 0 ) {
                var vector = ball.position.subtract(this.dragItem.position);
            }
        }

        this.dragItem.position = e.middlePoint;

        if (vector) {
            ball.position = this.dragItem.position.add(vector);
        }
        if (this.recording) {
            this.combi.push({
                x: e.middlePoint.x,
                y: e.middlePoint.y,
                name: this.dragItem.name
            });

            var ballPos = this.getItemByNodeName('ball').position;
            this.combi.push({
                x: ballPos.x,
                y: ballPos.y,
                name: 'ball'
            });

        }
    }
};

StrategieView.prototype.paperOnMouseUp = function(e) {
    this.dragItem = null;
};

StrategieView.prototype.paperOnFrame = function(e) {
    if (this.combi && this.combi.length > 0 && this.playing) {
        this._play();
    }
};

StrategieView.prototype.record = function() {
    this.recording = !this.recording;

    if (!this.recording) {
        sessionStorage.setItem('combi', JSON.stringify(this.combi));
    } else {
        document.querySelector(this.$el + ' .record').classList.add('disabled');
        this.renderSaveBox();
        sessionStorage.removeItem('combi');
    }
};

StrategieView.prototype.play = function(e) {
    this.terrain.placePlayers();
    this.terrain.placeDefence('1-5');

    var combiId = e.target.getAttribute('data-combi-id');
    this.combi = this.combis.filter(function(combi) {
        return combi._id === combiId;
    })[0].combi.slice(0);

    var oldSelectedCombi = document.querySelector('.combi.selected');
    if (oldSelectedCombi) {
        oldSelectedCombi.classList.remove('selected');
    }
    e.target.classList.add('selected');

    /* Add a remove button for the selected combi */
    var wrapper = document.createElement('span');
    wrapper.setAttribute('id', 'remove-combi');
    wrapper.classList.add('remove-combi');
    wrapper.classList.add('btn');
    wrapper.classList.add('btn-delete');
    wrapper.setAttribute('data-combi-id', combiId);

    var oldRemoveBtn = document.getElementById('remove-combi');
    if (oldRemoveBtn) {
        oldRemoveBtn.parentNode.removeChild(oldRemoveBtn);
    }

    document.querySelector('.toolbar').appendChild(wrapper);

    this.playing = true;
};

StrategieView.prototype.getItemByNodeName = function(nodeName) {
    return this.paper.project.layers[0].children[nodeName];
};

StrategieView.prototype._play = function() {
    var step = this.combi.shift();
    var item = this.getItemByNodeName(step.name);
    item.position = new Paper.Point(step.x, step.y);

    if (this.combi.length === 0) {
        this.playing = false;
    }

    step = this.combi.shift();
    item = this.getItemByNodeName(step.name);
    item.position = new Paper.Point(step.x, step.y);
};

StrategieView.prototype.renderSaveBox = function renderSaveBox() {
    document.querySelector(this.$el + ' .save-box').classList.remove('height0');
};

StrategieView.prototype.saveCombi = function saveCombi(e) {
    var xhr = new XHR();
    var name = document.querySelector(this.$el + " input[name='name']").value;
    var data = {
        name: name,
        combi: this.combi
    };
    var view = this;
    xhr.post('/combis').success(
        function(xhrData) {
            document.querySelector(view.$el + ' .save-box').classList.add('height0');
            document.querySelector(view.$el + ' .record').classList.remove('disabled');
        }
    ).send(data);
};

StrategieView.prototype.removeCombi = function removeCombi(e) {
    var combiId = e.target.getAttribute('data-combi-id');

    var xhr = new XHR();
    var view = this;
    console.log('remove combi');
    xhr.DELETE('/combis/' + combiId).success(function(data) {
        console.log('combi removed');
    }).send();
};

module.exports = StrategieView;
},{"../View.js":2,"../lib/underscore-1.5.2.js":3,"../lib/paper-full.min.js":7,"../lib/paperjs-tool.js":8,"../lib/xhr":5}],9:[function(require,module,exports){
var View = require('../View.js');
var _ = require('../lib/underscore-1.5.2.js');
var XHR = require('../lib/xhr');

TeamView.prototype = new View();
TeamView.constructor = TeamView;
function TeamView(selector) {
    this.$el = selector

    this.events = {
        click: {
            '.add-member': this.addMemberHandler,
            '.remove-member': this.removeMemberHandler
        },
        submit: {
            '#team-invite': this.sendInviteHandler
        }
    };

    this.render();
}

TeamView.prototype._render = function() {
    var tplContent = document.getElementById('team-template').innerHTML;
    var tpl = _.template(tplContent);
    document.querySelector(this.$el).innerHTML = tpl({combis: this.combis});
};

TeamView.prototype.addMemberHandler = function (e) {
    e.preventDefault();

    var li = document.createElement('li');
    li.innerHTML = '<input type="text" name="mail"/> <a href="" class="remove-member">-</a>';
    document.querySelector(this.$el).querySelector('.invite-member-list').appendChild(li)
};

TeamView.prototype.removeMemberHandler = function (e) {
    e.preventDefault();

    var li = e.target.parentNode;
    var ul = li.parentNode;
    ul.removeChild(li);
};

TeamView.prototype.sendInviteHandler = function(e) {
    e.preventDefault();

    var xhr = new XHR();

    var mails = [];
    Array.prototype.map.call(e.target.querySelectorAll('[name="mail"]'), function(input) {
        mails.push(input.value);
    });
    var data = {
        teamName: e.target.querySelector('[name="name"]').value,
        mails: mails
    };

    xhr
        .header('Content-Type', 'application/json')
        .post('/team/invite')
        .success(function(responseData) {
            console.log(responseData);
        })
        .send(JSON.stringify(data));
};

module.exports = TeamView;
},{"../View.js":2,"../lib/underscore-1.5.2.js":3,"../lib/xhr":5}],3:[function(require,module,exports){
(function(){//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,g=e.filter,d=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,w=Object.keys,_=i.bind,j=function(n){return n instanceof j?n:this instanceof j?(this._wrapped=n,void 0):new j(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=j),exports._=j):n._=j,j.VERSION="1.5.2";var A=j.each=j.forEach=function(n,t,e){if(null!=n)if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a=j.keys(n),u=0,i=a.length;i>u;u++)if(t.call(e,n[a[u]],a[u],n)===r)return};j.map=j.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e.push(t.call(r,n,u,i))}),e)};var E="Reduce of empty array with no initial value";j.reduce=j.foldl=j.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=j.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(E);return r},j.reduceRight=j.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=j.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=j.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(E);return r},j.find=j.detect=function(n,t,r){var e;return O(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},j.filter=j.select=function(n,t,r){var e=[];return null==n?e:g&&n.filter===g?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&e.push(n)}),e)},j.reject=function(n,t,r){return j.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},j.every=j.all=function(n,t,e){t||(t=j.identity);var u=!0;return null==n?u:d&&n.every===d?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var O=j.some=j.any=function(n,t,e){t||(t=j.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};j.contains=j.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:O(n,function(n){return n===t})},j.invoke=function(n,t){var r=o.call(arguments,2),e=j.isFunction(t);return j.map(n,function(n){return(e?t:n[t]).apply(n,r)})},j.pluck=function(n,t){return j.map(n,function(n){return n[t]})},j.where=function(n,t,r){return j.isEmpty(t)?r?void 0:[]:j[r?"find":"filter"](n,function(n){for(var r in t)if(t[r]!==n[r])return!1;return!0})},j.findWhere=function(n,t){return j.where(n,t,!0)},j.max=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.max.apply(Math,n);if(!t&&j.isEmpty(n))return-1/0;var e={computed:-1/0,value:-1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;a>e.computed&&(e={value:n,computed:a})}),e.value},j.min=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.min.apply(Math,n);if(!t&&j.isEmpty(n))return 1/0;var e={computed:1/0,value:1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;a<e.computed&&(e={value:n,computed:a})}),e.value},j.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=j.random(r++),e[r-1]=e[t],e[t]=n}),e},j.sample=function(n,t,r){return arguments.length<2||r?n[j.random(n.length-1)]:j.shuffle(n).slice(0,Math.max(0,t))};var k=function(n){return j.isFunction(n)?n:function(t){return t[n]}};j.sortBy=function(n,t,r){var e=k(t);return j.pluck(j.map(n,function(n,t,u){return{value:n,index:t,criteria:e.call(r,n,t,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var F=function(n){return function(t,r,e){var u={},i=null==r?j.identity:k(r);return A(t,function(r,a){var o=i.call(e,r,a,t);n(u,o,r)}),u}};j.groupBy=F(function(n,t,r){(j.has(n,t)?n[t]:n[t]=[]).push(r)}),j.indexBy=F(function(n,t,r){n[t]=r}),j.countBy=F(function(n,t){j.has(n,t)?n[t]++:n[t]=1}),j.sortedIndex=function(n,t,r,e){r=null==r?j.identity:k(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;r.call(e,n[o])<u?i=o+1:a=o}return i},j.toArray=function(n){return n?j.isArray(n)?o.call(n):n.length===+n.length?j.map(n,j.identity):j.values(n):[]},j.size=function(n){return null==n?0:n.length===+n.length?n.length:j.keys(n).length},j.first=j.head=j.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:o.call(n,0,t)},j.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},j.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},j.rest=j.tail=j.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},j.compact=function(n){return j.filter(n,j.identity)};var M=function(n,t,r){return t&&j.every(n,j.isArray)?c.apply(r,n):(A(n,function(n){j.isArray(n)||j.isArguments(n)?t?a.apply(r,n):M(n,t,r):r.push(n)}),r)};j.flatten=function(n,t){return M(n,t,[])},j.without=function(n){return j.difference(n,o.call(arguments,1))},j.uniq=j.unique=function(n,t,r,e){j.isFunction(t)&&(e=r,r=t,t=!1);var u=r?j.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:j.contains(a,r))||(a.push(r),i.push(n[e]))}),i},j.union=function(){return j.uniq(j.flatten(arguments,!0))},j.intersection=function(n){var t=o.call(arguments,1);return j.filter(j.uniq(n),function(n){return j.every(t,function(t){return j.indexOf(t,n)>=0})})},j.difference=function(n){var t=c.apply(e,o.call(arguments,1));return j.filter(n,function(n){return!j.contains(t,n)})},j.zip=function(){for(var n=j.max(j.pluck(arguments,"length").concat(0)),t=new Array(n),r=0;n>r;r++)t[r]=j.pluck(arguments,""+r);return t},j.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},j.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=j.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},j.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},j.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=new Array(e);e>u;)i[u++]=n,n+=r;return i};var R=function(){};j.bind=function(n,t){var r,e;if(_&&n.bind===_)return _.apply(n,o.call(arguments,1));if(!j.isFunction(n))throw new TypeError;return r=o.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(o.call(arguments)));R.prototype=n.prototype;var u=new R;R.prototype=null;var i=n.apply(u,r.concat(o.call(arguments)));return Object(i)===i?i:u}},j.partial=function(n){var t=o.call(arguments,1);return function(){return n.apply(this,t.concat(o.call(arguments)))}},j.bindAll=function(n){var t=o.call(arguments,1);if(0===t.length)throw new Error("bindAll must be passed function names");return A(t,function(t){n[t]=j.bind(n[t],n)}),n},j.memoize=function(n,t){var r={};return t||(t=j.identity),function(){var e=t.apply(this,arguments);return j.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},j.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},j.defer=function(n){return j.delay.apply(j,[n,1].concat(o.call(arguments,1)))},j.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var c=function(){o=r.leading===!1?0:new Date,a=null,i=n.apply(e,u)};return function(){var l=new Date;o||r.leading!==!1||(o=l);var f=t-(l-o);return e=this,u=arguments,0>=f?(clearTimeout(a),a=null,o=l,i=n.apply(e,u)):a||r.trailing===!1||(a=setTimeout(c,f)),i}},j.debounce=function(n,t,r){var e,u,i,a,o;return function(){i=this,u=arguments,a=new Date;var c=function(){var l=new Date-a;t>l?e=setTimeout(c,t-l):(e=null,r||(o=n.apply(i,u)))},l=r&&!e;return e||(e=setTimeout(c,t)),l&&(o=n.apply(i,u)),o}},j.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},j.wrap=function(n,t){return function(){var r=[n];return a.apply(r,arguments),t.apply(this,r)}},j.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},j.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},j.keys=w||function(n){if(n!==Object(n))throw new TypeError("Invalid object");var t=[];for(var r in n)j.has(n,r)&&t.push(r);return t},j.values=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},j.pairs=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},j.invert=function(n){for(var t={},r=j.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},j.functions=j.methods=function(n){var t=[];for(var r in n)j.isFunction(n[r])&&t.push(r);return t.sort()},j.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},j.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},j.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)j.contains(r,u)||(t[u]=n[u]);return t},j.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]===void 0&&(n[r]=t[r])}),n},j.clone=function(n){return j.isObject(n)?j.isArray(n)?n.slice():j.extend({},n):n},j.tap=function(n,t){return t(n),n};var S=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof j&&(n=n._wrapped),t instanceof j&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case"[object String]":return n==String(t);case"[object Number]":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case"[object Date]":case"[object Boolean]":return+n==+t;case"[object RegExp]":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;var a=n.constructor,o=t.constructor;if(a!==o&&!(j.isFunction(a)&&a instanceof a&&j.isFunction(o)&&o instanceof o))return!1;r.push(n),e.push(t);var c=0,f=!0;if("[object Array]"==u){if(c=n.length,f=c==t.length)for(;c--&&(f=S(n[c],t[c],r,e)););}else{for(var s in n)if(j.has(n,s)&&(c++,!(f=j.has(t,s)&&S(n[s],t[s],r,e))))break;if(f){for(s in t)if(j.has(t,s)&&!c--)break;f=!c}}return r.pop(),e.pop(),f};j.isEqual=function(n,t){return S(n,t,[],[])},j.isEmpty=function(n){if(null==n)return!0;if(j.isArray(n)||j.isString(n))return 0===n.length;for(var t in n)if(j.has(n,t))return!1;return!0},j.isElement=function(n){return!(!n||1!==n.nodeType)},j.isArray=x||function(n){return"[object Array]"==l.call(n)},j.isObject=function(n){return n===Object(n)},A(["Arguments","Function","String","Number","Date","RegExp"],function(n){j["is"+n]=function(t){return l.call(t)=="[object "+n+"]"}}),j.isArguments(arguments)||(j.isArguments=function(n){return!(!n||!j.has(n,"callee"))}),"function"!=typeof/./&&(j.isFunction=function(n){return"function"==typeof n}),j.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},j.isNaN=function(n){return j.isNumber(n)&&n!=+n},j.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"==l.call(n)},j.isNull=function(n){return null===n},j.isUndefined=function(n){return n===void 0},j.has=function(n,t){return f.call(n,t)},j.noConflict=function(){return n._=t,this},j.identity=function(n){return n},j.times=function(n,t,r){for(var e=Array(Math.max(0,n)),u=0;n>u;u++)e[u]=t.call(r,u);return e},j.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))};var I={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;"}};I.unescape=j.invert(I.escape);var T={escape:new RegExp("["+j.keys(I.escape).join("")+"]","g"),unescape:new RegExp("("+j.keys(I.unescape).join("|")+")","g")};j.each(["escape","unescape"],function(n){j[n]=function(t){return null==t?"":(""+t).replace(T[n],function(t){return I[n][t]})}}),j.result=function(n,t){if(null==n)return void 0;var r=n[t];return j.isFunction(r)?r.call(n):r},j.mixin=function(n){A(j.functions(n),function(t){var r=j[t]=n[t];j.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),z.call(this,r.apply(j,n))}})};var N=0;j.uniqueId=function(n){var t=++N+"";return n?n+t:t},j.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var q=/(.)^/,B={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\t|\u2028|\u2029/g;j.template=function(n,t,r){var e;r=j.defaults({},r,j.templateSettings);var u=new RegExp([(r.escape||q).source,(r.interpolate||q).source,(r.evaluate||q).source].join("|")+"|$","g"),i=0,a="__p+='";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(D,function(n){return"\\"+B[n]}),r&&(a+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'"),e&&(a+="'+\n((__t=("+e+"))==null?'':__t)+\n'"),u&&(a+="';\n"+u+"\n__p+='"),i=o+t.length,t}),a+="';\n",r.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{e=new Function(r.variable||"obj","_",a)}catch(o){throw o.source=a,o}if(t)return e(t,j);var c=function(n){return e.call(this,n,j)};return c.source="function("+(r.variable||"obj")+"){\n"+a+"}",c},j.chain=function(n){return j(n).chain()};var z=function(n){return this._chain?j(n).chain():n};j.mixin(j),A(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=e[n];j.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!=n&&"splice"!=n||0!==r.length||delete r[0],z.call(this,r)}}),A(["concat","join","slice"],function(n){var t=e[n];j.prototype[n]=function(){return z.call(this,t.apply(this._wrapped,arguments))}}),j.extend(j.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}})}).call(this);
//# sourceMappingURL=underscore-min.map
})()
},{}],7:[function(require,module,exports){
(function(){/*!
 * Paper.js v0.9.9 - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2013, Juerg Lehni & Jonathan Puckey
 * http://lehni.org/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 *
 * Date: Sun Jul 21 16:44:30 2013 -0700
 *
 ***
 *
 * straps.js - Class inheritance library with support for bean-style accessors
 *
 * Copyright (c) 2006 - 2013 Juerg Lehni
 * http://lehni.org/
 *
 * Distributed under the MIT license.
 *
 ***
 *
 * acorn.js
 * http://marijnhaverbeke.nl/acorn/
 *
 * Acorn is a tiny, fast JavaScript parser written in JavaScript,
 * created by Marijn Haverbeke and released under an MIT license.
 *
 */
var paper=new function(){var t=new function(){function e(t,e,n,i,s,a){function h(i,r,a,h){var r=r||(r=d(e,i))&&(r.get?r:r.value);"string"==typeof r&&"#"===r[0]&&(r=t[r.substring(1)]||r);var c,l="function"==typeof r,f=r,g=s||l?r&&r.get?i in t:t[i]:null;!(a||void 0!==r&&e.hasOwnProperty(i))||s&&g||(l&&g&&(r.base=g),l&&u&&0===r.length&&(c=i.match(/^(get|is)(([A-Z])(.*))$/))&&u.push([c[3].toLowerCase()+c[4],c[2]]),f&&!l&&f.get||(f={value:f,writable:!0}),(d(t,i)||{configurable:!0}).configurable&&(f.configurable=!0,f.enumerable=n),_(t,i,f)),!h||!l||s&&h[i]||(h[i]=function(e){return e&&t[i].apply(e,o.call(arguments,1))})}var u;if(e){u=[];for(var c in e)e.hasOwnProperty(c)&&!r.test(c)&&h(c,null,!0,a);h("toString"),h("valueOf");for(var l=0,f=u&&u.length;f>l;l++)try{var g=u[l],p=g[1];h(g[0],{get:t["get"+p]||t["is"+p],set:t["set"+p]},!0)}catch(v){}}return t}function n(e,n,i,r){try{e&&(r||void 0===r&&c(e)?h:u).call(e,n,i=i||e)}catch(s){if(s!==t.stop)throw s}return i}function i(t){return n(t,function(t,e){this[e]=t},new t.constructor)}var r=/^(statics|generics|preserve|enumerable|prototype|toString|valueOf)$/,s=Object.prototype.toString,a=Array.prototype,o=a.slice,h=a.forEach||function(t,e){for(var n=0,i=this.length;i>n;n++)t.call(e,this[n],n,this)},u=function(t,e){for(var n in this)this.hasOwnProperty(n)&&t.call(e,this[n],n,this)},c=Array.isArray=Array.isArray||function(t){return"[object Array]"===s.call(t)},l=Object.create||function(t){return{__proto__:t}},d=Object.getOwnPropertyDescriptor||function(t,e){var n=t.__lookupGetter__&&t.__lookupGetter__(e);return n?{get:n,set:t.__lookupSetter__(e),enumerable:!0,configurable:!0}:t.hasOwnProperty(e)?{value:t[e],enumerable:!0,configurable:!0,writable:!0}:null},f=Object.defineProperty||function(t,e,n){return(n.get||n.set)&&t.__defineGetter__?(n.get&&t.__defineGetter__(e,n.get),n.set&&t.__defineSetter__(e,n.set)):t[e]=n.value,t},_=function(t,e,n){return delete t[e],f(t,e,n)};return e(function(){},{inject:function(t){if(t){var n=this.prototype,i=Object.getPrototypeOf(n).constructor,r=t.statics===!0?t:t.statics;r!=t&&e(n,t,t.enumerable,i&&i.prototype,t.preserve,t.generics&&this),e(this,r,!0,i,t.preserve)}for(var s=1,a=arguments.length;a>s;s++)this.inject(arguments[s]);return this},extend:function(){for(var t,n=this,i=0,r=arguments.length;r>i&&!(t=arguments[i].initialize);i++);return t=t||function(){n.apply(this,arguments)},t.prototype=l(this.prototype),_(t.prototype,"constructor",{value:t,writable:!0,configurable:!0}),e(t,this,!0),arguments.length?this.inject.apply(t,arguments):t}},!0).inject({inject:function(){for(var t=0,n=arguments.length;n>t;t++)e(this,arguments[t],arguments[t].enumerable);return this},extend:function(){var t=l(this);return t.inject.apply(t,arguments)},each:function(t,e){return n(this,t,e)},clone:function(){return i(this)},statics:{each:n,clone:i,define:_,describe:d,create:function(t){return l(t.prototype)},isPlainObject:function(e){var n=null!=e&&e.constructor;return n&&(n===Object||n===t||"Object"===n.name)},check:function(t){return!(!t&&0!==t)},pick:function(){for(var t=0,e=arguments.length;e>t;t++)if(void 0!==arguments[t])return arguments[t];return null},stop:{}}})};"undefined"!=typeof module&&(module.exports=t),t.inject({generics:!0,clone:function(){return new this.constructor(this)},toString:function(){return null!=this._id?(this._class||"Object")+(this._name?" '"+this._name+"'":" @"+this._id):"{ "+t.each(this,function(t,e){if(!/^_/.test(e)){var n=typeof t;this.push(e+": "+("number"===n?s.instance.number(t):"string"===n?"'"+t+"'":t))}},[]).join(", ")+" }"},exportJSON:function(e){return t.exportJSON(this,e)},toJSON:function(){return t.serialize(this)},_set:function(e,n){if(e&&t.isPlainObject(e)){for(var i in e)!(e.hasOwnProperty(i)&&i in this)||n&&n[i]||(this[i]=e[i]);return!0}},statics:{exports:{},extend:function ee(){var e=ee.base.apply(this,arguments),n=e.prototype._class;return n&&!t.exports[n]&&(t.exports[n]=e),e},equals:function(e,n){function i(t,e){for(var n in t)if(t.hasOwnProperty(n)&&void 0===e[n])return!1;return!0}if(e===n)return!0;if(e&&e.equals)return e.equals(n);if(n&&n.equals)return n.equals(e);if(Array.isArray(e)&&Array.isArray(n)){if(e.length!==n.length)return!1;for(var r=0,s=e.length;s>r;r++)if(!t.equals(e[r],n[r]))return!1;return!0}if(e&&"object"==typeof e&&n&&"object"==typeof n){if(!i(e,n)||!i(n,e))return!1;for(var r in e)if(e.hasOwnProperty(r)&&!t.equals(e[r],n[r]))return!1;return!0}return!1},read:function(e,n,i,r){if(this===t){var s=this.peek(e,n);return e._index++,e.__read=1,s}var a=this.prototype,o=a._readIndex,h=n||o&&e._index||0;i||(i=e.length-h);var u=e[h];return u instanceof this||r&&r.readNull&&null==u&&1>=i?(o&&(e._index=h+1),u&&r&&r.clone?u.clone():u):(u=t.create(this),o&&(u.__read=!0),r&&(u.__options=r),u=u.initialize.apply(u,h>0||i<e.length?Array.prototype.slice.call(e,h,h+i):e)||u,o&&(e._index=h+u.__read,e.__read=u.__read,delete u.__read,r&&delete u.__options),u)},peek:function(t,e){return t[t._index=e||t._index||0]},readAll:function(t,e,n){for(var i,r=[],s=e||0,a=t.length;a>s;s++)r.push(Array.isArray(i=t[s])?this.read(i,0,0,n):this.read(t,s,1,n));return r},readNamed:function(t,e,n,i,r){var s=this.getNamed(t,e);return this.read(null!=s?[s]:t,n,i,r)},getNamed:function(e,n){var i=e[0];return void 0===e._hasObject&&(e._hasObject=1===e.length&&t.isPlainObject(i)),e._hasObject?n?i[n]:i:void 0},hasNamed:function(t,e){return!!this.getNamed(t,e)},isPlainValue:function(t){return this.isPlainObject(t)||Array.isArray(t)},serialize:function(e,n,i,r){n=n||{};var a,o=!r;if(o&&(n.formatter=new s(n.precision),r={length:0,definitions:{},references:{},add:function(t,e){var n="#"+t._id,i=this.references[n];if(!i){this.length++;var r=e.call(t),s=t._class;s&&r[0]!==s&&r.unshift(s),this.definitions[n]=r,i=this.references[n]=[n]}return i}}),e&&e._serialize){a=e._serialize(n,r);var h=e._class;!h||i||a._compact||a[0]===h||a.unshift(h)}else if(Array.isArray(e)){a=[];for(var u=0,c=e.length;c>u;u++)a[u]=t.serialize(e[u],n,i,r);i&&(a._compact=!0)}else if(t.isPlainObject(e)){a={};for(var u in e)e.hasOwnProperty(u)&&(a[u]=t.serialize(e[u],n,i,r))}else a="number"==typeof e?n.formatter.number(e,n.precision):e;return o&&r.length>0?[["dictionary",r.definitions],a]:a},deserialize:function(e,n){var i=e;if(n=n||{},Array.isArray(e)){var r=e[0],s="dictionary"===r;if(!s){if(n.dictionary&&1==e.length&&/^#/.test(r))return n.dictionary[r];r=t.exports[r]}i=[];for(var a=r?1:0,o=e.length;o>a;a++)i.push(t.deserialize(e[a],n));if(s)n.dictionary=i[0];else if(r){var h=i;i=t.create(r),r.apply(i,h)}}else if(t.isPlainObject(e)){i={};for(var u in e)i[u]=t.deserialize(e[u],n)}return i},exportJSON:function(e,n){return JSON.stringify(t.serialize(e,n))},importJSON:function(e){return t.deserialize("string"==typeof e?JSON.parse(e):e)},splice:function(t,e,n,i){var r=e&&e.length,s=void 0===n;n=s?t.length:n,n>t.length&&(n=t.length);for(var a=0;r>a;a++)e[a]._index=n+a;if(s)return t.push.apply(t,e),[];var o=[n,i];e&&o.push.apply(o,e);for(var h=t.splice.apply(t,o),a=0,u=h.length;u>a;a++)delete h[a]._index;for(var a=n+r,u=t.length;u>a;a++)t[a]._index=a;return h},merge:function(){return t.each(arguments,function(e){t.each(e,function(t,e){this[e]=t},this)},new t,!0)},capitalize:function(t){return t.replace(/\b[a-z]/g,function(t){return t.toUpperCase()})},camelize:function(t){return t.replace(/-(.)/g,function(t,e){return e.toUpperCase()})},hyphenate:function(t){return t.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()}}});var e={attach:function(e,n){if("string"!=typeof e)return t.each(e,function(t,e){this.attach(e,t)},this),void 0;var i=this._eventTypes[e];if(i){var r=this._handlers=this._handlers||{};r=r[e]=r[e]||[],-1==r.indexOf(n)&&(r.push(n),i.install&&1==r.length&&i.install.call(this,e))}},detach:function(e,n){if("string"!=typeof e)return t.each(e,function(t,e){this.detach(e,t)},this),void 0;var i,r=this._eventTypes[e],s=this._handlers&&this._handlers[e];r&&s&&(!n||-1!=(i=s.indexOf(n))&&1==s.length?(r.uninstall&&r.uninstall.call(this,e),delete this._handlers[e]):-1!=i&&s.splice(i,1))},once:function(t,e){this.attach(t,function(){e.apply(this,arguments),this.detach(t,e)})},fire:function(e,n){var i=this._handlers&&this._handlers[e];if(!i)return!1;var r=[].slice.call(arguments,1);return t.each(i,function(t){t.apply(this,r)===!1&&n&&n.stop&&n.stop()},this),!0},responds:function(t){return!(!this._handlers||!this._handlers[t])},on:"#attach",off:"#detach",trigger:"#fire",statics:{inject:function ne(){for(var e=0,n=arguments.length;n>e;e++){var i=arguments[e],r=i._events;if(r){var s={};t.each(r,function(e,n){var r="string"==typeof e,a=r?e:n,o=t.capitalize(a),h=a.substring(2).toLowerCase();s[h]=r?{}:e,a="_"+a,i["get"+o]=function(){return this[a]},i["set"+o]=function(t){t?this.attach(h,t):this[a]&&this.detach(h,this[a]),this[a]=t}}),i._eventTypes=s}ne.base.call(this,i)}return this}}},n=t.extend({_class:"PaperScope",initialize:function ie(t){if(paper=this,this.project=null,this.projects=[],this.tools=[],this.palettes=[],this._id=t&&(t.getAttribute("id")||t.src)||"paperscope-"+ie._id++,t&&t.setAttribute("id",this._id),ie._scopes[this._id]=this,!this.support){var e=Y.getContext(1,1);ie.prototype.support={nativeDash:"setLineDash"in e||"mozDash"in e,nativeBlendModes:K.nativeModes},Y.release(e)}},version:"0.9.9",getView:function(){return this.project&&this.project.view},getTool:function(){return this._tool||(this._tool=new W),this._tool},evaluate:function(t){var e=paper.PaperScript.evaluate(t,this);return V.updateFocus(),e},install:function(e){var n=this;t.each(["project","view","tool"],function(i){t.define(e,i,{configurable:!0,get:function(){return n[i]}})});for(var i in this)/^(version|_id)/.test(i)||i in e||(e[i]=this[i])},setup:function(t){return paper=this,this.project=new p(t),this},activate:function(){paper=this},clear:function(){for(var t=this.projects.length-1;t>=0;t--)this.projects[t].remove();for(var t=this.tools.length-1;t>=0;t--)this.tools[t].remove();for(var t=this.palettes.length-1;t>=0;t--)this.palettes[t].remove()},remove:function(){this.clear(),delete n._scopes[this._id]},statics:new function(){function t(t){return t+="Attribute",function(e,n){return e[t](n)||e[t]("data-paper-"+n)}}return{_scopes:{},_id:0,get:function(t){return"object"==typeof t&&(t=t.getAttribute("id")),this._scopes[t]||null},getAttribute:t("get"),hasAttribute:t("has")}}}),r=t.extend(e,{initialize:function(t){this._scope=paper,this._index=this._scope[this._list].push(this)-1,(t||!this._scope[this._reference])&&this.activate()},activate:function(){if(!this._scope)return!1;var t=this._scope[this._reference];return t&&t!=this&&t.fire("deactivate"),this._scope[this._reference]=this,this.fire("activate",t),!0},isActive:function(){return this._scope[this._reference]===this},remove:function(){return null==this._index?!1:(t.splice(this._scope[this._list],null,this._index,1),this._scope[this._reference]==this&&(this._scope[this._reference]=null),this._scope=null,!0)}}),s=t.extend({initialize:function(t){this.precision=t||5,this.multiplier=Math.pow(10,this.precision)},number:function(t){return Math.round(t*this.multiplier)/this.multiplier},point:function(t,e){return this.number(t.x)+(e||",")+this.number(t.y)},size:function(t,e){return this.number(t.width)+(e||",")+this.number(t.height)},rectangle:function(t,e){return this.point(t,e)+(e||",")+this.size(t,e)}});s.instance=new s(5);var a=new function(){var t=[[.5773502691896257],[0,.7745966692414834],[.33998104358485626,.8611363115940526],[0,.5384693101056831,.906179845938664],[.2386191860831969,.6612093864662645,.932469514203152],[0,.4058451513773972,.7415311855993945,.9491079123427585],[.1834346424956498,.525532409916329,.7966664774136267,.9602898564975363],[0,.3242534234038089,.6133714327005904,.8360311073266358,.9681602395076261],[.14887433898163122,.4333953941292472,.6794095682990244,.8650633666889845,.9739065285171717],[0,.26954315595234496,.5190961292068118,.7301520055740494,.8870625997680953,.978228658146057],[.1252334085114689,.3678314989981802,.5873179542866175,.7699026741943047,.9041172563704749,.9815606342467192],[0,.2304583159551348,.44849275103644687,.6423493394403402,.8015780907333099,.9175983992229779,.9841830547185881],[.10805494870734367,.31911236892788974,.5152486363581541,.6872929048116855,.827201315069765,.9284348836635735,.9862838086968123],[0,.20119409399743451,.3941513470775634,.5709721726085388,.7244177313601701,.8482065834104272,.937273392400706,.9879925180204854],[.09501250983763744,.2816035507792589,.45801677765722737,.6178762444026438,.755404408355003,.8656312023878318,.9445750230732326,.9894009349916499]],e=[[1],[.8888888888888888,.5555555555555556],[.6521451548625461,.34785484513745385],[.5688888888888889,.47862867049936647,.23692688505618908],[.46791393457269104,.3607615730481386,.17132449237917036],[.4179591836734694,.3818300505051189,.27970539148927664,.1294849661688697],[.362683783378362,.31370664587788727,.22238103445337448,.10122853629037626],[.3302393550012598,.31234707704000286,.26061069640293544,.1806481606948574,.08127438836157441],[.29552422471475287,.26926671930999635,.21908636251598204,.1494513491505806,.06667134430868814],[.2729250867779006,.26280454451024665,.23319376459199048,.18629021092773426,.1255803694649046,.05566856711617366],[.24914704581340277,.2334925365383548,.20316742672306592,.16007832854334622,.10693932599531843,.04717533638651183],[.2325515532308739,.22628318026289723,.2078160475368885,.17814598076194574,.13887351021978725,.09212149983772845,.04048400476531588],[.2152638534631578,.2051984637212956,.18553839747793782,.15720316715819355,.12151857068790319,.08015808715976021,.03511946033175186],[.2025782419255613,.19843148532711158,.1861610000155622,.16626920581699392,.13957067792615432,.10715922046717194,.07036604748810812,.03075324199611727],[.1894506104550685,.18260341504492358,.16915651939500254,.14959598881657674,.12462897125553388,.09515851168249279,.062253523938647894,.027152459411754096]],n=Math.abs,i=Math.sqrt,r=Math.pow,s=Math.cos,o=Math.PI;return{TOLERANCE:1e-5,EPSILON:1e-11,KAPPA:4*(i(2)-1)/3,isZero:function(t){return n(t)<=this.EPSILON},integrate:function(n,i,r,s){for(var a=t[s-2],o=e[s-2],h=.5*(r-i),u=h+i,c=0,l=s+1>>1,d=1&s?o[c++]*n(u):0;l>c;){var f=h*a[c];d+=o[c++]*(n(u+f)+n(u-f))}return h*d},findRoot:function(t,e,i,r,s,a,o){for(var h=0;a>h;h++){var u=t(i),c=u/e(i);if(n(c)<o)return i;var l=i-c;u>0?(s=i,i=r>=l?.5*(r+s):l):(r=i,i=l>=s?.5*(r+s):l)}},solveQuadratic:function(t,e,r,s){var a=this.EPSILON;if(n(t)<a)return n(e)>=a?(s[0]=-r/e,1):n(r)<a?-1:0;var o=e*e-4*t*r;if(0>o)return 0;o=i(o),t*=2;var h=0;return s[h++]=(-e-o)/t,o>0&&(s[h++]=(-e+o)/t),h},solveCubic:function(t,e,h,u,c){var l=this.EPSILON;if(n(t)<l)return a.solveQuadratic(e,h,u,c);e/=t,h/=t,u/=t;var d=e*e,f=(d-3*h)/9,_=(2*d*e-9*e*h+27*u)/54,g=f*f*f,p=_*_-g;if(e/=3,n(p)<l){if(n(_)<l)return c[0]=-e,1;var v=i(f),m=_>0?1:-1;return c[0]=2*-m*v-e,c[1]=m*v-e,2}if(0>p){var v=i(f),y=Math.acos(_/(v*v*v))/3,w=-2*v,x=2*o/3;return c[0]=w*s(y)-e,c[1]=w*s(y+x)-e,c[2]=w*s(y-x)-e,3}var b=(_>0?-1:1)*r(n(_)+i(p),1/3);return c[0]=b+f/b-e,1}}},o=t.extend({_class:"Point",_readIndex:!0,initialize:function(t,e){var n=typeof t;if("number"===n){var i="number"==typeof e;this.x=t,this.y=i?e:t,this.__read&&(this.__read=i?2:1)}else"undefined"===n||null===t?(this.x=this.y=0,this.__read&&(this.__read=null===t?1:0)):(Array.isArray(t)?(this.x=t[0],this.y=t.length>1?t[1]:t[0]):null!=t.x?(this.x=t.x,this.y=t.y):null!=t.width?(this.x=t.width,this.y=t.height):null!=t.angle?(this.x=t.length,this.y=0,this.setAngle(t.angle)):(this.x=this.y=0,this.__read&&(this.__read=0)),this.__read&&(this.__read=1))},set:function(t,e){return this.x=t,this.y=e,this},equals:function(t){return t===this||t&&(this.x===t.x&&this.y===t.y||Array.isArray(t)&&this.x===t[0]&&this.y===t[1])||!1},clone:function(){return new o(this.x,this.y)},toString:function(){var t=s.instance;return"{ x: "+t.number(this.x)+", y: "+t.number(this.y)+" }"},_serialize:function(t){var e=t.formatter;return[e.number(this.x),e.number(this.y)]},add:function(t){return t=o.read(arguments),new o(this.x+t.x,this.y+t.y)},subtract:function(t){return t=o.read(arguments),new o(this.x-t.x,this.y-t.y)},multiply:function(t){return t=o.read(arguments),new o(this.x*t.x,this.y*t.y)},divide:function(t){return t=o.read(arguments),new o(this.x/t.x,this.y/t.y)},modulo:function(t){return t=o.read(arguments),new o(this.x%t.x,this.y%t.y)},negate:function(){return new o(-this.x,-this.y)},transform:function(t){return t?t._transformPoint(this):this},getDistance:function(t,e){t=o.read(arguments);var n=t.x-this.x,i=t.y-this.y,r=n*n+i*i;return e?r:Math.sqrt(r)},getLength:function(){var t=this.x*this.x+this.y*this.y;return arguments.length&&arguments[0]?t:Math.sqrt(t)},setLength:function(t){if(this.isZero()){var e=this._angle||0;this.set(Math.cos(e)*t,Math.sin(e)*t)}else{var n=t/this.getLength();a.isZero(n)&&this.getAngle(),this.set(this.x*n,this.y*n)}return this},normalize:function(t){void 0===t&&(t=1);var e=this.getLength(),n=0!==e?t/e:0,i=new o(this.x*n,this.y*n);return i._angle=this._angle,i},getAngle:function(){return 180*this.getAngleInRadians(arguments[0])/Math.PI},setAngle:function(t){if(t=this._angle=t*Math.PI/180,!this.isZero()){var e=this.getLength();this.set(Math.cos(t)*e,Math.sin(t)*e)}return this},getAngleInRadians:function(){if(void 0===arguments[0])return null==this._angle&&(this._angle=Math.atan2(this.y,this.x)),this._angle;var t=o.read(arguments),e=this.getLength()*t.getLength();return a.isZero(e)?0/0:Math.acos(this.dot(t)/e)},getAngleInDegrees:function(){return this.getAngle(arguments[0])},getQuadrant:function(){return this.x>=0?this.y>=0?1:4:this.y>=0?2:3},getDirectedAngle:function(t){return t=o.read(arguments),180*Math.atan2(this.cross(t),this.dot(t))/Math.PI},rotate:function(t,e){if(0===t)return this.clone();t=t*Math.PI/180;var n=e?this.subtract(e):this,i=Math.sin(t),r=Math.cos(t);return n=new o(n.x*r-n.y*i,n.y*r+n.x*i),e?n.add(e):n},isInside:function(t){return t.contains(this)},isClose:function(t,e){return this.getDistance(t)<e},isColinear:function(t){return this.cross(t)<1e-5},isOrthogonal:function(t){return this.dot(t)<1e-5},isZero:function(){return a.isZero(this.x)&&a.isZero(this.y)},isNaN:function(){return isNaN(this.x)||isNaN(this.y)},dot:function(t){return t=o.read(arguments),this.x*t.x+this.y*t.y},cross:function(t){return t=o.read(arguments),this.x*t.y-this.y*t.x},project:function(t){if(t=o.read(arguments),t.isZero())return new o(0,0);var e=this.dot(t)/t.dot(t);return new o(t.x*e,t.y*e)},statics:{min:function(){var t=o.read(arguments);return point2=o.read(arguments),new o(Math.min(t.x,point2.x),Math.min(t.y,point2.y))},max:function(){var t=o.read(arguments);return point2=o.read(arguments),new o(Math.max(t.x,point2.x),Math.max(t.y,point2.y))},random:function(){return new o(Math.random(),Math.random())}}},t.each(["round","ceil","floor","abs"],function(t){var e=Math[t];this[t]=function(){return new o(e(this.x),e(this.y))}},{})),h=o.extend({initialize:function(t,e,n,i){this._x=t,this._y=e,this._owner=n,this._setter=i},set:function(t,e,n){return this._x=t,this._y=e,n||this._owner[this._setter](this),this},getX:function(){return this._x},setX:function(t){this._x=t,this._owner[this._setter](this)},getY:function(){return this._y},setY:function(t){this._y=t,this._owner[this._setter](this)}}),u=t.extend({_class:"Size",_readIndex:!0,initialize:function(t,e){var n=typeof t;if("number"===n){var i="number"==typeof e;this.width=t,this.height=i?e:t,this.__read&&(this.__read=i?2:1)}else"undefined"===n||null===t?(this.width=this.height=0,this.__read&&(this.__read=null===t?1:0)):(Array.isArray(t)?(this.width=t[0],this.height=t.length>1?t[1]:t[0]):null!=t.width?(this.width=t.width,this.height=t.height):null!=t.x?(this.width=t.x,this.height=t.y):(this.width=this.height=0,this.__read&&(this.__read=0)),this.__read&&(this.__read=1))},set:function(t,e){return this.width=t,this.height=e,this},equals:function(t){return t===this||t&&(this.width===t.width&&this.height===t.height||Array.isArray(t)&&this.width===t[0]&&this.height===t[1])||!1},clone:function(){return new u(this.width,this.height)},toString:function(){var t=s.instance;return"{ width: "+t.number(this.width)+", height: "+t.number(this.height)+" }"},_serialize:function(t){var e=t.formatter;return[e.number(this.width),e.number(this.height)]},add:function(t){return t=u.read(arguments),new u(this.width+t.width,this.height+t.height)},subtract:function(t){return t=u.read(arguments),new u(this.width-t.width,this.height-t.height)},multiply:function(t){return t=u.read(arguments),new u(this.width*t.width,this.height*t.height)},divide:function(t){return t=u.read(arguments),new u(this.width/t.width,this.height/t.height)},modulo:function(t){return t=u.read(arguments),new u(this.width%t.width,this.height%t.height)},negate:function(){return new u(-this.width,-this.height)},isZero:function(){return a.isZero(this.width)&&a.isZero(this.height)},isNaN:function(){return isNaN(this.width)||isNaN(this.height)},statics:{min:function(t,e){return new u(Math.min(t.width,e.width),Math.min(t.height,e.height))},max:function(t,e){return new u(Math.max(t.width,e.width),Math.max(t.height,e.height))},random:function(){return new u(Math.random(),Math.random())}}},t.each(["round","ceil","floor","abs"],function(t){var e=Math[t];this[t]=function(){return new u(e(this.width),e(this.height))}},{})),c=u.extend({initialize:function(t,e,n,i){this._width=t,this._height=e,this._owner=n,this._setter=i},set:function(t,e,n){return this._width=t,this._height=e,n||this._owner[this._setter](this),this},getWidth:function(){return this._width},setWidth:function(t){this._width=t,this._owner[this._setter](this)},getHeight:function(){return this._height},setHeight:function(t){this._height=t,this._owner[this._setter](this)}}),d=t.extend({_class:"Rectangle",_readIndex:!0,initialize:function(e,n,i,r){var s=typeof e,a=0;if("number"===s?(this.x=e,this.y=n,this.width=i,this.height=r,a=4):"undefined"===s||null===e?(this.x=this.y=this.width=this.height=0,a=null===e?1:0):1===arguments.length&&(Array.isArray(e)?(this.x=e[0],this.y=e[1],this.width=e[2],this.height=e[3],a=1):void 0!==e.x||void 0!==e.width?(this.x=e.x||0,this.y=e.y||0,this.width=e.width||0,this.height=e.height||0,a=1):void 0===e.from&&void 0===e.to&&(this.x=this.y=this.width=this.height=0,this._set(e),a=1)),!a){var h=o.readNamed(arguments,"from"),c=t.peek(arguments);if(this.x=h.x,this.y=h.y,c&&void 0!==c.x||t.hasNamed(arguments,"to")){var l=o.readNamed(arguments,"to");this.width=l.x-h.x,this.height=l.y-h.y,this.width<0&&(this.x=l.x,this.width=-this.width),this.height<0&&(this.y=l.y,this.height=-this.height)}else{var d=u.read(arguments);this.width=d.width,this.height=d.height}a=arguments._index}this.__read&&(this.__read=a)},set:function(t,e,n,i){return this.x=t,this.y=e,this.width=n,this.height=i,this},clone:function(){return new d(this.x,this.y,this.width,this.height)},equals:function(e){return t.isPlainValue(e)&&(e=d.read(arguments)),e===this||e&&this.x===e.x&&this.y===e.y&&this.width===e.width&&this.height===e.height||!1},toString:function(){var t=s.instance;return"{ x: "+t.number(this.x)+", y: "+t.number(this.y)+", width: "+t.number(this.width)+", height: "+t.number(this.height)+" }"},_serialize:function(t){var e=t.formatter;return[e.number(this.x),e.number(this.y),e.number(this.width),e.number(this.height)]},getPoint:function(){return new(arguments[0]?o:h)(this.x,this.y,this,"setPoint")},setPoint:function(t){t=o.read(arguments),this.x=t.x,this.y=t.y},getSize:function(){return new(arguments[0]?u:c)(this.width,this.height,this,"setSize")},setSize:function(t){t=u.read(arguments),this._fixX&&(this.x+=(this.width-t.width)*this._fixX),this._fixY&&(this.y+=(this.height-t.height)*this._fixY),this.width=t.width,this.height=t.height,this._fixW=1,this._fixH=1},getLeft:function(){return this.x},setLeft:function(t){this._fixW||(this.width-=t-this.x),this.x=t,this._fixX=0},getTop:function(){return this.y},setTop:function(t){this._fixH||(this.height-=t-this.y),this.y=t,this._fixY=0},getRight:function(){return this.x+this.width},setRight:function(t){void 0!==this._fixX&&1!==this._fixX&&(this._fixW=0),this._fixW?this.x=t-this.width:this.width=t-this.x,this._fixX=1},getBottom:function(){return this.y+this.height},setBottom:function(t){void 0!==this._fixY&&1!==this._fixY&&(this._fixH=0),this._fixH?this.y=t-this.height:this.height=t-this.y,this._fixY=1},getCenterX:function(){return this.x+.5*this.width},setCenterX:function(t){this.x=t-.5*this.width,this._fixX=.5},getCenterY:function(){return this.y+.5*this.height},setCenterY:function(t){this.y=t-.5*this.height,this._fixY=.5},getCenter:function(){return new(arguments[0]?o:h)(this.getCenterX(),this.getCenterY(),this,"setCenter")},setCenter:function(t){return t=o.read(arguments),this.setCenterX(t.x),this.setCenterY(t.y),this},isEmpty:function(){return 0==this.width||0==this.height},contains:function(t){return t&&void 0!==t.width||4==(Array.isArray(t)?t:arguments).length?this._containsRectangle(d.read(arguments)):this._containsPoint(o.read(arguments))},_containsPoint:function(t){var e=t.x,n=t.y;return e>=this.x&&n>=this.y&&e<=this.x+this.width&&n<=this.y+this.height},_containsRectangle:function(t){var e=t.x,n=t.y;return e>=this.x&&n>=this.y&&e+t.width<=this.x+this.width&&n+t.height<=this.y+this.height},intersects:function(t){return t=d.read(arguments),t.x+t.width>this.x&&t.y+t.height>this.y&&t.x<this.x+this.width&&t.y<this.y+this.height},touches:function(t){return t=d.read(arguments),t.x+t.width>=this.x&&t.y+t.height>=this.y&&t.x<=this.x+this.width&&t.y<=this.y+this.height},intersect:function(t){t=d.read(arguments);var e=Math.max(this.x,t.x),n=Math.max(this.y,t.y),i=Math.min(this.x+this.width,t.x+t.width),r=Math.min(this.y+this.height,t.y+t.height);return new d(e,n,i-e,r-n)},unite:function(t){t=d.read(arguments);var e=Math.min(this.x,t.x),n=Math.min(this.y,t.y),i=Math.max(this.x+this.width,t.x+t.width),r=Math.max(this.y+this.height,t.y+t.height);return new d(e,n,i-e,r-n)},include:function(t){t=o.read(arguments);var e=Math.min(this.x,t.x),n=Math.min(this.y,t.y),i=Math.max(this.x+this.width,t.x),r=Math.max(this.y+this.height,t.y);return new d(e,n,i-e,r-n)},expand:function(t,e){return void 0===e&&(e=t),new d(this.x-t/2,this.y-e/2,this.width+t,this.height+e)},scale:function(t,e){return this.expand(this.width*t-this.width,this.height*(void 0===e?t:e)-this.height)}},new function(){return t.each([["Top","Left"],["Top","Right"],["Bottom","Left"],["Bottom","Right"],["Left","Center"],["Top","Center"],["Right","Center"],["Bottom","Center"]],function(t,e){var n=t.join(""),i=/^[RL]/.test(n);e>=4&&(t[1]+=i?"Y":"X");var r=t[i?0:1],s=t[i?1:0],a="get"+r,u="get"+s,c="set"+r,l="set"+s,d="get"+n,f="set"+n;this[d]=function(){return new(arguments[0]?o:h)(this[a](),this[u](),this,f)},this[f]=function(t){t=o.read(arguments),this[c](t.x),this[l](t.y)}},{})}),f=d.extend({initialize:function(t,e,n,i,r,s){this.set(t,e,n,i,!0),this._owner=r,this._setter=s},set:function(t,e,n,i,r){return this._x=t,this._y=e,this._width=n,this._height=i,r||this._owner[this._setter](this),this}},new function(){var e=d.prototype;return t.each(["x","y","width","height"],function(e){var n=t.capitalize(e),i="_"+e;this["get"+n]=function(){return this[i]},this["set"+n]=function(t){this[i]=t,this._dontNotify||this._owner[this._setter](this)}},t.each(["Point","Size","Center","Left","Top","Right","Bottom","CenterX","CenterY","TopLeft","TopRight","BottomLeft","BottomRight","LeftCenter","TopCenter","RightCenter","BottomCenter"],function(t){var n="set"+t;this[n]=function(){this._dontNotify=!0,e[n].apply(this,arguments),delete this._dontNotify,this._owner[this._setter](this)}},{isSelected:function(){return this._owner._boundsSelected},setSelected:function(t){var e=this._owner;e.setSelected&&(e._boundsSelected=t,e.setSelected(t||e._selectedSegmentState>0))}}))}),_=t.extend({_class:"Matrix",initialize:function re(t){var e=arguments.length,n=!0;if(6==e?this.set.apply(this,arguments):1==e?t instanceof re?this.set(t._a,t._c,t._b,t._d,t._tx,t._ty):Array.isArray(t)?this.set.apply(this,t):n=!1:0==e?this.reset():n=!1,!n)throw Error("Unsupported matrix parameters")},set:function(t,e,n,i,r,s){return this._a=t,this._c=e,this._b=n,this._d=i,this._tx=r,this._ty=s,this},_serialize:function(e){return t.serialize(this.getValues(),e)},clone:function(){return new _(this._a,this._c,this._b,this._d,this._tx,this._ty)},equals:function(t){return t===this||t&&this._a==t._a&&this._b==t._b&&this._c==t._c&&this._d==t._d&&this._tx==t._tx&&this._ty==t._ty||!1},toString:function(){var t=s.instance;return"[["+[t.number(this._a),t.number(this._b),t.number(this._tx)].join(", ")+"], ["+[t.number(this._c),t.number(this._d),t.number(this._ty)].join(", ")+"]]"},reset:function(){return this._a=this._d=1,this._c=this._b=this._tx=this._ty=0,this},scale:function(){var t=o.read(arguments),e=o.read(arguments,0,0,{readNull:!0});return e&&this.translate(e),this._a*=t.x,this._c*=t.x,this._b*=t.y,this._d*=t.y,e&&this.translate(e.negate()),this},translate:function(t){t=o.read(arguments);var e=t.x,n=t.y;return this._tx+=e*this._a+n*this._b,this._ty+=e*this._c+n*this._d,this},rotate:function(t,e){e=o.read(arguments,1),t=t*Math.PI/180;var n=e.x,i=e.y,r=Math.cos(t),s=Math.sin(t),a=n-n*r+i*s,h=i-n*s-i*r,u=this._a,c=this._b,l=this._c,d=this._d;return this._a=r*u+s*c,this._b=-s*u+r*c,this._c=r*l+s*d,this._d=-s*l+r*d,this._tx+=a*u+h*c,this._ty+=a*l+h*d,this},shear:function(){var t=o.read(arguments),e=o.read(arguments,0,0,{readNull:!0});e&&this.translate(e);var n=this._a,i=this._c;return this._a+=t.y*this._b,this._c+=t.y*this._d,this._b+=t.x*n,this._d+=t.x*i,e&&this.translate(e.negate()),this},isIdentity:function(){return 1==this._a&&0==this._c&&0==this._b&&1==this._d&&0==this._tx&&0==this._ty},isInvertible:function(){return!!this._getDeterminant()},isSingular:function(){return!this._getDeterminant()},concatenate:function(t){var e=this._a,n=this._b,i=this._c,r=this._d;return this._a=t._a*e+t._c*n,this._b=t._b*e+t._d*n,this._c=t._a*i+t._c*r,this._d=t._b*i+t._d*r,this._tx+=t._tx*e+t._ty*n,this._ty+=t._tx*i+t._ty*r,this},preConcatenate:function(t){var e=this._a,n=this._b,i=this._c,r=this._d,s=this._tx,a=this._ty;return this._a=t._a*e+t._b*i,this._b=t._a*n+t._b*r,this._c=t._c*e+t._d*i,this._d=t._c*n+t._d*r,this._tx=t._a*s+t._b*a+t._tx,this._ty=t._c*s+t._d*a+t._ty,this},transform:function(t,e,n,i,r){return arguments.length<5?this._transformPoint(o.read(arguments)):this._transformCoordinates(t,e,n,i,r)},_transformPoint:function(t,e,n){var i=t.x,r=t.y;return e||(e=new o),e.set(i*this._a+r*this._b+this._tx,i*this._c+r*this._d+this._ty,n)},_transformCoordinates:function(t,e,n,i,r){for(var s=e,a=i,o=e+2*r;o>s;){var h=t[s++],u=t[s++];n[a++]=h*this._a+u*this._b+this._tx,n[a++]=h*this._c+u*this._d+this._ty}return n},_transformCorners:function(t){var e=t.x,n=t.y,i=e+t.width,r=n+t.height,s=[e,n,i,n,i,r,e,r];return this._transformCoordinates(s,0,s,0,4)},_transformBounds:function(t,e,n){for(var i=this._transformCorners(t),r=i.slice(0,2),s=i.slice(),a=2;8>a;a++){var o=i[a],h=1&a;o<r[h]?r[h]=o:o>s[h]&&(s[h]=o)}return e||(e=new d),e.set(r[0],r[1],s[0]-r[0],s[1]-r[1],n)},inverseTransform:function(){return this._inverseTransform(o.read(arguments))},_getDeterminant:function(){var t=this._a*this._d-this._b*this._c;return isFinite(t)&&!a.isZero(t)&&isFinite(this._tx)&&isFinite(this._ty)?t:null},_inverseTransform:function(t,e,n){var i=this._getDeterminant();if(!i)return null;var r=t.x-this._tx,s=t.y-this._ty;return e||(e=new o),e.set((r*this._d-s*this._b)/i,(s*this._a-r*this._c)/i,n)},decompose:function(){var t=this._a,e=this._b,n=this._c,i=this._d;if(a.isZero(t*i-e*n))return null;var r=Math.sqrt(t*t+e*e);t/=r,e/=r;var s=t*n+e*i;n-=t*s,i-=e*s;var h=Math.sqrt(n*n+i*i);return n/=h,i/=h,s/=h,e*n>t*i&&(t=-t,e=-e,s=-s,r=-r),{translation:this.getTranslation(),scaling:new o(r,h),rotation:180*-Math.atan2(e,t)/Math.PI,shearing:s}},getValues:function(){return[this._a,this._c,this._b,this._d,this._tx,this._ty]
},getTranslation:function(){return new o(this._tx,this._ty)},getScaling:function(){return(this.decompose()||{}).scaling},getRotation:function(){return(this.decompose()||{}).rotation},inverted:function(){var t=this._getDeterminant();return t&&new _(this._d/t,-this._c/t,-this._b/t,this._a/t,(this._b*this._ty-this._d*this._tx)/t,(this._c*this._tx-this._a*this._ty)/t)},shiftless:function(){return new _(this._a,this._c,this._b,this._d,0,0)},applyToContext:function(t){t.transform(this._a,this._c,this._b,this._d,this._tx,this._ty)}},new function(){return t.each({scaleX:"_a",scaleY:"_d",translateX:"_tx",translateY:"_ty",shearX:"_b",shearY:"_c"},function(e,n){n=t.capitalize(n),this["get"+n]=function(){return this[e]},this["set"+n]=function(t){this[e]=t}},{})}),g=t.extend({_class:"Line",initialize:function(t,e,n,i,r){var s=!1;arguments.length>=4?(this._px=t,this._py=e,this._vx=n,this._vy=i,s=r):(this._px=t.x,this._py=t.y,this._vx=e.x,this._vy=e.y,s=n),s||(this._vx-=this._px,this._vy-=this._py)},getPoint:function(){return new o(this._px,this._py)},getVector:function(){return new o(this._vx,this._vy)},getLength:function(){return this.getVector().getLength()},intersect:function(t,e){return g.intersect(this._px,this._py,this._vx,this._vy,t._px,t._py,t._vx,t._vy,!0,e)},getSide:function(t){return g.getSide(this._px,this._py,this._vx,this._vy,t.x,t.y,!0)},getDistance:function(t){return Math.abs(g.getSignedDistance(this._px,this._py,this._vx,this._vy,t.x,t.y,!0))},statics:{intersect:function(t,e,n,i,r,s,h,u,c,l){c||(n-=t,i-=e,h-=r,u-=s);var d=u*n-h*i;if(!a.isZero(d)){var f=t-r,_=e-s,g=(h*_-u*f)/d,p=(n*_-i*f)/d;if((l||g>=0&&1>=g)&&(l||p>=0&&1>=p))return new o(t+g*n,e+g*i)}},getSide:function(t,e,n,i,r,s,a){a||(n-=t,i-=e);var o=r-t,h=s-e,u=o*i-h*n;return 0===u&&(u=o*n+h*i,u>0&&(o-=n,h-=i,u=o*n+h*i,0>u&&(u=0))),0>u?-1:u>0?1:0},getSignedDistance:function(t,e,n,i,r,s,a){a||(n-=t,i-=e);var o=i/n,h=e-o*t;return(s-o*r-h)/Math.sqrt(o*o+1)}}}),p=r.extend({_class:"Project",_list:"projects",_reference:"project",initialize:function(t){r.call(this,!0),this.layers=[],this.symbols=[],this._currentStyle=new F,this.activeLayer=new w,t&&(this.view=t instanceof V?t:V.create(t)),this._selectedItems={},this._selectedItemCount=0,this._drawCount=0,this.options={}},_serialize:function(e,n){return t.serialize(this.layers,e,!0,n)},clear:function(){for(var t=this.layers.length-1;t>=0;t--)this.layers[t].remove();this.symbols=[]},remove:function se(){return se.base.call(this)?(this.view&&this.view.remove(),!0):!1},getCurrentStyle:function(){return this._currentStyle},setCurrentStyle:function(t){this._currentStyle.initialize(t)},getIndex:function(){return this._index},getSelectedItems:function(){var t=[];for(var e in this._selectedItems){var n=this._selectedItems[e];n._drawCount===this._drawCount&&t.push(n)}return t},_updateSelection:function(t){t._selected?(this._selectedItemCount++,this._selectedItems[t._id]=t,t.isInserted()&&(t._drawCount=this._drawCount)):(this._selectedItemCount--,delete this._selectedItems[t._id])},selectAll:function(){for(var t=0,e=this.layers.length;e>t;t++)this.layers[t].setSelected(!0)},deselectAll:function(){for(var t in this._selectedItems)this._selectedItems[t].setSelected(!1)},hitTest:function(e,n){e=o.read(arguments),n=S.getOptions(t.read(arguments));for(var i=this.layers.length-1;i>=0;i--){var r=this.layers[i].hitTest(e,n);if(r)return r}return null},importJSON:function(e){return this.activate(),t.importJSON(e)},draw:function(e,n){this._drawCount++,e.save(),n.applyToContext(e);for(var i=t.merge({offset:new o(0,0),transforms:[n]}),r=0,s=this.layers.length;s>r;r++)this.layers[r].draw(e,i);if(e.restore(),this._selectedItemCount>0){e.save(),e.strokeWidth=1;for(var a in this._selectedItems){var h=this._selectedItems[a];if(h._drawCount===this._drawCount&&(h._drawSelected||h._boundsSelected)){var u=h.getSelectedColor()||h.getLayer().getSelectedColor();e.strokeStyle=e.fillStyle=u?u.toCanvasStyle(e):"#009dec";var c=h._globalMatrix;if(h._drawSelected&&h._drawSelected(e,c),h._boundsSelected){var l=c._transformCorners(h._getBounds("getBounds"));e.beginPath();for(var r=0;8>r;r++)e[0===r?"moveTo":"lineTo"](l[r],l[++r]);e.closePath(),e.stroke();for(var r=0;8>r;r++)e.beginPath(),e.rect(l[r]-2,l[++r]-2,4,4),e.fill()}}}e.restore()}}}),v=t.extend({_class:"Symbol",initialize:function ae(t,e){this._id=ae._id=(ae._id||0)+1,this.project=paper.project,this.project.symbols.push(this),t&&this.setDefinition(t,e),this._instances={}},_serialize:function(e,n){return n.add(this,function(){return t.serialize([this._class,this._definition],e,!1,n)})},_changed:function(e){t.each(this._instances,function(t){t._changed(e)})},getDefinition:function(){return this._definition},setDefinition:function(t){t._parentSymbol&&(t=t.clone()),this._definition&&delete this._definition._parentSymbol,this._definition=t,t.remove(),t.setSelected(!1),arguments[1]||t.setPosition(new o),t._parentSymbol=this,this._changed(5)},place:function(t){return new C(this,t)},clone:function(){return new v(this._definition.clone(!1))}}),m=t.extend(e,{statics:{extend:function oe(e){e._serializeFields&&(e._serializeFields=t.merge(this.prototype._serializeFields,e._serializeFields));var n=oe.base.apply(this,arguments),i=n.prototype,r=i._class;return r&&(i._type=t.hyphenate(r)),n}},_class:"Item",_transformContent:!0,_boundsSelected:!1,_serializeFields:{name:null,matrix:new _,locked:!1,visible:!0,blendMode:"normal",opacity:1,guide:!1,clipMask:!1,data:{}},initialize:function(){},_initialize:function(t,e){if(this._id=m._id=(m._id||0)+1,!this._project){var n=paper.project,i=n.activeLayer;!i||t&&t.insert===!1?this._setProject(n):i.addChild(this)}return this._style=new F(this._project._currentStyle,this),this._matrix=new _,e&&this._matrix.translate(e),t?this._set(t,{insert:!0}):!0},_events:new function(){var e={mousedown:{mousedown:1,mousedrag:1,click:1,doubleclick:1},mouseup:{mouseup:1,mousedrag:1,click:1,doubleclick:1},mousemove:{mousedrag:1,mousemove:1,mouseenter:1,mouseleave:1}},n={install:function(t){var n=this._project.view._eventCounters;if(n)for(var i in e)n[i]=(n[i]||0)+(e[i][t]||0)},uninstall:function(t){var n=this._project.view._eventCounters;if(n)for(var i in e)n[i]-=e[i][t]||0}};return t.each(["onMouseDown","onMouseUp","onMouseDrag","onClick","onDoubleClick","onMouseMove","onMouseEnter","onMouseLeave"],function(t){this[t]=n},{onFrame:{install:function(){this._project.view._animateItem(this,!0)},uninstall:function(){this._project.view._animateItem(this,!1)}},onLoad:{}})},_serialize:function(e,n){function i(i){for(var a in i){var o=s[a];t.equals(o,i[a])||(r[a]=t.serialize(o,e,"data"!==a,n))}}var r={},s=this;return i(this._serializeFields),this instanceof y||i(this._style._defaults),[this._class,r]},_changed:function(t){var e=this._parent,n=this._project,i=this._parentSymbol;if(4&t&&(delete this._bounds,delete this._position),e&&12&t&&e._clearBoundsCache(),2&t&&this._clearBoundsCache(),n&&(1&t&&(n._needsRedraw=!0),n._changes)){var r=n._changesById[this._id];r?r.flags|=t:(r={item:this,flags:t},n._changesById[this._id]=r,n._changes.push(r))}i&&i._changed(t)},set:function(t){return t&&this._set(t),this},getId:function(){return this._id},getType:function(){return this._type},getName:function(){return this._name},setName:function(t,e){if(this._name&&this._removeFromNamed(),t&&this._parent){for(var n=this._parent._children,i=this._parent._namedChildren,r=t,s=1;e&&n[t];)t=r+" "+s++;(i[t]=i[t]||[]).push(this),n[t]=this}this._name=t||void 0,this._changed(32)},getStyle:function(){return this._style},setStyle:function(t){this.getStyle().set(t)},hasFill:function(){return!!this.getStyle().getFillColor()},hasStroke:function(){var t=this.getStyle();return!!t.getStrokeColor()&&t.getStrokeWidth()>0}},t.each(["locked","visible","blendMode","opacity","guide"],function(e){var n=t.capitalize(e),e="_"+e;this["get"+n]=function(){return this[e]},this["set"+n]=function(t){t!=this[e]&&(this[e]=t,this._changed("_locked"===e?32:33))}},{}),{_locked:!1,_visible:!0,_blendMode:"normal",_opacity:1,_guide:!1,isSelected:function(){if(this._children)for(var t=0,e=this._children.length;e>t;t++)if(this._children[t].isSelected())return!0;return this._selected},setSelected:function(t){if(this._children&&!arguments[1])for(var e=0,n=this._children.length;n>e;e++)this._children[e].setSelected(t);(t=!!t)!=this._selected&&(this._selected=t,this._project._updateSelection(this),this._changed(33))},_selected:!1,isFullySelected:function(){if(this._children&&this._selected){for(var t=0,e=this._children.length;e>t;t++)if(!this._children[t].isFullySelected())return!1;return!0}return this._selected},setFullySelected:function(t){if(this._children)for(var e=0,n=this._children.length;n>e;e++)this._children[e].setFullySelected(t);this.setSelected(t,!0)},isClipMask:function(){return this._clipMask},setClipMask:function(t){this._clipMask!=(t=!!t)&&(this._clipMask=t,t&&(this.setFillColor(null),this.setStrokeColor(null)),this._changed(33),this._parent&&this._parent._changed(256))},_clipMask:!1,getData:function(){return this._data||(this._data={}),this._data},setData:function(t){this._data=t},getPosition:function(){var t=this._position||(this._position=this.getBounds().getCenter(!0));return new(arguments[0]?o:h)(t.x,t.y,this,"setPosition")},setPosition:function(){this.translate(o.read(arguments).subtract(this.getPosition(!0)))},getMatrix:function(){return this._matrix},setMatrix:function(t){this._matrix.initialize(t),this._changed(5)},isEmpty:function(){return 0==this._children.length}},t.each(["getBounds","getStrokeBounds","getHandleBounds","getRoughBounds"],function(t){this[t]=function(){var e=this._boundsGetter,n=this._getCachedBounds("string"==typeof e?e:e&&e[t]||t,arguments[0]);return"getBounds"===t?new f(n.x,n.y,n.width,n.height,this,"setBounds"):n}},{_getCachedBounds:function(t,e,n){var i=(!e||e.equals(this._matrix))&&t;if(n&&this._parent){var r=n._id,s=this._parent._boundsCache=this._parent._boundsCache||{ids:{},list:[]};s.ids[r]||(s.list.push(n),s.ids[r]=n)}if(i&&this._bounds&&this._bounds[i])return this._bounds[i].clone();var a=this._matrix.isIdentity();e=!e||e.isIdentity()?a?null:this._matrix:a?e:e.clone().concatenate(this._matrix);var o=this._getBounds(t,e,i?this:n);return i&&(this._bounds||(this._bounds={}),this._bounds[i]=o.clone()),o},_clearBoundsCache:function(){if(this._boundsCache){for(var t=0,e=this._boundsCache.list,n=e.length;n>t;t++){var i=e[t];delete i._bounds,i!=this&&i._boundsCache&&i._clearBoundsCache()}delete this._boundsCache}},_getBounds:function(t,e,n){var i=this._children;if(!i||0==i.length)return new d;for(var r=1/0,s=-r,a=r,o=s,h=0,u=i.length;u>h;h++){var c=i[h];if(c._visible&&!c.isEmpty()){var l=c._getCachedBounds(t,e,n);r=Math.min(l.x,r),a=Math.min(l.y,a),s=Math.max(l.x+l.width,s),o=Math.max(l.y+l.height,o)}}return isFinite(r)?new d(r,a,s-r,o-a):new d},setBounds:function(t){t=d.read(arguments);var e=this.getBounds(),n=new _,i=t.getCenter();n.translate(i),(t.width!=e.width||t.height!=e.height)&&n.scale(0!=e.width?t.width/e.width:1,0!=e.height?t.height/e.height:1),i=e.getCenter(),n.translate(-i.x,-i.y),this.transform(n)}}),{getProject:function(){return this._project},_setProject:function(t){if(this._project!=t&&(this._project=t,this._children))for(var e=0,n=this._children.length;n>e;e++)this._children[e]._setProject(t)},getLayer:function(){for(var t=this;t=t._parent;)if(t instanceof w)return t;return null},getParent:function(){return this._parent},setParent:function(t){return t.addChild(this)},getChildren:function(){return this._children},setChildren:function(t){this.removeChildren(),this.addChildren(t)},getFirstChild:function(){return this._children&&this._children[0]||null},getLastChild:function(){return this._children&&this._children[this._children.length-1]||null},getNextSibling:function(){return this._parent&&this._parent._children[this._index+1]||null},getPreviousSibling:function(){return this._parent&&this._parent._children[this._index-1]||null},getIndex:function(){return this._index},isInserted:function(){return this._parent?this._parent.isInserted():!1},clone:function(t){return this._clone(new this.constructor({insert:!1}),t)},_clone:function(t,e){if(t.setStyle(this._style),this._children)for(var n=0,i=this._children.length;i>n;n++)t.addChild(this._children[n].clone(!1),!0);(e||void 0===e)&&t.insertAbove(this);for(var r=["_locked","_visible","_blendMode","_opacity","_clipMask","_guide"],n=0,i=r.length;i>n;n++){var s=r[n];this.hasOwnProperty(s)&&(t[s]=this[s])}return t._matrix.initialize(this._matrix),t.setSelected(this._selected),this._name&&t.setName(this._name,!0),t},copyTo:function(t){var e=this.clone();return t.layers?t.activeLayer.addChild(e):t.addChild(e),e},rasterize:function(e){var n=this.getStrokeBounds(),i=(e||72)/72,r=n.getTopLeft().floor(),s=n.getBottomRight().ceil();size=new u(s.subtract(r)),canvas=Y.getCanvas(size),ctx=canvas.getContext("2d"),matrix=(new _).scale(i).translate(r.negate()),ctx.save(),matrix.applyToContext(ctx),this.draw(ctx,t.merge({transforms:[matrix]}));var a=new b(canvas);return a.setPosition(r.add(size.divide(2))),ctx.restore(),a},contains:function(){return!!this._contains(this._matrix._inverseTransform(o.read(arguments)))},_contains:function(t){if(this._children){for(var e=this._children.length-1;e>=0;e--)if(this._children[e].contains(t))return!0;return!1}return t.isInside(this._getBounds("getBounds"))},hitTest:function(e,n){function i(i,r){var o=a["get"+r]();return e.getDistance(o)<n.tolerance?new S(i,s,{name:t.hyphenate(r),point:o}):void 0}if(e=o.read(arguments),n=S.getOptions(t.read(arguments)),this._locked||!this._visible||this._guide&&!n.guides)return null;if(!this._children&&!this.getRoughBounds().expand(n.tolerance)._containsPoint(e))return null;e=this._matrix._inverseTransform(e);var r,s=this;if(!(!n.center&&!n.bounds||this instanceof w&&!this._parent)){var a=this._getBounds("getBounds");if(n.center&&(r=i("center","Center")),!r&&n.bounds)for(var h=["TopLeft","TopRight","BottomLeft","BottomRight","LeftCenter","TopCenter","RightCenter","BottomCenter"],u=0;8>u&&!r;u++)r=i("bounds",h[u])}return(r||(r=this._children||!(n.guides&&!this._guide||n.selected&&!this._selected)?this._hitTest(e,n):null))&&r.point&&(r.point=s._matrix.transform(r.point)),r},_hitTest:function(t,e){if(this._children){for(var n,i=this._children.length-1;i>=0;i--)if(n=this._children[i].hitTest(t,e))return n}else if(e.fill&&this.hasFill()&&this._contains(t))return new S("fill",this)},importJSON:function(e){return this.addChild(t.importJSON(e))},addChild:function(t,e){return this.insertChild(void 0,t,e)},insertChild:function(t,e,n){var i=this.insertChildren(t,[e],n);return i&&i[0]},addChildren:function(t,e){return this.insertChildren(this._children.length,t,e)},insertChildren:function(e,n,i,r){var s=this._children;if(s&&n&&n.length>0){n=Array.prototype.slice.apply(n);for(var a=n.length-1;a>=0;a--){var o=n[a];r&&o._type!==r?n.splice(a,1):o._remove(!0)}t.splice(s,n,e,0);for(var a=0,h=n.length;h>a;a++){var o=n[a];o._parent=this,o._setProject(this._project),o._name&&o.setName(o._name)}this._changed(7)}else n=null;return n},_insert:function(t,e,n){if(!e._parent)return null;var i=e._index+(t?1:0);return e._parent===this._parent&&i>this._index&&i--,e._parent.insertChild(i,this,n)},insertAbove:function(t,e){return this._insert(!0,t,e)},insertBelow:function(t,e){return this._insert(!1,t,e)},sendToBack:function(){return this._parent.insertChild(0,this)},bringToFront:function(){return this._parent.addChild(this)},appendTop:"#addChild",appendBottom:function(t){return this.insertChild(0,t)},moveAbove:"#insertAbove",moveBelow:"#insertBelow",_removeFromNamed:function(){var t=this._parent._children,e=this._parent._namedChildren,n=this._name,i=e[n],r=i?i.indexOf(this):-1;-1!=r&&(t[n]==this&&delete t[n],i.splice(r,1),i.length?t[n]=i[i.length-1]:delete e[n])},_remove:function(e){return this._parent?(this._name&&this._removeFromNamed(),null!=this._index&&t.splice(this._parent._children,null,this._index,1),e&&this._parent._changed(7),this._parent=null,!0):!1},remove:function(){return this._remove(!0)},removeChildren:function(e,n){if(!this._children)return null;e=e||0,n=t.pick(n,this._children.length);for(var i=t.splice(this._children,null,e,n-e),r=i.length-1;r>=0;r--)i[r]._remove(!1);return i.length>0&&this._changed(7),i},reverseChildren:function(){if(this._children){this._children.reverse();for(var t=0,e=this._children.length;e>t;t++)this._children[t]._index=t;this._changed(7)}},isEditable:function(){for(var t=this;t;){if(!t._visible||t._locked)return!1;t=t._parent}return!0},_getOrder:function(t){function e(t){var e=[];do e.unshift(t);while(t=t._parent);return e}for(var n=e(this),i=e(t),r=0,s=Math.min(n.length,i.length);s>r;r++)if(n[r]!=i[r])return n[r]._index<i[r]._index?1:-1;return 0},hasChildren:function(){return this._children&&this._children.length>0},isAbove:function(t){return-1===this._getOrder(t)},isBelow:function(t){return 1===this._getOrder(t)},isParent:function(t){return this._parent===t},isChild:function(t){return t&&t._parent===this},isDescendant:function(t){for(var e=this;e=e._parent;)if(e==t)return!0;return!1},isAncestor:function(t){return t?t.isDescendant(this):!1},isGroupedWith:function(t){for(var e=this._parent;e;){if(e._parent&&/^(group|layer|compound-path)$/.test(e._type)&&t.isDescendant(e))return!0;e=e._parent}return!1},scale:function(t,e,n){return(arguments.length<2||"object"==typeof e)&&(n=e,e=t),this.transform((new _).scale(t,e,n||this.getPosition(!0)))},translate:function(){var t=new _;return this.transform(t.translate.apply(t,arguments))},rotate:function(t,e){return this.transform((new _).rotate(t,e||this.getPosition(!0)))},shear:function(t,e,n){return(arguments.length<2||"object"==typeof e)&&(n=e,e=t),this.transform((new _).shear(t,e,n||this.getPosition(!0)))},transform:function(t){var e=this._bounds,n=this._position;if(this._matrix.preConcatenate(t),(this._transformContent||arguments[1])&&this.applyMatrix(!0),this._changed(5),e&&0===t.getRotation()%90){for(var i in e){var r=e[i];t._transformBounds(r,r)}var s=this._boundsGetter,r=e[s&&s.getBounds||s||"getBounds"];r&&(this._position=r.getCenter(!0)),this._bounds=e}else n&&(this._position=t._transformPoint(n,n));return this},_applyMatrix:function(t,e){var n=this._children;if(n&&n.length>0){for(var i=0,r=n.length;r>i;i++)n[i].transform(t,e);return!0}},applyMatrix:function(t){var e=this._matrix;if(this._applyMatrix(e,!0)){var n=this._style,i=n.getFillColor(!0),r=n.getStrokeColor(!0);i&&i.transform(e),r&&r.transform(e),e.reset()}t||this._changed(5)},fitBounds:function(t,e){t=d.read(arguments);var n=this.getBounds(),i=n.height/n.width,r=t.height/t.width,s=(e?i>r:r>i)?t.width/n.width:t.height/n.height,a=new d(new o,new u(n.width*s,n.height*s));a.setCenter(t.getCenter()),this.setBounds(a)},_setStyles:function(t){var e=this._style,n=e.getStrokeWidth(),i=e.getStrokeJoin(),r=e.getStrokeCap(),s=e.getMiterLimit(),a=e.getFillColor(),o=e.getStrokeColor(),h=e.getShadowColor();if(null!=n&&(t.lineWidth=n),i&&(t.lineJoin=i),r&&(t.lineCap=r),s&&(t.miterLimit=s),a&&(t.fillStyle=a.toCanvasStyle(t)),o){t.strokeStyle=o.toCanvasStyle(t);var u=e.getDashArray(),c=e.getDashOffset();paper.support.nativeDash&&u&&u.length&&("setLineDash"in t?(t.setLineDash(u),t.lineDashOffset=c):(t.mozDash=u,t.mozDashOffset=c))}if(h){t.shadowColor=h.toCanvasStyle(t),t.shadowBlur=e.getShadowBlur();var l=this.getShadowOffset();t.shadowOffsetX=l.x,t.shadowOffsetY=l.y}},draw:function(t,e){if(this._visible&&0!==this._opacity){this._drawCount=this._project._drawCount;var n=e.transforms,i=n[n.length-1],r=i.clone().concatenate(this._matrix);n.push(this._globalMatrix=r);var s,a,o,h=this._blendMode,c=this._opacity,l="normal"===h,d=K.nativeModes[h],f=l&&1===c||(d||l&&1>c)&&this._canComposite();if(!f){var _=this.getStrokeBounds(i);if(!_.width||!_.height)return;o=e.offset,a=e.offset=_.getTopLeft().floor(),s=t,t=Y.getContext(_.getSize().ceil().add(new u(1,1)))}t.save(),f?(t.globalAlpha=c,d&&(t.globalCompositeOperation=h)):t.translate(-a.x,-a.y),(f?this._matrix:r).applyToContext(t),!f&&e.clipItem&&e.clipItem.draw(t,e.extend({clip:!0})),this._draw(t,e),t.restore(),n.pop(),e.clip&&t.clip(),f||(K.process(h,t,s,c,a.subtract(o)),Y.release(t),e.offset=o)}},_canComposite:function(){return!1}},t.each(["down","drag","up","move"],function(e){this["removeOn"+t.capitalize(e)]=function(){var t={};return t[e]=!0,this.removeOn(t)}},{removeOn:function(t){for(var e in t)if(t[e]){var n="mouse"+e,i=this._project,r=i._removeSets=i._removeSets||{};r[n]=r[n]||{},r[n][this._id]=this}return this}})),y=m.extend({_class:"Group",_serializeFields:{children:[]},initialize:function(t){this._children=[],this._namedChildren={},this._initialize(t)||this.addChildren(Array.isArray(t)?t:arguments)},_changed:function he(t){he.base.call(this,t),2&t&&this._transformContent&&!this._matrix.isIdentity()&&this.applyMatrix(),258&t&&delete this._clipItem},_getClipItem:function(){if(void 0!==this._clipItem)return this._clipItem;for(var t=0,e=this._children.length;e>t;t++){var n=this._children[t];if(n._clipMask)return this._clipItem=n}return this._clipItem=null},getTransformContent:function(){return this._transformContent},setTransformContent:function(t){this._transformContent=t,t&&this.applyMatrix()},isClipped:function(){return!!this._getClipItem()},setClipped:function(t){var e=this.getFirstChild();e&&e.setClipMask(t)},_draw:function(t,e){var n=e.clipItem=this._getClipItem();n&&n.draw(t,e.extend({clip:!0}));for(var i=0,r=this._children.length;r>i;i++){var s=this._children[i];s!==n&&s.draw(t,e)}e.clipItem=null}}),w=y.extend({_class:"Layer",initialize:function(){this._project=paper.project,this._index=this._project.layers.push(this)-1,y.apply(this,arguments),this.activate()},_remove:function ue(e){return this._parent?ue.base.call(this,e):null!=this._index?(this._project.activeLayer===this&&(this._project.activeLayer=this.getNextSibling()||this.getPreviousSibling()),t.splice(this._project.layers,null,this._index,1),this._project._needsRedraw=!0,!0):!1},getNextSibling:function ce(){return this._parent?ce.base.call(this):this._project.layers[this._index+1]||null},getPreviousSibling:function le(){return this._parent?le.base.call(this):this._project.layers[this._index-1]||null},isInserted:function de(){return this._parent?de.base.call(this):null!=this._index},activate:function(){this._project.activeLayer=this},_insert:function fe(e,n,i){return n instanceof w&&!n._parent&&this._remove(!0)?(t.splice(n._project.layers,[this],n._index+(e?1:0),0),this._setProject(n._project),this):fe.base.call(this,e,n,i)}}),x=m.extend({_class:"Shape",_transformContent:!1,initialize:function(t,e,n,i){this._initialize(i,e),this._type=t,this._size=n},getSize:function(){var t=this._size;return new c(t.width,t.height,this,"setSize")},setSize:function(){var t=u.read(arguments);this._size.equals(t)||(this._size.set(t.width,t.height),this._changed(5))},getRadius:function(){var t=this._size;return(t.width+t.height)/4},setRadius:function(t){var e=2*t;this.setSize(e,e)},_draw:function(t,e){var n=this._style,i=this._size,r=i.width,s=i.height,o=n.getFillColor(),h=n.getStrokeColor();if(o||h||e.clip)switch(t.beginPath(),this._type){case"rect":t.rect(-r/2,-s/2,r,s);break;case"circle":t.arc(0,0,(r+s)/4,0,2*Math.PI,!0);break;case"ellipse":var u=r/2,c=s/2,l=a.KAPPA,d=u*l,f=c*l;t.moveTo(-u,0),t.bezierCurveTo(-u,-f,-d,-c,0,-c),t.bezierCurveTo(d,-c,u,-f,u,0),t.bezierCurveTo(u,f,d,c,0,c),t.bezierCurveTo(-d,c,-u,f,-u,0)}e.clip||!o&&!h||(this._setStyles(t),o&&t.fill(),h&&t.stroke())},_canComposite:function(){return!(this.hasFill()&&this.hasStroke())},_getBounds:function(t,e){var n=new d(this._size).setCenter(0,0);return"getBounds"!==t&&this.hasStroke()&&(n=n.expand(this.getStrokeWidth())),e?e._transformBounds(n):n},_contains:function _e(t){switch(this._type){case"rect":return _e.base.call(this,t);case"circle":case"ellipse":return t.divide(this._size).getLength()<=.5}},_hitTest:function ge(t){if(this.hasStroke()){var e=this._type,n=this.getStrokeWidth();switch(e){case"rect":var i=new d(this._size).setCenter(0,0),r=i.expand(n),s=i.expand(-n);if(r._containsPoint(t)&&!s._containsPoint(t))return new S("stroke",this);break;case"circle":case"ellipse":var a,o=this._size,h=o.width,u=o.height;if("ellipse"===e){var c=t.getAngleInRadians(),l=h*Math.sin(c),f=u*Math.cos(c);a=h*u/(2*Math.sqrt(l*l+f*f))}else a=(h+u)/4;if(2*Math.abs(t.getLength()-a)<=n)return new S("stroke",this)}}return ge.base.apply(this,arguments)},statics:new function(){function e(e,n,i,r){return new x(e,n,i,t.getNamed(r))}return{Circle:function(){var n=o.readNamed(arguments,"center"),i=t.readNamed(arguments,"radius");return e("circle",n,new u(2*i),arguments)},Rectangle:function(){var t=d.readNamed(arguments,"rectangle");return e("rect",t.getCenter(!0),t.getSize(!0),arguments)},Ellipse:function(){var t=d.readNamed(arguments,"rectangle");return e("ellipse",t.getCenter(!0),t.getSize(!0),arguments)}}}}),b=m.extend({_class:"Raster",_transformContent:!1,_boundsGetter:"getBounds",_boundsSelected:!0,_serializeFields:{source:null},initialize:function(t,e){this._initialize(t,void 0!==e&&o.read(arguments,1))||(t.getContext?this.setCanvas(t):"string"==typeof t?this.setSource(t):this.setImage(t)),this._size||(this._size=new u)},clone:function(t){var e={insert:!1},n=this._image;if(n)e.image=n;else if(this._canvas){var i=e.canvas=Y.getCanvas(this._size);i.getContext("2d").drawImage(this._canvas,0,0)}return this._clone(new b(e),t)},getSize:function(){var t=this._size;return new c(t.width,t.height,this,"setSize")},setSize:function(){var t=u.read(arguments);if(!this._size.equals(t)){var e=this.getElement();this.setCanvas(Y.getCanvas(t)),e&&this.getContext(!0).drawImage(e,0,0,t.width,t.height)}},getWidth:function(){return this._size.width},getHeight:function(){return this._size.height},isEmpty:function(){return 0==this._size.width&&0==this._size.height},getPpi:function(){var t=this._matrix,e=new o(0,0).transform(t),n=new o(1,0).transform(t).subtract(e),i=new o(0,1).transform(t).subtract(e);return new u(72/n.getLength(),72/i.getLength())},getContext:function(){return this._context||(this._context=this.getCanvas().getContext("2d")),arguments[0]&&(this._image=null,this._changed(129)),this._context},setContext:function(t){this._context=t},getCanvas:function(){if(!this._canvas){var t=Y.getContext(this._size);try{this._image&&t.drawImage(this._image,0,0),this._canvas=t.canvas}catch(e){Y.release(t)}}return this._canvas},setCanvas:function(t){this._canvas&&Y.release(this._canvas),this._canvas=t,this._size=new u(t.width,t.height),this._image=null,this._context=null,this._changed(133)},getImage:function(){return this._image},setImage:function(t){this._canvas&&Y.release(this._canvas),this._image=t,this._size=new u(t.width,t.height),this._canvas=null,this._context=null,this._changed(5)},getSource:function(){return this._image&&this._image.src||this.toDataURL()},setSource:function(t){function e(){n.fire("load"),n._project.view&&n._project.view.draw(!0)}var n=this,i=document.getElementById(t)||new Image;i.width&&i.height?setTimeout(e,0):i.src||(q.add(i,{load:function(){n.setImage(i),e()}}),i.src=t),this.setImage(i)},getElement:function(){return this._canvas||this._image},getSubImage:function(t){t=d.read(arguments);var e=Y.getContext(t.getSize());return e.drawImage(this.getCanvas(),t.x,t.y,t.width,t.height,0,0,t.width,t.height),e.canvas},toDataURL:function(){var t=this._image&&this._image.src;if(/^data:/.test(t))return t;var e=this.getCanvas();return e?e.toDataURL():null},drawImage:function(t,e){e=o.read(arguments,1),this.getContext(!0).drawImage(t,e.x,e.y)},getAverageColor:function(e){var n,i;e?e instanceof I?(i=e,n=e.getBounds()):e.width?n=new d(e):e.x&&(n=new d(e.x-.5,e.y-.5,1,1)):n=this.getBounds();var r=32,s=Math.min(n.width,r),a=Math.min(n.height,r),o=b._sampleContext;o?o.clearRect(0,0,r+1,r+1):o=b._sampleContext=Y.getContext(new u(r)),o.save();var h=(new _).scale(s/n.width,a/n.height).translate(-n.x,-n.y);h.applyToContext(o),i&&i.draw(o,t.merge({clip:!0,transforms:[h]})),this._matrix.applyToContext(o),o.drawImage(this.getElement(),-this._size.width/2,-this._size.height/2),o.restore();for(var c=o.getImageData(.5,.5,Math.ceil(s),Math.ceil(a)).data,l=[0,0,0],f=0,g=0,p=c.length;p>g;g+=4){var v=c[g+3];f+=v,v/=255,l[0]+=c[g]*v,l[1]+=c[g+1]*v,l[2]+=c[g+2]*v}for(var g=0;3>g;g++)l[g]/=f;return f?B.read(l):null},getPixel:function(t){t=o.read(arguments);var e=this.getContext().getImageData(t.x,t.y,1,1).data;return new B("rgb",[e[0]/255,e[1]/255,e[2]/255],e[3]/255)},setPixel:function(){var t=o.read(arguments),e=B.read(arguments),n=e._convert("rgb"),i=e._alpha,r=this.getContext(!0),s=r.createImageData(1,1),a=s.data;a[0]=255*n[0],a[1]=255*n[1],a[2]=255*n[2],a[3]=null!=i?255*i:255,r.putImageData(s,t.x,t.y)},createImageData:function(t){return t=u.read(arguments),this.getContext().createImageData(t.width,t.height)},getImageData:function(t){return t=d.read(arguments),t.isEmpty()&&(t=new d(this._size)),this.getContext().getImageData(t.x,t.y,t.width,t.height)},setImageData:function(t,e){e=o.read(arguments,1),this.getContext(!0).putImageData(t,e.x,e.y)},_getBounds:function(t,e){var n=new d(this._size).setCenter(0,0);return e?e._transformBounds(n):n},_hitTest:function(t){if(this._contains(t)){var e=this;return new S("pixel",e,{offset:t.add(e._size.divide(2)).round(),color:{get:function(){return e.getPixel(this.offset)}}})}},_draw:function(t){var e=this.getElement();e&&(t.globalAlpha=this._opacity,t.drawImage(e,-this._size.width/2,-this._size.height/2))},_canComposite:function(){return!0}}),C=m.extend({_class:"PlacedSymbol",_transformContent:!1,_boundsGetter:{getBounds:"getStrokeBounds"},_boundsSelected:!0,_serializeFields:{symbol:null},initialize:function(t,e){this._initialize(t,void 0!==e&&o.read(arguments,1))||this.setSymbol(t instanceof v?t:new v(t))},getSymbol:function(){return this._symbol},setSymbol:function(t){this._symbol&&delete this._symbol._instances[this._id],this._symbol=t,t._instances[this._id]=this},clone:function(t){return this._clone(new C({symbol:this.symbol,insert:!1}),t)},isEmpty:function(){return this._symbol._definition.isEmpty()},_getBounds:function(t,e){return this.symbol._definition._getCachedBounds(t,e)},_hitTest:function(t,e,n){var i=this._symbol._definition._hitTest(t,e,n);return i&&(i.item=this),i},_draw:function(t,e){this.symbol._definition.draw(t,e)}}),S=t.extend({_class:"HitResult",initialize:function(t,e,n){this.type=t,this.item=e,n&&(n.enumerable=!0,this.inject(n))},statics:{getOptions:function(e){return e&&e._merged?e:t.merge({type:null,tolerance:paper.project.options.hitTolerance||2,fill:!e,stroke:!e,segments:!e,handles:!1,ends:!1,center:!1,bounds:!1,guides:!1,selected:!1,_merged:!0},e)}}}),k=t.extend({_class:"Segment",initialize:function(t,e,n,i,r,s){var a,o,h,u=arguments.length;0===u||(1===u?t.point?(a=t.point,o=t.handleIn,h=t.handleOut):a=t:6>u?2==u&&void 0===e.x?a=[t,e]:(a=t,o=e,h=n):6===u&&(a=[t,e],o=[n,i],h=[r,s])),this._point=new P(a,this),this._handleIn=new P(o,this),this._handleOut=new P(h,this)},_serialize:function(e){return t.serialize(this.isLinear()?this._point:[this._point,this._handleIn,this._handleOut],e,!0)},_changed:function(t){if(this._path){var e,n=this._path._curves&&this.getCurve();n&&(n._changed(),(e=n[t==this._point||t==this._handleIn&&n._segment1==this?"getPrevious":"getNext"]())&&e._changed()),this._path._changed(5)}},getPoint:function(){return this._point},setPoint:function(t){t=o.read(arguments),this._point.set(t.x,t.y)},getHandleIn:function(){return this._handleIn},setHandleIn:function(t){t=o.read(arguments),this._handleIn.set(t.x,t.y)},getHandleOut:function(){return this._handleOut},setHandleOut:function(t){t=o.read(arguments),this._handleOut.set(t.x,t.y)},isLinear:function(){return this._handleIn.isZero()&&this._handleOut.isZero()},setLinear:function(){this._handleIn.set(0,0),this._handleOut.set(0,0)},_isSelected:function(t){var e=this._selectionState;return t==this._point?!!(4&e):t==this._handleIn?!!(1&e):t==this._handleOut?!!(2&e):!1
},_setSelected:function(t,e){var n=this._path,e=!!e,i=this._selectionState||0,r=[!!(4&i),!!(1&i),!!(2&i)];if(t==this._point){if(e)r[1]=r[2]=!1;else{var s=this.getPrevious(),a=this.getNext();r[1]=s&&(s._point.isSelected()||s._handleOut.isSelected()),r[2]=a&&(a._point.isSelected()||a._handleIn.isSelected())}r[0]=e}else{var o=t==this._handleIn?1:2;r[o]!=e&&(e&&(r[0]=!1),r[o]=e)}this._selectionState=(r[0]?4:0)|(r[1]?1:0)|(r[2]?2:0),n&&i!=this._selectionState&&(n._updateSelection(this,i,this._selectionState),n._changed(33))},isSelected:function(){return this._isSelected(this._point)},setSelected:function(t){this._setSelected(this._point,t)},getIndex:function(){return void 0!==this._index?this._index:null},getPath:function(){return this._path||null},getCurve:function(){var t=this._path,e=this._index;return t?(t._closed||e!=t._segments.length-1||e--,t.getCurves()[e]||null):null},getLocation:function(){var t=this.getCurve();return t?new z(t,t.getNext()?0:1):null},getNext:function(){var t=this._path&&this._path._segments;return t&&(t[this._index+1]||this._path._closed&&t[0])||null},getPrevious:function(){var t=this._path&&this._path._segments;return t&&(t[this._index-1]||this._path._closed&&t[t.length-1])||null},reverse:function(){return new k(this._point,this._handleOut,this._handleIn)},remove:function(){return this._path?!!this._path.removeSegment(this._index):!1},clone:function(){return new k(this._point,this._handleIn,this._handleOut)},equals:function(t){return t===this||t&&this._point.equals(t._point)&&this._handleIn.equals(t._handleIn)&&this._handleOut.equals(t._handleOut)||!1},toString:function(){var t=["point: "+this._point];return this._handleIn.isZero()||t.push("handleIn: "+this._handleIn),this._handleOut.isZero()||t.push("handleOut: "+this._handleOut),"{ "+t.join(", ")+" }"},_transformCoordinates:function(t,e,n){var i=this._point,r=n&&this._handleIn.isZero()?null:this._handleIn,s=n&&this._handleOut.isZero()?null:this._handleOut,a=i._x,o=i._y,h=2;return e[0]=a,e[1]=o,r&&(e[h++]=r._x+a,e[h++]=r._y+o),s&&(e[h++]=s._x+a,e[h++]=s._y+o),t&&(t._transformCoordinates(e,0,e,0,h/2),a=e[0],o=e[1],n?(i._x=a,i._y=o,h=2,r&&(r._x=e[h++]-a,r._y=e[h++]-o),s&&(s._x=e[h++]-a,s._y=e[h++]-o)):(r||(e[h++]=a,e[h++]=o),s||(e[h++]=a,e[h++]=o))),e}}),P=o.extend({initialize:function(t,e){var n,i,r;t?void 0!==(n=t[0])?i=t[1]:(void 0===(n=t.x)&&(t=o.read(arguments),n=t.x),i=t.y,r=t.selected):n=i=0,this._x=n,this._y=i,this._owner=e,r&&this.setSelected(!0)},set:function(t,e){return this._x=t,this._y=e,this._owner._changed(this),this},getX:function(){return this._x},setX:function(t){this._x=t,this._owner._changed(this)},getY:function(){return this._y},setY:function(t){this._y=t,this._owner._changed(this)},isZero:function(){return a.isZero(this._x)&&a.isZero(this._y)},setSelected:function(t){this._owner._setSelected(this,t)},isSelected:function(){return this._owner._isSelected(this)}}),M=t.extend({_class:"Curve",initialize:function(t,e,n,i,r,s,a,o){var h=arguments.length;if(3===h)this._path=t,this._segment1=e,this._segment2=n;else if(0===h)this._segment1=new k,this._segment2=new k;else if(1===h)this._segment1=new k(t.segment1),this._segment2=new k(t.segment2);else if(2===h)this._segment1=new k(t),this._segment2=new k(e);else{var u,c,l,d;4===h?(u=t,c=e,l=n,d=i):8===h&&(u=[t,e],d=[a,o],c=[n-t,i-e],l=[r-a,s-o]),this._segment1=new k(u,null,c),this._segment2=new k(d,l,null)}},_changed:function(){delete this._length,delete this._bounds},getPoint1:function(){return this._segment1._point},setPoint1:function(t){t=o.read(arguments),this._segment1._point.set(t.x,t.y)},getPoint2:function(){return this._segment2._point},setPoint2:function(t){t=o.read(arguments),this._segment2._point.set(t.x,t.y)},getHandle1:function(){return this._segment1._handleOut},setHandle1:function(t){t=o.read(arguments),this._segment1._handleOut.set(t.x,t.y)},getHandle2:function(){return this._segment2._handleIn},setHandle2:function(t){t=o.read(arguments),this._segment2._handleIn.set(t.x,t.y)},getSegment1:function(){return this._segment1},getSegment2:function(){return this._segment2},getPath:function(){return this._path},getIndex:function(){return this._segment1._index},getNext:function(){var t=this._path&&this._path._curves;return t&&(t[this._segment1._index+1]||this._path._closed&&t[0])||null},getPrevious:function(){var t=this._path&&this._path._curves;return t&&(t[this._segment1._index-1]||this._path._closed&&t[t.length-1])||null},isSelected:function(){return this.getHandle1().isSelected()&&this.getHandle2().isSelected()},setSelected:function(t){this.getHandle1().setSelected(t),this.getHandle2().setSelected(t)},getValues:function(){return M.getValues(this._segment1,this._segment2)},getPoints:function(){for(var t=this.getValues(),e=[],n=0;8>n;n+=2)e.push(new o(t[n],t[n+1]));return e},getLength:function(){var t=arguments[0],e=arguments[1],n=0===arguments.length||0===t&&1===e;if(n&&null!=this._length)return this._length;var i=M.getLength(this.getValues(),t,e);return n&&(this._length=i),i},getArea:function(){return M.getArea(this.getValues())},getPart:function(t,e){return new M(M.getPart(this.getValues(),t,e))},isLinear:function(){return this._segment1._handleOut.isZero()&&this._segment2._handleIn.isZero()},getIntersections:function(t){return M.getIntersections(this.getValues(),t.getValues(),this,t,[])},reverse:function(){return new M(this._segment2.reverse(),this._segment1.reverse())},_getParameter:function(t,e){return e?t:t&&t.curve===this?t.parameter:void 0===t&&void 0===e?.5:this.getParameterAt(t,0)},divide:function(t,e){var n=this._getParameter(t,e),i=null;if(n>0&&1>n){var r=M.subdivide(this.getValues(),n),s=this.isLinear(),a=r[0],h=r[1];s||(this._segment1._handleOut.set(a[2]-a[0],a[3]-a[1]),this._segment2._handleIn.set(h[4]-h[6],h[5]-h[7]));var u=a[6],c=a[7],l=new k(new o(u,c),!s&&new o(a[4]-u,a[5]-c),!s&&new o(h[2]-u,h[3]-c));if(this._path)this._segment1._index>0&&0===this._segment2._index?this._path.add(l):this._path.insert(this._segment2._index,l),i=this;else{var d=this._segment2;this._segment2=l,i=new M(l,d)}}return i},split:function(t,e){return this._path?this._path.split(this._segment1._index,this._getParameter(t,e)):null},clone:function(){return new M(this._segment1,this._segment2)},toString:function(){var t=["point1: "+this._segment1._point];return this._segment1._handleOut.isZero()||t.push("handle1: "+this._segment1._handleOut),this._segment2._handleIn.isZero()||t.push("handle2: "+this._segment2._handleIn),t.push("point2: "+this._segment2._point),"{ "+t.join(", ")+" }"},statics:{getValues:function(t,e){var n=t._point,i=t._handleOut,r=e._handleIn,s=e._point;return[n._x,n._y,n._x+i._x,n._y+i._y,s._x+r._x,s._y+r._y,s._x,s._y]},evaluate:function(t,e,n){var i,r,s=t[0],a=t[1],h=t[2],u=t[3],c=t[4],l=t[5],d=t[6],f=t[7];if(0!==n||0!==e&&1!==e){var _=3*(h-s),g=3*(c-h)-_,p=d-s-_-g,v=3*(u-a),m=3*(l-u)-v,y=f-a-v-m;if(0===n)i=((p*e+g)*e+_)*e+s,r=((y*e+m)*e+v)*e+a;else{var w=1e-5;if(w>e&&h==s&&u==a||e>1-w&&c==d&&l==f?(i=c-h,r=l-u):(i=(3*p*e+2*g)*e+_,r=(3*y*e+2*m)*e+v),3===n){var x=6*p*e+2*g,b=6*y*e+2*m;return(i*b-r*x)/Math.pow(i*i+r*r,1.5)}}}else i=0===e?s:d,r=0===e?a:f;return 2==n?new o(r,-i):new o(i,r)},subdivide:function(t,e){var n=t[0],i=t[1],r=t[2],s=t[3],a=t[4],o=t[5],h=t[6],u=t[7];void 0===e&&(e=.5);var c=1-e,l=c*n+e*r,d=c*i+e*s,f=c*r+e*a,_=c*s+e*o,g=c*a+e*h,p=c*o+e*u,v=c*l+e*f,m=c*d+e*_,y=c*f+e*g,w=c*_+e*p,x=c*v+e*y,b=c*m+e*w;return[[n,i,l,d,v,m,x,b],[x,b,y,w,g,p,h,u]]},solveCubic:function(t,e,n,i){var r=t[e],s=t[e+2],o=t[e+4],h=t[e+6],u=3*(s-r),c=3*(o-s)-u,l=h-r-u-c;return a.solveCubic(l,c,u,r-n,i)},getParameterOf:function(t,e,n){if(Math.abs(t[0]-e)<1e-5&&Math.abs(t[1]-n)<1e-5)return 0;if(Math.abs(t[6]-e)<1e-5&&Math.abs(t[7]-n)<1e-5)return 1;for(var i,r,s=[],a=[],o=M.solveCubic(t,0,e,s),h=M.solveCubic(t,1,n,a),u=0;-1==o||o>u;)if(-1==o||(i=s[u++])>=0&&1>=i){for(var c=0;-1==h||h>c;)if((-1==h||(r=a[c++])>=0&&1>=r)&&(-1==o?i=r:-1==h&&(r=i),Math.abs(i-r)<1e-5))return.5*(i+r);if(-1==o)break}return null},getPart:function(t,e,n){return e>0&&(t=M.subdivide(t,e)[1]),1>n&&(t=M.subdivide(t,(n-e)/(1-e))[0]),t},isLinear:function(t){return t[0]===t[2]&&t[1]===t[3]&&t[4]===t[6]&&t[5]===t[7]},isFlatEnough:function(t,e){var n=t[0],i=t[1],r=t[2],s=t[3],a=t[4],o=t[5],h=t[6],u=t[7],c=3*r-2*n-h,l=3*s-2*i-u,d=3*a-2*h-n,f=3*o-2*u-i;return Math.max(c*c,d*d)+Math.max(l*l,f*f)<10*e*e},getArea:function(t){var e=t[0],n=t[1],i=t[2],r=t[3],s=t[4],a=t[5],o=t[6],h=t[7];return(3*r*e-1.5*r*s-1.5*r*o-3*n*i-1.5*n*s-.5*n*o+1.5*a*e+1.5*a*i-3*a*o+.5*h*e+1.5*h*i+3*h*s)/10},getBounds:function(t){for(var e=t.slice(0,2),n=e.slice(),i=[0,0],r=0;2>r;r++)M._addBounds(t[r],t[r+2],t[r+4],t[r+6],r,0,e,n,i);return new d(e[0],e[1],n[0]-e[0],n[1]-e[1])},_getCrossings:function(t,e,n,i,r){function s(t){return M.evaluate(e,1,1).y*t.y>0}var a=M.solveCubic(t,1,i,r),o=0,h=1e-5,u=Math.abs;-1===a&&(r[0]=M.getParameterOf(t,n,i),a=null!==r[0]?1:0);for(var c=0;a>c;c++){var l=r[c];if(l>-h&&1-h>l){var d=M.evaluate(t,l,0);if(n<d.x+h){var f=M.evaluate(t,l,1);if(u(d.x-n)<h){var _=f.getAngle();if(_>-180&&0>_&&(l>h||s(f)))continue}else if(u(f.y)<h||h>l&&!s(f))continue;o++}}}return o},_addBounds:function(t,e,n,i,r,s,o,h,u){function c(t,e){var n=t-e,i=t+e;n<o[r]&&(o[r]=n),i>h[r]&&(h[r]=i)}var l=3*(e-n)-t+i,d=2*(t+n)-4*e,f=e-t,_=a.solveQuadratic(l,d,f,u),g=1e-5,p=1-g;c(i,0);for(var v=0;_>v;v++){var m=u[v],y=1-m;m>g&&p>m&&c(y*y*y*t+3*y*y*m*e+3*y*m*m*n+m*m*m*i,s)}}}},t.each(["getBounds","getStrokeBounds","getHandleBounds","getRoughBounds"],function(t){this[t]=function(){this._bounds||(this._bounds={});var e=this._bounds[t];return e||(e=this._bounds[t]=A[t]([this._segment1,this._segment2],!1,this._path.getStyle())),e.clone()}},{}),t.each(["getPoint","getTangent","getNormal","getCurvature"],function(t,e){this[t+"At"]=function(t,n){var i=this.getValues();return M.evaluate(i,n?t:M.getParameterAt(i,t,0),e)},this[t]=function(t){return M.evaluate(this.getValues(),t,e)}},{getParameterAt:function(t,e){return M.getParameterAt(this.getValues(),t,void 0!==e?e:0>t?1:0)},getParameterOf:function(t){return t=o.read(arguments),M.getParameterOf(this.getValues(),t.x,t.y)},getLocationAt:function(t,e){return e||(t=this.getParameterAt(t)),new z(this,t)},getLocationOf:function(t){t=o.read(arguments);var e=this.getParameterOf(t);return null!=e?new z(this,e):null},getNearestLocation:function(t){function e(e){if(e>=0&&1>=e){var i=t.getDistance(M.evaluate(n,e,0),!0);if(s>i)return s=i,h=e,!0}}t=o.read(arguments);for(var n=this.getValues(),i=100,r=a.TOLERANCE,s=1/0,h=0,u=0;i>=u;u++)e(u/i);for(var c=1/(2*i);c>r;)e(h-c)||e(h+c)||(c/=2);var l=M.evaluate(n,h,0);return new z(this,h,l,null,null,null,t.getDistance(l))},getNearestPoint:function(t){return t=o.read(arguments),this.getNearestLocation(t).getPoint()}}),new function(){function t(t){var e=t[0],n=t[1],i=t[2],r=t[3],s=t[4],a=t[5],o=t[6],h=t[7],u=9*(i-s)+3*(o-e),c=6*(e+s)-12*i,l=3*(i-e),d=9*(r-a)+3*(h-n),f=6*(n+a)-12*r,_=3*(r-n);return function(t){var e=(u*t+c)*t+l,n=(d*t+f)*t+_;return Math.sqrt(e*e+n*n)}}function e(t,e){return Math.max(2,Math.min(16,Math.ceil(32*Math.abs(e-t))))}return{statics:!0,getLength:function(n,i,r){if(void 0===i&&(i=0),void 0===r&&(r=1),n[0]==n[2]&&n[1]==n[3]&&n[6]==n[4]&&n[7]==n[5]){var s=n[6]-n[0],o=n[7]-n[1];return(r-i)*Math.sqrt(s*s+o*o)}var h=t(n);return a.integrate(h,i,r,e(i,r))},getParameterAt:function(n,i,r){function s(t){var n=e(r,t);return f+=t>r?a.integrate(c,r,t,n):-a.integrate(c,t,r,n),r=t,f-i}if(0===i)return r;var o=i>0,h=o?r:0,u=o?1:r,i=Math.abs(i),c=t(n),l=a.integrate(c,h,u,e(h,u));if(i>=l)return o?u:h;var d=i/l,f=0;return a.findRoot(s,c,o?h+d:u-d,h,u,16,1e-5)}}},new function(){function t(t,e,n,i,r,s,a){var o=t[0],h=t[t.length-1];o&&i.equals(o._point)||h&&i.equals(h._point)||t.push(new z(e,n,i,r,s,a))}function e(i,r,s,a,o,h,u,c){if(c=(c||0)+1,!(c>20)){h=h||[0,1],u=u||[0,1];for(var l=M.getPart(i,h[0],h[1]),d=M.getPart(r,u[0],u[1]),f=0;f++<20;){var _,g=n(l,d,_=u.slice()),p=0;if(0===g)break;if(g>0){if(u=_,d=M.getPart(r,u[0],u[1]),p=n(d,l,_=h.slice()),0===p)break;g>0&&(h=_,l=M.getPart(i,h[0],h[1]))}if(0>g||0>p){if(h[1]-h[0]>u[1]-u[0]){var v=(h[0]+h[1])/2;e(i,r,s,a,o,[h[0],v],u,c),e(i,r,s,a,o,[v,h[1]],u,c);break}var v=(u[0]+u[1])/2;e(i,r,s,a,o,h,[u[0],v],c),e(i,r,s,a,o,h,[v,u[1]],c);break}if(Math.abs(h[1]-h[0])<=1e-5&&Math.abs(u[1]-u[0])<=1e-5){var m=(h[0]+h[1])/2,y=(u[0]+u[1])/2;t(o,s,m,M.evaluate(i,m,0),a,y,M.evaluate(r,y,0));break}}}}function n(t,e,n){var r=t[0],s=t[1],a=t[2],o=t[3],h=t[4],u=t[5],c=t[6],l=t[7],d=e[0],f=e[1],_=e[2],p=e[3],v=e[4],m=e[5],y=e[6],w=e[7],x=g.getSignedDistance,b=x(r,s,c,l,a,o)||0,C=x(r,s,c,l,h,u)||0,S=b*C>0?.75:4/9,k=S*Math.min(0,b,C),P=S*Math.max(0,b,C),z=x(r,s,c,l,d,f),I=x(r,s,c,l,_,p),A=x(r,s,c,l,v,m),L=x(r,s,c,l,y,w);if(k>Math.max(z,I,A,L)||P<Math.min(z,I,A,L))return 0;var O,T=i(z,I,A,L);z>L&&(O=k,k=P,P=O);for(var D=-1/0,j=1/0,B=-1/0,E=0,N=T.length;N>E;E++){var F=T[E],R=T[(E+1)%N];R[1]<F[1]&&(O=R,R=F,F=O);var q=F[0],V=F[1],H=R[0],Z=R[1],U=(Z-V)/(H-q);if(k>=V&&Z>=k){var X=q+(k-V)/U;j>X&&(j=X),X>D&&(D=X)}if(P>=V&&Z>=P){var X=q+(P-V)/U;X>B&&(B=X),j>X&&(j=0)}}if(1/0!==j&&B!==-1/0){var J=Math.min(k,P),$=Math.max(k,P);L>J&&$>L&&(B=1),z>J&&$>z&&(j=0),D>B&&(B=1);var G=n[0],W=n[1]-G;if(n[0]=G+j*W,n[1]=G+B*W,(W-(n[1]-n[0]))/W>=.2)return 1}return M.getBounds(t).touches(M.getBounds(e))?-1:0}function i(t,e,n,i){var r=[0,t],s=[1/3,e],a=[2/3,n],o=[1,i],h=g.getSignedDistance,u=h(0,t,1,i,1/3,e),c=h(0,t,1,i,2/3,n);if(0>u*c)return[r,s,o,a];var l,d;return Math.abs(u)>Math.abs(c)?(l=s,d=(i-n-(i-t)/3)*(2*(i-n)-i+e)/3):(l=a,d=(e-t+(t-i)/3)*(-2*(t-e)+t-n)/3),0>d?[r,l,o]:[r,s,a,o]}function r(e,n,i,r,s){for(var a=M.isLinear(e),o=a?n:e,h=a?e:n,u=h[0],c=h[1],l=h[6],d=h[7],f=l-u,_=d-c,g=Math.atan2(-_,f),p=Math.sin(g),v=Math.cos(g),m=f*v-_*p,y=[],w=0;8>w;w+=2){var x=o[w]-u,b=o[w+1]-c;y.push(x*v-b*p,b*v+x*p)}for(var C=[],S=M.solveCubic(y,1,0,C),w=0;S>w;w++){var k=C[w];if(k>=0&&1>=k){var P=M.evaluate(y,k,0);P.x>=0&&P.x<=m&&t(s,a?r:i,k,M.evaluate(o,k,0),a?i:r)}}}function s(e,n,i,r,s){var a=g.intersect(e[0],e[1],e[6],e[7],n[0],n[1],n[6],n[7]);a&&t(s,i,null,a,r)}return{statics:{getIntersections:function(t,n,i,a,o){var h=M.isLinear(t),u=M.isLinear(n);return(h&&u?s:h||u?r:e)(t,n,i,a,o),o}}}}),z=t.extend({_class:"CurveLocation",initialize:function pe(t,e,n,i,r,s,a){this._id=pe._id=(pe._id||0)+1,this._curve=t,this._segment1=t._segment1,this._segment2=t._segment2,this._parameter=e,this._point=n,this._curve2=i,this._parameter2=r,this._point2=s,this._distance=a},getSegment:function(){if(!this._segment){var t=this.getCurve(),e=this.getParameter();if(1===e)this._segment=t._segment2;else if(0===e||arguments[0])this._segment=t._segment1;else{if(null==e)return null;this._segment=t.getLength(0,e)<t.getLength(e,1)?t._segment1:t._segment2}}return this._segment},getCurve:function(){return(!this._curve||arguments[0])&&(this._curve=this._segment1.getCurve(),null==this._curve.getParameterOf(this._point)&&(this._curve=this._segment2.getPrevious().getCurve())),this._curve},getIntersection:function(){var t=this._intersection;if(!t&&this._curve2){var e=this._parameter2;this._intersection=t=new z(this._curve2,e,this._point2||this._point,this),t._intersection=this}return t},getPath:function(){var t=this.getCurve();return t&&t._path},getIndex:function(){var t=this.getCurve();return t&&t.getIndex()},getOffset:function(){var t=this.getPath();return t&&t._getOffset(this)},getCurveOffset:function(){var t=this.getCurve(),e=this.getParameter();return null!=e&&t&&t.getLength(0,e)},getParameter:function(){if((null==this._parameter||arguments[0])&&this._point){var t=this.getCurve(arguments[0]&&this._point);this._parameter=t&&t.getParameterOf(this._point)}return this._parameter},getPoint:function(){if((!this._point||arguments[0])&&null!=this._parameter){var t=this.getCurve();this._point=t&&t.getPointAt(this._parameter,!0)}return this._point},getTangent:function(){var t=this.getParameter(),e=this.getCurve();return null!=t&&e&&e.getTangentAt(t,!0)},getNormal:function(){var t=this.getParameter(),e=this.getCurve();return null!=t&&e&&e.getNormalAt(t,!0)},getDistance:function(){return this._distance},divide:function(){var t=this.getCurve(!0);return t&&t.divide(this.getParameter(!0),!0)},split:function(){var t=this.getCurve(!0);return t&&t.split(this.getParameter(!0),!0)},toString:function(){var t=[],e=this.getPoint(),n=s.instance;e&&t.push("point: "+e);var i=this.getIndex();null!=i&&t.push("index: "+i);var r=this.getParameter();return null!=r&&t.push("parameter: "+n.number(r)),null!=this._distance&&t.push("distance: "+n.number(this._distance)),"{ "+t.join(", ")+" }"}}),I=m.extend({_class:"PathItem",initialize:function(){},getIntersections:function(t){if(!this.getBounds().touches(t.getBounds()))return[];for(var e=[],n=this.getCurves(),i=t.getCurves(),r=i.length,s=[],a=0;r>a;a++)s[a]=i[a].getValues();for(var a=0,o=n.length;o>a;a++)for(var h=n[a],u=h.getValues(),c=0;r>c;c++)M.getIntersections(u,s[c],h,i[c],e);return e},setPathData:function(t){function e(t,e,n){var r=parseFloat(i[t]);return a&&(r+=h[e]),n&&(h[e]=r),r}function n(t,n){return new o(e(t,"x",n),e(t+1,"y",n))}var i,r,s=t.match(/[a-z][^a-z]*/gi),a=!1,h=new o;"path"===this._type?this.removeSegments():this.removeChildren();for(var u=0,c=s.length;c>u;u++){var l=s[u],d=l[0],f=d.toLowerCase();i=l.slice(1).trim().split(/[\s,]+|(?=[+-])/),a=d===f;var _=i.length;switch(f){case"m":case"l":for(var g=0;_>g;g+=2)this[0===g&&"m"===f?"moveTo":"lineTo"](n(g,!0));break;case"h":case"v":for(var p="h"==f?"x":"y",g=0;_>g;g++)e(g,p,!0),this.lineTo(h);break;case"c":for(var g=0;_>g;g+=6)this.cubicCurveTo(n(g),r=n(g+2),n(g+4,!0));break;case"s":for(var g=0;_>g;g+=4)this.cubicCurveTo(h.multiply(2).subtract(r),r=n(g),n(g+2,!0));break;case"q":for(var g=0;_>g;g+=4)this.quadraticCurveTo(r=n(g),n(g+2,!0));break;case"t":for(var g=0;_>g;g+=2)this.quadraticCurveTo(r=h.multiply(2).subtract(r),n(g,!0));break;case"a":break;case"z":this.closePath()}}},_canComposite:function(){return!(this.hasFill()&&this.hasStroke())}}),A=I.extend({_class:"Path",_serializeFields:{segments:[],closed:!1},initialize:function(t){this._closed=!1,this._segments=[];var e=Array.isArray(t)?"object"==typeof t[0]?t:arguments:t&&(void 0!==t.point&&void 0===t.size||void 0!==t.x)?arguments:null;this.setSegments(e||[]),this._initialize(!e&&t)},clone:function(t){var e=this._clone(new A({segments:this._segments,insert:!1}),t);return e._closed=this._closed,void 0!==this._clockwise&&(e._clockwise=this._clockwise),e},_changed:function ve(t){if(ve.base.call(this,t),4&t){if(delete this._length,delete this._clockwise,this._curves)for(var e=0,n=this._curves.length;n>e;e++)this._curves[e]._changed(5)}else 8&t&&delete this._bounds},getSegments:function(){return this._segments},setSegments:function(t){this._selectedSegmentState=0,this._segments.length=0,delete this._curves,this._add(k.readAll(t))},getFirstSegment:function(){return this._segments[0]},getLastSegment:function(){return this._segments[this._segments.length-1]},getCurves:function(){var t=this._curves,e=this._segments;if(!t){var n=this._countCurves();t=this._curves=Array(n);for(var i=0;n>i;i++)t[i]=new M(this,e[i],e[i+1]||e[0])}return t},getFirstCurve:function(){return this.getCurves()[0]},getLastCurve:function(){var t=this.getCurves();return t[t.length-1]},getPathData:function(){function t(t,e,s){var a=t._point,o=e._point,h=t._handleOut,u=e._handleIn;if(h.isZero()&&u.isZero())s||r.push("L"+i.point(o,n));else{var c=o.subtract(a);r.push("c"+i.point(h,n)+" "+i.point(c.add(u),n)+" "+i.point(c,n))}}var e=this._segments,n=arguments[0],i=s.instance,r=[];if(0===e.length)return"";r.push("M"+i.point(e[0]._point));for(var a=0,o=e.length-1;o>a;a++)t(e[a],e[a+1],!1);return this._closed&&(t(e[e.length-1],e[0],!0),r.push("z")),r.join("")},isClosed:function(){return this._closed},setClosed:function(t){if(this._closed!=(t=!!t)){if(this._closed=t,this._curves){var e=this._curves.length=this._countCurves();t&&(this._curves[e-1]=new M(this,this._segments[e-1],this._segments[0]))}this._changed(5)}},isEmpty:function(){return 0===this._segments.length},isPolygon:function(){for(var t=0,e=this._segments.length;e>t;t++)if(!this._segments[t].isLinear())return!1;return!0},_applyMatrix:function(t){for(var e=Array(6),n=0,i=this._segments.length;i>n;n++)this._segments[n]._transformCoordinates(t,e,!0);return!0},_add:function(t,e){for(var n=this._segments,i=this._curves,r=t.length,s=null==e,e=s?n.length:e,a=this.isFullySelected(),o=0;r>o;o++){var h=t[o];h._path&&(h=t[o]=h.clone()),h._path=this,h._index=e+o,a&&(h._selectionState=4),h._selectionState&&this._updateSelection(h,0,h._selectionState)}if(s)n.push.apply(n,t);else{n.splice.apply(n,[e,0].concat(t));for(var o=e+r,u=n.length;u>o;o++)n[o]._index=o}if(i||t._curves){i||(i=this._curves=[]);var c=e>0?e-1:e,l=c,d=Math.min(c+r,this._countCurves());t._curves&&(i.splice.apply(i,[c,0].concat(t._curves)),l+=t._curves.length);for(var o=l;d>o;o++)i.splice(o,0,new M(this,null,null));this._adjustCurves(c,d)}return this._changed(5),t},_adjustCurves:function(t,e){for(var n,i=this._segments,r=this._curves,s=t;e>s;s++)n=r[s],n._path=this,n._segment1=i[s],n._segment2=i[s+1]||i[0];(n=r[this._closed&&0===t?i.length-1:t-1])&&(n._segment2=i[t]||i[0]),(n=r[e])&&(n._segment1=i[e])},_countCurves:function(){var t=this._segments.length;return!this._closed&&t>0?t-1:t},add:function(t){return arguments.length>1&&"number"!=typeof t?this._add(k.readAll(arguments)):this._add([k.read(arguments)])[0]},insert:function(t,e){return arguments.length>2&&"number"!=typeof e?this._add(k.readAll(arguments,1),t):this._add([k.read(arguments,1)],t)[0]},addSegment:function(){return this._add([k.read(arguments)])[0]},insertSegment:function(t){return this._add([k.read(arguments,1)],t)[0]},addSegments:function(t){return this._add(k.readAll(t))},insertSegments:function(t,e){return this._add(k.readAll(e),t)},removeSegment:function(t){return this.removeSegments(t,t+1)[0]||null},removeSegments:function(e,n){e=e||0,n=t.pick(n,this._segments.length);var i=this._segments,r=this._curves,s=i.length,a=i.splice(e,n-e),o=a.length;if(!o)return a;for(var h=0;o>h;h++){var u=a[h];u._selectionState&&this._updateSelection(u,u._selectionState,0),delete u._index,delete u._path}for(var h=e,c=i.length;c>h;h++)i[h]._index=h;if(r){var l=e>0&&n===s+(this._closed?1:0)?e-1:e,r=r.splice(l,o);arguments[2]&&(a._curves=r.slice(1)),this._adjustCurves(l,l)}return this._changed(5),a},isFullySelected:function(){return this._selected&&this._selectedSegmentState==4*this._segments.length},setFullySelected:function(t){t&&this._selectSegments(!0),this.setSelected(t)},setSelected:function me(t){t||this._selectSegments(!1),me.base.call(this,t)},_selectSegments:function(t){var e=this._segments.length;this._selectedSegmentState=t?4*e:0;for(var n=0;e>n;n++)this._segments[n]._selectionState=t?4:0},_updateSelection:function(t,e,n){t._selectionState=n;var i=this._selectedSegmentState+=n-e;i>0&&this.setSelected(!0)},flatten:function(t){for(var e=new O(this),n=0,i=e.length/Math.ceil(e.length/t),r=e.length+(this._closed?-i:i)/2,s=[];r>=n;)s.push(new k(e.evaluate(n,0))),n+=i;this.setSegments(s)},simplify:function(t){if(this._segments.length>2){var e=new T(this,t||2.5);this.setSegments(e.fit())}},split:function(t,e){if(null!==e){if(1===arguments.length){var n=t;"number"==typeof n&&(n=this.getLocationAt(n)),t=n.index,e=n.parameter}e>=1&&(t++,e--);var i=this.getCurves();if(t>=0&&t<i.length){e>0&&i[t++].divide(e,!0);var r,s=this.removeSegments(t,this._segments.length,!0);return this._closed?(this.setClosed(!1),r=this):t>0&&(r=this._clone((new A).insertAbove(this,!0))),r._add(s,0),this.addSegment(s[0]),r}return null}},isClockwise:function(){return void 0!==this._clockwise?this._clockwise:A.isClockwise(this._segments)},setClockwise:function(t){this.isClockwise()!=(t=!!t)&&this.reverse(),this._clockwise=t},reverse:function(){this._segments.reverse();for(var t=0,e=this._segments.length;e>t;t++){var n=this._segments[t],i=n._handleIn;n._handleIn=n._handleOut,n._handleOut=i,n._index=t}delete this._curves,void 0!==this._clockwise&&(this._clockwise=!this._clockwise)},join:function(t){if(t){var e=t._segments,n=this.getLastSegment(),i=t.getLastSegment();n._point.equals(i._point)&&t.reverse();var r,s=t.getFirstSegment();return n._point.equals(s._point)?(n.setHandleOut(s._handleOut),this._add(e.slice(1))):(r=this.getFirstSegment(),r._point.equals(s._point)&&t.reverse(),i=t.getLastSegment(),r._point.equals(i._point)?(r.setHandleIn(i._handleIn),this._add(e.slice(0,e.length-1),0)):this._add(e.slice())),t.closed&&this._add([e[0]]),t.remove(),r=this.getFirstSegment(),n=this.getLastSegment(),n._point.equals(r._point)&&(r.setHandleIn(n._handleIn),n.remove(),this.setClosed(!0)),this._changed(5),!0}return!1},reduce:function(){return this},getLength:function(){if(null==this._length){var t=this.getCurves();this._length=0;for(var e=0,n=t.length;n>e;e++)this._length+=t[e].getLength()}return this._length},getArea:function(){for(var t=this.getCurves(),e=0,n=0,i=t.length;i>n;n++)e+=t[n].getArea();return e},_getOffset:function(t){var e=t&&t.getIndex();if(null!=e){for(var n=this.getCurves(),i=0,r=0;e>r;r++)i+=n[r].getLength();var s=n[e];return i+s.getLength(0,t.getParameter())}return null},getLocationOf:function(t){t=o.read(arguments);for(var e=this.getCurves(),n=0,i=e.length;i>n;n++){var r=e[n].getLocationOf(t);if(r)return r}return null},getLocationAt:function(t,e){var n=this.getCurves(),i=0;if(e){var r=~~t;return n[r].getLocationAt(t-r,!0)}for(var s=0,a=n.length;a>s;s++){var o=i,h=n[s];if(i+=h.getLength(),i>=t)return h.getLocationAt(t-o)}return t<=this.getLength()?new z(n[n.length-1],1):null},getPointAt:function(t,e){var n=this.getLocationAt(t,e);return n&&n.getPoint()},getTangentAt:function(t,e){var n=this.getLocationAt(t,e);return n&&n.getTangent()},getNormalAt:function(t,e){var n=this.getLocationAt(t,e);return n&&n.getNormal()},getNearestLocation:function(t){t=o.read(arguments);for(var e=this.getCurves(),n=1/0,i=null,r=0,s=e.length;s>r;r++){var a=e[r].getNearestLocation(t);a._distance<n&&(n=a._distance,i=a)}return i},getNearestPoint:function(t){return t=o.read(arguments),this.getNearestLocation(t).getPoint()},getStyle:function(){var t=this._parent;return(t&&"compound-path"===t._type?t:this)._style},_contains:function(t){var e=this._closed;if(!e&&!this.hasFill()||!this._getBounds("getRoughBounds")._containsPoint(t))return!1;for(var n=this.getCurves(),i=this._segments,r=0,s=Array(3),a=(e?n[n.length-1]:new M(i[i.length-1]._point,i[0]._point)).getValues(),o=a,h=0,u=n.length;u>h;h++){var c=n[h].getValues(),l=c[0],d=c[1];(l!==c[2]||d!==c[3]||l!==c[4]||d!==c[5]||l!==c[6]||d!==c[7])&&(r+=M._getCrossings(c,o,t.x,t.y,s),o=c)}return e||(r+=M._getCrossings(a,o,t.x,t.y,s)),1===(1&r)},_hitTest:function(t,e){function n(e,n,i){return t.getDistance(n)<v?new S(i,y,{segment:e,point:n}):void 0}function i(t,i){var r=t._point;return(i||e.segments)&&n(t,r,"segment")||!i&&e.handles&&(n(t,r.add(t._handleIn),"handle-in")||n(t,r.add(t._handleOut),"handle-out"))}function r(t){l.push(t)}function s(t){var e=l[t],n=l[(t+1)%l.length];return[e.x,e.y,e.x,e.y,n.x,n.y,n.x,n.y]}function a(t){for(var e=l.length,n=s(e-1),i=Array(3),r=0,a=0;e>a;a++){var o=s(a);r+=M._getCrossings(o,n,t.x,t.y,i),n=o}return 1===(1&r)}function o(e){return("round"!==h||"round"!==u)&&(l=[],p||e._index>0&&e._index<g.length-1?"round"!==h&&(e._handleIn.isZero()||e._handleOut.isZero())&&A._addSquareJoin(e,h,m,c,r,!0):"round"!==u&&A._addSquareCap(e,u,m,r,!0),l.length>0)?a(t):t.getDistance(e._point)<=m}var h,u,c,l,d,f,_=this.getStyle(),g=this._segments,p=this._closed,v=e.tolerance||0,m=0,y=this;if(e.stroke&&_.getStrokeColor()&&(h=_.getStrokeJoin(),u=_.getStrokeCap(),m=_.getStrokeWidth()/2+v,c=m*_.getMiterLimit()),!e.ends||e.segments||p){if(e.segments||e.handles)for(var w=0,x=g.length;x>w;w++)if(f=i(g[w]))return f}else if(f=i(g[0],!0)||i(g[g.length-1],!0))return f;if(m>0){if(d=this.getNearestLocation(t)){var b=d.getParameter();0===b||1===b?o(d.getSegment())||(d=null):d._distance>m&&(d=null)}if(!d&&"miter"===h)for(var w=0,x=g.length;x>w;w++){var C=g[w];if(t.getDistance(C._point)<=c&&o(C)){d=C.getLocation();break}}}return!d&&e.fill&&this.hasFill()&&this.contains(t)?new S("fill",this):d?new S("stroke",this,{location:d}):null}},new function(){function t(t,e,n,i){function r(e){var n=a[e],i=a[e+1];(d!=n||f!=i)&&(t.beginPath(),t.moveTo(d,f),t.lineTo(n,i),t.stroke(),t.beginPath(),t.arc(n,i,s,0,2*Math.PI,!0),t.fill())}for(var s=i/2,a=Array(6),o=0,h=e.length;h>o;o++){var u=e[o];u._transformCoordinates(n,a,!1);var c=u._selectionState,l=4&c,d=a[0],f=a[1];(l||1&c)&&r(2),(l||2&c)&&r(4),t.save(),t.beginPath(),t.rect(d-s,f-s,i,i),t.fill(),l||(t.beginPath(),t.rect(d-s+1,f-s+1,i-2,i-2),t.fillStyle="#ffffff",t.fill()),t.restore()}}function e(t,e,n){function i(e){var i=d[e];if(n)i._transformCoordinates(n,_,!1),r=_[0],s=_[1];else{var f=i._point;r=f._x,s=f._y}if(g)t.moveTo(r,s),g=!1;else{if(n)h=_[2],u=_[3];else{var p=i._handleIn;h=r+p._x,u=s+p._y}h==r&&u==s&&c==a&&l==o?t.lineTo(r,s):t.bezierCurveTo(c,l,h,u,r,s)}if(a=r,o=s,n)c=_[4],l=_[5];else{var p=i._handleOut;c=a+p._x,l=o+p._y}}for(var r,s,a,o,h,u,c,l,d=e._segments,f=d.length,_=Array(6),g=!0,p=0;f>p;p++)i(p);e._closed&&f>1&&i(0)}return{_draw:function(t,n){var i=n.clip,r=n.compound;r||t.beginPath();var s=this.getStyle(),a=s.getFillColor(),o=s.getStrokeColor(),h=s.getDashArray(),u=!paper.support.nativeDash&&o&&h&&h.length;if((a||o&&!u||r||i)&&e(t,this),this._closed&&t.closePath(),!i&&!r&&(a||o)&&(this._setStyles(t),a&&t.fill(),o)){if(u){t.beginPath();for(var c,l=new O(this),d=s.getDashOffset(),f=0;d<l.length;)c=d+h[f++%h.length],l.drawPart(t,d,c),d=c+h[f++%h.length]}t.stroke()}},_drawSelected:function(n,i){n.beginPath(),e(n,this,i),n.stroke(),t(n,this._segments,i,this._project.options.handleSize||4)}}},new function(){function t(t){var e=t.length,n=[],i=[],r=2;n[0]=t[0]/r;for(var s=1;e>s;s++)i[s]=1/r,r=(e-1>s?4:2)-i[s],n[s]=(t[s]-n[s-1])/r;for(var s=1;e>s;s++)n[e-s-1]-=i[e-s]*n[e-s];return n}return{smooth:function(){var e,n=this._segments,i=n.length,r=i;if(!(2>=i)){this._closed?(e=Math.min(i,4),r+=2*Math.min(i,e)):e=0;for(var s=[],a=0;i>a;a++)s[a+e]=n[a]._point;if(this._closed)for(var a=0;e>a;a++)s[a]=n[a+i-e]._point,s[a+i+e]=n[a]._point;else r--;for(var h=[],a=1;r-1>a;a++)h[a]=4*s[a]._x+2*s[a+1]._x;h[0]=s[0]._x+2*s[1]._x,h[r-1]=3*s[r-1]._x;for(var u=t(h),a=1;r-1>a;a++)h[a]=4*s[a]._y+2*s[a+1]._y;h[0]=s[0]._y+2*s[1]._y,h[r-1]=3*s[r-1]._y;var c=t(h);if(this._closed){for(var a=0,l=i;e>a;a++,l++){var d=a/e,f=1-d,_=a+e,g=l+e;u[l]=u[a]*d+u[l]*f,c[l]=c[a]*d+c[l]*f,u[g]=u[_]*f+u[g]*d,c[g]=c[_]*f+c[g]*d}r--}for(var p=null,a=e;r-e>=a;a++){var v=n[a-e];p&&v.setHandleIn(p.subtract(v._point)),r>a&&(v.setHandleOut(new o(u[a],c[a]).subtract(v._point)),p=r-1>a?new o(2*s[a+1]._x-u[a+1],2*s[a+1]._y-c[a+1]):new o((s[r]._x+u[r-1])/2,(s[r]._y+c[r-1])/2))}if(this._closed&&p){var v=this._segments[0];v.setHandleIn(p.subtract(v._point))}}}}},new function(){function e(t){var e=t._segments;if(0==e.length)throw Error("Use a moveTo() command first");return e[e.length-1]}return{moveTo:function(){1===this._segments.length&&this.removeSegment(0),this._segments.length||this._add([new k(o.read(arguments))])},moveBy:function(){throw Error("moveBy() is unsupported on Path items.")},lineTo:function(){this._add([new k(o.read(arguments))])},cubicCurveTo:function(){var t=o.read(arguments),n=o.read(arguments),i=o.read(arguments),r=e(this);r.setHandleOut(t.subtract(r._point)),this._add([new k(i,n.subtract(i))])},quadraticCurveTo:function(){var t=o.read(arguments),n=o.read(arguments),i=e(this)._point;this.cubicCurveTo(t.add(i.subtract(t).multiply(1/3)),t.add(n.subtract(t).multiply(1/3)),n)},curveTo:function(){var n=o.read(arguments),i=o.read(arguments),r=t.pick(t.read(arguments),.5),s=1-r,a=e(this)._point,h=n.subtract(a.multiply(s*s)).subtract(i.multiply(r*r)).divide(2*r*s);if(h.isNaN())throw Error("Cannot put a curve through points with parameter = "+r);this.quadraticCurveTo(h,i)},arcTo:function(n,i){var r,s=e(this),a=s._point,h=o.read(arguments),u=t.pick(t.peek(arguments),!0);
if("boolean"==typeof u){n=h,i=u;var c=a.add(n).divide(2),r=c.add(c.subtract(a).rotate(i?-90:90))}else r=h,n=o.read(arguments);var l=new g(a.add(r).divide(2),r.subtract(a).rotate(90),!0),d=new g(r.add(n).divide(2),n.subtract(r).rotate(90),!0),f=l.intersect(d,!0),_=new g(a,n),p=_.getSide(r);if(!f){if(!p)return this.lineTo(n);throw Error("Cannot put an arc through the given points: "+[a,r,n])}var v=a.subtract(f),m=v.getDirectedAngle(n.subtract(f)),y=_.getSide(f);0==y?m=p*Math.abs(m):p==y&&(m-=360*(0>m?-1:1));for(var w=Math.abs(m),x=w>=360?4:Math.ceil(w/90),b=m/x,C=b*Math.PI/360,S=4/3*Math.sin(C)/(1+Math.cos(C)),P=[],M=0;x>=M;M++){var z=x>M?f.add(v):n,I=x>M?v.rotate(90).multiply(S):null;0==M?s.setHandleOut(I):P.push(new k(z,v.rotate(-90).multiply(S),I)),v=v.rotate(b)}this._add(P)},lineBy:function(t){t=o.read(arguments);var n=e(this);this.lineTo(n._point.add(t))},curveBy:function(t,n,i){t=o.read(t),n=o.read(n);var r=e(this)._point;this.curveTo(r.add(t),r.add(n),i)},arcBy:function(t,n){t=o.read(t),n=o.read(n);var i=e(this)._point;this.arcTo(i.add(t),i.add(n))},closePath:function(){var t=this.getFirstSegment(),e=this.getLastSegment();t._point.equals(e._point)&&(t.setHandleIn(e._handleIn),e.remove()),this.setClosed(!0)}}},{_getBounds:function(t,e){return A[t](this._segments,this._closed,this.getStyle(),e)},statics:{isClockwise:function(t){function e(t,e){s&&(r+=(n-t)*(e+i)),n=t,i=e,s=!0}for(var n,i,r=0,s=!1,a=0,o=t.length;o>a;a++){var h=t[a],u=t[o>a+1?a+1:0],c=h._point,l=h._handleOut,d=u._handleIn,f=u._point;e(c._x,c._y),e(c._x+l._x,c._y+l._y),e(f._x+d._x,f._y+d._y),e(f._x,f._y)}return r>0},getBounds:function(t,e,n,i,r){function s(t){t._transformCoordinates(i,o,!1);for(var e=0;2>e;e++)M._addBounds(h[e],h[e+4],o[e+2],o[e],e,r?r[e]:0,u,c,l);var n=h;h=o,o=n}var a=t[0];if(!a)return new d;for(var o=Array(6),h=a._transformCoordinates(i,Array(6),!1),u=h.slice(0,2),c=u.slice(),l=Array(2),f=1,_=t.length;_>f;f++)s(t[f]);return e&&s(a),new d(u[0],u[1],c[0]-u[0],c[1]-u[1])},getStrokeBounds:function(t,e,n,i){function r(t,e){if(!e)return[t,t];var n=e.shiftless(),i=n.transform(new o(t,0)),r=n.transform(new o(0,t)),s=i.getAngleInRadians(),a=i.getLength(),h=r.getLength(),u=Math.sin(s),c=Math.cos(s),l=Math.tan(s),d=-Math.atan(h*l/a),f=Math.atan(h/(l*a));return[Math.abs(a*Math.cos(d)*c-h*Math.sin(d)*u),Math.abs(h*Math.sin(f)*c+a*Math.cos(f)*u)]}function s(t){_=_.include(i?i._transformPoint(t,t):t)}function a(t,e){"round"===e||!t._handleIn.isZero()&&!t._handleOut.isZero()?_=_.unite(m.setCenter(i?i._transformPoint(t._point):t._point)):A._addSquareJoin(t,e,l,v,s)}function h(t,e){switch(e){case"round":a(t,e);break;case"butt":case"square":A._addSquareCap(t,e,l,s)}}if(!n.getStrokeColor()||!n.getStrokeWidth())return A.getBounds(t,e,n,i);for(var c=t.length-(e?0:1),l=n.getStrokeWidth()/2,f=r(l,i),_=A.getBounds(t,e,n,i,f),g=n.getStrokeJoin(),p=n.getStrokeCap(),v=l*n.getMiterLimit(),m=new d(new u(f).multiply(2)),y=1;c>y;y++)a(t[y],g);return e?a(t[0],g):(h(t[0],p),h(t[t.length-1],p)),_},_addSquareJoin:function(t,e,n,i,r,s){var a=t.getCurve(),h=a.getPrevious(),u=a.getPointAt(0,!0),c=h.getNormalAt(1,!0),l=a.getNormalAt(0,!0),d=c.getDirectedAngle(l)<0?-n:n;if(c.setLength(d),l.setLength(d),s&&(r(u),r(u.add(c))),"miter"===e){var f=new g(u.add(c),new o(-c.y,c.x),!0).intersect(new g(u.add(l),new o(-l.y,l.x),!0),!0);if(f&&u.getDistance(f)<=i&&(r(f),!s))return}s||r(u.add(c)),r(u.add(l))},_addSquareCap:function(t,e,n,i,r){var s=t._point,a=t.getLocation(),o=a.getNormal().normalize(n);r&&(i(s.subtract(o)),i(s.add(o))),"square"===e&&(s=s.add(o.rotate(0==a.getParameter()?-90:90))),i(s.add(o)),i(s.subtract(o))},getHandleBounds:function(t,e,n,i,r,s){var a=Array(6),o=1/0,h=-o,u=o,c=h;r=r/2||0,s=s/2||0;for(var l=0,f=t.length;f>l;l++){var _=t[l];_._transformCoordinates(i,a,!1);for(var g=0;6>g;g+=2){var p=0==g?s:r,v=a[g],m=a[g+1],y=v-p,w=v+p,x=m-p,b=m+p;o>y&&(o=y),w>h&&(h=w),u>x&&(u=x),b>c&&(c=b)}}return new d(o,u,h-o,c-u)},getRoughBounds:function(t,e,n,i){var r=n.getStrokeColor()?n.getStrokeWidth():0,s=r;return r>0&&("miter"===n.getStrokeJoin()&&(s=r*n.getMiterLimit()),"square"===n.getStrokeCap()&&(s=Math.max(s,r*Math.sqrt(2)))),A.getHandleBounds(t,e,n,i,r,s)}}});A.inject({statics:new function(){function e(e){return new A(t.getNamed(e))}function n(){var t=d.readNamed(arguments,"rectangle"),n=u.readNamed(arguments,"radius",0,0,{readNull:!0}),i=t.getBottomLeft(!0),s=t.getTopLeft(!0),a=t.getTopRight(!0),o=t.getBottomRight(!0),h=e(arguments);if(!n||n.isZero())h._add([new k(i),new k(s),new k(a),new k(o)]);else{n=u.min(n,t.getSize(!0).divide(2));var c=n.multiply(2*r);h._add([new k(i.add(n.width,0),null,[-c.width,0]),new k(i.subtract(0,n.height),[0,c.height],null),new k(s.add(0,n.height),null,[0,-c.height]),new k(s.add(n.width,0),[-c.width,0],null),new k(a.subtract(n.width,0),null,[c.width,0]),new k(a.add(0,n.height),[0,-c.height],null),new k(o.subtract(0,n.height),null,[0,c.height]),new k(o.subtract(n.width,0),[c.width,0],null)])}return h._closed=!0,h}function i(){for(var t=d.readNamed(arguments,"rectangle"),n=e(arguments),i=t.getPoint(!0),r=t.getSize(!0),a=Array(4),o=0;4>o;o++){var h=s[o];a[o]=new k(h._point.multiply(r).add(i),h._handleIn.multiply(r),h._handleOut.multiply(r))}return n._add(a),n._closed=!0,n}var r=a.KAPPA/2,s=[new k([0,.5],[0,r],[0,-r]),new k([.5,0],[-r,0],[r,0]),new k([1,.5],[0,-r],[0,r]),new k([.5,1],[r,0],[-r,0])];return{Line:function(){return new A(o.readNamed(arguments,"from"),o.readNamed(arguments,"to")).set(t.getNamed(arguments))},Circle:function(){var e=o.readNamed(arguments,"center"),n=t.readNamed(arguments,"radius");return i(new d(e.subtract(n),new u(2*n,2*n))).set(t.getNamed(arguments))},Rectangle:n,RoundRectangle:n,Ellipse:i,Oval:i,Arc:function(){var t=o.readNamed(arguments,"from"),n=o.readNamed(arguments,"through"),i=o.readNamed(arguments,"to"),r=e(arguments);return r.moveTo(t),r.arcTo(n,i),r},RegularPolygon:function(){for(var n=o.readNamed(arguments,"center"),i=t.readNamed(arguments,"sides"),r=t.readNamed(arguments,"radius"),s=e(arguments),a=360/i,h=!(i%3),u=new o(0,h?-r:r),c=h?-1:.5,l=Array(i),d=0;i>d;d++)l[d]=new k(n.add(u.rotate((d+c)*a)));return s._add(l),s._closed=!0,s},Star:function(){for(var n=o.readNamed(arguments,"center"),i=2*t.readNamed(arguments,"points"),r=t.readNamed(arguments,"radius1"),s=t.readNamed(arguments,"radius2"),a=e(arguments),h=360/i,u=new o(0,-1),c=Array(i),l=0;i>l;l++)c[l]=new k(n.add(u.rotate(h*l).multiply(l%2?s:r)));return a._add(c),a._closed=!0,a}}}});var L=I.extend({_class:"CompoundPath",_serializeFields:{children:[]},initialize:function(t){this._children=[],this._namedChildren={},this._initialize(t)||this.addChildren(Array.isArray(t)?t:arguments)},insertChildren:function ye(t,e,n){e=ye.base.call(this,t,e,n,"path");for(var i=0,r=!n&&e&&e.length;r>i;i++){var s=e[i];void 0===s._clockwise&&s.setClockwise(0===s._index)}return e},reduce:function(){if(1==this._children.length){var t=this._children[0];return t.insertAbove(this),this.remove(),t}return this},reverse:function(){for(var t=this._children,e=0,n=t.length;n>e;e++)t[e].reverse()},smooth:function(){for(var t=0,e=this._children.length;e>t;t++)this._children[t].smooth()},isClockwise:function(){var t=this.getFirstChild();return t&&t.isClockwise()},setClockwise:function(t){this.isClockwise()!=!!t&&this.reverse()},getFirstSegment:function(){var t=this.getFirstChild();return t&&t.getFirstSegment()},getLastSegment:function(){var t=this.getLastChild();return t&&t.getLastSegment()},getCurves:function(){for(var t=this._children,e=[],n=0,i=t.length;i>n;n++)e=e.concat(t[n].getCurves());return e},getFirstCurve:function(){var t=this.getFirstChild();return t&&t.getFirstCurve()},getLastCurve:function(){var t=this.getLastChild();return t&&t.getFirstCurve()},getArea:function(){for(var t=this._children,e=0,n=0,i=t.length;i>n;n++)e+=t[n].getArea();return e},getPathData:function(){for(var t=this._children,e=[],n=0,i=t.length;i>n;n++)e.push(t[n].getPathData(arguments[0]));return e.join(" ")},_contains:function(t){for(var e=[],n=0,i=this._children.length;i>n;n++){var r=this._children[n];r.contains(t)&&e.push(r)}return 1==(1&e.length)&&e},_hitTest:function we(e,n){var i=we.base.call(this,e,t.merge(n,{fill:!1}));return!i&&n.fill&&this.hasFill()&&(i=this._contains(e),i=i?new S("fill",i[0]):null),i},_draw:function(t,e){var n=this._children,i=this._style;if(0!==n.length){t.beginPath(),e=e.extend({compound:!0});for(var r=0,s=n.length;s>r;r++)n[r].draw(t,e);e.clip||(this._setStyles(t),i.getFillColor()&&t.fill(),i.getStrokeColor()&&t.stroke())}}},new function(){function e(t){if(!t._children.length)throw Error("Use a moveTo() command first");return t._children[t._children.length-1]}var n={moveTo:function(){var t=new A;this.addChild(t),t.moveTo.apply(t,arguments)},moveBy:function(){this.moveTo(e(this).getLastSegment()._point.add(o.read(arguments)))},closePath:function(){e(this).closePath()}};return t.each(["lineTo","cubicCurveTo","quadraticCurveTo","curveTo","arcTo","lineBy","curveBy","arcBy"],function(t){n[t]=function(){var n=e(this);n[t].apply(n,arguments)}}),n}),O=t.extend({initialize:function(t){function e(t,e){var n=M.getValues(t,e);s.curves.push(n),s._computeParts(n,t._index,0,1)}this.curves=[],this.parts=[],this.length=0,this.index=0;for(var n,i=t._segments,r=i[0],s=this,a=1,o=i.length;o>a;a++)n=i[a],e(r,n),r=n;t._closed&&e(n,i[0])},_computeParts:function(t,e,n,i){if(i-n>1/32&&!M.isFlatEnough(t,.25)){var r=M.subdivide(t),s=(n+i)/2;this._computeParts(r[0],e,n,s),this._computeParts(r[1],e,s,i)}else{var a=t[6]-t[0],o=t[7]-t[1],h=Math.sqrt(a*a+o*o);h>1e-5&&(this.length+=h,this.parts.push({offset:this.length,value:i,index:e}))}},getParameterAt:function(t){for(var e,n=this.index;e=n,!(0==n||this.parts[--n].offset<t););for(var i=this.parts.length;i>e;e++){var r=this.parts[e];if(r.offset>=t){this.index=e;var s=this.parts[e-1],a=s&&s.index==r.index?s.value:0,o=s?s.offset:0;return{value:a+(r.value-a)*(t-o)/(r.offset-o),index:r.index}}}var r=this.parts[this.parts.length-1];return{value:1,index:r.index}},evaluate:function(t,e){var n=this.getParameterAt(t);return M.evaluate(this.curves[n.index],n.value,e)},drawPart:function(t,e,n){e=this.getParameterAt(e),n=this.getParameterAt(n);for(var i=e.index;i<=n.index;i++){var r=M.getPart(this.curves[i],i==e.index?e.value:0,i==n.index?n.value:1);i==e.index&&t.moveTo(r[0],r[1]),t.bezierCurveTo.apply(t,r.slice(2))}}}),T=t.extend({initialize:function(t,e){this.points=[];for(var n,i=t._segments,r=0,s=i.length;s>r;r++){var a=i[r].point.clone();n&&n.equals(a)||(this.points.push(a),n=a)}this.error=e},fit:function(){var t=this.points,e=t.length;return this.segments=e>0?[new k(t[0])]:[],e>1&&this.fitCubic(0,e-1,t[1].subtract(t[0]).normalize(),t[e-2].subtract(t[e-1]).normalize()),this.segments},fitCubic:function(t,e,n,i){if(1==e-t){var r=this.points[t],s=this.points[e],a=r.getDistance(s)/3;return this.addCurve([r,r.add(n.normalize(a)),s.add(i.normalize(a)),s]),void 0}for(var o,h=this.chordLengthParameterize(t,e),u=Math.max(this.error,this.error*this.error),c=0;4>=c;c++){var l=this.generateBezier(t,e,h,n,i),d=this.findMaxError(t,e,l,h);if(d.error<this.error)return this.addCurve(l),void 0;if(o=d.index,d.error>=u)break;this.reparameterize(t,e,h,l),u=d.error}var f=this.points[o-1].subtract(this.points[o]),_=this.points[o].subtract(this.points[o+1]),g=f.add(_).divide(2).normalize();this.fitCubic(t,o,n,g),this.fitCubic(o,e,g.negate(),i)},addCurve:function(t){var e=this.segments[this.segments.length-1];e.setHandleOut(t[1].subtract(t[0])),this.segments.push(new k(t[3],t[2].subtract(t[3])))},generateBezier:function(t,e,n,i,r){for(var s=1e-11,a=this.points[t],o=this.points[e],h=[[0,0],[0,0]],u=[0,0],c=0,l=e-t+1;l>c;c++){var d=n[c],f=1-d,_=3*d*f,g=f*f*f,p=_*f,v=_*d,m=d*d*d,y=i.normalize(p),w=r.normalize(v),x=this.points[t+c].subtract(a.multiply(g+p)).subtract(o.multiply(v+m));h[0][0]+=y.dot(y),h[0][1]+=y.dot(w),h[1][0]=h[0][1],h[1][1]+=w.dot(w),u[0]+=y.dot(x),u[1]+=w.dot(x)}var b,C,S=h[0][0]*h[1][1]-h[1][0]*h[0][1];if(Math.abs(S)>s){var k=h[0][0]*u[1]-h[1][0]*u[0],P=u[0]*h[1][1]-u[1]*h[0][1];b=P/S,C=k/S}else{var M=h[0][0]+h[0][1],z=h[1][0]+h[1][1];b=C=Math.abs(M)>s?u[0]/M:Math.abs(z)>s?u[1]/z:0}var I=o.getDistance(a);return s*=I,(s>b||s>C)&&(b=C=I/3),[a,a.add(i.normalize(b)),o.add(r.normalize(C)),o]},reparameterize:function(t,e,n,i){for(var r=t;e>=r;r++)n[r-t]=this.findRoot(i,this.points[r],n[r-t])},findRoot:function(t,e,n){for(var i=[],r=[],s=0;2>=s;s++)i[s]=t[s+1].subtract(t[s]).multiply(3);for(var s=0;1>=s;s++)r[s]=i[s+1].subtract(i[s]).multiply(2);var a=this.evaluate(3,t,n),o=this.evaluate(2,i,n),h=this.evaluate(1,r,n),u=a.subtract(e),c=o.dot(o)+u.dot(h);return Math.abs(c)<1e-5?n:n-u.dot(o)/c},evaluate:function(t,e,n){for(var i=e.slice(),r=1;t>=r;r++)for(var s=0;t-r>=s;s++)i[s]=i[s].multiply(1-n).add(i[s+1].multiply(n));return i[0]},chordLengthParameterize:function(t,e){for(var n=[0],i=t+1;e>=i;i++)n[i-t]=n[i-t-1]+this.points[i].getDistance(this.points[i-1]);for(var i=1,r=e-t;r>=i;i++)n[i]/=n[r];return n},findMaxError:function(t,e,n,i){for(var r=Math.floor((e-t+1)/2),s=0,a=t+1;e>a;a++){var o=this.evaluate(3,n,i[a-t]),h=o.subtract(this.points[a]),u=h.x*h.x+h.y*h.y;u>=s&&(s=u,r=a)}return{error:s,index:r}}});I.inject(new function(){function t(t,e){t.sort(function(t,e){var n=t.getPath(),i=e.getPath();return n===i?t.getIndex()+t.getParameter()-(e.getIndex()+e.getParameter()):n._id-i._id});for(var n=e&&[],i=t.length-1;i>=0;i--){var r=t[i],s=r.getIntersection(),a=r.divide(),o=a&&a.getSegment1()||r.getSegment();n&&n.push(s),o._intersection=s}return n}function e(t){if(t instanceof L){for(var e=t._children,n=e.length,i=Array(n),r=Array(n),s=e[0].isClockwise(),a=0;n>a;a++)i[a]=e[a].getBounds(),r[a]=0;for(var a=0;n>a;a++){for(var o=1;n>o;o++)a!==o&&i[a].contains(i[o])&&r[o]++;a>0&&0===r[a]%2&&e[a].setClockwise(s)}}return t}function n(n,r,s,a){n=e(n.clone(!1)),r=e(r.clone(!1));var h=n.isClockwise(),u=r.isClockwise(),c=n.getIntersections(r);t(t(c,!0)),a&&(r.reverse(),u=!u);for(var l=[].concat(n._children||[n]).concat(r._children||[r]),d=[],f=new L,_=0,g=l.length;g>_;_++){var p=l[_],v=p._parent,m=p.isClockwise(),y=p._segments;p=v instanceof L?v:p;for(var w=y.length-1;w>=0;w--){var x=y[w],b=x.getCurve().getPoint(.5),C=p!==n&&n.contains(b)&&(m===h||a||!i(n,b)),S=p!==r&&r.contains(b)&&(m===u||!i(r,b));s(p===n,C,S)?x._invalid=!0:d.push(x)}}for(var _=0,g=d.length;g>_;_++){var x=d[_];if(!x._visited){var p=new A,P=x._intersection,M=P&&P.getSegment(!0);x.getPrevious()._invalid&&x.setHandleIn(M?M._handleIn:new o(0,0));do{if(x._visited=!0,x._invalid&&x._intersection){var z=x._intersection.getSegment(!0);p.add(new k(x._point,x._handleIn,z._handleOut)),z._visited=!0,x=z}else p.add(x.clone());x=x.getNext()}while(x&&!x._visited&&x!==M);var I=p._segments.length;I>1&&(I>2||!p.isPolygon())?(p.setClosed(!0),f.addChild(p,!0)):p.remove()}}return n.remove(),r.remove(),f.reduce()}function i(t,e){var n=t.getCurves(),i=t.getBounds();if(i.contains(e))for(var r=0,s=n.length;s>r;r++){var a=n[r];if(a.getBounds().contains(e)&&a.getParameterOf(e))return!0}return!1}return{unite:function(t){return n(this,t,function(t,e,n){return e||n})},intersect:function(t){return n(this,t,function(t,e,n){return!(e||n)})},subtract:function(t){return n(this,t,function(t,e,n){return t&&n||!t&&!e},!0)},exclude:function(t){return new y([this.subtract(t),t.subtract(this)])},divide:function(t){return new y([this.subtract(t),this.intersect(t)])}}});var D=m.extend({_class:"TextItem",_boundsSelected:!0,_serializeFields:{content:null},_boundsGetter:"getBounds",initialize:function(e){this._content="",this._lines=[];var n=e&&t.isPlainObject(e)&&void 0===e.x&&void 0===e.y;this._initialize(n&&e,!n&&o.read(arguments))},_clone:function xe(t){return t.setContent(this._content),xe.base.call(this,t)},getContent:function(){return this._content},setContent:function(t){this._content=""+t,this._lines=this._content.split(/\r\n|\n|\r/gm),this._changed(69)},isEmpty:function(){return!this._content},getCharacterStyle:"#getStyle",setCharacterStyle:"#setStyle",getParagraphStyle:"#getStyle",setParagraphStyle:"#setStyle"}),j=D.extend({_class:"PointText",initialize:function(){D.apply(this,arguments)},clone:function(t){return this._clone(new j({insert:!1}),t)},getPoint:function(){var t=this._matrix.getTranslation();return new h(t.x,t.y,this,"setPoint")},setPoint:function(t){t=o.read(arguments),this.translate(t.subtract(this._matrix.getTranslation()))},_draw:function(t){if(this._content){this._setStyles(t);var e=this._style,n=this._lines,i=e.getLeading();t.font=e.getFontStyle(),t.textAlign=e.getJustification();for(var r=0,s=n.length;s>r;r++){var a=n[r];e.getFillColor()&&t.fillText(a,0,0),e.getStrokeColor()&&t.strokeText(a,0,0),t.translate(0,i)}}}},new function(){var t=null;return{_getBounds:function(e,n){t||(t=Y.getContext(1,1));var i=this._style,r=this._lines,s=r.length,a=i.getJustification(),o=i.getLeading(),h=0;t.font=i.getFontStyle();for(var u=0,c=0;s>c;c++)u=Math.max(u,t.measureText(r[c]).width);"left"!==a&&(h-=u/("center"===a?2:1));var l=new d(h,s?-.75*o:0,u,s*o);return n?n._transformBounds(l,l):l}}}),B=t.extend(new function(){function e(t){var e=h[t];if(!e){i||(i=Y.getContext(1,1),i.globalCompositeOperation="copy"),i.fillStyle="rgba(0,0,0,0)",i.fillStyle=t,i.fillRect(0,0,1,1);var n=i.getImageData(0,0,1,1).data;e=h[t]=[n[0]/255,n[1]/255,n[2]/255]}return e.slice()}function n(t){var e=t.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);if(e.length>=4){for(var n=[0,0,0],i=0;3>i;i++){var r=e[i+1];n[i]=parseInt(1==r.length?r+r:r,16)/255}return n}}var i,r={gray:["gray"],rgb:["red","green","blue"],hsb:["hue","saturation","brightness"],hsl:["hue","saturation","lightness"],gradient:["gradient","origin","destination","highlight"]},a={},h={},u=[[0,3,1],[2,0,1],[1,0,3],[1,2,0],[3,1,0],[0,1,2]],c={"rgb-hsb":function(t,e,n){var i=Math.max(t,e,n),r=Math.min(t,e,n),s=i-r,a=0===s?0:60*(i==t?(e-n)/s+(n>e?6:0):i==e?(n-t)/s+2:(t-e)/s+4);return[a,0===i?0:s/i,i]},"hsb-rgb":function(t,e,n){var t=t/60%6,i=Math.floor(t),r=t-i,i=u[i],s=[n,n*(1-e),n*(1-e*r),n*(1-e*(1-r))];return[s[i[0]],s[i[1]],s[i[2]]]},"rgb-hsl":function(t,e,n){var i=Math.max(t,e,n),r=Math.min(t,e,n),s=i-r,a=0===s,o=a?0:60*(i==t?(e-n)/s+(n>e?6:0):i==e?(n-t)/s+2:(t-e)/s+4),h=(i+r)/2,u=a?0:.5>h?s/(i+r):s/(2-i-r);return[o,u,h]},"hsl-rgb":function(t,e,n){if(t/=360,0===e)return[n,n,n];for(var i=[t+1/3,t,t-1/3],r=.5>n?n*(1+e):n+e-n*e,s=2*n-r,a=[],o=0;3>o;o++){var h=i[o];0>h&&(h+=1),h>1&&(h-=1),a[o]=1>6*h?s+6*(r-s)*h:1>2*h?r:2>3*h?s+6*(r-s)*(2/3-h):s}return a},"rgb-gray":function(t,e,n){return[.2989*t+.587*e+.114*n]},"gray-rgb":function(t){return[t,t,t]},"gray-hsb":function(t){return[0,0,t]},"gray-hsl":function(t){return[0,0,t]},"gradient-rgb":function(){return[]},"rgb-gradient":function(){return[]}};return t.each(r,function(e,n){a[n]=[],t.each(e,function(e,i){var s=t.capitalize(e),h=/^(hue|saturation)$/.test(e),u=a[n][i]="gradient"===e?function(t){var e=this._components[0];return t=E.read(Array.isArray(t)?t:arguments,0,0,{readNull:!0}),e!==t&&(e&&e._removeOwner(this),t&&t._addOwner(this)),t}:"hue"===e?function(t){return isNaN(t)?0:(t%360+360)%360}:"gradient"===n?function(){return o.read(arguments,0,0,{readNull:"highlight"===e,clone:!0})}:function(t){return isNaN(t)?0:Math.min(Math.max(t,0),1)};this["get"+s]=function(){return this._type===n||h&&/^hs[bl]$/.test(this._type)?this._components[i]:this._convert(n)[i]},this["set"+s]=function(t){this._type===n||h&&/^hs[bl]$/.test(this._type)||(this._components=this._convert(n),this._properties=r[n],this._type=n),t=u.call(this,t),null!=t&&(this._components[i]=t,this._changed())}},this)},{_class:"Color",_readIndex:!0,initialize:function l(t){var i,s,o,h,u=Array.prototype.slice,c=arguments,d=0,f=!0;Array.isArray(t)&&(c=t,t=c[0]);var _=null!=t&&typeof t;if("string"===_&&t in r&&(i=t,t=c[1],Array.isArray(t)?(s=t,o=c[2]):(this.__read&&(d=1),c=u.call(c,1),_=typeof t)),!s){if(f=!(this.__options&&this.__options.dontParse),h="number"===_?c:"object"===_&&null!=t.length?t:null){i||(i=h.length>=3?"rgb":"gray");var g=r[i].length;o=h[g],this.__read&&(d+=h===arguments?g+(null!=o?1:0):1),h.length>g&&(h=u.call(h,0,g))}else if("string"===_)s=t.match(/^#[0-9a-f]{3,6}$/i)?n(t):e(t),i="rgb";else if("object"===_)if(t.constructor===l){if(i=t._type,s=t._components.slice(),o=t._alpha,"gradient"===i)for(var p=1,v=s.length;v>p;p++){var m=s[p];m&&(s[p]=m.clone())}}else if(t.constructor===E)i="gradient",h=c;else{i="hue"in t?"lightness"in t?"hsl":"hsb":"gradient"in t||"stops"in t||"radial"in t?"gradient":"gray"in t?"gray":"rgb";var y=r[i];x=f&&a[i],this._components=s=[];for(var p=0,v=y.length;v>p;p++){var w=t[y[p]];null==w&&0===p&&"gradient"===i&&"stops"in t&&(w={stops:t.stops,radial:t.radial}),f&&(w=x[p].call(this,w)),null!=w&&(s[p]=w)}o=t.alpha}this.__read&&i&&(d=1)}if(this._type=i||"rgb","gradient"===i&&(this._id=l._id=(l._id||0)+1),!s){this._components=s=[];for(var x=a[this._type],p=0,v=x.length;v>p;p++){var w=h&&h[p];f&&(w=x[p].call(this,w)),null!=w&&(s[p]=w)}}this._components=s,this._properties=r[this._type],this._alpha=o,this.__read&&(this.__read=d)},_serialize:function(e,n){var i=this.getComponents();return t.serialize(/^(gray|rgb)$/.test(this._type)?i:[this._type].concat(i),e,!0,n)},_changed:function(){this._canvasStyle=null,this._owner&&this._owner._changed(17)},clone:function(){return new B(this._type,this._components.slice(),this._alpha)},_convert:function(t){var e;return this._type===t?this._components.slice():(e=c[this._type+"-"+t])?e.apply(this,this._components):c["rgb-"+t].apply(this,c[this._type+"-rgb"].apply(this,this._components))},convert:function(t){return new B(t,this._convert(t),this._alpha)},getType:function(){return this._type},setType:function(t){this._components=this._convert(t),this._properties=r[t],this._type=t},getComponents:function(){var t=this._components.slice();return null!=this._alpha&&t.push(this._alpha),t},getAlpha:function(){return null!=this._alpha?this._alpha:1},setAlpha:function(t){this._alpha=null==t?null:Math.min(Math.max(t,0),1),this._changed()},hasAlpha:function(){return null!=this._alpha},equals:function(e){return t.isPlainValue(e)&&(e=B.read(arguments)),e===this||e&&this._type===e._type&&this._alpha===e._alpha&&t.equals(this._components,e._components)||!1},toString:function(){for(var t=this._properties,e=[],n="gradient"===this._type,i=s.instance,r=0,a=t.length;a>r;r++){var o=this._components[r];null!=o&&e.push(t[r]+": "+(n?o:i.number(o)))}return null!=this._alpha&&e.push("alpha: "+i.number(this._alpha)),"{ "+e.join(", ")+" }"},toCSS:function(t){var e=this._convert("rgb"),n=t||null==this._alpha?1:this._alpha;return e=[Math.round(255*e[0]),Math.round(255*e[1]),Math.round(255*e[2])],1>n&&e.push(n),(4==e.length?"rgba(":"rgb(")+e.join(",")+")"},toCanvasStyle:function(t){if(this._canvasStyle)return this._canvasStyle;if("gradient"!==this._type)return this._canvasStyle=this.toCSS();var e,n=this._components,i=n[0],r=i._stops,s=n[1],a=n[2];if(i._radial){var o=a.getDistance(s),h=n[3];if(h){var u=h.subtract(s);u.getLength()>o&&(h=s.add(u.normalize(o-.1)))}var c=h||s;e=t.createRadialGradient(c.x,c.y,0,s.x,s.y,o)}else e=t.createLinearGradient(s.x,s.y,a.x,a.y);for(var l=0,d=r.length;d>l;l++){var f=r[l];e.addColorStop(f._rampPoint,f._color.toCanvasStyle())}return this._canvasStyle=e},transform:function(t){if("gradient"===this._type){for(var e=this._components,n=1,i=e.length;i>n;n++){var r=e[n];t._transformPoint(r,r,!0)}this._changed()}},statics:{_types:r,random:function(){var t=Math.random;return new B(t(),t(),t())}}})},new function(){function e(t,e){return 0>t?0:e&&t>360?360:!e&&t>1?1:t}var n={add:function(t,n,i){return e(t+n,i)},subtract:function(t,n,i){return e(t-n,i)},multiply:function(t,n,i){return e(t*n,i)},divide:function(t,n,i){return e(t/n,i)}};return t.each(n,function(t,e){var n={dontParse:/^(multiply|divide)$/.test(e)};this[e]=function(e){e=B.read(arguments,0,0,n);for(var i=this._type,r=this._properties,s=this._components,a=e._convert(i),o=0,h=s.length;h>o;o++)a[o]=t(s[o],a[o],"hue"===r[o]);return new B(i,a,null!=this._alpha?t(this._alpha,e.getAlpha()):null)}},{})});t.each(B._types,function(e,n){var i=this[t.capitalize(n)+"Color"]=function(t){var e=null!=t&&typeof t,i="object"===e&&null!=t.length?t:"string"===e?null:arguments;return i?new B(n,i):new B(t)};if(3==n.length){var r=n.toUpperCase();B[r]=this[r+"Color"]=i}},t.exports);var E=t.extend({_class:"Gradient",initialize:function be(t,e){this._id=be._id=(be._id||0)+1,t&&this._set(t)&&(t=e=null),this._stops||this.setStops(t||["white","black"]),null==this._radial&&this.setRadial("string"==typeof e&&"radial"===e||e||!1)},_serialize:function(e,n){return n.add(this,function(){return t.serialize([this._stops,this._radial],e,!0,n)})},_changed:function(){for(var t=0,e=this._owners&&this._owners.length;e>t;t++)this._owners[t]._changed()},_addOwner:function(t){this._owners||(this._owners=[]),this._owners.push(t)},_removeOwner:function(t){var e=this._owners?this._owners.indexOf(t):-1;-1!=e&&(this._owners.splice(e,1),0===this._owners.length&&delete this._owners)},clone:function(){for(var t=[],e=0,n=this._stops.length;n>e;e++)t[e]=this._stops[e].clone();return new this.constructor(t)},getStops:function(){return this._stops},setStops:function(t){if(this.stops)for(var e=0,n=this._stops.length;n>e;e++)delete this._stops[e]._owner;if(t.length<2)throw Error("Gradient stop list needs to contain at least two stops.");this._stops=N.readAll(t,0,!1,!0);for(var e=0,n=this._stops.length;n>e;e++){var i=this._stops[e];i._owner=this,i._defaultRamp&&i.setRampPoint(e/(n-1))}this._changed()},getRadial:function(){return this._radial},setRadial:function(t){this._radial=t,this._changed()},equals:function(t){if(t&&t.constructor==this.constructor&&this._stops.length==t._stops.length){for(var e=0,n=this._stops.length;n>e;e++)if(!this._stops[e].equals(t._stops[e]))return!1;return!0}return!1}}),N=t.extend({_class:"GradientStop",initialize:function(t,e){if(t){var n,i;void 0===e&&Array.isArray(t)?(n=t[0],i=t[1]):t.color?(n=t.color,i=t.rampPoint):(n=t,i=e),this.setColor(n),this.setRampPoint(i)}},clone:function(){return new N(this._color.clone(),this._rampPoint)},_serialize:function(e,n){return t.serialize([this._color,this._rampPoint],e,!0,n)},_changed:function(){this._owner&&this._owner._changed(17)},getRampPoint:function(){return this._rampPoint},setRampPoint:function(t){this._defaultRamp=null==t,this._rampPoint=t||0,this._changed()},getColor:function(){return this._color},setColor:function(t){this._color=B.read(arguments),this._color===t&&(this._color=t.clone()),this._color._owner=this,this._changed()},equals:function(t){return t===this||t instanceof N&&this._color.equals(t._color)&&this._rampPoint==t._rampPoint||!1}}),F=t.extend(new function(){var e={fillColor:void 0,strokeColor:void 0,strokeWidth:1,strokeCap:"butt",strokeJoin:"miter",miterLimit:10,dashOffset:0,dashArray:[],shadowColor:void 0,shadowBlur:0,shadowOffset:new o,selectedColor:void 0,font:"sans-serif",fontSize:12,leading:null,justification:"left"},n={strokeWidth:25,strokeCap:25,strokeJoin:25,miterLimit:25,font:5,fontSize:5,leading:5,justification:5},i={},r={_defaults:e,_textDefaults:t.merge(e,{fillColor:new B})};return t.each(e,function(e,s){var a=/Color$/.test(s),o=t.capitalize(s),h=n[s],u="set"+o,c="get"+o;r[u]=function(t){var e=this._item&&this._item._children;if(e&&e.length>0&&"compound-path"!==this._item._type)for(var n=0,i=e.length;i>n;n++)e[n]._style[u](t);else{var r=this._values[s];r!=t&&(a&&(r&&delete r._owner,t&&t.constructor===B&&(t._owner=this._item)),this._values[s]=t,this._item&&this._item._changed(h||17))}},r[c]=function(){var e,n=this._item&&this._item._children;if(!n||0===n.length||arguments[0]||"compound-path"===this._item._type){var e=this._values[s];return void 0===e?(e=this._defaults[s],e&&e.clone&&(e=e.clone()),this._values[s]=e):!a||e&&e.constructor===B||(this._values[s]=e=B.read([e],0,0,{readNull:!0,clone:!0}),e&&(e._owner=this._item)),e}for(var i=0,r=n.length;r>i;i++){var o=n[i]._style[c]();if(0===i)e=o;else if(!t.equals(e,o))return void 0}return e},i[c]=function(){return this._style[c]()},i[u]=function(t){this._style[u](t)}}),m.inject(i),r},{_class:"Style",initialize:function(t,e){this._values={},this._item=e,e instanceof D&&(this._defaults=this._textDefaults),t&&this.set(t)},set:function(t){var e=t instanceof F,n=e?t._values:t;if(n)for(var i in n)if(i in this._defaults){var r=n[i];this[i]=r&&e&&r.clone?r.clone():r}},getLeading:function Ce(){var t=Ce.base.call(this);return null!=t?t:1.2*this.getFontSize()},getFontStyle:function(){var t=this.getFontSize();return(/[a-z]/i.test(t)?t+" ":t+"px ")+this.getFont()}}),R=new function(){function e(n,i){for(var r=[],s=0,a=n&&n.length;a>s;){var o=n[s++];if("string"==typeof o)o=document.createElement(o);else if(!o||!o.nodeType)continue;t.isPlainObject(n[s])&&R.set(o,n[s++]),Array.isArray(n[s])&&e(n[s++],o),i&&i.appendChild(o),r.push(o)}return r}var n=/^(checked|value|selected|disabled)$/i,i={text:"textContent",html:"innerHTML"},r={lineHeight:1,zoom:1,zIndex:1,opacity:1};return{create:function(t,n){var i=Array.isArray(t),r=e(i?t:arguments,i?n:null);return 1==r.length?r[0]:r},find:function(t,e){return(e||document).querySelector(t)},findAll:function(t,e){return(e||document).querySelectorAll(t)},get:function(t,e){return t?n.test(e)?"value"===e||"string"!=typeof t[e]?t[e]:!0:e in i?t[i[e]]:t.getAttribute(e):null},set:function(t,e,r){if("string"!=typeof e)for(var s in e)e.hasOwnProperty(s)&&this.set(t,s,e[s]);else{if(!t||void 0===r)return t;n.test(e)?t[e]=r:e in i?t[i[e]]=r:"style"===e?this.setStyle(t,r):"events"===e?q.add(t,r):t.setAttribute(e,r)}return t},getStyles:function(t){var e=t&&t.ownerDocument.defaultView;return e&&e.getComputedStyle(t,"")},getStyle:function(t,e){return t&&t.style[e]||this.getStyles(t)[e]||null},setStyle:function(t,e,n){if("string"!=typeof e)for(var i in e)e.hasOwnProperty(i)&&this.setStyle(t,i,e[i]);else!/^-?[\d\.]+$/.test(n)||e in r||(n+="px"),t.style[e]=n;return t},hasClass:function(t,e){return RegExp("\\s*"+e+"\\s*").test(t.className)},addClass:function(t,e){t.className=(t.className+" "+e).trim()},removeClass:function(t,e){t.className=t.className.replace(RegExp("\\s*"+e+"\\s*")," ").trim()},remove:function(t){t.parentNode&&t.parentNode.removeChild(t)},removeChildren:function(t){for(;t.firstChild;)t.removeChild(t.firstChild)},getBounds:function(t,e){var n,i=t.ownerDocument,r=i.body,s=i.documentElement;try{n=t.getBoundingClientRect()}catch(a){n={left:0,top:0,width:0,height:0}}var o=n.left-(s.clientLeft||r.clientLeft||0),h=n.top-(s.clientTop||r.clientTop||0);if(!e){var u=i.defaultView;o+=u.pageXOffset||s.scrollLeft||r.scrollLeft,h+=u.pageYOffset||s.scrollTop||r.scrollTop}return new d(o,h,n.width,n.height)},getViewportBounds:function(t){var e=t.ownerDocument,n=e.defaultView,i=e.documentElement;return new d(0,0,n.innerWidth||i.clientWidth,n.innerHeight||i.clientHeight)},getOffset:function(t,e){return this.getBounds(t,e).getPoint()},getSize:function(t){return this.getBounds(t,!0).getSize()},isInvisible:function(t){return this.getSize(t).equals(new u(0,0))},isInView:function(t){return!this.isInvisible(t)&&this.getViewportBounds(t).intersects(this.getBounds(t,!0))}}},q={add:function(t,e){for(var n in e){var i=e[n];t.addEventListener?t.addEventListener(n,i,!1):t.attachEvent&&t.attachEvent("on"+n,i.bound=function(){i.call(t,window.event)})}},remove:function(t,e){for(var n in e){var i=e[n];t.removeEventListener?t.removeEventListener(n,i,!1):t.detachEvent&&t.detachEvent("on"+n,i.bound)}},getPoint:function(t){var e=t.targetTouches?t.targetTouches.length?t.targetTouches[0]:t.changedTouches[0]:t;return new o(e.pageX||e.clientX+document.documentElement.scrollLeft,e.pageY||e.clientY+document.documentElement.scrollTop)},getTarget:function(t){return t.target||t.srcElement},getOffset:function(t,e){return q.getPoint(t).subtract(R.getOffset(e||q.getTarget(t)))},preventDefault:function(t){t.preventDefault?t.preventDefault():t.returnValue=!1},stopPropagation:function(t){t.stopPropagation?t.stopPropagation():t.cancelBubble=!0
},stop:function(t){q.stopPropagation(t),q.preventDefault(t)}};q.requestAnimationFrame=new function(){var t="equestAnimationFrame",e=window["r"+t]||window["webkitR"+t]||window["mozR"+t]||window["oR"+t]||window["msR"+t];e&&e(function(t){null==t&&(e=null)});var i,r=[],s=!0;return q.add(window,{focus:function(){s=!0},blur:function(){s=!1}}),function(t,a){return e?e(t,a):(r.push([t,a]),i||(i=setInterval(function(){for(var t=r.length-1;t>=0;t--){var e=r[t],i=e[0],a=e[1];(!a||("true"==n.getAttribute(a,"keepalive")||s)&&R.isInView(a))&&(r.splice(t,1),i(Date.now()))}},1e3/60)),void 0)}};var V=t.extend(e,{_class:"View",initialize:function Se(t){this._scope=paper,this._project=paper.project,this._element=t;var e;if(this._id=t.getAttribute("id"),null==this._id&&t.setAttribute("id",this._id="view-"+Se._id++),q.add(t,this._viewHandlers),n.hasAttribute(t,"resize")){var i=R.getOffset(t,!0),r=this;e=R.getViewportBounds(t).getSize().subtract(i),this._windowHandlers={resize:function(){R.isInvisible(t)||(i=R.getOffset(t,!0)),r.setViewSize(R.getViewportBounds(t).getSize().subtract(i))}},q.add(window,this._windowHandlers)}else e=new u(parseInt(t.getAttribute("width"),10),parseInt(t.getAttribute("height"),10)),e.isNaN()&&(e=R.getSize(t));if(t.width=e.width,t.height=e.height,n.hasAttribute(t,"stats")&&"undefined"!=typeof Stats){this._stats=new Stats;var s=this._stats.domElement,a=s.style,i=R.getOffset(t);a.position="absolute",a.left=i.x+"px",a.top=i.y+"px",document.body.appendChild(s)}Se._views.push(this),Se._viewsById[this._id]=this,this._viewSize=new c(e.width,e.height,this,"setViewSize"),this._matrix=new _,this._zoom=1,Se._focused||(Se._focused=this),this._frameItems={},this._frameItemCount=0},remove:function(){return this._project?(V._focused==this&&(V._focused=null),V._views.splice(V._views.indexOf(this),1),delete V._viewsById[this._id],this._project.view==this&&(this._project.view=null),q.remove(this._element,this._viewHandlers),q.remove(window,this._windowHandlers),this._element=this._project=null,this.detach("frame"),this._frameItems={},!0):!1},_events:{onFrame:{install:function(){this._requested||(this._animate=!0,this._requestFrame())},uninstall:function(){this._animate=!1}},onResize:{}},_animate:!1,_time:0,_count:0,_requestFrame:function(){var t=this;q.requestAnimationFrame(function(){t._requested=!1,t._animate&&(t._requestFrame(),t._handleFrame())},this._element),this._requested=!0},_handleFrame:function(){paper=this._scope;var e=Date.now()/1e3,n=this._before?e-this._before:0;this._before=e,this._handlingFrame=!0,this.fire("frame",t.merge({delta:n,time:this._time+=n,count:this._count++})),this._stats&&this._stats.update(),this._handlingFrame=!1,this.draw(!0)},_animateItem:function(t,e){var n=this._frameItems;e?(n[t._id]={item:t,time:0,count:0},1===++this._frameItemCount&&this.attach("frame",this._handleFrameItems)):(delete n[t._id],0===--this._frameItemCount&&this.detach("frame",this._handleFrameItems))},_handleFrameItems:function(e){for(var n in this._frameItems){var i=this._frameItems[n];i.item.fire("frame",t.merge(e,{time:i.time+=e.delta,count:i.count++}))}},_redraw:function(){this._project._needsRedraw=!0,this._handlingFrame||(this._animate?this._handleFrame():this.draw())},_transform:function(t){this._matrix.concatenate(t),this._bounds=null,this._inverse=null,this._redraw()},getElement:function(){return this._element},getViewSize:function(){return this._viewSize},setViewSize:function(t){t=u.read(arguments);var e=t.subtract(this._viewSize);e.isZero()||(this._element.width=t.width,this._element.height=t.height,this._viewSize.set(t.width,t.height,!0),this._bounds=null,this.fire("resize",{size:t,delta:e}),this._redraw())},getBounds:function(){return this._bounds||(this._bounds=this._getInverse()._transformBounds(new d(new o,this._viewSize))),this._bounds},getSize:function(){return this.getBounds().getSize(arguments[0])},getCenter:function(){return this.getBounds().getCenter(arguments[0])},setCenter:function(t){t=o.read(arguments),this.scrollBy(t.subtract(this.getCenter()))},getZoom:function(){return this._zoom},setZoom:function(t){this._transform((new _).scale(t/this._zoom,this.getCenter())),this._zoom=t},isVisible:function(){return R.isInView(this._element)},scrollBy:function(){this._transform((new _).translate(o.read(arguments).negate()))},projectToView:function(){return this._matrix._transformPoint(o.read(arguments))},viewToProject:function(){return this._getInverse()._transformPoint(o.read(arguments))},_getInverse:function(){return this._inverse||(this._inverse=this._matrix.inverted()),this._inverse}},{statics:{_views:[],_viewsById:{},_id:0,create:function(t){return"string"==typeof t&&(t=document.getElementById(t)),new H(t)}}},new function(){function t(t){var e=q.getTarget(t);return e.getAttribute&&V._viewsById[e.getAttribute("id")]}function e(t,e){return t.viewToProject(q.getOffset(e,t._element))}function n(){if(!V._focused||!V._focused.isVisible())for(var t=0,e=V._views.length;e>t;t++){var n=V._views[t];if(n&&n.isVisible()){V._focused=u=n;break}}}function i(n){var i=V._focused=t(n),r=e(i,n);c=!0,i._onMouseDown&&i._onMouseDown(n,r),(o=i._scope._tool)&&o._onHandleEvent("mousedown",r,n),i.draw(!0)}function r(i){var r;if(c||(r=t(i),r?(h=V._focused,V._focused=u=r):u&&u==V._focused&&(V._focused=h,n())),r=r||V._focused){var s=i&&e(r,i);r._onMouseMove&&r._onMouseMove(i,s),(o=r._scope._tool)&&o._onHandleEvent(c&&o.responds("mousedrag")?"mousedrag":"mousemove",s,i)&&q.stop(i),r.draw(!0)}}function s(t){var n=V._focused;if(n&&c){var i=e(n,t);curPoint=null,c=!1,n._onMouseUp&&n._onMouseUp(t,i),o&&o._onHandleEvent("mouseup",i,t)&&q.stop(t),n.draw(!0)}}function a(t){c&&q.stop(t)}var o,h,u,c=!1;return q.add(document,{mousemove:r,mouseup:s,touchmove:r,touchend:s,selectstart:a,scroll:n}),q.add(window,{load:n}),{_viewHandlers:{mousedown:i,touchstart:i,selectstart:a},statics:{updateFocus:n}}}),H=V.extend({_class:"CanvasView",initialize:function(t){if(!(t instanceof HTMLCanvasElement)){var e=u.read(arguments,1);e.isZero()&&(e=new u(1024,768)),t=Y.getCanvas(e)}this._context=t.getContext("2d"),this._eventCounters={},V.call(this,t)},draw:function(t){if(t&&!this._project._needsRedraw)return!1;var e=this._context,n=this._viewSize;return e.clearRect(0,0,n._width+1,n._height+1),this._project.draw(e,this._matrix),this._project._needsRedraw=!1,!0}},new function(){function t(t,e,n,i,r,s){for(var a,o=i;o;){if(o.responds(t)&&(a||(a=new J(t,e,n,i,r?n.subtract(r):null)),o.fire(t,a)&&(!s||a._stopped)))return!1;o=o.getParent()}return!0}function e(e,n,i,r,s){if(e._eventCounters[n]){var a=e._project,u=a.hitTest(r,{tolerance:a.options.hitTolerance||0,fill:!0,stroke:!0}),c=u&&u.item;if(c)return"mousemove"===n&&c!=o&&(s=r),"mousemove"===n&&h||t(n,i,r,c,s),c}}var n,i,r,s,a,o,h,u,c;return{_onMouseDown:function(t,o){var l=e(this,"mousedown",t,o);u=a==l&&Date.now()-c<300,s=a=l,n=i=r=o,h=s&&s.responds("mousedrag")},_onMouseUp:function(a,o){var l=e(this,"mouseup",a,o);h&&(i&&!i.equals(o)&&t("mousedrag",a,o,s,i),l!=s&&(r=o,t("mousemove",a,o,l,r))),l===s&&(c=Date.now(),(!u||t("doubleclick",a,n,l))&&t("click",a,n,l),u=!1),s=null,h=!1},_onMouseMove:function(n,a){s&&t("mousedrag",n,a,s,i);var h=e(this,"mousemove",n,a,r);i=r=a,h!==o&&(t("mouseleave",n,a,o),o=h,t("mouseenter",n,a,h))}}}),Z=t.extend({_class:"Event",initialize:function(t){this.event=t},preventDefault:function(){this._prevented=!0,q.preventDefault(this.event)},stopPropagation:function(){this._stopped=!0,q.stopPropagation(this.event)},stop:function(){this.stopPropagation(),this.preventDefault()},getModifiers:function(){return X.modifiers}}),U=Z.extend({_class:"KeyEvent",initialize:function(t,e,n,i){Z.call(this,i),this.type=t?"keydown":"keyup",this.key=e,this.character=n},toString:function(){return"{ type: '"+this.type+"', key: '"+this.key+"', character: '"+this.character+"', modifiers: "+this.getModifiers()+" }"}}),X=new function(){function e(t,e,n,r){var s=String.fromCharCode(n),o=i[e]||s.toLowerCase(),h=t?"keydown":"keyup",u=V._focused,c=u&&u.isVisible()&&u._scope,l=c&&c._tool;a[o]=t,l&&l.responds(h)&&(l.fire(h,new U(t,o,s,r)),u&&u.draw(!0))}var n,i={8:"backspace",9:"tab",13:"enter",16:"shift",17:"control",18:"option",19:"pause",20:"caps-lock",27:"escape",32:"space",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",46:"delete",91:"command",93:"command",224:"command"},r=t.merge({shift:!1,control:!1,option:!1,command:!1,capsLock:!1,space:!1}),s={},a={};return q.add(document,{keydown:function(a){var o,h=a.which||a.keyCode,u=i[h];u?((o=t.camelize(u))in r&&(r[o]=!0),s[h]=0,e(!0,h,null,a)):n=h},keypress:function(t){if(null!=n){var i=t.which||t.keyCode;s[n]=i,e(!0,n,i,t),n=null}},keyup:function(n){var a,o=n.which||n.keyCode,h=i[o];h&&(a=t.camelize(h))in r&&(r[a]=!1),null!=s[o]&&(e(!1,o,s[o],n),delete s[o])}}),{modifiers:r,isDown:function(t){return!!a[t]}}},J=Z.extend({_class:"MouseEvent",initialize:function(t,e,n,i,r){Z.call(this,e),this.type=t,this.point=n,this.target=i,this.delta=r},toString:function(){return"{ type: '"+this.type+"', point: "+this.point+", target: "+this.target+(this.delta?", delta: "+this.delta:"")+", modifiers: "+this.getModifiers()+" }"}});t.extend(e,{_class:"Palette",_events:["onChange"],initialize:function(e,n,i){var r=R.find(".palettejs-panel")||R.find("body").appendChild(R.create("div",{"class":"palettejs-panel"}));this._element=r.appendChild(R.create("table",{"class":"palettejs-pane"})),this._title=e,i||(i={});for(var s in this._components=n){var a=n[s];a instanceof $||(null==a.value&&(a.value=i[s]),a.name=s,a=n[s]=new $(a)),this._element.appendChild(a._element),a._palette=this,void 0===i[s]&&(i[s]=a.value)}this._values=t.each(i,function(e,r){var s=n[r];s&&t.define(i,r,{enumerable:!0,configurable:!0,get:function(){return s._value},set:function(t){s.setValue(t)}})}),window.paper&&paper.palettes.push(this)},reset:function(){for(var t in this._components)this._components[t].reset()},remove:function(){R.remove(this._element)}});var $=t.extend(e,{_class:"Component",_events:["onChange","onClick"],_types:{"boolean":{type:"checkbox",value:"checked"},string:{type:"text"},number:{type:"number",number:!0},button:{type:"button"},text:{tag:"div",value:"text"},slider:{type:"range",number:!0},list:{tag:"select",options:function(){R.removeChildren(this._inputItem),R.create(t.each(this._options,function(t){this.push("option",{value:t,text:t})},[]),this._inputItem)}}},initialize:function(e){this._type=e.type in this._types?e.type:"options"in e?"list":"onClick"in e?"button":typeof e.value,this._info=this._types[this._type]||{type:this._type};var n=this,i=!1;this._inputItem=R.create(this._info.tag||"input",{type:this._info.type,events:{change:function(){n.setValue(R.get(this,n._info.value||"value")),i&&(n._palette.fire("change",n,n.name,n._value),n.fire("change",n._value))},click:function(){n.fire("click")}}}),this._element=R.create("tr",[this._labelItem=R.create("td"),"td",[this._inputItem]]),t.each(e,function(t,e){this[e]=t},this),this._defaultValue=this._value,i=!0},getType:function(){return this._type},getLabel:function(){return this._label},setLabel:function(t){this._label=t,R.set(this._labelItem,"text",t+":")},getOptions:function(){return this._options},setOptions:function(t){this._options=t,this._info.options&&this._info.options.call(this)},getValue:function(){return this._value},setValue:function(t){var e=this._info.value||"value";R.set(this._inputItem,e,t),t=R.get(this._inputItem,e),this._value=this._info.number?parseFloat(t,10):t},getRange:function(){return[parseFloat(R.get(this._inputItem,"min")),parseFloat(R.get(this._inputItem,"max"))]},setRange:function(t,e){var n=Array.isArray(t)?t:[t,e];R.set(this._inputItem,{min:n[0],max:n[1]})},getMin:function(){return this.getRange()[0]},setMin:function(t){this.setRange(t,this.getMax())},getMax:function(){return this.getRange()[1]},setMax:function(t){this.setRange(this.getMin(),t)},getStep:function(){return parseFloat(R.get(this._inputItem,"step"))},setStep:function(t){R.set(this._inputItem,"step",t)},reset:function(){this.setValue(this._defaultValue)}}),G=Z.extend({_class:"ToolEvent",_item:null,initialize:function(t,e,n){this.tool=t,this.type=e,this.event=n},_choosePoint:function(t,e){return t?t:e?e.clone():null},getPoint:function(){return this._choosePoint(this._point,this.tool._point)},setPoint:function(t){this._point=t},getLastPoint:function(){return this._choosePoint(this._lastPoint,this.tool._lastPoint)},setLastPoint:function(t){this._lastPoint=t},getDownPoint:function(){return this._choosePoint(this._downPoint,this.tool._downPoint)},setDownPoint:function(t){this._downPoint=t},getMiddlePoint:function(){return!this._middlePoint&&this.tool._lastPoint?this.tool._point.add(this.tool._lastPoint).divide(2):this._middlePoint},setMiddlePoint:function(t){this._middlePoint=t},getDelta:function(){return!this._delta&&this.tool._lastPoint?this.tool._point.subtract(this.tool._lastPoint):this._delta},setDelta:function(t){this._delta=t},getCount:function(){return/^mouse(down|up)$/.test(this.type)?this.tool._downCount:this.tool._count},setCount:function(t){this.tool[/^mouse(down|up)$/.test(this.type)?"downCount":"count"]=t},getItem:function(){if(!this._item){var t=this.tool._scope.project.hitTest(this.getPoint());if(t){for(var e=t.item,n=e._parent;/^(group|compound-path)$/.test(n._type);)e=n,n=n._parent;this._item=e}}return this._item},setItem:function(t){this._item=t},toString:function(){return"{ type: "+this.type+", point: "+this.getPoint()+", count: "+this.getCount()+", modifiers: "+this.getModifiers()+" }"}}),W=r.extend({_class:"Tool",_list:"tools",_reference:"_tool",_events:["onActivate","onDeactivate","onEditOptions","onMouseDown","onMouseUp","onMouseDrag","onMouseMove","onKeyDown","onKeyUp"],initialize:function(t){r.call(this),this._firstMove=!0,this._count=0,this._downCount=0,this._set(t)},getMinDistance:function(){return this._minDistance},setMinDistance:function(t){this._minDistance=t,null!=this._minDistance&&null!=this._maxDistance&&this._minDistance>this._maxDistance&&(this._maxDistance=this._minDistance)},getMaxDistance:function(){return this._maxDistance},setMaxDistance:function(t){this._maxDistance=t,null!=this._minDistance&&null!=this._maxDistance&&this._maxDistance<this._minDistance&&(this._minDistance=t)},getFixedDistance:function(){return this._minDistance==this._maxDistance?this._minDistance:null},setFixedDistance:function(t){this._minDistance=t,this._maxDistance=t},_updateEvent:function(t,e,n,i,r,s,a){if(!r){if(null!=n||null!=i){var o=null!=n?n:0,h=e.subtract(this._point),u=h.getLength();if(o>u)return!1;var c=null!=i?i:0;if(0!=c)if(u>c)e=this._point.add(h.normalize(c));else if(a)return!1}if(s&&e.equals(this._point))return!1}switch(this._lastPoint=r&&"mousemove"==t?e:this._point,this._point=e,t){case"mousedown":this._lastPoint=this._downPoint,this._downPoint=this._point,this._downCount++;break;case"mouseup":this._lastPoint=this._downPoint}return this._count=r?0:this._count+1,!0},_fireEvent:function(t,e){var n=paper.project._removeSets;if(n){"mouseup"===t&&(n.mousedrag=null);var i=n[t];if(i){for(var r in i){var s=i[r];for(var a in n){var o=n[a];o&&o!=i&&delete o[s._id]}s.remove()}n[t]=null}}return this.responds(t)&&this.fire(t,new G(this,t,e))},_onHandleEvent:function(t,e,n){paper=this._scope;var i=!1;switch(t){case"mousedown":this._updateEvent(t,e,null,null,!0,!1,!1),i=this._fireEvent(t,n);break;case"mousedrag":for(var r=!1,s=!1;this._updateEvent(t,e,this.minDistance,this.maxDistance,!1,r,s);)i=this._fireEvent(t,n)||i,r=!0,s=!0;break;case"mouseup":!e.equals(this._point)&&this._updateEvent("mousedrag",e,this.minDistance,this.maxDistance,!1,!1,!1)&&(i=this._fireEvent("mousedrag",n)),this._updateEvent(t,e,null,this.maxDistance,!1,!1,!1),i=this._fireEvent(t,n)||i,this._updateEvent(t,e,null,null,!0,!1,!1),this._firstMove=!0;break;case"mousemove":for(;this._updateEvent(t,e,this.minDistance,this.maxDistance,this._firstMove,!0,!1);)i=this._fireEvent(t,n)||i,this._firstMove=!1}return i}}),Y={canvases:[],getCanvas:function(t,e){var n,i=void 0===e?t:new u(t,e),r=!0;n=this.canvases.length?this.canvases.pop():document.createElement("canvas");var s=n.getContext("2d");return s.save(),n.width===i.width&&n.height===i.height?r&&s.clearRect(0,0,i.width+1,i.height+1):(n.width=i.width,n.height=i.height),n},getContext:function(t,e){return this.getCanvas(t,e).getContext("2d")},release:function(t){var e=t.canvas?t.canvas:t;e.getContext("2d").restore(),this.canvases.push(e)}},K=new function(){function e(t,e,n){return.2989*t+.587*e+.114*n}function n(t,n,i,r){var s=r-e(t,n,i);f=t+s,_=n+s,g=i+s;var r=e(f,_,g),a=p(f,_,g),o=v(f,_,g);if(0>a){var h=r-a;f=r+(f-r)*r/h,_=r+(_-r)*r/h,g=r+(g-r)*r/h}if(o>255){var u=255-r,c=o-r;f=r+(f-r)*u/c,_=r+(_-r)*u/c,g=r+(g-r)*u/c}}function i(t,e,n){return v(t,e,n)-p(t,e,n)}function r(t,e,n,i){var r,s=[t,e,n],a=v(t,e,n),o=p(t,e,n);o=o===t?0:o===e?1:2,a=a===t?0:a===e?1:2,r=0===p(o,a)?1===v(o,a)?2:1:0,s[a]>s[o]?(s[r]=(s[r]-s[o])*i/(s[a]-s[o]),s[a]=i):s[r]=s[a]=0,s[o]=0,f=s[0],_=s[1],g=s[2]}var s,a,o,h,u,c,l,d,f,_,g,p=Math.min,v=Math.max,m=Math.abs,y={multiply:function(){f=u*s/255,_=c*a/255,g=l*o/255},screen:function(){f=u+s-u*s/255,_=c+a-c*a/255,g=l+o-l*o/255},overlay:function(){f=128>u?2*u*s/255:255-2*(255-u)*(255-s)/255,_=128>c?2*c*a/255:255-2*(255-c)*(255-a)/255,g=128>l?2*l*o/255:255-2*(255-l)*(255-o)/255},"soft-light":function(){var t=s*u/255;f=t+u*(255-(255-u)*(255-s)/255-t)/255,t=a*c/255,_=t+c*(255-(255-c)*(255-a)/255-t)/255,t=o*l/255,g=t+l*(255-(255-l)*(255-o)/255-t)/255},"hard-light":function(){f=128>s?2*s*u/255:255-2*(255-s)*(255-u)/255,_=128>a?2*a*c/255:255-2*(255-a)*(255-c)/255,g=128>o?2*o*l/255:255-2*(255-o)*(255-l)/255},"color-dodge":function(){f=0===u?0:255===s?255:p(255,255*u/(255-s)),_=0===c?0:255===a?255:p(255,255*c/(255-a)),g=0===l?0:255===o?255:p(255,255*l/(255-o))},"color-burn":function(){f=255===u?255:0===s?0:v(0,255-255*(255-u)/s),_=255===c?255:0===a?0:v(0,255-255*(255-c)/a),g=255===l?255:0===o?0:v(0,255-255*(255-l)/o)},darken:function(){f=s>u?u:s,_=a>c?c:a,g=o>l?l:o},lighten:function(){f=u>s?u:s,_=c>a?c:a,g=l>o?l:o},difference:function(){f=u-s,0>f&&(f=-f),_=c-a,0>_&&(_=-_),g=l-o,0>g&&(g=-g)},exclusion:function(){f=u+s*(255-u-u)/255,_=c+a*(255-c-c)/255,g=l+o*(255-l-l)/255},hue:function(){r(s,a,o,i(u,c,l)),n(f,_,g,e(u,c,l))},saturation:function(){r(u,c,l,i(s,a,o)),n(f,_,g,e(u,c,l))},luminosity:function(){n(u,c,l,e(s,a,o))},color:function(){n(s,a,o,e(u,c,l))},add:function(){f=p(u+s,255),_=p(c+a,255),g=p(l+o,255)},subtract:function(){f=v(u-s,0),_=v(c-a,0),g=v(l-o,0)},average:function(){f=(u+s)/2,_=(c+a)/2,g=(l+o)/2},negation:function(){f=255-m(255-s-u),_=255-m(255-a-c),g=255-m(255-o-l)}},w=this.nativeModes=t.each(["source-over","source-in","source-out","source-atop","destination-over","destination-in","destination-out","destination-atop","lighter","darker","copy","xor"],function(t){this[t]=!0},{}),x=Y.getContext(1,1);t.each(y,function(t,e){x.save();var n="darken"===e,i=!1;x.fillStyle=n?"#300":"#a00",x.fillRect(0,0,1,1),x.globalCompositeOperation=e,x.globalCompositeOperation===e&&(x.fillStyle=n?"#a00":"#300",x.fillRect(0,0,1,1),i=x.getImageData(0,0,1,1).data[0]!==(n?170:51)),w[e]=i,x.restore()}),Y.release(x),this.process=function(t,e,n,i,r){var p=e.canvas,v="normal"===t;if(v||w[t])n.save(),n.setTransform(1,0,0,1,0,0),n.globalAlpha=i,v||(n.globalCompositeOperation=t),n.drawImage(p,r.x,r.y),n.restore();else{var m=y[t];if(!m)return;for(var x=n.getImageData(r.x,r.y,p.width,p.height),b=x.data,C=e.getImageData(0,0,p.width,p.height).data,S=0,k=b.length;k>S;S+=4){s=C[S],u=b[S],a=C[S+1],c=b[S+1],o=C[S+2],l=b[S+2],h=C[S+3],d=b[S+3],m();var P=h*i/255,M=1-P;b[S]=P*f+M*u,b[S+1]=P*_+M*c,b[S+2]=P*g+M*l,b[S+3]=h*i+M*d}n.putImageData(x,r.x,r.y)}}},Q=t.each({fillColor:["fill","color"],strokeColor:["stroke","color"],strokeWidth:["stroke-width","number"],strokeCap:["stroke-linecap","string"],strokeJoin:["stroke-linejoin","string"],miterLimit:["stroke-miterlimit","number"],dashArray:["stroke-dasharray","array"],dashOffset:["stroke-dashoffset","number"],font:["font-family","string"],fontSize:["font-size","number"],justification:["text-anchor","lookup",{left:"start",center:"middle",right:"end"}],opacity:["opacity","number"],blendMode:["mix-blend-mode","string"]},function(e,n){var i=t.capitalize(n),r=e[2];this[n]={type:e[1],property:n,attribute:e[0],toSVG:r,fromSVG:r&&t.each(r,function(t,e){this[t]=e},{}),get:"get"+i,set:"set"+i}},{}),te={href:"http://www.w3.org/1999/xlink",xlink:"http://www.w3.org/2000/xmlns"};return new function(){function e(t,e){for(var n in e){var i=e[n],r=te[n];"number"==typeof i&&(i=z.number(i)),r?t.setAttributeNS(r,n,i):t.setAttribute(n,i)}return t}function n(t,n){return e(document.createElementNS("http://www.w3.org/2000/svg",t),n)}function r(t,e,n){return t[e]._point.getDistance(t[n]._point)}function o(t,e){var n=t._matrix,i=n.getTranslation(),r={};if(e){n=n.shiftless();var s=n._inverseTransform(i);r.x=s.x,r.y=s.y,i=null}if(n.isIdentity())return r;var o=n.decompose();if(o&&!o.shearing){var h=[],u=o.rotation,c=o.scaling;i&&!i.isZero()&&h.push("translate("+z.point(i)+")"),a.isZero(c.x-1)&&a.isZero(c.y-1)||h.push("scale("+z.point(c)+")"),u&&h.push("rotate("+z.number(u)+")"),r.transform=h.join(" ")}else r.transform="matrix("+n.getValues().join(",")+")";return r}function h(t,e,n,i){var r="rect"===n?e[1]._point.add(e[2]._point).divide(2):"roundrect"===n?e[3]._point.add(e[4]._point).divide(2):"circle"===n||"ellipse"===n?e[1]._point:null,s=r&&r.subtract(i).getAngle()+90;return a.isZero(s||0)?0:s}function u(t,e){function n(t,n){var i=e[t],r=i.getNext(),s=e[n],a=s.getNext();return i._handleOut.isZero()&&r._handleIn.isZero()&&s._handleOut.isZero()&&a._handleIn.isZero()&&r._point.subtract(i._point).isColinear(a._point.subtract(s._point))}function i(t){var n=e[t],i=n.getNext(),r=n._handleOut,s=i._handleIn,o=a.KAPPA;if(r.isOrthogonal(s)){var h=n._point,u=i._point,c=new g(h,r,!0).intersect(new g(u,s,!0),!0);return c&&a.isZero(r.getLength()/c.subtract(h).getLength()-o)&&a.isZero(s.getLength()/c.subtract(u).getLength()-o)}}if(t.isPolygon())return 4===e.length&&t._closed&&n(0,2)&&n(1,3)?"rect":0===e.length?"empty":e.length>=3?t._closed?"polygon":"polyline":"line";if(t._closed){if(8===e.length&&i(0)&&i(2)&&i(4)&&i(6)&&n(1,5)&&n(3,7))return"roundrect";if(4===e.length&&i(0)&&i(1)&&i(2)&&i(3))return a.isZero(r(e,0,2)-r(e,1,3))?"circle":"ellipse"}return"path"}function c(t){for(var i=o(t),r=t._children,s=n("g",i),a=0,h=r.length;h>a;a++){var u=r[a],c=P(u);if(c)if(u.isClipMask()){var l=n("clipPath");l.appendChild(c),S(u,l,"clip"),e(s,{"clip-path":"url(#"+l.id+")"})}else s.appendChild(c)}return s}function d(t){var e=o(t,!0),i=t.getSize();return e.x-=i.width/2,e.y-=i.height/2,e.width=i.width,e.height=i.height,e.href=t.toDataURL(),n("image",e)}function f(t){var e,s=t._segments,a=t.getPosition(!0),o=u(t,s),c=h(t,s,o,a);switch(o){case"empty":return null;case"path":var d=t.getPathData();e=d&&{d:d};break;case"polyline":case"polygon":var f=[];for(i=0,l=s.length;l>i;i++)f.push(z.point(s[i]._point));e={points:f.join(" ")};break;case"rect":var g=r(s,0,3),p=r(s,0,1),v=s[1]._point.rotate(-c,a);e={x:v.x,y:v.y,width:g,height:p};break;case"roundrect":o="rect";var g=r(s,1,6),p=r(s,0,3),m=(g-r(s,0,7))/2,y=(p-r(s,1,2))/2,w=s[3]._point,x=s[4]._point,v=w.subtract(x.subtract(w).normalize(m)).rotate(-c,a);e={x:v.x,y:v.y,width:g,height:p,rx:m,ry:y};break;case"line":var b=s[0]._point,C=s[s.length-1]._point;e={x1:b.x,y1:b.y,x2:C.x,y2:C.y};break;case"circle":var S=r(s,0,2)/2;e={cx:a.x,cy:a.y,r:S};break;case"ellipse":var m=r(s,2,0)/2,y=r(s,3,1)/2;e={cx:a.x,cy:a.y,rx:m,ry:y}}return c&&(e.transform="rotate("+z.number(c)+","+z.point(a)+")",t._gradientMatrix=(new _).rotate(-c,a)),n(o,e)}function v(t){var e=o(t,!0),i=t.getPathData();return i&&(e.d=i),n("path",e)}function y(t){var e=o(t,!0),i=t.getSymbol(),r=C(i,"symbol");return definition=i.getDefinition(),bounds=definition.getBounds(),r||(r=n("symbol",{viewBox:z.rectangle(bounds)}),r.appendChild(P(definition)),S(i,r,"symbol")),e.href="#"+r.id,e.x+=bounds.x,e.y+=bounds.y,e.width=z.number(bounds.width),e.height=z.number(bounds.height),n("use",e)}function w(t,e){var i=C(t,"color");if(!i){var r,s=t.getGradient(),a=s._radial,o=e._gradientMatrix,h=t.getOrigin().transform(o),u=t.getDestination().transform(o);if(a){r={cx:h.x,cy:h.y,r:h.getDistance(u)};var c=t.getHighlight();c&&(c=c.transform(o),r.fx=c.x,r.fy=c.y)}else r={x1:h.x,y1:h.y,x2:u.x,y2:u.y};r.gradientUnits="userSpaceOnUse",i=n((a?"radial":"linear")+"Gradient",r);for(var l=s._stops,d=0,f=l.length;f>d;d++){var _=l[d],g=_._color,p=g.getAlpha();r={offset:_._rampPoint,"stop-color":g.toCSS(!0)},1>p&&(r["stop-opacity"]=p),i.appendChild(n("stop",r))}S(t,i,"color")}return"url(#"+i.id+")"}function x(t){var e=n("text",o(t,!0));return e.textContent=t._content,e}function b(n,i){var r={},s=n.getParent();return null!=n._name&&(r.id=n._name),t.each(Q,function(e){var i=e.get,a=e.type,o=n[i]();if(!s||!t.equals(s[i](),o)){if("color"===a&&null!=o){var h=o.getAlpha();1>h&&(r[e.attribute+"-opacity"]=h)}r[e.attribute]=null==o?"none":"number"===a?z.number(o):"color"===a?o.gradient?w(o,n):o.toCSS(!0):"array"===a?o.join(","):"lookup"===a?e.toSVG[o]:o}}),1===r.opacity&&delete r.opacity,null==n._visibility||n._visibility||(r.visibility="hidden"),delete n._gradientMatrix,e(i,r)}function C(t,e){return I||(I={ids:{},svgs:{}}),t&&I.svgs[e+"-"+t._id]}function S(t,e,n){I||C();var i=I.ids[n]=(I.ids[n]||0)+1;e.id=n+"-"+i,I.svgs[n+"-"+t._id]=e}function k(t,e){if(!I)return t;var i="svg"===t.nodeName.toLowerCase()&&t,r=null;for(var s in I.svgs)r||(i||(i=n("svg"),i.appendChild(t)),r=i.insertBefore(n("defs"),i.firstChild)),r.appendChild(I.svgs[s]);return I=null,e&&e.asString?(new XMLSerializer).serializeToString(i):i}function P(t){var e=A[t._type],n=e&&e(t,t._type);return n&&t._data&&n.setAttribute("data-paper-data",JSON.stringify(t._data)),n&&b(t,n)}function M(t){z=t&&t.precision?new s(t.precision):s.instance}var z,I,A={group:c,layer:c,raster:d,path:f,"compound-path":v,"placed-symbol":y,"point-text":x};m.inject({exportSVG:function(t){return M(t),k(P(this),t)}}),p.inject({exportSVG:function(t){M(t);for(var e=this.layers,i=this.view.getSize(),r=n("svg",{x:0,y:0,width:i.width,height:i.height,version:"1.1",xmlns:"http://www.w3.org/2000/svg","xmlns:xlink":"http://www.w3.org/1999/xlink"}),s=0,a=e.length;a>s;s++)r.appendChild(P(e[s]));return k(r,t)}})},new function(){function e(t,e,n,i){var r=te[e],s=r?t.getAttributeNS(r,e):t.getAttribute(e);return"null"===s&&(s=null),null==s?i?null:n?"":0:n?s:parseFloat(s)}function n(t,n,i,r){return n=e(t,n,!1,r),i=e(t,i,!1,r),r&&null==n&&null==i?null:new o(n||0,i||0)}function i(t,n,i,r){return n=e(t,n,!1,r),i=e(t,i,!1,r),r&&null==n&&null==i?null:new u(n||0,i||0)}function r(t,e,n){return"none"===t?null:"number"===e?parseFloat(t):"array"===e?t?t.split(/[\s,]+/g).map(parseFloat):[]:"color"===e?x(t)||t:"lookup"===e?n[t]:t}function s(t,e){var n=t.childNodes,i="clippath"===e,r=i?new L:new y,s=r._project,a=s._currentStyle,o=[];i||(r._transformContent=!1,r=w(r,t),s._currentStyle=r._style.clone());for(var h=0,u=n.length;u>h;h++){var c,l=n[h];1==l.nodeType&&(c=C(l))&&(i&&c instanceof L?(o.push.apply(o,c.removeChildren()),c.remove()):c instanceof v||o.push(c))}return r.addChildren(o),i&&(r=w(r.reduce(),t)),s._currentStyle=a,(i||"defs"===e)&&(r.remove(),r=null),r}function a(t,e){var n=new A,i=t.points;n.moveTo(i.getItem(0));for(var r=1,s=i.numberOfItems;s>r;r++)n.lineTo(i.getItem(r));return"polygon"===e&&n.closePath(),n}function h(t){var e=t.getAttribute("d"),n=e.match(/m/gi).length>1?new L:new A;return n.setPathData(e),n}function c(t,i){for(var r=t.childNodes,s=[],a=0,o=r.length;o>a;a++){var h=r[a];1==h.nodeType&&s.push(w(new N,h))}var u,c,l,d="radialgradient"===i,f=new E(s,d);return d?(u=n(t,"cx","cy"),c=u.add(e(t,"r"),0),l=n(t,"fx","fy",!0)):(u=n(t,"x1","y1"),c=n(t,"x2","y2")),w(new B(f,u,c,l),t),null}function l(t,e,n,i){for(var r=(i.getAttribute(n)||"").split(/\)\s*/g),s=new _,a=0,o=r.length;o>a;a++){var h=r[a];if(!h)break;for(var u=h.split("("),c=u[0],l=u[1].split(/[\s,]+/g),d=0,f=l.length;f>d;d++)l[d]=parseFloat(l[d]);switch(c){case"matrix":s.concatenate(new _(l[0],l[2],l[1],l[3],l[4],l[5]));break;case"rotate":s.rotate(l[0],l[1],l[2]);break;case"translate":s.translate(l[0],l[1]);break;case"scale":s.scale(l);break;case"skewX":case"skewY":var e=Math.tan(l[0]*Math.PI/180),g="skewX"==c;s.shear(g?e:0,g?0:e)}}t.transform(s)}function f(t,e,n){var i=t["fill-opacity"===n?"getFillColor":"getStrokeColor"]();i&&i.setAlpha(parseFloat(e))}function g(e,n,i){var r=e.attributes[n],s=r&&r.value;if(!s){var a=t.camelize(n);s=e.style[a],s||i.node[a]===i.parent[a]||(s=i.node[a])}return s?"none"===s?null:s:void 0}function w(e,n){var i={node:R.getStyles(n)||{},parent:R.getStyles(n.parentNode)||{}};return t.each(k,function(r,s){var a=g(n,s,i);void 0!==a&&(e=t.pick(r(e,a,s,n,i),e))}),e}function x(t){var e=t&&t.match(/\((?:#|)([^)']+)/);return e&&P[e[1]]}function C(t,e){"string"==typeof t&&(t=(new DOMParser).parseFromString(t,"image/svg+xml"));var n=t.nodeName.toLowerCase(),i=S[n],r=i&&i(t,n),s=t.getAttribute("data-paper-data");return!r||r instanceof y||(r=w(r,t)),r&&s&&(r._data=JSON.parse(s)),e&&(P={}),r}var S={g:s,svg:s,clippath:s,polygon:a,polyline:a,path:h,lineargradient:c,radialgradient:c,image:function(t){var r=new b(e(t,"href",!0));return r.attach("load",function(){var e=i(t,"width","height");this.setSize(e),this.translate(n(t,"x","y").add(e.divide(2)))}),r},symbol:function(t,e){return new v(s(t,e),!0)},defs:s,use:function(t){var i=(e(t,"href",!0)||"").substring(1),r=P[i],s=n(t,"x","y");return r?r instanceof v?r.place(s):r.clone().translate(s):null},circle:function(t){return new A.Circle(n(t,"cx","cy"),e(t,"r"))},ellipse:function(t){var e=n(t,"cx","cy"),r=i(t,"rx","ry");return new A.Ellipse(new d(e.subtract(r),e.add(r)))},rect:function(t){var e=n(t,"x","y"),r=i(t,"width","height"),s=i(t,"rx","ry");return new A.Rectangle(new d(e,r),s)},line:function(t){return new A.Line(n(t,"x1","y1"),n(t,"x2","y2"))},text:function(t){var e=new j(n(t,"x","y",!1).add(n(t,"dx","dy",!1)));return e.setContent(t.textContent.trim()||""),e}},k=t.merge(t.each(Q,function(t){this[t.attribute]=function(e,n){e[t.set](r(n,t.type,t.fromSVG))}},{}),{id:function(t,e){P[e]=t,t.setName&&t.setName(e)},"clip-path":function(t,e){var n=x(e);if(n){if(n=n.clone(),n.setClipMask(!0),!(t instanceof y))return new y(n,t);t.insertChild(0,n)}},gradientTransform:l,transform:l,"fill-opacity":f,"stroke-opacity":f,visibility:function(t,e){t.setVisible("visible"===e)},"stop-color":function(t,e){t.setColor&&t.setColor(e)},"stop-opacity":function(t,e){t._color&&t._color.setAlpha(parseFloat(e))},offset:function(t,e){var n=e.match(/(.*)%$/);t.setRampPoint(n?n[1]/100:parseFloat(e))},viewBox:function(t,e,n,s,a){var o=new d(r(e,"array")),h=i(s,"width","height",!0);if(t instanceof y){var u=h?o.getSize().divide(h):1,c=(new _).translate(o.getPoint()).scale(u);t.transform(c.inverted())}else if(t instanceof v){h&&o.setSize(h);var l="visible"!=g(s,"overflow",a),f=t._definition;l&&!o.contains(f.getBounds())&&(l=new A.Rectangle(o).transform(f._matrix),l.setClipMask(!0),f.addChild(l))}}}),P={};m.inject({importSVG:function(t){return this.addChild(C(t,!0))}}),p.inject({importSVG:function(t){return this.activate(),C(t,!0)}})},paper=new(n.inject(t.merge(t.exports,{enumerable:!0,Base:t,Numerical:a,DomElement:R,DomEvent:q,Key:X}))),"function"==typeof define&&define.amd&&define(paper),paper};paper.PaperScope.prototype.PaperScript=function(root){function _$_(t,e,n){var i=binaryOperators[e];if(t&&t[i]){var r=t[i](n);return"!="===e?!r:r}switch(e){case"+":return t+n;case"-":return t-n;case"*":return t*n;case"/":return t/n;case"%":return t%n;case"==":return t==n;case"!=":return t!=n}}function $_(t,e){var n=unaryOperators[t];if(n&&e&&e[n])return e[n]();switch(t){case"+":return+e;case"-":return-e}}function compile(t){function e(t){for(var e=0,n=s.length;n>e;e++){var i=s[e];if(i[0]>=t)break;t+=i[1]}return t}function n(n){return t.substring(e(n.range[0]),e(n.range[1]))
}function i(n,i){for(var r=e(n.range[0]),a=e(n.range[1]),o=0,h=s.length-1;h>=0;h--)if(r>s[h][0]){o=h+1;break}s.splice(o,0,[r,i.length-a+r]),t=t.substring(0,r)+i+t.substring(a)}function r(t){if(t&&("MemberExpression"!==t.type||!t.computed)){for(var e in t)if("range"!==e){var s=t[e];if(Array.isArray(s))for(var a=0,o=s.length;o>a;a++)r(s[a]);else s&&"object"==typeof s&&r(s)}switch(t&&t.type){case"BinaryExpression":if(t.operator in binaryOperators&&"Literal"!==t.left.type){var h=n(t.left),u=n(t.right);i(t,"_$_("+h+', "'+t.operator+'", '+u+")")}break;case"AssignmentExpression":if(/^.=$/.test(t.operator)&&"Literal"!==t.left.type){var h=n(t.left),u=n(t.right);i(t,h+" = _$_("+h+', "'+t.operator[0]+'", '+u+")")}break;case"UpdateExpression":if(!t.prefix){var c=n(t.argument);i(t,c+" = _$_("+c+', "'+t.operator[0]+'", 1)')}break;case"UnaryExpression":if(t.operator in unaryOperators&&"Literal"!==t.argument.type){var c=n(t.argument);i(t,'$_("'+t.operator+'", '+c+")")}}}}var s=[];return r(scope.acorn.parse(t,{ranges:!0})),t}function evaluate(code,scope){paper=scope;var view=scope.project&&scope.project.view,res;with(scope)!function(){var onActivate,onDeactivate,onEditOptions,onMouseDown,onMouseUp,onMouseDrag,onMouseMove,onKeyDown,onKeyUp,onFrame,onResize;res=eval(compile(code)),/on(?:Key|Mouse)(?:Up|Down|Move|Drag)/.test(code)&&Base.each(paper.Tool.prototype._events,function(key){var value=eval(key);value&&(scope.getTool()[key]=value)}),view&&(view.setOnResize(onResize),view.fire("resize",{size:view.size,delta:new Point}),view.setOnFrame(onFrame),view.draw())}.call(scope);return res}function request(t,e){var n=new(window.ActiveXObject||XMLHttpRequest)("Microsoft.XMLHTTP");return n.open("GET",t,!0),n.overrideMimeType&&n.overrideMimeType("text/plain"),n.onreadystatechange=function(){return 4===n.readyState?evaluate(n.responseText,e):void 0},n.send(null)}function load(){for(var t=document.getElementsByTagName("script"),e=0,n=t.length;n>e;e++){var i=t[e];if(/^text\/(?:x-|)paperscript$/.test(i.type)&&!i.getAttribute("data-paper-ignore")){var r=PaperScope.getAttribute(i,"canvas"),s=PaperScope.get(r)||new PaperScope(i).setup(r);i.src?request(i.src,s):evaluate(i.innerHTML,s),i.setAttribute("data-paper-ignore",!0)}}}var Base=paper.Base,PaperScope=paper.PaperScope,exports,define,scope=this;!function(t,e){return"object"==typeof exports&&"object"==typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):(e(t.acorn||(t.acorn={})),void 0)}(this,function(t){"use strict";function e(t){le=t||{};for(var e in ge)Object.prototype.hasOwnProperty.call(le,e)||(le[e]=ge[e]);_e=le.sourceFile||null}function n(t,e){var n=pe(de,t);e+=" ("+n.line+":"+n.column+")";var i=new SyntaxError(e);throw i.pos=t,i.loc=n,i.raisedAt=ve,i}function i(t){function e(t){if(1==t.length)return n+="return str === "+JSON.stringify(t[0])+";";n+="switch(str){";for(var e=0;e<t.length;++e)n+="case "+JSON.stringify(t[e])+":";n+="return true}return false;"}t=t.split(" ");var n="",i=[];t:for(var r=0;r<t.length;++r){for(var s=0;s<i.length;++s)if(i[s][0].length==t[r].length){i[s].push(t[r]);continue t}i.push([t[r]])}if(i.length>3){i.sort(function(t,e){return e.length-t.length}),n+="switch(str.length){";for(var r=0;r<i.length;++r){var a=i[r];n+="case "+a[0].length+":",e(a)}n+="}"}else e(t);return Function("str",n)}function r(){this.line=ke,this.column=ve-Pe}function s(){ke=1,ve=Pe=0,Se=!0,u()}function a(t,e){ye=ve,le.locations&&(xe=new r),be=t,u(),Ce=e,Se=t.beforeExpr}function o(){var t=le.onComment&&le.locations&&new r,e=ve,i=de.indexOf("*/",ve+=2);if(-1===i&&n(ve-2,"Unterminated comment"),ve=i+2,le.locations){Yn.lastIndex=e;for(var s;(s=Yn.exec(de))&&s.index<ve;)++ke,Pe=s.index+s[0].length}le.onComment&&le.onComment(!0,de.slice(e+2,i),e,ve,t,le.locations&&new r)}function h(){for(var t=ve,e=le.onComment&&le.locations&&new r,n=de.charCodeAt(ve+=2);fe>ve&&10!==n&&13!==n&&8232!==n&&8329!==n;)++ve,n=de.charCodeAt(ve);le.onComment&&le.onComment(!1,de.slice(t+2,ve),t,ve,e,le.locations&&new r)}function u(){for(;fe>ve;){var t=de.charCodeAt(ve);if(32===t)++ve;else if(13===t){++ve;var e=de.charCodeAt(ve);10===e&&++ve,le.locations&&(++ke,Pe=ve)}else if(10===t)++ve,++ke,Pe=ve;else if(14>t&&t>8)++ve;else if(47===t){var e=de.charCodeAt(ve+1);if(42===e)o();else{if(47!==e)break;h()}}else if(160===t)++ve;else{if(!(t>=5760&&Un.test(String.fromCharCode(t))))break;++ve}}}function c(){var t=de.charCodeAt(ve+1);return t>=48&&57>=t?S(!0):(++ve,a(xn))}function l(){var t=de.charCodeAt(ve+1);return Se?(++ve,x()):61===t?w(kn,2):w(Cn,1)}function d(){var t=de.charCodeAt(ve+1);return 61===t?w(kn,2):w(En,1)}function f(t){var e=de.charCodeAt(ve+1);return e===t?w(124===t?In:An,2):61===e?w(kn,2):w(124===t?Ln:Tn,1)}function _(){var t=de.charCodeAt(ve+1);return 61===t?w(kn,2):w(On,1)}function g(t){var e=de.charCodeAt(ve+1);return e===t?w(Mn,2):61===e?w(kn,2):w(Pn,1)}function p(t){var e=de.charCodeAt(ve+1),n=1;return e===t?(n=62===t&&62===de.charCodeAt(ve+2)?3:2,61===de.charCodeAt(ve+n)?w(kn,n+1):w(Bn,n)):(61===e&&(n=61===de.charCodeAt(ve+2)?3:2),w(jn,n))}function v(t){var e=de.charCodeAt(ve+1);return 61===e?w(Dn,61===de.charCodeAt(ve+2)?3:2):w(61===t?Sn:zn,1)}function m(t){switch(t){case 46:return c();case 40:return++ve,a(pn);case 41:return++ve,a(vn);case 59:return++ve,a(yn);case 44:return++ve,a(mn);case 91:return++ve,a(dn);case 93:return++ve,a(fn);case 123:return++ve,a(_n);case 125:return++ve,a(gn);case 58:return++ve,a(wn);case 63:return++ve,a(bn);case 48:var e=de.charCodeAt(ve+1);if(120===e||88===e)return C();case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:return S(!1);case 34:case 39:return k(t);case 47:return l(t);case 37:case 42:return d();case 124:case 38:return f(t);case 94:return _();case 43:case 45:return g(t);case 60:case 62:return p(t);case 61:case 33:return v(t);case 126:return w(zn,1)}return!1}function y(t){if(t?ve=me+1:me=ve,le.locations&&(we=new r),t)return x();if(ve>=fe)return a(Ne);var e=de.charCodeAt(ve);if(Kn(e)||92===e)return z();var i=m(e);if(i===!1){var s=String.fromCharCode(e);if("\\"===s||$n.test(s))return z();n(ve,"Unexpected character '"+s+"'")}return i}function w(t,e){var n=de.slice(ve,ve+e);ve+=e,a(t,n)}function x(){for(var t,e,i="",r=ve;;){ve>=fe&&n(r,"Unterminated regular expression");var s=de.charAt(ve);if(Wn.test(s)&&n(r,"Unterminated regular expression"),t)t=!1;else{if("["===s)e=!0;else if("]"===s&&e)e=!1;else if("/"===s&&!e)break;t="\\"===s}++ve}var i=de.slice(r,ve);++ve;var o=M();return o&&!/^[gmsiy]*$/.test(o)&&n(r,"Invalid regexp flag"),a(je,RegExp(i,o))}function b(t,e){for(var n=ve,i=0,r=0,s=null==e?1/0:e;s>r;++r){var a,o=de.charCodeAt(ve);if(a=o>=97?o-97+10:o>=65?o-65+10:o>=48&&57>=o?o-48:1/0,a>=t)break;++ve,i=i*t+a}return ve===n||null!=e&&ve-n!==e?null:i}function C(){ve+=2;var t=b(16);return null==t&&n(me+2,"Expected hexadecimal number"),Kn(de.charCodeAt(ve))&&n(ve,"Identifier directly after number"),a(De,t)}function S(t){var e=ve,i=!1,r=48===de.charCodeAt(ve);t||null!==b(10)||n(e,"Invalid number"),46===de.charCodeAt(ve)&&(++ve,b(10),i=!0);var s=de.charCodeAt(ve);(69===s||101===s)&&(s=de.charCodeAt(++ve),(43===s||45===s)&&++ve,null===b(10)&&n(e,"Invalid number"),i=!0),Kn(de.charCodeAt(ve))&&n(ve,"Identifier directly after number");var o,h=de.slice(e,ve);return i?o=parseFloat(h):r&&1!==h.length?/[89]/.test(h)||Oe?n(e,"Invalid number"):o=parseInt(h,8):o=parseInt(h,10),a(De,o)}function k(t){ve++;for(var e="";;){ve>=fe&&n(me,"Unterminated string constant");var i=de.charCodeAt(ve);if(i===t)return++ve,a(Be,e);if(92===i){i=de.charCodeAt(++ve);var r=/^[0-7]+/.exec(de.slice(ve,ve+3));for(r&&(r=r[0]);r&&parseInt(r,8)>255;)r=r.slice(0,r.length-1);if("0"===r&&(r=null),++ve,r)Oe&&n(ve-2,"Octal literal in strict mode"),e+=String.fromCharCode(parseInt(r,8)),ve+=r.length-1;else switch(i){case 110:e+="\n";break;case 114:e+="\r";break;case 120:e+=String.fromCharCode(P(2));break;case 117:e+=String.fromCharCode(P(4));break;case 85:e+=String.fromCharCode(P(8));break;case 116:e+="	";break;case 98:e+="\b";break;case 118:e+="";break;case 102:e+="\f";break;case 48:e+="\0";break;case 13:10===de.charCodeAt(ve)&&++ve;case 10:le.locations&&(Pe=ve,++ke);break;default:e+=String.fromCharCode(i)}}else(13===i||10===i||8232===i||8329===i)&&n(me,"Unterminated string constant"),e+=String.fromCharCode(i),++ve}}function P(t){var e=b(16,t);return null===e&&n(me,"Bad character escape sequence"),e}function M(){Fn=!1;for(var t,e=!0,i=ve;;){var r=de.charCodeAt(ve);if(Qn(r))Fn&&(t+=de.charAt(ve)),++ve;else{if(92!==r)break;Fn||(t=de.slice(i,ve)),Fn=!0,117!=de.charCodeAt(++ve)&&n(ve,"Expecting Unicode escape sequence \\uXXXX"),++ve;var s=P(4),a=String.fromCharCode(s);a||n(ve-1,"Invalid Unicode escape"),(e?Kn(s):Qn(s))||n(ve-4,"Invalid Unicode escape"),t+=a}e=!1}return Fn?t:de.slice(i,ve)}function z(){var t=M(),e=Ee;return Fn||(Zn(t)?e=ln[t]:(le.forbidReserved&&(3===le.ecmaVersion?Rn:qn)(t)||Oe&&Vn(t))&&n(me,"The keyword '"+t+"' is reserved")),a(e,t)}function I(){Me=me,ze=ye,Ie=xe,y()}function A(t){for(Oe=t,ve=ze;Pe>ve;)Pe=de.lastIndexOf("\n",Pe-2)+1,--ke;u(),y()}function L(){this.type=null,this.start=me,this.end=null}function O(){this.start=we,this.end=null,null!==_e&&(this.source=_e)}function T(){var t=new L;return le.locations&&(t.loc=new O),le.ranges&&(t.range=[me,0]),t}function D(t){var e=new L;return e.start=t.start,le.locations&&(e.loc=new O,e.loc.start=t.loc.start),le.ranges&&(e.range=[t.range[0],0]),e}function j(t,e){return t.type=e,t.end=ze,le.locations&&(t.loc.end=Ie),le.ranges&&(t.range[1]=ze),t}function B(t){return le.ecmaVersion>=5&&"ExpressionStatement"===t.type&&"Literal"===t.expression.type&&"use strict"===t.expression.value}function E(t){return be===t?(I(),!0):void 0}function N(){return!le.strictSemicolons&&(be===Ne||be===gn||Wn.test(de.slice(ze,me)))}function F(){E(yn)||N()||q()}function R(t){be===t?I():q()}function q(){n(me,"Unexpected token")}function V(t){"Identifier"!==t.type&&"MemberExpression"!==t.type&&n(t.start,"Assigning to rvalue"),Oe&&"Identifier"===t.type&&Hn(t.name)&&n(t.start,"Assigning to "+t.name+" in strict mode")}function H(t){Me=ze=ve,le.locations&&(Ie=new r),Ae=Oe=null,Le=[],y();var e=t||T(),n=!0;for(t||(e.body=[]);be!==Ne;){var i=Z();e.body.push(i),n&&B(i)&&A(!0),n=!1}return j(e,"Program")}function Z(){be===Cn&&y(!0);var t=be,e=T();switch(t){case Fe:case Ve:I();var i=t===Fe;E(yn)||N()?e.label=null:be!==Ee?q():(e.label=ce(),F());for(var r=0;r<Le.length;++r){var s=Le[r];if(null==e.label||s.name===e.label.name){if(null!=s.kind&&(i||"loop"===s.kind))break;if(e.label&&i)break}}return r===Le.length&&n(e.start,"Unsyntactic "+t.keyword),j(e,i?"BreakStatement":"ContinueStatement");case He:return I(),F(),j(e,"DebuggerStatement");case Ue:return I(),Le.push(ti),e.body=Z(),Le.pop(),R(nn),e.test=U(),F(),j(e,"DoWhileStatement");case $e:if(I(),Le.push(ti),R(pn),be===yn)return J(e,null);if(be===en){var a=T();return I(),G(a,!0),1===a.declarations.length&&E(cn)?$(e,a):J(e,a)}var a=W(!1,!0);return E(cn)?(V(a),$(e,a)):J(e,a);case Ge:return I(),he(e,!0);case We:return I(),e.test=U(),e.consequent=Z(),e.alternate=E(Xe)?Z():null,j(e,"IfStatement");case Ye:return Ae||n(me,"'return' outside of function"),I(),E(yn)||N()?e.argument=null:(e.argument=W(),F()),j(e,"ReturnStatement");case Ke:I(),e.discriminant=U(),e.cases=[],R(_n),Le.push(ei);for(var o,h;be!=gn;)if(be===Re||be===Ze){var u=be===Re;o&&j(o,"SwitchCase"),e.cases.push(o=T()),o.consequent=[],I(),u?o.test=W():(h&&n(Me,"Multiple default clauses"),h=!0,o.test=null),R(wn)}else o||q(),o.consequent.push(Z());return o&&j(o,"SwitchCase"),I(),Le.pop(),j(e,"SwitchStatement");case Qe:return I(),Wn.test(de.slice(ze,me))&&n(ze,"Illegal newline after throw"),e.argument=W(),F(),j(e,"ThrowStatement");case tn:if(I(),e.block=X(),e.handler=null,be===qe){var c=T();I(),R(pn),c.param=ce(),Oe&&Hn(c.param.name)&&n(c.param.start,"Binding "+c.param.name+" in strict mode"),R(vn),c.guard=null,c.body=X(),e.handler=j(c,"CatchClause")}return e.guardedHandlers=Te,e.finalizer=E(Je)?X():null,e.handler||e.finalizer||n(e.start,"Missing catch or finally clause"),j(e,"TryStatement");case en:return I(),e=G(e),F(),e;case nn:return I(),e.test=U(),Le.push(ti),e.body=Z(),Le.pop(),j(e,"WhileStatement");case rn:return Oe&&n(me,"'with' in strict mode"),I(),e.object=U(),e.body=Z(),j(e,"WithStatement");case _n:return X();case yn:return I(),j(e,"EmptyStatement");default:var l=Ce,d=W();if(t===Ee&&"Identifier"===d.type&&E(wn)){for(var r=0;r<Le.length;++r)Le[r].name===l&&n(d.start,"Label '"+l+"' is already declared");var f=be.isLoop?"loop":be===Ke?"switch":null;return Le.push({name:l,kind:f}),e.body=Z(),Le.pop(),e.label=d,j(e,"LabeledStatement")}return e.expression=d,F(),j(e,"ExpressionStatement")}}function U(){R(pn);var t=W();return R(vn),t}function X(t){var e,n=T(),i=!0,r=!1;for(n.body=[],R(_n);!E(gn);){var s=Z();n.body.push(s),i&&t&&B(s)&&(e=r,A(r=!0)),i=!1}return r&&!e&&A(!1),j(n,"BlockStatement")}function J(t,e){return t.init=e,R(yn),t.test=be===yn?null:W(),R(yn),t.update=be===vn?null:W(),R(vn),t.body=Z(),Le.pop(),j(t,"ForStatement")}function $(t,e){return t.left=e,t.right=W(),R(vn),t.body=Z(),Le.pop(),j(t,"ForInStatement")}function G(t,e){for(t.declarations=[],t.kind="var";;){var i=T();if(i.id=ce(),Oe&&Hn(i.id.name)&&n(i.id.start,"Binding "+i.id.name+" in strict mode"),i.init=E(Sn)?W(!0,e):null,t.declarations.push(j(i,"VariableDeclarator")),!E(mn))break}return j(t,"VariableDeclaration")}function W(t,e){var n=Y(e);if(!t&&be===mn){var i=D(n);for(i.expressions=[n];E(mn);)i.expressions.push(Y(e));return j(i,"SequenceExpression")}return n}function Y(t){var e=K(t);if(be.isAssign){var n=D(e);return n.operator=Ce,n.left=e,I(),n.right=Y(t),V(e),j(n,"AssignmentExpression")}return e}function K(t){var e=Q(t);if(E(bn)){var n=D(e);return n.test=e,n.consequent=W(!0),R(wn),n.alternate=W(!0,t),j(n,"ConditionalExpression")}return e}function Q(t){return te(ee(),-1,t)}function te(t,e,n){var i=be.binop;if(null!=i&&(!n||be!==cn)&&i>e){var r=D(t);r.left=t,r.operator=Ce,I(),r.right=te(ee(),i,n);var r=j(r,/&&|\|\|/.test(r.operator)?"LogicalExpression":"BinaryExpression");return te(r,e,n)}return t}function ee(){if(be.prefix){var t=T(),e=be.isUpdate;return t.operator=Ce,t.prefix=!0,I(),t.argument=ee(),e?V(t.argument):Oe&&"delete"===t.operator&&"Identifier"===t.argument.type&&n(t.start,"Deleting local variable in strict mode"),j(t,e?"UpdateExpression":"UnaryExpression")}for(var i=ne();be.postfix&&!N();){var t=D(i);t.operator=Ce,t.prefix=!1,t.argument=i,V(i),I(),i=j(t,"UpdateExpression")}return i}function ne(){return ie(re())}function ie(t,e){if(E(xn)){var n=D(t);return n.object=t,n.property=ce(!0),n.computed=!1,ie(j(n,"MemberExpression"),e)}if(E(dn)){var n=D(t);return n.object=t,n.property=W(),n.computed=!0,R(fn),ie(j(n,"MemberExpression"),e)}if(!e&&E(pn)){var n=D(t);return n.callee=t,n.arguments=ue(vn,!1),ie(j(n,"CallExpression"),e)}return t}function re(){switch(be){case an:var t=T();return I(),j(t,"ThisExpression");case Ee:return ce();case De:case Be:case je:var t=T();return t.value=Ce,t.raw=de.slice(me,ye),I(),j(t,"Literal");case on:case hn:case un:var t=T();return t.value=be.atomValue,t.raw=be.keyword,I(),j(t,"Literal");case pn:var e=we,n=me;I();var i=W();return i.start=n,i.end=ye,le.locations&&(i.loc.start=e,i.loc.end=xe),le.ranges&&(i.range=[n,ye]),R(vn),i;case dn:var t=T();return I(),t.elements=ue(fn,!0,!0),j(t,"ArrayExpression");case _n:return ae();case Ge:var t=T();return I(),he(t,!1);case sn:return se();default:q()}}function se(){var t=T();return I(),t.callee=ie(re(),!0),t.arguments=E(pn)?ue(vn,!1):Te,j(t,"NewExpression")}function ae(){var t=T(),e=!0,i=!1;for(t.properties=[],I();!E(gn);){if(e)e=!1;else if(R(mn),le.allowTrailingCommas&&E(gn))break;var r,s={key:oe()},a=!1;if(E(wn)?(s.value=W(!0),r=s.kind="init"):le.ecmaVersion>=5&&"Identifier"===s.key.type&&("get"===s.key.name||"set"===s.key.name)?(a=i=!0,r=s.kind=s.key.name,s.key=oe(),be!==pn&&q(),s.value=he(T(),!1)):q(),"Identifier"===s.key.type&&(Oe||i))for(var o=0;o<t.properties.length;++o){var h=t.properties[o];if(h.key.name===s.key.name){var u=r==h.kind||a&&"init"===h.kind||"init"===r&&("get"===h.kind||"set"===h.kind);u&&!Oe&&"init"===r&&"init"===h.kind&&(u=!1),u&&n(s.key.start,"Redefinition of property")}}t.properties.push(s)}return j(t,"ObjectExpression")}function oe(){return be===De||be===Be?re():ce(!0)}function he(t,e){be===Ee?t.id=ce():e?q():t.id=null,t.params=[];var i=!0;for(R(pn);!E(vn);)i?i=!1:R(mn),t.params.push(ce());var r=Ae,s=Le;if(Ae=!0,Le=[],t.body=X(!0),Ae=r,Le=s,Oe||t.body.body.length&&B(t.body.body[0]))for(var a=t.id?-1:0;a<t.params.length;++a){var o=0>a?t.id:t.params[a];if((Vn(o.name)||Hn(o.name))&&n(o.start,"Defining '"+o.name+"' in strict mode"),a>=0)for(var h=0;a>h;++h)o.name===t.params[h].name&&n(o.start,"Argument name clash in strict mode")}return j(t,e?"FunctionDeclaration":"FunctionExpression")}function ue(t,e,n){for(var i=[],r=!0;!E(t);){if(r)r=!1;else if(R(mn),e&&le.allowTrailingCommas&&E(t))break;n&&be===mn?i.push(null):i.push(W(!0))}return i}function ce(t){var e=T();return e.name=be===Ee?Ce:t&&!le.forbidReserved&&be.keyword||q(),I(),j(e,"Identifier")}t.version="0.3.2";var le,de,fe,_e;t.parse=function(t,n){return de=t+"",fe=de.length,e(n),s(),H(le.program)};var ge=t.defaultOptions={ecmaVersion:5,strictSemicolons:!1,allowTrailingCommas:!0,forbidReserved:!1,locations:!1,onComment:null,ranges:!1,program:null,sourceFile:null},pe=t.getLineInfo=function(t,e){for(var n=1,i=0;;){Yn.lastIndex=i;var r=Yn.exec(t);if(!(r&&r.index<e))break;++n,i=r.index+r[0].length}return{line:n,column:e-i}};t.tokenize=function(t,n){function i(t){return y(t),r.start=me,r.end=ye,r.startLoc=we,r.endLoc=xe,r.type=be,r.value=Ce,r}de=t+"",fe=de.length,e(n),s();var r={};return i.jumpTo=function(t,e){if(ve=t,le.locations){ke=1,Pe=Yn.lastIndex=0;for(var n;(n=Yn.exec(de))&&n.index<t;)++ke,Pe=n.index+n[0].length}Se=e,u()},i};var ve,me,ye,we,xe,be,Ce,Se,ke,Pe,Me,ze,Ie,Ae,Le,Oe,Te=[],De={type:"num"},je={type:"regexp"},Be={type:"string"},Ee={type:"name"},Ne={type:"eof"},Fe={keyword:"break"},Re={keyword:"case",beforeExpr:!0},qe={keyword:"catch"},Ve={keyword:"continue"},He={keyword:"debugger"},Ze={keyword:"default"},Ue={keyword:"do",isLoop:!0},Xe={keyword:"else",beforeExpr:!0},Je={keyword:"finally"},$e={keyword:"for",isLoop:!0},Ge={keyword:"function"},We={keyword:"if"},Ye={keyword:"return",beforeExpr:!0},Ke={keyword:"switch"},Qe={keyword:"throw",beforeExpr:!0},tn={keyword:"try"},en={keyword:"var"},nn={keyword:"while",isLoop:!0},rn={keyword:"with"},sn={keyword:"new",beforeExpr:!0},an={keyword:"this"},on={keyword:"null",atomValue:null},hn={keyword:"true",atomValue:!0},un={keyword:"false",atomValue:!1},cn={keyword:"in",binop:7,beforeExpr:!0},ln={"break":Fe,"case":Re,"catch":qe,"continue":Ve,"debugger":He,"default":Ze,"do":Ue,"else":Xe,"finally":Je,"for":$e,"function":Ge,"if":We,"return":Ye,"switch":Ke,"throw":Qe,"try":tn,"var":en,"while":nn,"with":rn,"null":on,"true":hn,"false":un,"new":sn,"in":cn,"instanceof":{keyword:"instanceof",binop:7,beforeExpr:!0},"this":an,"typeof":{keyword:"typeof",prefix:!0,beforeExpr:!0},"void":{keyword:"void",prefix:!0,beforeExpr:!0},"delete":{keyword:"delete",prefix:!0,beforeExpr:!0}},dn={type:"[",beforeExpr:!0},fn={type:"]"},_n={type:"{",beforeExpr:!0},gn={type:"}"},pn={type:"(",beforeExpr:!0},vn={type:")"},mn={type:",",beforeExpr:!0},yn={type:";",beforeExpr:!0},wn={type:":",beforeExpr:!0},xn={type:"."},bn={type:"?",beforeExpr:!0},Cn={binop:10,beforeExpr:!0},Sn={isAssign:!0,beforeExpr:!0},kn={isAssign:!0,beforeExpr:!0},Pn={binop:9,prefix:!0,beforeExpr:!0},Mn={postfix:!0,prefix:!0,isUpdate:!0},zn={prefix:!0,beforeExpr:!0},In={binop:1,beforeExpr:!0},An={binop:2,beforeExpr:!0},Ln={binop:3,beforeExpr:!0},On={binop:4,beforeExpr:!0},Tn={binop:5,beforeExpr:!0},Dn={binop:6,beforeExpr:!0},jn={binop:7,beforeExpr:!0},Bn={binop:8,beforeExpr:!0},En={binop:10,beforeExpr:!0};t.tokTypes={bracketL:dn,bracketR:fn,braceL:_n,braceR:gn,parenL:pn,parenR:vn,comma:mn,semi:yn,colon:wn,dot:xn,question:bn,slash:Cn,eq:Sn,name:Ee,eof:Ne,num:De,regexp:je,string:Be};for(var Nn in ln)t.tokTypes["_"+Nn]=ln[Nn];var Fn,Rn=i("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile"),qn=i("class enum extends super const export import"),Vn=i("implements interface let package private protected public static yield"),Hn=i("eval arguments"),Zn=i("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this"),Un=/[\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/,Xn="\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc",Jn="\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f",$n=RegExp("["+Xn+"]"),Gn=RegExp("["+Xn+Jn+"]"),Wn=/[\n\r\u2028\u2029]/,Yn=/\r\n|[\n\r\u2028\u2029]/g,Kn=t.isIdentifierStart=function(t){return 65>t?36===t:91>t?!0:97>t?95===t:123>t?!0:t>=170&&$n.test(String.fromCharCode(t))},Qn=t.isIdentifierChar=function(t){return 48>t?36===t:58>t?!0:65>t?!1:91>t?!0:97>t?95===t:123>t?!0:t>=170&&Gn.test(String.fromCharCode(t))},ti={kind:"loop"},ei={kind:"switch"}});var binaryOperators={"+":"_add","-":"_subtract","*":"_multiply","/":"_divide","%":"_modulo","==":"equals","!=":"equals"},unaryOperators={"-":"_negate","+":null},fields=Base.each("add,subtract,multiply,divide,modulo,negate".split(","),function(t){this["_"+t]="#"+t},{});return paper.Point.inject(fields),paper.Size.inject(fields),paper.Color.inject(fields),"complete"===document.readyState?setTimeout(load):paper.DomEvent.add(window,{load:load}),{compile:compile,evaluate:evaluate,load:load}}(this);
})()
},{}],10:[function(require,module,exports){
var page = require('page');

var AppView= require('./views/app');
var StrategieView = require('./views/strategie');
var TeamView = require('./views/team');
var UsersView = require('./views/users');
var Users = require('./models/users');
var XHR = require('./lib/xhr');

var currentView = null;

function clean(ctx, next) {
    if (currentView) {
        currentView.destroy.call(currentView);
        next();
    }
}

function transition(ctx, next) {
    next();
}

function index(ctx) {
    currentView = new AppView('#app-wrapper');
    currentView.render();
}

function combis(ctx) {
    var xhr = new XHR();
    currentView = new StrategieView('#content');
    xhr.get('/combis').success(function(data) {
        if (data.length > 0)
            currentView.setModel(JSON.parse(data));
        else
            currentView.setModel();
    }).send();
}

function team(ctx) {
    currentView = new TeamView('#content');
    currentView.render();
}

function users(ctx) {
    currentView = new UsersView('#content', Users.all());
}

page('/', index);
page('/team', team);
page('/_combis', combis);
page('/_users', users);
page('*', transition);
page('*', clean);
page();
},{"./views/app":1,"./views/strategie":6,"./views/team":9,"./views/users":4,"./models/users":11,"./lib/xhr":5,"page":12}],12:[function(require,module,exports){

;(function(){

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' == typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' == typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
    // show <path> with [state]
    } else if ('string' == typeof path) {
      page.show(path, fn);
    // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path){
    if (0 == arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options){
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) window.addEventListener('click', onclick, false);
    if (!dispatch) return;
    var url = location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function(){
    running = false;
    removeEventListener('click', onclick, false);
    removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch){
    var ctx = new Context(path, state);
    if (false !== dispatch) page.dispatch(ctx);
    if (!ctx.unhandled) ctx.pushState();
    return ctx;
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */

  page.replace = function(path, state, init, dispatch){
    var ctx = new Context(path, state);
    ctx.init = init;
    if (null == dispatch) dispatch = true;
    if (dispatch) page.dispatch(ctx);
    ctx.save();
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx){
    var i = 0;

    function next() {
      var fn = page.callbacks[i++];
      if (!fn) return unhandled(ctx);
      fn(ctx, next);
    }

    next();
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    var current = window.location.pathname + window.location.search;
    if (current == ctx.canonicalPath) return;
    page.stop();
    ctx.unhandled = true;
    window.location = ctx.canonicalPath;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' == path[0] && 0 != path.indexOf(base)) path = base + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? path.slice(i + 1) : '';
    this.pathname = ~i ? path.slice(0, i) : path;
    this.params = [];

    // fragment
    this.hash = '';
    if (!~this.path.indexOf('#')) return;
    var parts = this.path.split('#');
    this.path = parts[0];
    this.hash = parts[1] || '';
    this.querystring = this.querystring.split('#')[0];
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function(){
    history.pushState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function(){
    history.replaceState(this.state, this.title, this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(path
      , this.keys = []
      , options.sensitive
      , options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn){
    var self = this;
    return function(ctx, next){
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Array} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params){
    var keys = this.keys
      , qsIndex = path.indexOf('?')
      , pathname = ~qsIndex ? path.slice(0, qsIndex) : path
      , m = this.regexp.exec(pathname);

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];

      var val = 'string' == typeof m[i]
        ? decodeURIComponent(m[i])
        : m[i];

      if (key) {
        params[key.name] = undefined !== params[key.name]
          ? params[key.name]
          : val;
      } else {
        params.push(val);
      }
    }

    return true;
  };

  /**
   * Normalize the given path string,
   * returning a regular expression.
   *
   * An empty array should be passed,
   * which will contain the placeholder
   * key names. For example "/user/:id" will
   * then contain ["id"].
   *
   * @param  {String|RegExp|Array} path
   * @param  {Array} keys
   * @param  {Boolean} sensitive
   * @param  {Boolean} strict
   * @return {RegExp}
   * @api private
   */

  function pathtoRegexp(path, keys, sensitive, strict) {
    if (path instanceof RegExp) return path;
    if (path instanceof Array) path = '(' + path.join('|') + ')';
    path = path
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
          + (optional || '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
  }

  /**
   * Handle "populate" events.
   */

  function onpopstate(e) {
    if (e.state) {
      var path = e.state.path;
      page.replace(path, e.state);
    }
  }

  /**
   * Handle "click" events.
   */

  function onclick(e) {
    if (1 != which(e)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;

    // ensure link
    var el = e.target;
    while (el && 'A' != el.nodeName) el = el.parentNode;
    if (!el || 'A' != el.nodeName) return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (el.pathname == location.pathname && (el.hash || '#' == link)) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;

    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // same page
    var orig = path + el.hash;

    path = path.replace(base, '');
    if (base && orig == path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null == e.which
      ? e.button
      : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return 0 == href.indexOf(origin);
  }

  /**
   * Expose `page`.
   */

  if ('undefined' == typeof module) {
    window.page = page;
  } else {
    module.exports = page;
  }

})();

},{}],8:[function(require,module,exports){
var Paper = require('./paper-full.min.js').exports;
var _ = require('./underscore-1.5.2.js');

var strokeColor = "white";
var strokeWidth = 4;
var background = "#202020";

function Terrain(paper, longueur, largeur, offsetLeft, offsetTop) {
    this.longueur = longueur;
    this.largeur = largeur;
    this.offsetLeft = offsetLeft || 0;
    this.offsetTop = offsetTop || 0;
    this.paper = paper;
};

Terrain.prototype.draw = function() {
    renderTerrain(this.offsetLeft, this.offsetTop, this.longueur, this.largeur);
    renderPlayers(this.offsetLeft, this.offsetTop, this.longueur, this.largeur);

    this.placePlayers();

    this.placeBall();
};

Terrain.prototype.placeBall = function () {
    this.getItemByName('ball').position = this.getItemByName('t1DC').position.subtract(new Paper.Point(15, 0))
};

Terrain.prototype.placePlayers = function() {
    var positionAttaque = placePlayer(this.longueur, this.largeur, this.offsetLeft, this.offsetTop);

    _.each(positionAttaque, function(pos, poste) {
        return this.getItemByName("t1" + poste).position = pos;
    }, this);
};

Terrain.prototype.placeDefence = function(defenseType) {
    var positionDefense = getDefensePosition(defenseType, this.longueur, this.largeur, this.offsetLeft, this.offsetTop);

    _.each(positionDefense, function(pos, poste) {
        return this.getItemByName("t2" + poste).position = pos;
    }, this);
}

Terrain.prototype.getItemByName = function(itemName) {
    return this.paper.project.layers[0].children[itemName];
}

function largeurRatio(nb, realLargeur) {
    return nb * realLargeur / 200;
}
function longueurRatio(nb, realLongueur) {
    return nb * realLongueur / 400;
}

function renderPlayers(offsetLeft, offsetTop, longueur, largeur) {
    var team1color = 'black';
    var team2color = 'red';
    var ballColor = 'lightblue';

    var ball = createPlayer.call(this, new Paper.Point(160, 25), ballColor, 5);
    ball.name = 'ball';

    var t1G = createPlayer.call(this, new Paper.Point(20, 10), team1color);
    t1G.name = 't1G';
    var t1AiD = createPlayer.call(this, new Paper.Point(40, 10), team1color);
    t1AiD.name = 't1AiD';
    var t1AiG = createPlayer.call(this, new Paper.Point(60, 10), team1color);
    t1AiG.name = 't1AiG';
    var t1PV = createPlayer.call(this, new Paper.Point(80, 10), team1color);
    t1PV.name = 't1PV';
    var t1AD = createPlayer.call(this, new Paper.Point(100, 10), team1color);
    t1AD.name = 't1AD';
    var t1AG = createPlayer.call(this, new Paper.Point(120, 10), team1color);
    t1AG.name = 't1AG';
    var t1DC = createPlayer.call(this, new Paper.Point(140, 10), team1color);
    t1DC.name = "t1DC";

    var t2G = createPlayer.call(this, new Paper.Point(20, 40), team2color);
    t2G.name = 't2G'
    var t2AiD = createPlayer.call(this, new Paper.Point(40, 40), team2color);
    t2AiD.name = 't2AiD'
    var t2AiG = createPlayer.call(this, new Paper.Point(60, 40), team2color);
    t2AiG.name = 't2AiG'
    var t2PV = createPlayer.call(this, new Paper.Point(80, 40), team2color);
    t2PV.name = 't2PV'
    var t2AD = createPlayer.call(this, new Paper.Point(100, 40), team2color);
    t2AD.name = 't2AD'
    var t2AG = createPlayer.call(this, new Paper.Point(120, 40), team2color);
    t2AG.name = 't2AG'
    var t2DC = createPlayer.call(this, new Paper.Point(140, 40), team2color);
    t2DC.name = 't2DC'

}

function placePlayer(longueur, largeur, offsetLeft, offsetTop) {
    return {
        'G': {x: longueurRatio(390, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'PV': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'AiG': {x: longueurRatio(10, longueur) + offsetLeft, y: largeurRatio(190, largeur) + offsetTop},
        'AiD': {x: longueurRatio(10, longueur) + offsetLeft, y: largeurRatio(10, largeur) + offsetTop},
        'AG': {x: longueurRatio(115, longueur) + offsetLeft, y: largeurRatio(175, largeur) + offsetTop},
        'DC': {x: longueurRatio(150, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
        'AD': {x: longueurRatio(115, longueur) + offsetLeft, y: largeurRatio(25, largeur) + offsetTop}
    };
}

function getDefensePosition(typeDefense, longueur, largeur, offsetLeft, offsetTop) {
    var defense = {
        '1-5': {
            'G': {x: longueurRatio(0, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
            'PV': {x: longueurRatio(100, longueur) + offsetLeft, y: largeurRatio(100, largeur) + offsetTop},
            'AiG': {x: longueurRatio(20, longueur) + offsetLeft, y: largeurRatio(23, largeur) + offsetTop},
            'AiD': {x: longueurRatio(20, longueur) + offsetLeft, y: largeurRatio(177, largeur) + offsetTop},
            'AG': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(45, largeur) + offsetTop},
            'DC': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(90, largeur) + offsetTop},
            'AD': {x: longueurRatio(70, longueur) + offsetLeft, y: largeurRatio(155, largeur) + offsetTop}
        }
    }

    return defense[typeDefense] || null;
}

function createPlayer(position, color, radius) {
    radius = radius || 10;
    var j = new Paper.Path.Circle({
        center: position,
        radius: radius
    });
    j.fillColor = color;
    j.draggable = true;
    return j;
}

function renderTerrain(x, y, longueur, largeur) {
    var longueur = longueur;
    var largeur = largeur;

    var offsetLeft = x;
    var offsetTop = y;

    // Le terrain
    var rect = new Paper.Rectangle(new Paper.Point(offsetLeft, offsetTop), new Paper.Size(longueur, largeur));
    var terrain = new Paper.Path.Rectangle(rect);
    terrain.fillColor = {
        gradient: {
            stops: ["#1212FF", "#B9B9FF"]
        },
        origin: new Paper.Point(offsetLeft, offsetTop),
        origin: new Paper.Point(offsetLeft, offsetTop + largeur)
    }
    terrain.strokeColor = strokeColor;
    terrain.strokeWidth = strokeWidth;

    // La zone de gauche
    var zoneRayon = largeurRatio(60, largeur);
    var largeurCage = largeurRatio(30, largeur);
    var longueurCage = longueurRatio(10, longueur);
    var zoneLargeurTotal = zoneRayon * 2 + largeurCage;
    var zoneRect = new Paper.Rectangle(new Paper.Point(offsetLeft -zoneRayon, offsetTop + (largeur - zoneLargeurTotal) / 2), new Paper.Size(zoneRayon*2, zoneLargeurTotal));
    var radius = new Paper.Size(zoneRayon);
    var zoneGauche = new Paper.Path.RoundRectangle(zoneRect, radius);
    zoneGauche.removeSegment(0);
    zoneGauche.removeSegment(0);
    zoneGauche.removeSegment(0);
    zoneGauche.removeSegment(0);
    zoneGauche.fillColor = "#FFF973";
    zoneGauche.strokeColor = strokeColor;
    zoneGauche.strokeWidth = strokeWidth;

    // La zone de droite
    var zoneDroiteRect = zoneRect.clone();
    zoneDroiteRect.left += longueur;
    zoneDroiteRect.right += longueur;
    var zoneDroite = new Paper.Path.RoundRectangle(zoneDroiteRect, radius);
    zoneDroite.removeSegment(4);
    zoneDroite.removeSegment(4);
    zoneDroite.removeSegment(4);
    zoneDroite.removeSegment(4);
    zoneDroite.fillColor = '#FFF973';
    zoneDroite.strokeColor = strokeColor;
    zoneDroite.strokeWidth = strokeWidth;

    // Les 9m de gauche
    var neufMRayon = largeurRatio(90, largeur);
    var neufMLargeutTotal = neufMRayon * 2 + largeurCage;
    var neufMGaucheRect= new Paper.Rectangle(new Paper.Point(offsetLeft - neufMRayon, offsetTop + (largeur - neufMLargeutTotal) / 2), new Paper.Size(neufMRayon * 2, neufMLargeutTotal));
    radius = new Paper.Size(neufMRayon);
    var neufMGauche = new Paper.Path.RoundRectangle(neufMGaucheRect, radius);
    neufMGauche.removeSegment(0);
    neufMGauche.removeSegment(0);
    neufMGauche.removeSegment(0);
    neufMGauche.removeSegment(0);
    neufMGauche.strokeColor = strokeColor;
    neufMGauche.strokeWidth = strokeWidth;

    // Les 9m de droite
    var neufMDroiteRect = neufMGaucheRect.clone();
    neufMDroiteRect.left += longueur;
    neufMDroiteRect.right += longueur;
    var neufMDroite = new Paper.Path.RoundRectangle(neufMDroiteRect, radius);
    neufMDroite.removeSegment(4);
    neufMDroite.removeSegment(4);
    neufMDroite.removeSegment(4);
    neufMDroite.removeSegment(4);
    neufMDroite.strokeColor = strokeColor;
    neufMDroite.strokeWidth = strokeWidth;

    // Ligne de 7m de gauche
    var distance = 70 * longueur / 400;
    var longeurSeptM = 20 * largeur / 200;
    var septMGauche = new Paper.Path(new Paper.Point(offsetLeft + distance, offsetTop + (largeur / 2) - (longeurSeptM / 2)), new Paper.Point(offsetLeft + distance, offsetTop + (largeur / 2) + (longeurSeptM / 2)));
    septMGauche.strokeColor = strokeColor;
    septMGauche.strokeWidth = strokeWidth;

    // Ligne de 7m de droite
    var septMDroite = new Paper.Path(new Paper.Point(offsetLeft + longueur - distance, offsetTop + (largeur / 2) - (longeurSeptM / 2)), new Paper.Point(offsetLeft + longueur - distance, offsetTop + (largeur / 2) + (longeurSeptM / 2)));
    septMDroite.strokeColor = strokeColor;
    septMDroite.strokeWidth = strokeWidth;

    // Ligne mediane
    var mediane= new Paper.Path(new Paper.Point(offsetLeft + (longueur / 2), offsetTop), new Paper.Point(offsetLeft + (longueur / 2), largeur + offsetTop));
    mediane.strokeColor = strokeColor;
    mediane.strokeWidth = strokeWidth;

    // Cage gauche
    var topLeft = {
        x: offsetLeft - longueurCage,
        y: offsetTop + (largeur / 2) - (largeurCage / 2)
    }
    var cageGaucheRect = new Paper.Rectangle(new Paper.Point(topLeft), new Paper.Size(longueurCage, largeurCage));
    var cageGauche = new Paper.Path.Rectangle(cageGaucheRect);
    cageGauche.strokeColor = strokeColor;
    cageGauche.strokeWidth = strokeWidth;
    cageGauche.fillColor = background;

    // Cage droite
    var cageDroiteRect = cageGaucheRect.clone();
    cageDroiteRect.left += longueur + longueurCage;
    cageDroiteRect.right += longueur + longueurCage;
    var cageDroite = new Paper.Path.Rectangle(cageDroiteRect);
    cageDroite.strokeColor = strokeColor;
    cageDroite.strokeWidth = strokeWidth;
    cageDroite.fillColor = background;

    var rect = new Paper.Rectangle(new Paper.Point(0, 0), new Paper.Point(offsetLeft + longueur + 10, offsetTop));
    var p = new Paper.Path.Rectangle(rect);
    p.fillColor = background;

    rect = new Paper.Rectangle(new Paper.Point(0, offsetTop + largeur), new Paper.Point(offsetLeft + longueur + 10, offsetTop + largeur + 20));
    p = new Paper.Path.Rectangle(rect);
    p.fillColor = background;
}

module.exports = Terrain;


},{"./paper-full.min.js":7,"./underscore-1.5.2.js":3}],11:[function(require,module,exports){
var Q = require('q');
var XHR = require('../lib/xhr');

function Users(users) {
    this.models = users || [];
}

Users.all = function() {
    var deferred = Q.defer();

    var xhr = new XHR();
    xhr.get('/users')
        .success(function(data) {
            deferred.resolve(new Users(JSON.parse(data)));
        })
        .send();


    return deferred.promise;
};

Users.prototype.add = function(user) {
    var deferred = Q.defer();

    var xhr = new XHR();
    xhr.post('/users')
        .header('Content-Type', 'application/json')
        .success(function(data) {
            deferred.resolve(data);
        })
        .send(user);

    return deferred.promise;
};

module.exports = Users;
},{"../lib/xhr":5,"q":13}],14:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],13:[function(require,module,exports){
(function(process){// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else {
        Q = definition();
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;

    function flush() {
        /* jshint loopfunc: true */

        while (head.next) {
            head = head.next;
            var task = head.task;
            head.task = void 0;
            var domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }

            try {
                task();

            } catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!

                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }

                    throw e;

                } else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function() {
                       throw e;
                    }, 0);
                }
            }

            if (domain) {
                domain.exit();
            }
        }

        flushing = false;
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process !== "undefined" && process.nextTick) {
        // Node.js before 0.9. Note that some fake-Node environments, like the
        // Mocha test runner, introduce a `process` global without a `nextTick`.
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }

    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this does have the nice side-effect of reducing the size
// of the code by reducing x.call() to merely x(), eliminating many
// hard-to-minify characters.
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
// engine that has a deployed base of browsers that support generators.
// However, SM's generators use the Python-inspired semantics of
// outdated ES6 drafts.  We would like to support ES6, but we'd also
// like to make it possible to use generators in deployed browsers, so
// we also support Python-style generators.  At some point we can remove
// this block.
var hasES6Generators;
try {
    /* jshint evil: true, nonew: false */
    new Function("(function* (){ yield 1; })");
    hasES6Generators = true;
} catch (e) {
    hasES6Generators = false;
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (isPromise(value)) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = deprecate(function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    }, "valueOf", "inspect");

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become fulfilled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be fulfilled
 */
Q.race = race;
function race(answerPs) {
    return promise(function(resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function(answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = deprecate(function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        });
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return isObject(object) &&
        typeof object.promiseDispatch === "function" &&
        typeof object.inspect === "function";
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var unhandledReasonsDisplayed = false;
var trackUnhandledRejections = true;
function displayUnhandledReasons() {
    if (
        !unhandledReasonsDisplayed &&
        typeof window !== "undefined" &&
        !window.Touch &&
        window.console
    ) {
        console.warn("[Q] Unhandled rejection reasons (should be empty):",
                     unhandledReasons);
    }

    unhandledReasonsDisplayed = true;
}

function logUnhandledReasons() {
    for (var i = 0; i < unhandledReasons.length; i++) {
        var reason = unhandledReasons[i];
        console.warn("Unhandled rejection reason:", reason);
    }
}

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;
    unhandledReasonsDisplayed = false;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;

        // Show unhandled rejection reasons if Node exits without handling an
        // outstanding rejection.  (Note that Browserify presently produces a
        // `process` global without the `EventEmitter` `on` method.)
        if (typeof process !== "undefined" && process.on) {
            process.on("exit", logUnhandledReasons);
        }
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
    displayUnhandledReasons();
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    if (typeof process !== "undefined" && process.on) {
        process.removeListener("exit", logUnhandledReasons);
    }
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;
            if (hasES6Generators) {
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return result.value;
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return exception.value;
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var countDown = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++countDown;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--countDown === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (countDown === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {String} custom error message (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, message) {
    return Q(object).timeout(ms, message);
};

Promise.prototype.timeout = function (ms, message) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        deferred.reject(new Error(message || "Timed out after " + ms + " ms"));
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

})(require("__browserify_process"))
},{"__browserify_process":14}],2:[function(require,module,exports){
var Microee = require('microee');

/* -------------------------------------------- */
/*              VIEW CLASS                      */
/* -------------------------------------------- */

function View() {
    this.children = [];
    this.events = {};
    this.$el = null;
    this.template = null;
}
View.prototype.addEvent = function(eventType, selector, callback) {
    var elmt = document.querySelector(this.$el);
    if (!selector) {
        Gator(elmt).on(eventType, callback.bind(this));
    } else {
        Gator(elmt).on(eventType, selector, callback.bind(this));
    }
};
View.prototype.removeEvent = function(eventType, selector, callback) {
    var elmt = document.querySelector(this.$el);
    Gator(elmt).off(eventType, selector, callback.bind(this));
};
View.prototype._unbind = function() {
    var elmt = document.querySelector(this.$el);
    Gator(elmt).off();
};
View.prototype.render = function() {
    this._unbind();
    for (var eventType in this.events) {
        for (var selector in this.events[eventType]) {
            var callback = this.events[eventType][selector];
            this.addEvent(eventType, selector, callback);
        }
    }

    if (this._render) {
        this._render();
    } else {
        this.children.forEach(function(childView) {
            childView.view.render();
        });
    }
    if (this.bind) {
        this.bind();
    }
};

View.prototype.addView = function(label, view) {
    this.children.push({label: label, view: view});
};

View.prototype.getView = function(label) {
    var matches = this.children.filter(function(childView) {
        return label === childView.label;
    });

    return matches ? matches[0].view : null;
};

View.prototype.destroy = function() {
    this._unbind();
}

Microee.mixin(View);

module.exports = View;
},{"microee":15}],15:[function(require,module,exports){
function M() { this._events = {}; }
M.prototype = {
  on: function(ev, cb) {
    this._events || (this._events = {});
    var e = this._events;
    (e[ev] || (e[ev] = [])).push(cb);
    return this;
  },
  removeListener: function(ev, cb) {
    var e = this._events[ev] || [], i;
    for(i = e.length-1; i >= 0 && e[i]; i--){
      if(e[i] === cb || e[i].cb === cb) { e.splice(i, 1); }
    }
  },
  removeAllListeners: function(ev) {
    if(!ev) { this._events = {}; }
    else { this._events[ev] && (this._events[ev] = []); }
  },
  emit: function(ev) {
    this._events || (this._events = {});
    var args = Array.prototype.slice.call(arguments, 1), i, e = this._events[ev] || [];
    for(i = e.length-1; i >= 0 && e[i]; i--){
      e[i].apply(this, args);
    }
    return this;
  },
  when: function(ev, cb) {
    return this.once(ev, cb, true);
  },
  once: function(ev, cb, when) {
    if(!cb) return this;
    function c() {
      if(!when) this.removeListener(ev, c);
      if(cb.apply(this, arguments) && when) this.removeListener(ev, c);
    }
    c.cb = cb;
    this.on(ev, c);
    return this;
  }
};
M.mixin = function(dest) {
  var o = M.prototype, k;
  for (k in o) {
    o.hasOwnProperty(k) && (dest.prototype[k] = o[k]);
  }
};
module.exports = M;

},{}]},{},[10])
;