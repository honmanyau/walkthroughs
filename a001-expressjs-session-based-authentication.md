# ExpressJS Session-based Authentication

## Introduction

This is a walkthrough that demonstrates how session-based authentication works on an NodeJS-ExpressJS server.

The motivation for writing this is because there is almost every article that you find out there (at the time of writing) is about PassportJS/Auth0/Firebase... etc., and the only article (that I managed to find) about implementing session-based authentication from scratch is effectively the usual copypasta-style tutorial.

As such, this walkthrough intends to be a slightly lower-level exploration that shows how various parts fit together where authentication is concerned. **The code is not meant to be production-ready** and, in addition, please take the information shown in this walkthrough with a grain of salt as I have not had any training in cybers security so.

If you spot any mistakes or anything that you think is a really bad idea—please kindly raise an issue to let me know (and it will be very much appreciated


## Table of Contents

* [Assumed Knowledge](#assumed-knowledge)
  
## Assumed Knowledge

* JavaScript (ES6)
* HTML5
* Web API
* Working knowledge of NPM, NodeJS and ExpressJS

Some things in this walkthrough may seem unnecessary to the more experienced reader—those things (often in the form of code comments) are included in the hope that the more naive readers can still benefit from this walkthrough.

## Setup

### Creating Files and Directories

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

### Editing `server.js`

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

### Editing `public/index.html`

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
            <input type="text" name="username" placeholder="Username" />
          </label>
          <label>
            Password:
            <input type="password" name="password" placeholder="password" />
          </label>
        </fieldset>
        
        <button type="submit" class="submit-button">Sign in</button>
      </form>
    </main>
  </body>
</html>
```

### Editing `public/style.css`

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

.submit-button {
  margin: 1em 0em;
  font-size: 1em;
  line-height: 2em;
  border-radius: 4px;
}
```

