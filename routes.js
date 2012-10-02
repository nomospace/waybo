var express = require('express');
var path = require('path');
var Weibo = require('./libs/weibo-samxxu.js');
var config = require('./config').config;
var appInstance;

var app_key = '934435042',
  app_secret = '223057e0575e38f202c54f673c032e31',
  access_token = '2.003CmKvBwOnOBBa5eae88cc40v2lSb'; // token 有效时间为 24 小时

var weibo = new Weibo(app_key, app_secret);
var redirect_uri = 'http://nomospace.github.com/';
var authorize_url = weibo.getAuthorizeUrl({
  redirect_uri: redirect_uri,
  response_type: 'code'
});

console.log(authorize_url);

module.exports = function(app) {
  appInstance = app;
  app.use(express.static(path.join(__dirname, 'public')));

  // url routes
  app.get('/api/index', function(req, res) {
    res.partial('../README.md');
  });

  app.get('/api/signin', function(req, res) {
    res.send(authorize_url);
  });

  app.get('/api/code/:code', function(req, res) {
    weibo.getAccessToken({
        code: req.params.code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri
      }, function(err, result, accessToken) {
        if (err) res.send(err);
        else {
          app.locals.accessToken = accessToken;
          console.log(accessToken);
          res.redirect('/statuses/public_timeline');
        }
      }
    );
  });

  app.get('/api/statuses/public_timeline', function(req, res) {
    weibo.GET('statuses/public_timeline', {count: 200}, callback.bind(null, res));
  });

  app.get('/api/statuses/home_timeline/:uid', function(req, res) {
    var uid = req.params.uid, page = req.query.page;
    weibo.GET('statuses/home_timeline', {uid: uid, page: page}, callback.bind(null, res));
  });

  app.get('/api/statuses/user_timeline/:uid', function(req, res) {
    var uid = req.params.uid, page = req.query.page;
    weibo.GET('statuses/user_timeline', {uid: uid, page: page}, callback.bind(null, res));
  });

  app.get('/api/statuses/show/:id', function(req, res) {
    var id = req.params.id;
    weibo.GET('statuses/show', {id: id}, callback.bind(null, res));
  });

  app.get('/api/friendships/friends/:uid', function(req, res) {
    var uid = req.params.uid, page = req.query.page;
    weibo.GET('friendships/friends', {uid: uid, page: page}, callback.bind(null, res));
  });

  app.get('/api/friendships/followers/:uid', function(req, res) {
    var uid = req.params.uid, page = req.query.page;
    weibo.GET('friendships/followers', {uid: uid, page: page}, callback.bind(null, res));
  });

  app.get('/', function(req, res) {
    res.render('index.html', {page: 'index'});
  });

  app.get('*', function(req, res) {
    console.log('*');
    res.render('index.html');
  });
};

function callback(res, err, data) {
  if (err) {
    console.log(err);
    appInstance.locals.error = err;
    res.send(err.data);
  }
  else {
    res.send(data);
  }
}
