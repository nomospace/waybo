var express = require('express');
var crypto = require('crypto');
var path = require('path');
var Weibo = require('./libs/weibo-samxxu');
var emotions = require('./libs/emotions');
var config = require('./config');
var appInstance;

var weibo = new Weibo(config.app_key, config.app_secret);
var redirect_uri = config.redirect_uri;
var authorize_url = weibo.getAuthorizeUrl({
  redirect_uri: redirect_uri,
  response_type: 'code'
});

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
          var uid = result.uid;
          app.locals({
            'accessToken': accessToken,
            'uid': uid
          });
          genSession({token: accessToken, uid: uid}, res);
          res.redirect('/statuses/public_timeline');
        }
      }
    );
  });

  app.get('/api/account/end_session', function(req, res) {
    weibo.GET('account/end_session', {},
      function(err, data) {
        if (!err) {
          app.locals({
            'accessToken': '',
            'uid': ''
          });
          req.session.destroy();
          res.clearCookie(config.auth_cookie_name, {path: '/'});
//          weibo = new Weibo(config.app_key, config.app_secret);
        }
        callback(res, err, data);
      });
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

  app.get('/api/statuses/repost_timeline/:id', function(req, res) {
    var id = req.params.id, count = req.query.count;
    weibo.GET('statuses/repost_timeline', {id: id, count: count}, callback.bind(null, res));
  });

  app.get('/api/statuses/update', function(req, res) {
    var status = req.query.status;
    weibo.POST('statuses/update', {status: status}, callback.bind(null, res));
  });

  app.get('/api/favorites/create', function(req, res) {
    var id = req.query.id;
    weibo.POST('favorites/create', {id: id}, callback.bind(null, res));
  });

  app.get('/api/favorites/destroy', function(req, res) {
    var id = req.query.id;
    weibo.POST('favorites/destroy', {id: id}, callback.bind(null, res));
  });

  app.get('/api/favorites/:id', function(req, res) {
    var id = req.params.id, page = req.query.page;
    weibo.GET('favorites', {id: id, page: page}, callback.bind(null, res));
  });

  app.get('/api/comments/by_me', function(req, res) {
    var page = req.query.page;
    weibo.GET('comments/by_me', {page: page}, callback.bind(null, res));
  });

  app.get('/api/comments/to_me', function(req, res) {
    var page = req.query.page;
    weibo.GET('comments/to_me', {page: page}, callback.bind(null, res));
  });

  app.get('/api/comments/create', function(req, res) {
    var comment = req.query.comment,
      id = req.query.id,
      comment_ori = req.query.comment_ori || 0;
    weibo.POST('comments/create', {comment: comment, id: id, comment_ori: comment_ori}, callback.bind(null, res));
  });

  app.get('/api/comments/mentions', function(req, res) {
    var page = req.query.page;
    weibo.GET('comments/mentions', {page: page}, callback.bind(null, res));
  });

  app.get('/api/statuses/mentions', function(req, res) {
    var page = req.query.page;
    weibo.GET('statuses/mentions', {page: page}, callback.bind(null, res));
  });

  app.get('/api/friendships/friends/:uid', function(req, res) {
    var uid = req.params.uid, page = req.query.page;
    weibo.GET('friendships/friends', {uid: uid, page: page}, callback.bind(null, res));
  });

  app.get('/api/friendships/followers/:uid', function(req, res) {
    var uid = req.params.uid, page = req.query.page;
    weibo.GET('friendships/followers', {uid: uid, page: page}, callback.bind(null, res));
  });

  app.get('/api/friendships/create', function(req, res) {
    var uid = req.query.uid;
    weibo.POST('friendships/create', {uid: uid}, callback.bind(null, res));
  });

  app.get('/api/friendships/destroy', function(req, res) {
    var uid = req.query.uid;
    weibo.POST('friendships/destroy', {uid: uid}, callback.bind(null, res));
  });

  app.get('/api/comments/show/:id', function(req, res) {
    var id = req.params.id, count = req.query.count;
    weibo.GET('comments/show', {id: id, count: count}, callback.bind(null, res));
  });

  app.get('/api/users/show/:uid', function(req, res) {
    var uid = req.params.uid;
    weibo.GET('users/show', {uid: uid}, callback.bind(null, res));
  });

  app.get('/api/emotions', function(req, res) {
    res.send(emotions);
  });

  app.get('/', function(req, res) {
    res.render('index.html', {page: 'index'});
  });

  app.get('*', function(req, res) {
    res.render('index.html');
  });
};

function callback(res, err, data) {
  if (err) {
    appInstance.locals.error = err;
    res.send(err.data);
  }
  else {
    res.send(data);
  }
}

function genSession(data, res) {
  var token = encrypt(data.accessToken + '\t' + data.uid, config.session_secret);
  // cookie 有效期 10 天
  res.cookie(config.auth_cookie_name, token, {
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 10
  });
}

function encrypt(str, secret) {
  var cipher = crypto.createCipher('aes192', secret);
  var enc = cipher.update(str, 'utf8', 'hex');
  enc += cipher.final('hex');
  return enc;
}
