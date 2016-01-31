var express    = require('express');
var login      = require('./user');
var app        = express();

app.use('/user', login);
app.use(express.static(__dirname + '/'));
app.listen(process.env.PORT || 3000);