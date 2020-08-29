const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const LevelStore = require("level-session-store")(session);

const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const bodyParser = require('body-parser');

const port = 3030;
const config = require('./config.json');

//// DB
const users = require("./modals/users.js");
const mongoose = require("mongoose")

app.use(session({
  //store: new LevelStore("./data/dashboard-session/"),
  secret: config.secret,
  cookie: {
    //domain: domain
    maxAge: 86400000, // 5 days
    httpOnly: false,
  },
  resave: false,
  saveUninitialized: false,
}));

// set up cors to allow us to accept requests from our client

app.use(cors());
app.use(bodyParser.json())

const sessionCheck = (req, res, next) => {
  if (!req.session.user) {
    next()
  } else {
    res.json({
      authenticated: true,
      message: "You are allready loggedin."
    });
  }
};

const authCheck = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if(!token) return res.json({
    authenticated: false,
    message: "User has not been authenticated"
  });

  jwt.verify(token, config.jsonWebToken.ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) return res.json({
      authenticated: false,
      message: "User has not been authenticated"
    });
    req.session.user = user;
    next()
  })
}

app.post("/api/v1/auth/", sessionCheck, (req, res) => {

  let username = req.body ? req.body.username : null;
  let password = req.body ? req.body.password : null;

  if(!username || !password) {
    return res.json({
      authenticated: false,
      message: "No username or password found"
    });
  }

  users.findOne({ username: username }, (err, user) => {
    if(!user) {
      return res.json({
        authenticated: false,
        message: "Username is not find in the database."
      });
    } else {

      bcrypt.compare(password, user.password, function(err, result) {
          if(err) {
            return res.json({
              authenticated: false,
              message: "An error occured, please try again."
            });
          }

          if(result){
            let AccessToken = jwt.sign(user.toJSON(), config.jsonWebToken.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            return res.json({
              authenticated: true,
              token: AccessToken,
              message: "Successfully authenticated."
            });
          } else {
            return res.json({
              authenticated: false,
              message: "The credentials are incorrect."
            });
          }
      });

    }
  });
});

app.post("/api/v1/auth/register", authCheck, sessionCheck, (req, res) => {

  let username = req.body ? req.body.username : null;
  let email = req.body ? req.body.email : null;
  let password = req.body ? req.body.password : null;

  if(!username || !password || !email) {
    return res.json({
      authenticated: false,
      message: "Dont forgot the required fields"
    });
  }

  users.findOne({ $or: [{ user: username }, { email: email }]}, (err, user) => {
    if(err || user) {
      return res.json({
        authenticated: false,
        message: "Your username/email is already exists."
      });
    } else {

      bcrypt.hash(password, 10, function(err, hash) {
          if(err) {
            console.log(err)
            return res.json({
              authenticated: false,
              registered: false,
              message: "An error occured, please try again."
            });
          }

          let MongooseObject = new mongoose.Types.ObjectId();
          let _rand = Math.random().toString(36).substr(2);

          let newUser = new users({
            _id: MongooseObject,
            username: username,
            email: email,
            password: hash,
            token: _rand + _rand,
            is_moderator: false,
            created_at: Date.now(),
            updated_at: Date.now()
          });
          newUser.save().then(() => {
            return res.json({
              authenticated: false,
              registered: true,
              message: "Your account has been created please login."
            });
          }).catch(err => {
            console.log(err)
            return res.json({
              authenticated: false,
              registered: false,
              message: "An error occured, please try again."
            });
          });
      });

    }
  });

});

app.post("/api/v1/auth/logout", (req, res) => {
    req.session.destroy(() => {
        return res.json({
          authenticated: false,
          message: "User successfully loggedout",
          user: {},
        });
    });
});

app.post("/", authCheck, (req, res) => {
  return res.json({
    authenticated: true,
    message: "user successfully authenticated",
    user: req.session.user
  });
});

// connect react to nodejs express server
app.listen(port, () => console.log(`Server is running on port ${port}!`));

require('./db');
