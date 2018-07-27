# ExpressJS Cookie Session-based Authentication

## Introduction

This is a walkthrough that demonstrates how cookie session-based authentication works on an NodeJS-ExpressJS server.

The motivation for writing this is because there is almost every article that you find out there (at the time of writing) is about PassportJS/Auth0/Firebase... etc., and the only article (that I managed to find) about implementing cookie session-based authentication from scratch is effectively the usual copypasta-style tutorial.

As such, this walkthrough intends to be a slightly lower-level exploration that shows how various parts fit together where authentication is concerned. **The code is not meant to be production-ready** and, in addition, please take the information shown in this walkthrough with a grain of salt as I haven't had any training in cybers security so.

If you spot any mistakes or anything that you think is a really bad idea—please kindly raise an issue to let me know (and it will be very much appreciated


## Table of Contents

* [Assumed Knowledge](#assumed-knowledge)
* [General Notes](#general-notes)
  * [Regarding `console` Methods](#regarding-console-methods)
* [Setup](#setup)
  * [Create Files and Directories](#create-files-and-directories)
  * [Edit `server.js`](#edit-serverjs)
  * [Edit `.env`](#edit-env)
  * [Edit `User.js`](#edit-userjs)
  * [Edit `public/dashboard.html`](#edit-publicdashboardhtml)
  * [Edit `public/index.html`](#edit-publicindexhtml)
  * [Edit `public/style.css`](#edit-publicstylecss)
* [Step 1: Sending Login Credentials to the Server](#step-1-sending-login-credentials-to-the-server)
* [Step 2: `POST`ing Login Credentials to the Server](#step-2-posting-login-credentials-to-the-server)
* [Step 3: Implementing the `/signup` Route](#step-3-implementing-the-signup-route)
* [Step 4: Enabling Session](#step-4-enabling-session)
* [Step 5: Serving Protected Pages](#step-5-serving-protected-pages)
* [Step 6: Serving Authorised Content](#step-6-serving-authorised-content)
* [Step 7: Implementing the `/signin` route](#step-7-implementing-the-signin-route)
* [Step 8: Implementing Sign Out](#step-8-implementing-sign-out)

## Assumed Knowledge

* JavaScript
  * Basic ES6 syntax
  * Gathering and destructuring
* HTML5
  * Working with various types of input elements
* Web API
  * Creating event listeners
  * Handling events
  * `fetch`
  * `Promise`
* Working knowledge of NPM, NodeJS and ExpressJS

Some things in this walkthrough may seem unnecessary to the more experienced reader—those things (often in the form of code comments) are included in the hope that the more naive readers can still benefit from this walkthrough.

## General Notes

### Regarding `console` Methods

Since this is a learning exercise, being able to visualise the flow of data and data themelves, various `console` methods are used liberally.

However, the `console` methods (such as `console.log()`) are commented out to emphasis the fact that they could leak implementation detail in production code. A linter would usually be used to catch these statements during development.

## Setup

### Create Files and Directories

```sh
# Create project directory
mkdir walkthrough

cd walkthrough
mkdir public
mkdir middlewares

# Install dependencies
npm install express bcrypt express-session dotenv

# Create files
touch server.js
touch User.js
touch .env

cd public
touch index.html
touch style.css
touch client.js

cd ../middlewares
touch checkAuth.js
```

### Edit `server.js`

```javascript
let express = require('express');
let app = express();

// Middlewares
app.use(express.static('public'));

// Routes
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard', function(request, response) {
  response.sendFile(__dirname + '/public/dashboard.html');
});

let listener = app.listen(3000, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
```

### Edit `.env`

```sh
SESSION_SECRET='superc4l1fr4g1l1st1cexpi4l1d0c10us'
```

### Edit `User.js`

```javascript
module.exports = (function() {
  let database = { entries: 0, users: {} },
      create = () => {},
      findOne = () => {},
      publicAPI = {};

  create = function({ username, password, email, mobile }) {
    return new Promise(function(resolve, reject) {
      let usernameIsString = typeof username === 'string',
        passwordIsString = typeof password === 'string',
        valuesAreValid = usernameIsString && passwordIsString;

      if (valuesAreValid) {
        let uid = 'uid' + (++database.entries),
            user = { uid, username, password, email, mobile };

        database.users[uid] = user;
        resolve({ ...user });
      }
      else {
        throw Error('Username and/or password are strings!');
      }
    });
  };

  findOne = function({ username, uid }) {
    return new Promise(function(resolve, reject) {
      let user = database.users[uid];

      if (!user) {
        for (let id in database.users) {
          let entry = database.users[id];

          if (username === entry.username) {
            user = { ...entry };
          }
        }
      }

      resolve(user || null);
    });
  };

  publicAPI = {
    create,
    findOne
  };

  return publicAPI;
})();
```

### Edit `public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Nyanpasu!</title>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="style.css">

    <script src="client.js" defer></script>
  </head>

  <body>
    <main id="app" class="app flex justify-center align-center">
      <form class="flex flex-column justify-center">
        <fieldset>
          <legend>Login credentials</legend>

          <label for="input-username">Username:</label>
          <input id="input-username" type="text" placeholder="Username" />

          <label for="input-password">Password:</label>
          <input id="input-password" type="password" placeholder="•••••••••" />
        </fieldset>

        <fieldset>
          <legend>Contact details</legend>

          <label for="input-email">E-mail address:</label>
          <input id="input-email" type="email" placeholder="nadeshiko@nyanpasu.com" />

          <label for="input-mobile">Mobile number:</label>
          <input id="input-mobile" type="mobile" placeholder="+61 412 345 678" />
        </fieldset>

        <button id="button-signup" class="button-form" type="button" data-route="signup">Sign up</button>
        <button id="button-signin" class="button-form" type="button" data-route="signin">Sign in</button>
      </form>
    </main>
  </body>
</html>
```

### Edit `public/dashboard.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Dashboard</title>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="style.css">

    <script src="client.js" defer></script>
  </head>

  <body id="dashboard">
    <main id="app" class="app flex justify-center align-center">
      <form class="flex flex-column justify-center">
        <fieldset>
          <legend>Login credentials</legend>

          <label for="input-username">Username:</label>
          <input id="input-username" type="text" disabled />

          <label for="input-newpassword">New password:</label>
          <input id="input-newpassword" type="text" placeholder="•••••••••" disabled />

          <label for="input-confirmnewpassword">Confirm new password:</label>
          <input id="input-confirmnewpassword" type="text" placeholder="•••••••••" disabled />
        </fieldset>

        <fieldset>
          <legend>Contact details</legend>

          <label for="input-email">E-mail address:</label>
          <input id="input-email" type="email" placeholder="nadeshiko@nyanpasu.com" />

          <label for="input-mobile">Mobile number:</label>
          <input id="input-mobile" type="mobile" placeholder="+61 412 345 678" />
        </fieldset>

        <fieldset>
          <legend>Authorise changes</legend>

          <label for="input-password">Current password:</label>
          <input id="input-password" type="text" placeholder="•••••••••" disabled />
        </fieldset>

        <button id="button-modify" class="button-form" type="button" data-route="signup">Modify</button>
        <button id="button-signout" class="button-form" type="button" data-route="signout">Sign out</button>
      </form>
    </main>
  </body>
</html>
```

### Edit `public/style.css`

```css
* {
  box-sizing: border-box;
}

html {
  font-size: 14px;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Century Gothic', sans-serif;
  background: #333;
  color: white;
}

label {
  margin: 0.5em 0em;
  display: block;
}

input {
  font-size: 14px;
}

.flex {
  display: flex;
}

.flex-column {
  flex-direction: column;
}

.justify-center {
  justify-content: center;
}

.align-center {
  align-items: center;
}

.app {
  height: 100vh;
}

.button-form {
  margin-top: 1em;
  font-size: 14px;
  line-height: 1.999em;
  border: 2px solid #DDD;
  border-radius: 1em;
  color: white;
  background: none;
  box-shadow: none;
  transition: border-color 0.7s, color 0.7s;
}

.button-form:hover {
  border-color: #1CE;
  color: #1CE;
}

.button-form:active {
  background: rgba(255, 255, 255, 0.07);
}
```

### Edit `public/client.js`

```javascript
(function() {
  const HOST = '';
  let page = document.body.id,
      methods = {
        index: initIndex,
        dashboard: initDashboard
      };

  methods[page]();


  // ================
  // Helper functions
  // ================
  function initIndex() {

  }

  function initDashboard() {

  }
})()
```

## Step 1: Sending Login Credentials to the Server

This step involves the following:

* Writing client-side code so that login credentials can be sent to the server in JSON format
* Making the functionality available to both the "Sign in" and "Sign up" buttons

To avoid some of the complexities involved with the `multipart/form-data` content type, login credential are sent in the JSON format in this case. It is worth noting that, for security reasons, login credentials should be sent over SSL/TLS, or in other words, under the HTTPS protocol.

An event listener should first be added to the sign-in and sign-up buttons to capture the action. Note that the starter files have been set up such that scripts meant for `index.html` are placed in the `initIndex` function:

```javascript
// public/client.js

// ...

function initIndex() {
  let signInButton = document.getElementById('button-signin'),
      signUpButton = document.getElementById('button-signup');

  signInButton.addEventListener('click', handleIndexButtonClick);
  signUpButton.addEventListener('click', handleIndexButtonClick);
}

// ...

function handleIndexButtonClick(event) {
  event.preventDefault();
}

// ...
```

The event handler `handleIndexButtonClick` is meant to retrieve the values of the username and password form inputs and `POST` if off to the appropriate route on the server; the appropriate route is store as a `data-` attribute on each of the button elements in our case. The implementation is as follows:

```javascript
// public/client.js

// ...

function handleIndexButtonClick(event) {
  event.preventDefault();

  let route = event.target.datasets.route,
      method = 'POST',
      headers = { 'Content-Type': 'application/json' },
      username = document.getElementById('input-username').value,
      password = document.getElementById('input-password').value,
      email = document.getElementById('input-email').value,
      mobile = document.getElementById('input-mobile').value,
      body = JSON.stringify({ username, password, email, mobile });

  fetch(`${HOST}/${route}`, { method, headers, body })
    .then((response) => {
      // console.log(
      //   'OK: ', response.ok,
      //   '\nStatus: ', response.status,
      //   '\nStatus text: ', response.statusText
      // );
    });
}

// ...
```

Since the `/signin` and `/signup` `POST` routes haven't been set up on the server, clicking on the buttons will result in a `404` response (give it a go by uncommenting `console.log`!).

### Step 2: `POST`ing Login Credentials to the Server

This step involves the following:

* Initial setup of a `POST` route, `/signup`, on the server for creating a new user with the credentials provided
* Initial setup of a `POST` route, `/signin`, on the server for authenticating an existing user

Once you are happy with the code above and the response returned by the server, setup the `POST` route as follows:

```javascript
// server.js

// Routes

// ...

app.post('/signup', function(request, response) {
  // console.log(`/signup, POST, request.body: ${request.body}`);

  response.status(501).send('(◕︿◕✿)');
});

app.post('/signin', function(request, response) {
  // console.log(`/signin, POST, request.body: ${request.body}`);

  response.status(501).send('(◕︿◕✿)');
});
```

We are setting up the `/signup` and `/signin` routes to return a `501 Not Implemented` response since we are leaving its implementation for later. Posting login credentials should now result in a `501` response instead of a `404` response.

If you are a step ahead and have already looked at `request.body` to find that it is currently `undefined`. To have the JSON string sent from the client parsed to `request.body`, we can use the `bodyParser` middleware:

```javascript
// server.js

let express = require('express');
let bodyParser = require('body-parser');

let app = express();

// Middlewares
app.use(express.static('public'));
app.use(bodyParser.json());

// ...
```

If everything is implemented correctly, `request.body` should now be a JSON object that mirrors what is sent from the client. Do keep in mind that logging sensitive data to the console is a potential security risk!

## Step 3: Implementing the `/signup` Route

This step involves the implementation for handling data posted to the `/signup` route:

* Checking whether the username submitted by the client already exists
* Creating a user if the username received from the client does not already exist and the password is valid

**Note 3.1**: we won't be setting up and using a database and using a DBMS in this walkthrough—user data is stored in a plain old JavaScript object ([POJO](https://leanpub.com/javascriptallongesix/read)). There is a multitude of reasons for why one should use a database instead of writing to disk in a real, production environment, so please don't do this in a real app/website!

**Note 3.2**: we have omitted both client-side and server-side password valdiation in this walkthrough—please make sure you implement those in a real app/website!

To begin with, import our fake `User` model:

```javascript
// server.js

// ...

let app = express();

let User = require('./User.js');

// ...
```

To check if a username already exists in the database, we use the `findOne` method, which either returns a `Promise` object that is resolved with `{ uid, username, password }` when a user with the username provided is found, or `null` otherwise:

```javascript
// server.js

app.post('/signup', function(request, response) {
  let { username, password, email, mobile } = request.body;

  User.findOne({ username })
    .then((user) => {
      // console.log(user);
    });

  response.status(501).send('(◕︿◕✿)');
});
```

And if a user does not exist, we should first encrypt create an entry in the database using the `create` method; we are using the popular library [`bcrypt`](https://github.com/kelektiv/node.bcrypt.js) to do this:

```javascript
// server.js

// ...

let bcrypt = require('bcrypt');

// ...

app.post('/signup', function(request, response) {
  let { username, password, email, mobile } = request.body;

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        bcrypt.hash(password, 12, function(error, hash) {
          // console.log(
          //   'Password: ', password,
          //   '\nHash: ', hash
          // );
        });
      }
    });

  response.status(501).send('(◕︿◕✿)');
});
```

**Note 3.3**: If you unsure why passwords need to be encrypted, please spend some time researching into the topic. I personally find [this article](https://hackernoon.com/your-node-js-authentication-tutorial-is-wrong-f1a3bf831a46) to be a good starting point.

Using the hash created by `bcrypt`, we can now create a new user using the `create` method available to `User` and send a response back to the client accordingly:

```javascript
// server.js

// ...

app.post('/signup', function(request, response) {
  // console.log('/signup, POST, request.body: ', request.body);

  let { username, password, email, mobile } = request.body;

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        bcrypt.hash(password, 12, function(error, hash) {
          // console.log(
          //   'Password: ', password,
          //   '\nHash: ', hash
          // );
          User.create({ username, password: hash, email, mobile });

          response.json({ message: 'Successfully created new user.' });
        });
      }
      else {
        response.json({ error: 'Username already taken.' });
      }
    });
});
```

The `create` method returns a `Promise` object that is resolved with an object in the form of `{ uid, username, password }` if you wish to inspect the object representing a newly created user.

Finally, we process the response from the server on the client side by returning `response.json()` in the existing `then` and adding a second `then`:

```javascript
// public/client.js

// ...

function handleIndexButtonClick(event) {
  // ...

  fetch(`${HOST}/${route}`, { method, headers, body })
    .then((response) => {
      // console.log(
      //   'OK: ', response.ok,
      //   '\nStatus: ', response.status,
      //   '\nStatus text: ', response.statusText
      // );

      return response.json();
    })
    .then((data) => {
      // console.log(data);
    })
    .catch((error) => {
      // console.error(`Something went wrong during sign up! Error: ${error}`);
    });
}
```

This is a good place to try creating users and inspect what is logged to the console on both the server side and client side. Note that since the fake database resides in memory, you will need to restart the server if you wish to restart with a clean database.

## Step 4: Enabling Session

This step involves the following:

* Developing and understanding of the flow in a typical cookie session-based authentication
* Enabling cookie session with a session store

While we can store and retrieve login credentials from our (fake) database now, we are faced with another question—how do we actually remember the user as signed in?

Our simple web app does not currently remember whether or not a user has already been authenticated. A [cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) is a small piece of data that can passed between a server and a browser every time a data is requested or served, it is commonly used for establishing login sessions and is what we will be using.

Before adding anything else, it is worthwhile inspecting `request.session` using `console.log` in `/signup` route:

```javascript
app.post('/signup', function(request, response) {
  // console.log('/signup, POST, request.body: ', request.body);
  // console.log('/signup, request.session: ', request.session);

  // ...
});
```

Accessing the route by pressing the "Sign up" button should show that `request.session` is `undefined`.

To cookie session mechanisms on our server, we add `express-session` to it as a middleware as follows:

```javascript
// server.js

let express = require('express');
let bodyParser = require('body-parser');
let bcrypt = require('bcrypt');
let session = require('express-session');

let app = express();

let User = require('./User.js');

// Middlewares
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

The option `secret` is required for cookie signing (it can be a string or an array, for more information, please refer to [the documentation](https://github.com/expressjs/session)).

Both `resave` and `saveUninitialized` no longer accept default options at the time of writing. `resave` is an option that, according to the documentation, depends mostly on whether or not the store being used implements the `touch` method; the default **not-for-production** memory store does have the `touch` method implemented and we are setting `resave` to false in our case.

For an excellent explanation about `resave` and `saveUninitialized`, please read the accepted answer in [this StackOverflow thread](https://stackoverflow.com/questions/40381401/when-use-saveuninitialized-and-resave-in-express-session#40396102).

Coming back to the `saveUninitialized` option, this option specifies whether or not an "uninitialised" session is saved to the session store. A session is considered initialised if `request.session` has been modified, setting it to `false` reduces the number of sessions being written to the store.

The effect of this option can be seen by examining cookie session storage; to see the effect of this setting on our code using Firefox Developer Edition, open the Storage Inspector (⇧F9) > Cookies and highlight the URL for our web page. There should be not cookies listed and you should see the message "No data present for selected host".

Go through the sign up process, check the console (if you haven't commented out the code for logging), while paying attention to the table. There should be no changes and the message "No data present for selected host" remains.

Now set `saveUninitialized` to `true` and repeat the process—this time you should see new entry as soon as you press the "Sign up" button; that is, a session is saved to the store even though we haven't made any change to it. Once you are happy with what we have just done, clean up the session cookie by right clicking on the entry and selecting "Delete all session cookies" and set `saveUninitialized` back to `false`, since we only want to initialise a session for an authenticated user:

```javascript
// server.js

// ...

// Middlewares
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

As mentioned above, we want to initialise a session only for an authenticated user. There are two points in our webpage where a user can be authenticated:

* Right after signing up. More specifically, right after `User.create` in our `/signup` route implementation (note that not all websites do this, particularly those require e-mail confirmation)
* Right after signing in, which we haven't implemented yet and will come back to later

What we will do in our case is simply assign the object `{ username }` to the `request.session.user` property after a user is successfully created:

```javascript
// server.js

// ...

app.post('/signup', function(request, response) {
  // console.log('/signup, POST, request.body: ', request.body);
  // console.log('/signup, request.session: ', request.session);

  let { username, password, email, mobile } = request.body;

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        bcrypt.hash(password, 12, function(error, hash) {
          // console.log(
          //   'Password: ', password,
          //   '\nHash: ', hash
          // );
          User.create({ username, password: hash, email, mobile });

          request.session.user = { username };
          // console.log(request.session);
          response.json({ message: 'Successfully created new user.' });
        });
      }
      else {
        response.send({ error: 'Username already taken.' });
      }
    });
});

// ...
```

Now open Storage Inspector (⇧F9) > Cookies and highlight the URL for our web page again and create a **new user**—a session cookie should now appear, indicating that the user is considered authenticated and a session is stored in the session store!

## Step 5: Serving Protected Pages

In this step we will:

* Create an authentication middleware to check whether or not a user is already authenticated and has an active session
* Serve a protected page that is meant only for authenticated and authorised users
* Redirect a user to the dashboard on successful sign up

**Note 5.1**: restart the server to clean up our fake database before continuing.

Our dashboard page is meant only for authenticated users but it can currently be accessed by anyone (albeit not having anything interesting to look at), try visiting it by appending `/dashboard` to the URL. Since we are now passing a session cookie back and forth between the server and an authenticated user, all we need to do is check whether or not the user is authenticated, as indicated by the presence of the `request.session.user` object, before serving user content; we do this by implementing a middleware at the `/dashboard` route:

```javascript
// server.js

app.get('/dashboard',
  function(request, response, next) {
    // Middleware
  },
  function(request, response) {
    response.sendFile(__dirname + '/public/dashboard.html');
  }
);
```

In the middleware, we first check whether or not a `request.session.user` exist. If `request.session.user` exist and the `username` property is found, we call `next()` so that the sever can serve `dashboard.html`:

```javascript
// server.js

app.get('/dashboard',
  function(request, response, next) {
    let { user } = request.session;

    if (user) {
      next();
    }
  },
  function(request, response) {
    response.sendFile(__dirname + '/public/dashboard.html');
  }
);
```

Otherwise the user is directed back to the home page:

```javascript
// server.js

app.get('/dashboard',
  function(request, response, next) {
    let { user } = request.session;

    if (user) {
      next();
    }
    else {
      response.redirect('/');
    }
  },
  function(request, response) {
    response.sendFile(__dirname + '/public/dashboard.html');
  }
);
```

Revisiting `/dashboard` should now redirect an unauthenticated user back to the home page.

**Note 5.2**: it is worth noting that sending a response to redirect may not work well with certain front-end frameworks. In those cases, one can send a response that indicates successful sign in and handle redirection on the client side.

The middleware that we have just created is actually general enough that we can use for it for other pages; even though we won't be implementing other protect routes, let's factor it out for practice:

```javascript
// middlwares/checkAuth.js

module.exports = function(request, response, next) {
  let { user } = request.session;

  if (user) {
    next();
  }
  else {
    response.redirect('/');
  }
}
```

```javascript
// server.js

// ...

let checkAuth = require('./middlewares/checkAuth.js');

// ...

app.get('/dashboard', checkAuth, function(request, response) {
    response.sendFile(__dirname + '/public/dashboard.html');
});
```

Make sure that the implementation is correct by visiting `/dashboard` with and without signing in. Finally, we can now redirect a user to the `/dashboard` upon successful sign up:

```javascript
// server.js

app.post('/signup', function(request, response) {
  // ...

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        bcrypt.hash(password, 12, function(error, hash) {
          // console.log(
          //   'Password: ', password,
          //   '\nHash: ', hash
          // );
          User.create({ username, password: hash });

          request.session.user = { username };
          // console.log(request.session);
          response.redirect('/dashboard');
        });
      }
      else {
        response.send({ error: 'Username already taken.' });
      }
    });
});
```

And on the client side:

```javascript
// public/client.js

// ...

function handleIndexButtonClick(event) {
  // ...

  // Authentication request
  fetch(`${HOST}/${route}`, { method, headers, body, redirect: 'follow' })
    .then((response) => {
      console.log(
        'OK: ', response.ok,
        '\nStatus: ', response.status,
        '\nStatus text: ', response.statusText
      );

      if (response.redirected) {
        window.location.assign(response.url);
      }
      else {
        return response.json();
      }
    })
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error(`Something went wrong during sign in! Error: ${error}`);
    });
}

// ...
```

## Step 6: Serving Authorised Content

In this step we will:

* Show private/personal information that is user-specific on the dashboard

Our dashboard is currently only a form that does nothing; ideally we would like to show a user her/his profile details and provide the ability to change those details. Since we won't be implementing server-side rendering, we will do this my making a request to a makeshift endpoint, `/api/user`, that returns some private information to an authenticated user:

```javascript
// server.js

app.get('/api/user', checkAuth, function(request, response) {
  // ...
});
```

We are using the `checkAuth` middleware for this route since we don't expect an unauthenticated user to perform this action. This route returns a JSON response containing the username, e-mail address and mobile number to the client:

```javascript
// server.js

// ...

app.get('/api/user', checkAuth, function(request, response) {
  let { username } = request.session.user;

  User.findOne({ username })
    .then((user) => {
      response.json({ username, email, mobile });
    });
});

// ...
```

And on the client side:

```javascript
// public/client.js

// ...

function initDashboard() {
  let usernameInput = document.getElementById('input-username'),
      newPasswordInput = document.getElementById('input-newpassword'),
      confirmNewPasswordInput = document.getElementById('input-confirmnewpassword'),
      emailInput = document.getElementById('input-email'),
      mobileInput = document.getElementById('input-mobile');

  fetch('/api/user')
    .then((response) => response.json())
    .then((data) => {
      let { username, email, mobile } = data;

      usernameInput.value = username;
      emailInput.value = email;
      mobileInput.value = mobile;
    });
}

// ...
```

Test your code by creating a new account with a non-empty e-mail address and a non-empty mobile number. You should now see those private information in the appropriate fields once you are redirected to the dashboard.

## Step 7: Implementing the `signin` route

In this step we will:

* Implement the ability to sign in

The implementation for the  `/signin` route is similar to that of the `/signup` route, with the exception that we are comparing a password submitted by the user to its corresponding hash stored in our (fake) user database instead of creating a new entry. To begin with, we attempt to find an entry in the user database using the username submitted by the user:

```javascript
// server.js

// ...

app.post('/signin', function(request, response) {
  // console.log(`/signin, POST, request.body: ${JSON.stringify(request.body)}`);

  let { username, password } = request.body;

  User.findOne({ username })
    .then((user) => {
      if (user) {

      }
      else {
        response.json({ error: 'Incorrect login credentials.' });
      }
    });
});

// ...
```

We are responding with `"Incorrect login credentials"` instead of `"User not found"`—using a general response that is the same for any incorrect information, be it password or username or something else, has the advantage of giving less information to a bad actor.

Once a user that matches the username provided is found, we should compare that the password provided with the hash stored in the database. We use `bcrypt`'s `compare` method to do this:

```javascript
// server.js

// ...

app.post('/signin', function(request, response) {
  // console.log(`/signin, POST, request.body: ${JSON.stringify(request.body)}`);

  let { username, password } = request.body;

  User.findOne({ username })
    .then((user) => {
      if (user) {
        let hash = user.password;

        bcrypt.compare(password, hash, (error, result) => {

        });
      }
      else {
        response.json({ error: 'Incorrect login credentials.' });
      }
    });
});

// ...
```

Finally, we redirect the user to `/dashboard` if the password provided is valid and respond with `"Incorrect login credentials."` otherwise:

```javascript
// server.js

// ...

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
});

// ...
```

It is worth noting that we won't have to touch `public/client.js` because we have already set it up such that it will handle both the `/signin` and `/signup` routes. Test the sign in functionality we have just implemented by creating a new account (sign up), going back to the home page, then sign in.

## Step 8: Implementing Sign Out

In this step we will:

* Implement the ability to sign out

In this walkthrough we are only signing a user out upon request from the user, so let's code this according to the flow of the process by starting with `public/client.js`:

```javascript
// ...

function initDashboard() {
  let usernameInput = document.getElementById('input-username'),
      newPasswordInput = document.getElementById('input-newpassword'),
      confirmNewPasswordInput = document.getElementById('input-confirmnewpassword'),
      emailInput = document.getElementById('input-email'),
      mobileInput = document.getElementById('input-mobile'),
      signOutButton = document.getElementById('button-signout');

  fetch('/api/user')
    .then((response) => response.json())
    .then((data) => {
      let { username, email, mobile } = data;

      usernameInput.value = username;
      emailInput.value = email;
      mobileInput.value = mobile;
    });

  signOutButton.addEventListener('click', handleSignOutButtonClick);
}

// ...

function handleSignOutButtonClick(event) {
    event.preventDefault();

}

// ...
```

The event handler `handleSignOutButtonClick` needs to send a `GET` request to the server's `/signout`:

```javascript
// ...

function handleSignOutButtonClick(event) {
    event.preventDefault();

    fetch('/signout')
      .then((response) => {
        // console.log(response);
      });
}

// ...
```

And once a response is received the user is redirected back to the home page:

```javascript
// ...

function handleSignOutButtonClick(event) {
    event.preventDefault();

    fetch('/signout')
      .then((response) => {
        // console.log(response);

        window.location.assign(response.url);
      });
}

// ...
```

The `/signup` route hasn't been implemented yet, we start off with:

```javascript
// server.js

// ...

app.get('/signout', checkAuth, function(request, response) {
  response.status(501).send('(◕︿◕✿)');
});

// ...
```

And we need to do two things here:

1. End the session—`express-session` provides us with a `destroy` method that for
2. Response with a redirect so that the user will be redirected back to the home page

As such:

```javascript
// server.js

// ...

app.get('/signout', checkAuth, function(request, response) {
  request.session.destroy((error) => {
    if (!error) {
      response.redirect('/');
    }
  });
});

// ...
```

And... that's it! For those who are curious of what exactly is happening, try doing the following with and without `destroy`ing the session:

1. Sign up with a new account
2. Click on sign out (you should now be redirected back to the home page)
3. Visit the dashboard by appending `/dashboard` to the URL







===
