# ExpressJS Session-based Authentication

## Introduction

This is a walkthrough that demonstrates how session-based authentication works on an NodeJS-ExpressJS server.

The motivation for writing this is because there is almost every article that you find out there (at the time of writing) is about PassportJS/Auth0/Firebase... etc., and the only article (that I managed to find) about implementing session-based authentication from scratch is effectively the usual copypasta-style tutorial.

As such, this walkthrough intends to be a slightly lower-level exploration that shows how various parts fit together where authentication is concerned. **The code is not meant to be production-ready** and, in addition, please take the information shown in this walkthrough with a grain of salt as I have not had any training in cybers security so.

If you spot any mistakes or anything that you think is a really bad idea—please kindly raise an issue to let me know (and it will be very much appreciated


## Table of Contents

* [Assumed Knowledge](#assumed-knowledge)
* [General Notes](#general-notes)
  * [Regarding `console` Methods](#regarding-console-methods)
* [Setup](#setup)
  * [Create Files and Directories](#create-files-and-directories)
  * [Edit `server.js`](#edit-serverjs)
  * [Edit `public/index.html`](#edit-publicindexhtml)
  * [Edit `public/style.css`](#edit-publicstylecss)
* [Step 1: Sending Login Credentials to the Server](#step-1-sending-login-credentials-to-the-server)
  
## Assumed Knowledge

* JavaScript (ES6)
* HTML5
* Web API
* Working knowledge of NPM, NodeJS and ExpressJS

Some things in this walkthrough may seem unnecessary to the more experienced
reader—those things (often in the form of code comments) are included in the
hope that the more naive readers can still benefit from this walkthrough.

## General Notes

### Regarding `console` Methods

Since this is a learning exercise, being able to visualise the flow of data and
data themelves, various `console` methods are used liberally.

However, the `console` methods (such as `console.log()`) are commented out to
emphasis the fact that they could leak impelementation detail in production code.
A linter would usually be used to catch these statements during development.

## Setup

### Create Files and Directories

```sh
# Create project directory
mkdir walkthrough

cd walkthrough
mkdir public

# Install dependencies
npm install express

# Create files
touch server.js

cd public
touch index.html
touch style.css
touch client.js
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

let listener = app.listen(3000, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
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
          <label>
            Username:
            <input type="text" placeholder="Username" />
          </label>
          <label>
            Password:
            <input type="password" placeholder=="•••••••••" />
          </label>
        </fieldset>
        
        <button id="button-signin" type="submit" class="button-signin">Sign in</button>
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
  margin: auto 1em;
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

.button-signin {
  margin: 1em 0em;
  font-size: 1em;
  line-height: 2em;
  border-radius: 4px;
}
```
## Step 1: Sending Login Credentials to the Server

The features we will be implementing:

* Write Client-side code so that login credentials can be sent to the server in JSON format
* Setup a `POST` route `/signin` on the server for accepting login credentials from the client

To avoid some of the complexities involved with the `multipart/form-data` content type,
login credential are sent in the JSON format in this case. It is worth noting that, for
security reasons, login credentials should be sent over SSL/TLS, or in other words,
under the HTTPS protocol.

An event listener should first be added to the sign-in button to capture the action:

```javascript
// public/client.js
const HOST = '';
let signInButton = document.getElementById('button-signin');

signInButton.addEventListener('click', handleSignInButtonClick);

function handleSignInButtonClick(event) {
  event.preventDefault();
}
```

The event handler `handleSignInButtonClick` is meant to retrieve the values of the
username and password form inputs and `POST` if off to `/signin`. It can be
implemented as follows:

```javascript
// ...

function handleSignInButtonClick(event) {
  event.preventDefault();
  
  let method = 'POST',
      headers = { 'Content-Type': 'application/json' },
      username = document.getElementById('input-username').value,
      password = document.getElementById('input-password').value,
      body = JSON.stringify({ username, password });
      
  fetch(`${HOST}/signin`, { method, headers, body })
    .then((response) => {
      // console.log(
      //   'OK: ', response.ok,
      //   '\nStatus: ', response.status,
      //   '\nStatus text: ', response.statusText
      // );
      
      return response.text();
    });
}
```

Since the '/signin' 'POST' route hasn't been set up on the server, submitting the
form will result in a `404` response (give it a go by uncommenting `console.log`!).

Once you are happy with the code above and the response returned by the server,
setup the `POST` route as follows:

```javascript
// server.js

// Routes

// ...

app.post('/signin', function(request, response) {
  // console.log(`/signin, POST, request.body: ${request.body}`);
  
  response.status(501).send('(◕︿◕✿)');
});
```

We are setting up the `/signin` route to return a `501 Not Implemented` reponse
since we are leaving its implementation for later. Posting login credentials
should now result in a `501` reponse instead of a `404` response.

If you are a step ahead and have already looked at `request.body` to find that it
is currently `undefined`. To have the JSON string sent from the client parsed to
`request.body`, we can use the `bodyParser` middleware:

```javascript
let express = require('express');
let bodyParser = require('body-parser');

let app = express();

// Middlewares
app.use(express.static('public'));
app.use(bodyParser.json());

// ...
```

If everything is implemented correctly, `request.body` should now be a JSON object
that mirrors what is sent from the client. Do keep in mind that logging sensitive
data to the console is a potential security risk!


