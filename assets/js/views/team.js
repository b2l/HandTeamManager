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