var express = require('express');
var path = require('path');
var Weibo = require('./libs/weibo-samxxu.js');

var app_key = '3873930736',
  app_secret = '358e312b72543e91404806e599cb6125',
  access_token = '2.003CmKvBo2cKOE6791b250a7FSHPGB'; // token 有效时间为 24 小时

var weibo = new Weibo(app_key, app_secret, access_token);

module.exports = function(app) {
  app.use(express.static(path.join(__dirname, 'public')));

  // url routes
  app.get('/api/index', function(req, res) {
    res.partial('../README.md');
  });

  app.get('/api/statuses/public_timeline', function(req, res) {
    weibo.GET('statuses/public_timeline', {}, function(err, data) {
      if (err) {
        console.log(err);
      }
      else {
        res.send(data);
      }
    });
  });

  app.get('/api/statuses/user_timeline/:uid', function(req, res) {
    var uid = req.params.uid;
    weibo.GET('statuses/user_timeline', {uid: uid}, function(err, data) {
      if (err) {
        console.log(err);
      }
      else {
        res.send(data);
      }
    });
  });

  app.get('/', function(req, res) {
    res.render('index.html', {page: 'index'});
  });

  app.get('*', function(req, res) {
    console.log('*');
    res.render('index.html');
  });
};
