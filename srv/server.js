var express = require("express");
var EE = require('events').EventEmitter;
var fs = require("fs");
var controllers = require('./controllers');

var Router = require('./router');
router = new Router(controllers);


var app = module.exports = express();

app.use('/public', express.static(__dirname + '/public'));
app.use(express.bodyParser());

var Events = new EE;

app.all('*', router.dispatch);

app.listen(process.env.PORT || 3000);