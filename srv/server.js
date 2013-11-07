var express = require("express");
var appController = require('./controllers/app');

var app = express();

app.use('/public', express.static(__dirname + '/../public'));

app.use(express.bodyParser());

app.get('/', function(req, res) {
    appController.index(req, res);
});

app.get('/combis', function(req, res) {
    appController.allCombi(req, res);
});

app.post('/combis', function(req, res) {
    appController.saveCombi(req, res);
});

app.delete('/combis/:id', function(req, res) {
    appController.deleteCombi(req, res);
});

var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("listening on  " + port)
});