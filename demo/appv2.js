var W2 = require('./lib/weibo_v2.js');

var api = new W2.WeiboApi({
    app_key: '3873930736',
    app_secret: '358e312b72543e91404806e599cb6125',
    access_token: '2.003CmKvBo2cKOE4e9008da09WZMYJD',
    user_id: '1760951922',
    redirect_uri: 'http://www.google.com/'
  }
);

//console.log(api);

api.statuses.publicTimeline({}, function(results) {
  console.log(results);
});

//var auth_url = api.getAuthorizeUrl({});
//console.log(auth_url);

//api.accessToken({
//    code: '2.003CmKvBo2cKOE4e9008da09WZMYJD'
//  },
//  function(data) {
//    console.log(data);
//  }
//);
