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
