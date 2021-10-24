// ========================= Modules ========================= 
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt")
const saltRounds = 10;

// ========================= Setup ========================= 
// Create express app
const app = express();

// Setup EJS
app.set('view engine', 'ejs');

// Setup "Bodyparser"
app.use(express.urlencoded({extended: true}));

// Setup static files
app.use(express.static("public"));

// ========================= MongoDB ========================= 
mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

const User = new mongoose.model("User", userSchema);

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

  // Find matching user
  User.findOne({email: username}, function(err, foundUser) {
    if(err) {
      console.log(err);
    } else {
      if(foundUser) {
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if(err) {
            console.log(err);
          } else {
            if(result === true) {
              res.render("secrets");
            } else {
              res.render("login", {username: username, password: password, errorMsg: "Incorrect email or password. Please try again."})
            }
          }
        });
      }
    }
  })
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {

  const username = req.body.username;

  // Hash and salt password using bcrypt
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    if(err) {
      console.log(err);
    } else {
      const newUser = new User({
        email: username,
        password: hash
      });
      
      // Save newUser to database
      newUser.save(function(err) {
        if(err) {
          console.log(err);
        } else {
          res.render("secrets")
        }
      });
    }
  });
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});