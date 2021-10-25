// ========================= Modules ========================= 
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook").Strategy

// ========================= Setup ========================= 
// Create express app
const app = express();

// Setup EJS
app.set('view engine', 'ejs');

// Setup "Bodyparser"
app.use(express.urlencoded({extended: true}));

// Setup express-session Package
app.use(session({
  secret: process.env.SECRET, 
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport package and use it to deal with session
app.use(passport.initialize());
app.use(passport.session());

// Setup static files
app.use(express.static("public"));

// ========================= MongoDB ========================= 
mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
})

userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Setting up login with facebook: https://www.twilio.com/blog/facebook-oauth-login-node-js-app-passport-js
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    enableProof: true
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// ========================= GET/POST ========================= 

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res) {
  res.render("login", {username: "", password: "", errorMsg: ""});
});

app.post("/login", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  passport.authenticate("local", function(err, user) {
    if(err) {
      console.log(err);
    } else {
      if(!user) {
        res.render("login", {username: username, password: password, errorMsg: "Incorrect email or password. Please try again."})
      } else {
        req.logIn(user, function(err) {
          if(err) {
            console.log(err);
          } else {
            res.redirect("/secrets");
          }
        })
      }
    }
  })(req, res);

});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {

  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  });
});

app.get("/secrets", function(req, res) {
  User.find({secret: {$ne:null}}, function(err, foundUsers) {
    if(err) {
      console.log(err);
    } else {
      if(foundUsers) {
        const allSecrets = [];
        foundUsers.forEach(user => {
          allSecrets.push(user.secret);
        })
        res.render("secrets", {allSecrets: allSecrets});
      }
    }
    
    foundUsers.forEach(user => {

    })
  })

})

app.get("/logout", function(req, res) {
  req.logOut();
  res.redirect("/");
})

app.get("/submit", function(req, res) {
  if(req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
})

app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function(err, foundUser) {
    if(err) {
      console.log(err);
    } else {
      if(foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function() {
          res.redirect("/secrets");
        })
      }
    }
  })
})



app.listen(3000, function() {
  console.log("Server started on port 3000");
});