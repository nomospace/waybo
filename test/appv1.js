var SinaWeibo = require('../libs/weibo-samxxu.js');

var app_key = '3873930736',
  app_secret = '358e312b72543e91404806e599cb6125',
  access_token = '2.003CmKvBo2cKOE4e9008da09WZMYJD',
  user_id = '1760951922';

var weibo = new SinaWeibo(app_key, app_secret, access_token);

//console.log(weibo);

weibo.GET('users/show', {uid: user_id}, function(err, json, res) {
  if (err) return callback(err);
  console.dir(json);
});
