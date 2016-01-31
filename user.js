//this file should ideally handle all login and sign up processes.
var mysql      = require('mysql');
var express    = require('express');
var crypto     = require('crypto');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var router     = express.Router();
router.use(bodyParser.urlencoded({
  extended: true
}));
router.use(cookieParser());

//LOGIN/SIGN UP routes
router.get('/', function(req, res) {
	res.sendFile(__dirname + '/user/signup.html');
});

router.post('/login.js', function(req, res) {
  //mysql insert session_id statement.
  var session_insert = function(user, session_id) {
    connection.query('UPDATE user_info set session_id = "' + session_id + '" ' 
      + 'where username = "' + req.body.username + '";', 
      function (err) {
        if (err) throw err;
      });
  }
  //fetch salt and hash of supplied username.
  var user_verify = function(user) {
  var q = 'select * from user_info where username = "' + user + '";';
  connection.query(q, function(err, result) {
    if (err) throw err;
      else {
        if (result.length < 1) {
          res.send('user not found');
        }
        else {
          //check if password matches hash
          var user = req.body.username
          var salt = result[0].salt; 
          var input_pass = req.body.password;
          var db_pass = result[0].password;

          //rehash password.
          crypto.pbkdf2(input_pass, salt, 7000, 256, 
          function (err, hash) {
            if (err) { throw err; }
            else {
              hash = new Buffer(hash).toString('hex');
              if (hash === db_pass) {
                console.log('success! welcome ' + user);
                //generate and set cookie and update cookie in db.
                var id = crypto.randomBytes(20).toString('hex');
                session_insert(req.body.username, id);
                res.cookie('id', id, {maxAge: 900000, httpOnly: true});
                res.send('success! welcome ' + user);
              }
            }
          });
        }
      }
  });
  }
  //SETUP database connection.
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'slicez11',
    database : 'users'
  });
  connection.connect();
  
  //begin verification
  user_verify(req.body.username);

})

//SIGN-UP submission
router.post('/signup.js', function(req, res) {
  //SETUP mysql query functions
  //1. checks if username is already taken.
  var user_query = function(user, next) {
  var q = 'select * from user_info where username = "' + user + '";';
  connection.query(q, function(err, result) {
    if (err) throw err;
      else {
        if (result.length) {
          console.log(res.send('username taken'));
        }
        else {
          next();
        }
      }
  });
  }
  //2. inserts user info into database.
  var user_insert = function(user, email, salt, hash) {
    connection.query('INSERT INTO user_info '
      + '(username, email, salt, password) '
      + 'VALUES ("'
      + user + '", "'
      + email + '", "'
      + salt + '", "'
      + hash
      +  '");', function (err) {
        if (err) throw err;
      });
  }
  //3. create salt and hash password.
  var begin = function() {
    //create salt
    crypto.randomBytes(128, function (err, salt) {
      if (err) { throw err; }
      //convert to hex string
      salt = new Buffer(salt).toString('hex');
      //create hash
      crypto.pbkdf2(req.body.password, salt, 7000, 256, 
        function (err, hash) {
          if (err) { throw err; }
          var user = req.body.user_name;
          var email = req.body.input_email;
          salt = salt; 
          hash = new Buffer(hash).toString('hex');
          //insert user info to table
          user_insert(user, email, salt, hash);
          });
          res.send('Thanks for registering ' + req.body.user_name);
          console.log('user: ' + req.body.user_name + ' registered');
    });
  }

  //check that username and password are provided.
  if (req.body.password !== req.body.confirm_pass) {  
    res.send('passwords do not match.');
    return;
  }
  //set up mysql connection
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'slicez11',
    database : 'users'
  });
  connection.connect();
  
  //execute chain of above functions.
  user_query(req.body.user_name, begin);
});

module.exports = router;
