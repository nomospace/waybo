var site = require('./controllers/site');

var express = require('express');
var path = require('path');

module.exports = function(app) {

  var staticDir = path.join(__dirname, 'public');
  app.use(express.static(staticDir));

  // url routes
  app.get('/', site.index);
//  app.get('/signin', site.index);

  // ajax
  app.get('/ajax/index', site.index);

//  app.get('*', function(req, res) {
//    res.render('index.html', {});
//    // throw new NotFound;
//  });
};

function NotFound(msg) {
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

NotFound.prototype.__proto__ = Error.prototype;
