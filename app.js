// ========================= Modules ========================= 
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")

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
  password: String
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ========================= GET/POST ========================= 

app.get("/", function(req, res) {
  res.render("home");
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
  if(req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("login");
  }
})

app.get("/logout", function(req, res) {
  req.logOut();
  res.redirect("/");
})




app.listen(3000, function() {
  console.log("Server started on port 3000");
});