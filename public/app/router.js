define(["app"], function(app) {
  console.log(app);
  var Router = Backbone.Router.extend({
    routes: {
      "": "index",
      "statuses/public_timeline": "public_timeline"
    },

    index: function() {
      alert('index');
    },
    public_timeline: function() {
      alert('public_timeline');
    }
  });
  return Router;
});
