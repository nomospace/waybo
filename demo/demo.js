var tapi = require('weibo');

// change appkey to yours
var appkey = '3873930736', secret = '358e312b72543e91404806e599cb6125';
var oauth_callback_url = 'localhost:3001' || 'oob';
tapi.init('tsina', appkey, secret, oauth_callback_url);

tapi.public_timeline({ user: { blogType: 'tsina'}, oauth_pin: '2.003CmKvBo2cKOE4e9008da09WZMYJD'}, function(err, statuses) {
  if (err) {
    console.error(err);
  } else {
    console.log(statuses);
  }
});
