//express setup
var express = require('express')
var app = express()
var PORT = process.env.PORT || 8090;

var bodyParser = require('body-parser')
var session = require('express-session')
app.use(bodyParser.urlencoded({extended: false}));
//setup express-handlebars
var exphbs = require('express-handlebars');
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


//requiring passport last
var passport = require('passport');
var passportLocal = require('passport-local');
//middleware init
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

app.use(passport.initialize());
app.use(passport.session());


//passport use methed as callback when being authenticated
passport.use(new passportLocal.Strategy(function(username, password, done) {
  //check password in db
  Student.findOne({
    where: {
      username: username
    }
  }).then(function(user) {
    console.log("WHAT IS", user);
    //check password against hash
    if(user) {
      bcrypt.compare(password, user.dataValues.password, function(err, bcryptUser) {
        if (bcryptUser) {
          //if password is correct authenticate the user with cookie
          done(null, user);
        }
        else {
          done(null, null);
        }
      });
    }
    else {
      done(null, null);
    }
  });
}));

//change the object used to authenticate to a smaller token, and protects the server from attacks
passport.serializeUser(function(user, done) {
  console.log('in serializeUser', user);
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  console.log('in deserializeUser', user);
  done(null, user);
});

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
  username: {
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
}, {
    hooks: {
      beforeCreate: function(input){
        input.password = bcrypt.hashSync(input.password, 10);
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
  username: {
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
}, {
    hooks: {
      beforeCreate: function(input){
        input.password = bcrypt.hashSync(input.password, 10);
      }
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

//registers students
app.post('/register', function(req, res) {
  Student.create(req.body).then(function(user) {
    req.session.authenticated = user;
    res.redirect('/login');
  }).catch(function(err) {
    res.redirect('/register?msg=' + err.message);
  });
});

//registers instructors
app.post('/registerInstructor', function(req, res) {
  Instructor.create(req.body).then(function(user) {
    req.session.authenticated = user;
    res.redirect('/login');
  }).catch(function(err) {
    res.redirect('/register?msg=' + err.message);
  });
});

//student login without hash
// app.post('/loginStudent', function(req, res) {
//   var email = req.body.email;
//   var password = req.body.password;

//   Student.findOne({
//     where: {
//       email: email,
//       password: password
//     }
//   }).then(function(user) {
//     if(user) {
//       req.session.authenticated = user;
//       res.redirect('/students');
//     } else {
//       res.redirect('/?msg=you are not logged in');
//     }
//   }).catch(function(err) {
//     throw err;
//   });
// });

//check login with db using passport
app.post('/loginStudent', passport.authenticate('local', {
  successRedirect: '/students',
  failureRedirect: '/?msg=you are not logged in'
}));


//instructor login without hash
// app.post('/loginInstructor', function(req, res) {
//   var username = req.body.username;
//   var password = req.body.password;

//   Instructor.findOne({
//     where: {
//       username: username,
//       password: password
//     }
//   }).then(function(user) {
//     if(user) {
//       req.session.authenticated = user;
//       res.redirect('/instructors');
//     } else {
//       res.redirect('/?msg=you are not logged in');
//     }
//   }).catch(function(err) {
//     throw err;
//   });
// });

//instructor login with hash
app.post('/loginInstructor', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  Instructor.findOne({
    where: {
      username: username,
      //password: password
    }
  }).then(function(user) {
    console.log("WHAT IS", user);
    //check password against hash
    if(user) {
      bcrypt.compare(password, user.dataValues.password, function(err, bcryptUser) {
        if (bcryptUser) {
          req.session.authenticated = user;
          res.redirect('/instructors');
          //if password is correct authenticate the user with cookie
          //done(null, user);
        }
        else {
          res.redirect('/?msg=you are not logged in');
          //done(null, null);
        }
      });
    }
    else {
      res.redirect('/?msg=you are not logged in');
      //done(null, null);
    }
  });
});



//creates a ta
// app.post('/createta', function(req, res) {
//   Instructor.create({
//     firstname: req.body.firstname,
//     lastname: req.body.lastname,
//     teacher:  false
//   }).then(function() {
//     res.redirect('/instructors');
//   });
// });

//creates the db for connect-session-sequelize
//SequelizeStore.sync();

// database connection via sequelize
sequelize.sync().then(function() {
  app.listen(PORT, function() {
      console.log("Listening on:" + PORT)
  });
});



