var express = require('express');
var path = require('path');

module.exports = function(app) {
  app.use(express.static(path.join(__dirname, 'public')));

  // url routes
  app.get('/api/statuses/public_timeline', function(req, res) {
    res.send('hello');
  });

  // ajax
  //app.get('/ajax/index', site.index);

  app.get('*', function(req, res) {
    res.render('index.html');
  });
};
