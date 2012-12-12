var net = require('net'), ip;

function getNetworkIP(callback) {
  var socket = net.createConnection(80, 'www.google.com');
  socket.on('connect', function() {
    callback('', socket.address().address);
    socket.end();
  });
  socket.on('error', function(e) {
    callback(e, 'error');
  });
}

getNetworkIP(function(error, ipValue) {
  if (error) {
    console.log('error:', error);
  }
  ip = ipValue;
});

exports.getNetworkIP = function() {
  return ip;
}
