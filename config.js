module.exports = {
  debug: true,
  name: 'waybo',
  description: 'A simple web-weibo base on nodejs.',
  version: 0.1,

  app_key: '934435042',
  app_secret: '223057e0575e38f202c54f673c032e31',
  redirect_uri: 'http://nomospace.github.com/weibo/',

  sessionSecret: 'waybo',
  authCookieName: 'waybo',
  host: '127.0.0.1',
  port: 3002
//  db: 'mongodb://127.0.0.1/nodeweibo'
};
