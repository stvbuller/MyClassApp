var express = require('express')
var app = express()
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser')
var session = require('express-session')
app.use(bodyParser.urlencoded({extended: false}));
//setup express-handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var mysql = require('mysql');
var Sequelize = require('sequelize');
var bcrypt = require('bcryptjs');

// load dependency for connect-session-sequelize
var cookieParser = require('cookie-parser')
// initalize sequelize with session store
var SequelizeStore = require('connect-session-sequelize')(session.Store);

var sequelize = new Sequelize('myclassapp_db', 'root');

var PORT = process.env.NODE_ENV || 8090;

app.use(session({
  secret: 'abcde',
  cookie: {
    maxAge: 1000 * 600
  },
  saveUninitialized: true,
  resave: false,
  store: new SequelizeStore({         //used for connect-session-sequelize
    db: sequelize
  }),
}));

//the Student model
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

//the Instructor model, uses the boolean "teacher" to
//designate teacher or ta
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
    allowNull: true,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true,
    validate: {
      len: {
        args: [0, 10],
        msg: "Please enter a password between 1 and 10 characters"
      }
    }
  },
  teacher: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  }
});

//one to many relationship for the instructor to students
Instructor.hasMany(Student);


app.get('/', function (req, res) {
    res.render('register', {
      msg: req.query.msg
    });
});

app.get('/login', function (req, res) {
    res.render('login', {
      msg: req.query.msg
    });
});


app.get('/students', function (req, res) {
    Student.findAll({
    // include: [{
    //   model: Instructor
    //   }]
    }).then(function(student) {
      res.render('students' , {
        student: student
      })
    });
});

app.get('/instructors', function (req, res) {
    Instructor.findAll({
    include: [{
      model: Student
      }]
    }).then(function(instructor) {
      res.render('instructors' , {
        instructor: instructor
      })
    });
});

//** this needs to be changed so that instructors
//are registered as well as students
app.post('/register', function(req, res) {
  Student.create(req.body).then(function(user) {
    req.session.authenticated = user;
    res.redirect('/login');
  }).catch(function(err) {
    res.redirect('/register?msg=' + err.message);
  });
});

//** this needs to be changed so that the passwords
//of instructors are checked as well as students
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

//creates a teacher
app.post('/createinstructors', function(req, res) {
  Instructor.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    teacher: true
  }).then(function() {
    res.redirect('/instructors');
  });
});

//creates a ta
app.post('/createta', function(req, res) {
  Instructor.create({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    teacher:  false
  }).then(function() {
    res.redirect('/instructors');
  });
});

//creates the db for connect-session-sequelize
//SequelizeStore.sync();

// database connection via sequelize
sequelize.sync().then(function() {
  app.listen(PORT, function() {
      console.log("Listening on:" + PORT)
  });
});

