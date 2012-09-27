var path = require('path');
var express = require('express');
var config = require('./config').config;
var routes = require('./routes');
var markdown = require('markdown-js');
var partials = require('express-partials');
var ejs = require('ejs');
var fs = require('fs');

var app = express();

app.configure('development', function() {
  var viewsRoot = path.join(__dirname, 'views');
  // View 默认的根目录为 viewsRoot 的值
  app.set('views', viewsRoot);
  // View 引擎默认处理 html 后缀
  app.set('views engine', 'html');
  //  启用 View 缓存（在开发阶段被关闭）
  app.set('view cache', false);
  app.engine('html', ejs.renderFile);

  app.engine('md', function(path, options, fn) {
    fs.readFile(path, 'utf8', function(err, str) {
      if (err) return fn(err);
      str = markdown.parse(str).toString();
      fn(null, str);
    });
  });

  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: config.sessionSecret
  }));
  app.use(partials());
});

// app.error(function(err, req, res) {
//   console.log(err);
// });

// set static, dynamic helpers
// 为 layout.html 绑定数据
app.locals({
  config: config,
  csrf: function(req, res) {
    // todo csrf -> undefined
    return req.session ? req.session._csrf : '';
  }
});

routes(app);

app.listen(config.port);

// 设置静态资源根目录
var staticDir = path.join(__dirname, 'public');
// app.configure('development', function() {
app.use(express.static(staticDir));
// 在 HTML 页面中显示程序传递和抛出的异常
app.use(express.errorHandler({
  dumpExceptions: true,
  showStack: true
}));
// });

console.log(config.host + ':' + config.port);
module.exports = app;
