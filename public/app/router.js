define(['app'], function(app) {
  console.log(app);
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
      alert('index');
    },
    'statuses/public_timeline': function() {
      fetch('statuses/public_timeline').done(function(result) {
        Handlebars.registerHelper('dateFormat', function(date) {
          return moment(date).format('LL');
        });
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
