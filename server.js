var express = require('express')
var app = express()
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser')
var session = require('express-session')
app.use(bodyParser.urlencoded({extended: false}));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
var mysql = require('mysql');
var Sequelize = require('sequelize');
var bcrypt = require('bcryptjs');

var sequelize = new Sequelize('myclassapp_db', 'root');

var PORT = process.env.NODE_ENV || 8090;

app.use(session({
  secret: 'abcde',
  cookie: {
    maxAge: 1000 * 600
  },
  saveUninitialized: true,
  resave: false
}));







app.get('/', function (req, res) {
    res.render('home', {
      msg: req.query.msg
    });
});


sequelize.sync();

app.listen(PORT, function(){
  console.log('Listening on %s', PORT)
});
