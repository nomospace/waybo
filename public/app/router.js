define(['app'], function(app) {
  console.log(app);

  Handlebars.registerHelper('dateFormat', function(date) {
    return date && moment(date).format('LLL');
  });
  Handlebars.registerHelper('textFormat', function(text) {
    return text;
  });

  var $main = $('#main');
  var statusTpl = $('#J_status').html(),
    statusContext = Handlebars.compile(statusTpl);
  var followTpl = $('#J_follow').html(),
    followContext = Handlebars.compile(followTpl);
  var fetch = function(url, options) {
    return $.get(api + url, options);
  };
  var api = '/api/';
  var Router = Backbone.Router.extend({
    routes: {
      '': 'index',
      'statuses/public_timeline': 'statuses/public_timeline',
      'statuses/home_timeline/:uid': 'statuses/home_timeline',
      'statuses/user_timeline/:uid': 'statuses/user_timeline',
      'statuses/show/:id': 'statuses/show',
      'friendships/friends/:uid': 'friendships/friends'
    },
    index: function() {
      fetch('index').done(function(result) {
        $main.html(result);
      });
    },
    'statuses/public_timeline': function() {
      fetch('statuses/public_timeline').done(function(result) {
        $main.html(statusContext(result.statuses));
      });
    },
    'statuses/home_timeline': function(uid) {
      fetch('statuses/home_timeline/' + uid).done(function(result) {
        $main.html(statusContext(result.statuses));
      });
    },
    'statuses/user_timeline': function(uid) {
      fetch('statuses/user_timeline/' + uid).done(function(result) {
        $main.html(statusContext(result.statuses));
      });
    },
    'statuses/show': function(id) {
      fetch('statuses/show/' + id).done(function(result) {
        $main.html(statusContext([result]));
      });
    },
    'friendships/friends': function(uid) {
      fetch('friendships/friends/' + uid).done(function(result) {
        $main.html(followContext(result));
      });
    }
  });
  return Router;
});
