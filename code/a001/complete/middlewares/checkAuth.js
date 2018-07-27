module.exports = function(request, response, next) {
  let { user } = request.session;

  if (user) {
    next();
  }
  else {
    response.redirect('/');
  }
}
