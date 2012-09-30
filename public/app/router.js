define(['app'], function(app) {
  console.log(app);

  Handlebars.registerHelper('dateFormat', function(date) {
    return date && moment(date).format('LLL');
  });
  Handlebars.registerHelper('textFormat', function(text) {
    return text;
  });

  var $main = $('#main');
//  var moreTpl = $('#J_more').html();
  var statusTpl = $('#J_status').html(),
    statusContext = Handlebars.compile(statusTpl);
  var followTpl = $('#J_follow').html(),
    followContext = Handlebars.compile(followTpl);

  var fetch = function(url, options) {
    return $.get(api + url, options);
  };

  var api = '/api/';

  var beforeRender = function(ctx, key, callback) {
    var $btn = $('#J_btn_more');
    $btn.off('click').on('click', function() {
      callback(ctx[key].page++);
    });
    ctx[key] = ctx[key] || {};
    ctx[key].page = 1;
    $btn.click();
  };

  var Router = Backbone.Router.extend({
    routes: {
      '': 'index',
      'statuses/public_timeline': 'statuses/public_timeline',
      'statuses/home_timeline/:uid': 'statuses/home_timeline',
      'statuses/user_timeline/:uid': 'statuses/user_timeline',
      'statuses/show/:id': 'statuses/show',
      'friendships/friends/:uid': 'friendships/friends',
      'friendships/followers/:uid': 'friendships/followers'
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
      // TODO backbone 自动回收容器资源
      $main.html('');
      var url = 'statuses/home_timeline/' + uid;
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $main.append(statusContext(result.statuses));
        });
      });
    },
    'statuses/user_timeline': function(uid) {
      $main.html('');
      var url = 'statuses/user_timeline/' + uid;
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $main.append(statusContext(result.statuses));
        });
      });
    },
    'statuses/show': function(id) {
      fetch('statuses/show/' + id).done(function(result) {
        $main.append(statusContext([result]));
      });
    },
    'friendships/friends': function(uid) {
      fetch('friendships/friends/' + uid).done(function(result) {
        $main.html(followContext(result));
      });
    },
    'friendships/followers': function(uid) {
      fetch('friendships/followers/' + uid).done(function(result) {
        $main.html(followContext(result));
      });
    }
  });

  return Router;
});
