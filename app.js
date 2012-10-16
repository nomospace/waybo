var path = require('path');
var express = require('express');
var http = require('http');
var sio = require('socket.io');
var config = require('./config');
var routes = require('./routes');
var partials = require('express-partials');
var ejs = require('ejs');
var markdown = require('markdown-js');
var fs = require('fs');

var appRoot = './';
var app = express();

var socketServer = http.createServer(app);
socketServer.listen(config.socketPort);
var io = sio.listen(socketServer, {log: false});

app.configure('development', function() {
  app.use(partials());
//  app.use(express.logger({format: ':method :url :status'}));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(appRoot, 'public')));
  app.use(express.cookieParser());
  app.use(express.session({secret: config.session_secret}));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true}));
  app.set('views', path.join(appRoot, 'views'));
  app.set('views engine', 'html');
  app.set('view cache', false);
  app.engine('html', ejs.renderFile);
  app.engine('md', function(path, options, fn) {
    fs.readFile(path, 'utf8', function(err, str) {
      if (err) return fn(err);
      str = markdown.parse(str).toString();
      fn(null, str);
    });
  });
  app.locals({config: config});
});

routes(app, io);
app.listen(config.port);
//process.on('uncaughtException', function(err) {
//  console.log(err);
//});
console.log(config.host + ':' + config.port);
