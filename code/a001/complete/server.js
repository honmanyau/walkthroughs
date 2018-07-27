let express = require('express');
let bodyParser = require('body-parser');
let bcrypt = require('bcrypt');
let session = require('express-session');

let app = express();

let User = require('./User.js');

let checkAuth = require('./middlewares/checkAuth.js');

// Middlewares
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.json());

// Routes
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard', checkAuth, function(request, response) {
  response.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/api/user', checkAuth, function(request, response) {
  User.findOne({ username: request.session.user.username })
    .then((user) => {
      let { username, email, mobile } = user;
      // console.log(user);
      response.json({ username, email, mobile });
    });
});

app.get('/signout', checkAuth, function(request, response) {
  request.session.destroy((error) => {
    if (!error) {
      response.redirect('/');
    }
  });
});

app.post('/signup', function(request, response) {
  // console.log('/signup, POST, request.body: ', request.body);
  // console.log('/signup, request.session: ', request.session, request.sessionID, request.session.id);

  let { username, password, email, mobile } = request.body;

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        bcrypt.hash(password, 12, function(error, hash) {
          // console.log(
          //   'Password: ', password,
          //   '\nHash: ', hash
          // );
          User.create({ username, email, mobile, password: hash });

          request.session.user = { username };
          console.log(request.session);
          response.redirect('/dashboard');
        });
      }
      else {
        response.json({ error: 'Username already taken.' });
      }
    });
});

app.post('/signin', function(request, response) {
  // console.log(`/signin, POST, request.body: ${JSON.stringify(request.body)}`);

  let { username, password } = request.body;

  User.findOne({ username })
    .then((user) => {
      if (user) {
        let hash = user.password;

        bcrypt.compare(password, hash, (error, result) => {
          if (result) {
            response.redirect('/dashboard');
          }
          else {
            response.json({ error: 'Incorrect login credentials.' });
          }
        });
      }
      else {
        response.json({ error: 'Incorrect login credentials.' });
      }
    });

  // response.status(501).send('(◕︿◕✿)');
});

let listener = app.listen(3000, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
