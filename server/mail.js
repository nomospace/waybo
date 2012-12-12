var fs = require('fs');
var $ = require('jquery');
var mailer = require('nodemailer');
var Handlebars = require('handlebars');
var helper = require('./helper');
var address, content, statusContext, favoritesContext;

exports.setMail = function(options) {
  address = options.address;
  content = options.content;
//  console.log(content);
  fs.readFile('./views/index.html', 'utf8', function(err, data) {
    if (err) throw err;
    $('body').append(data);
    statusContext = Handlebars.compile($('#J_status').html());
    favoritesContext = Handlebars.compile($('#J_favorites').html());
    send();
  });
};

function generateHtml() {
  // TODO bad smell
  return  statusContext(content[2].statusesByUser) + favoritesContext(content[3].favorites);
}

function send() {
  var transport = mailer.createTransport("SMTP", {
    // service: "Gmail",
    host: 'smtp.163.com',
    // hostname
    port: 25,
    // port for secure SMTP
    auth: {
      user: 'qatest2@163.com',
      pass: 'qa1234'
    }
  });

  var message = {
    // sender info
    from: 'qatest2 <qatest2@163.com>',
    // Comma separated list of recipients
    to: '"jinlu" <jinlu_hz@163.com>',
    // Subject of the message
    subject: '您感兴趣的言论',
    headers: {
      'X-Laziness-level': 1000
    },
    // plaintext body
    text: '您感兴趣的言论',
    // HTML body
    html: generateHtml()
  };

  console.log('Sending Mail');

  transport.sendMail(message, function(error) {
    if (error) {
      console.log('Error occured');
      console.log(error.message);
      return;
    }
    console.log('Message sent successfully!');
    transport.close(); // close the connection pool
  });
}
