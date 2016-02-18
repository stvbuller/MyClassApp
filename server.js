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


var Student = sequelize.define('Student', {
  firstname: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 20],
        msg: "Please enter a first name less than 20 characters"
      },
      is: ["^[a-z]+$",'i']
    }
  },
  lastname: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 20],
        msg: "Please enter a last name less than 20 characters"
      },
      is: ["^[a-z]+$",'i']
    }
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 10],
        msg: "Please enter a password between 1 and 10 characters"
      }
    }
  }
});

var Instructor = sequelize.define('Instructor', {
  firstname: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 20],
        msg: "Please enter a first name less than 20 characters"
      },
      is: ["^[a-z]+$",'i']
    }
  },
  lastname: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 20],
        msg: "Please enter a last name less than 20 characters"
      },
      is: ["^[a-z]+$",'i']
    }
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 10],
        msg: "Please enter a password between 1 and 10 characters"
      }
    }
  }
});

app.get('/', function (req, res) {
    res.render('registration', {
      msg: req.query.msg
    });
});

app.get('/login', function (req, res) {
    res.render('login', {
      msg: req.query.msg
    });
});

app.get('/register', function (req, res) {
    res.render('registration', {
      msg: req.query.msg
    });
});

app.get('/students', function (req, res) {
    Student.findAll({
    // include: [{
    //   model: AlterEgo
    //   }]
    }).then(function(student) {
      res.render('students' , {
        student: student
      })
    });
});

app.get('/instructor', function (req, res) {
    Instructor.findAll({
    // include: [{
    //   model: AlterEgo
    //   }]
    }).then(function(student) {
      res.render('instructors' , {
        instructor: instructor
      })
    });
});

app.post('/register', function(req, res) {
  Student.create(req.body).then(function(user) {
    req.session.authenticated = user;
    res.redirect('/login');
  }).catch(function(err) {
    res.redirect('/register?msg=' + err.message);
  });
});

app.post('/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  Student.findOne({
    where: {
      email: email,
      password: password
    }
  }).then(function(user) {
    if(user) {
      req.session.authenticated = user;
      res.redirect('/students');
    } else {
      res.redirect('/?msg=you are not logged in');
    }
  }).catch(function(err) {
    throw err;
  });
});


sequelize.sync();

app.listen(PORT, function(){
  console.log('Listening on %s', PORT)
});
