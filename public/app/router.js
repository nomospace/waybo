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
  var commentTpl = $('#J_comment').html(),
    commentContext = Handlebars.compile(commentTpl);
  var followTpl = $('#J_follow').html(),
    followContext = Handlebars.compile(followTpl);
  var $btnMore = $('#J_btn_more');

  var fetch = function(url, options) {
    return $.get(api + url, options);
  };

  var api = '/api/';

  var beforeRender = function(ctx, key, callback) {
    $btnMore.off('click').on('click', function() {
      callback(ctx[key].page++);
    });
    ctx[key] = ctx[key] || {};
    ctx[key].page = 1;
    $btnMore.click();
  };

  var Router = Backbone.Router.extend({
    routes: {
      '': 'index',
      'signin': 'signin',
      'statuses/public_timeline': 'statuses/public_timeline',
      'statuses/home_timeline/:uid': 'statuses/home_timeline',
      'statuses/user_timeline/:uid': 'statuses/user_timeline',
      'statuses/show/:id': 'statuses/show',
      'comments/by_me': 'comments/by_me',
      'statuses/mentions': 'statuses/mentions',
      'friendships/friends/:uid': 'friendships/friends',
      'friendships/followers/:uid': 'friendships/followers'
    },
    index: function() {
      fetch('index').done(function(result) {
        $main.html(result);
      });
    },
    signin: function() {
      fetch('signin').done(function(result) {
        location.href = result;
      });
    },
    'statuses/public_timeline': function() {
      fetch('statuses/public_timeline').done(function(result) {
        if (!result.error) $btnMore.show();
        $main.html(statusContext(result));
      });
    },
    'statuses/home_timeline': function(uid) {
      // TODO backbone 自动回收容器资源
      $main.html('');
      var url = 'statuses/home_timeline/' + uid;
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $main.append(statusContext(result));
        });
      });
    },
    'statuses/user_timeline': function(uid) {
      $main.html('');
      var url = 'statuses/user_timeline/' + uid;
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $main.append(statusContext(result));
        });
      });
    },
    'statuses/show': function(id) {
      fetch('statuses/show/' + id).done(function(result) {
        $main.html(statusContext([result]));
      });
    },
    'comments/by_me': function() {
      $main.html('');
      var url = 'comments/by_me';
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $main.html(commentContext(result));
        });
      });
    },
    'statuses/mentions': function() {
      $main.html('');
      var url = 'statuses/mentions';
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $main.html(statusContext(result));
        });
      });
    },
    'friendships/friends': function(uid) {
      $main.html('');
      var url = 'friendships/friends/' + uid;
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $main.append(followContext(result));
        });
      });
    },
    'friendships/followers': function(uid) {
      $main.html('');
      var url = 'friendships/followers/' + uid;
      beforeRender(this, url, function(page) {
        fetch(url, {page: page}).done(function(result) {
          $main.append(followContext(result));
        });
      });
    }
  });

  return Router;
});
