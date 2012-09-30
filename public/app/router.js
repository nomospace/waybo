define(['app'], function(app) {
  console.log(app);

  Handlebars.registerHelper('dateFormat', function(date) {
    return date && moment(date).format('LLL');
  });
  Handlebars.registerHelper('textFormat', function(text) {
    return text;
  });

  var $main = $('#main');
  var weiboTpl = $('#J_weibo').html(),
    context = Handlebars.compile(weiboTpl);
  var fetch = function(url, options) {
    return $.get(api + url, options);
  };
  var api = '/api/';
  var Router = Backbone.Router.extend({
    routes: {
      '': 'index',
      'statuses/public_timeline': 'statuses/public_timeline',
      'statuses/user_timeline/:uid': 'statuses/user_timeline'
    },
    index: function() {
      fetch('index').done(function(result) {
        $main.html(result);
      });
    },
    'statuses/public_timeline': function() {
      fetch('statuses/public_timeline').done(function(result) {
        $main.html(context(result.statuses));
      });
    },
    'statuses/user_timeline': function(uid) {
      fetch('statuses/user_timeline/' + uid).done(function(result) {
        $main.html(context(result.statuses));
      });
    }
  });
  return Router;
});
