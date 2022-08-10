var express = require('express');
var app = express();

var formidable = require('express-formidable');
app.use(formidable());

var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

var http = require('http').createServer(app);
var bcrypt = require('bcrypt');
var fs = require('fs');

const jwt = require('jsonwebtoken');
const accessTokenSecret = "myAccessTokenSecret1234567890";

app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

var socketIO = require('socket.io')(http);
var socketID = "";
var users = [];

var mainURL = "http://localhost:3000";

socketIO.on("connection", function(socket) {
  console.log("User Connected", socket.id);
  socketID = socket.id;
});

http.listen(3000, function() {
      console.log("Server Started on port 3000");
      mongoClient.connect("mongodb://localhost:27017", function(err, client) {
          var database = client.db("social_book");
          console.log("Database connected");

          app.get("/signup", function(req, res) {
            res.render("signup");
          });

          app.post("/signup", function(req, res) {
              var name = req.fields.name;
              var username = req.fields.username;
              var email = req.fields.email;
              var password = req.fields.password;
              var gender = req.fields.gender;

              database.collection("users").findOne({
                  $or: [{
                    "email": email
                  }, {
                    "username": username
                  }]
                }, function(error, user) {
                  if (user == null) {
                    bcrypt.hash(password, 10, function(error, hash) {
                        database.collection("users").insertOne({
                          "name": name,
                          "username": username,
                          "email": email,
                          "password": hash,
                          "gender": gender,
                          "profileImage": "",
                          "coverPhoto": "",
                          "dob": "",
                          "city": "",
                          "country": "",
                          "aboutMe": "",
                          "friends": [],
                          "pages": [],
                          "notifications": [],
                          "groups": [],
                          "posts": []
                        }, function(error, data) {
                          result.json({
                            "status": "success",
                            "message": "Signed up successfully! You can login now..."
                          });
                        });
                      });
                    }
                    else {
                      res.json({
                        "status": "error",
                        "message": "Email or username already exists"
                      });
                    }
                  });
              });

              app.get("/login", function (req, res){
                res.render("login");
              });

              app.post("/login", function (req, res){
                var email= req.fields.email;
                var password= req.fields.password;
                database.collection("users").findOne({
                  "email": email
                }, function (error, user){
                  if(user== null){
                    res.json({
                      "status": "error",
                      "message": "Account with this EmailId doesn't exist"
                    });
                  } else {
                    bcrypt.compare(password, user.password, function (error, isVerify){
                      if (isVerify){
                        var accessToken= jwt.sign({ email: email }, accessTokenSecret);
                        database.collection("users").findOneAndUpdate({
                          "email": email
                        }, {
                          $set: {
                            "accessToken": accessToken
                          }
                        }, function (error, data){
                          res.json({
                            "status": "success",
                            "message": "Login successfully",
                            "accessToken": accessToken,
                            "profileImage": user.profileImage
                          });
                        });
                      } else {
                        res.json({
                          "status": "error",
                          "message": "Password is not correct"
                        });
                      }
                    });
                  }
                });
              });

              app.get("/updateProfile", function (req, res){
                res.render("updateProfile");
              });

              app.post("/getUser", function (req, res){
                var accessToken = req.fields.accessToken;
                database.collection("users").findOne({
                  "accessToken": accessToken
                }, function (error, user){
                  if(user== null){
                    res.json({
                      "status": "error",
                      "message": " User has been logged out. Please login again."
                    });
                  } else {
                    res.json({
                      "status": "success",
                      "message": "Record has been fetched",
                      "data": user
                    });
                  }
                });
              });

              app.get("/logout", function (req, res){
                res.redirect("/login");
              });
              
          });
      });
