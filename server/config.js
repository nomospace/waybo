// server/config.js
require('dotenv').config();

module.exports = {
  weibo: {
    appKey: process.env.WEIBO_APP_KEY,
    appSecret: process.env.WEIBO_APP_SECRET,
    redirectUri: process.env.WEIBO_REDIRECT_URI
  },
  session: {
    secret: process.env.SESSION_SECRET || 'waybo-secret'
  },
  server: {
    port: process.env.INTERNAL_PORT || 4005,
    externalPort: process.env.PORT || 3005
  },
  openclaw: {
    apiUrl: process.env.OPENCLAW_API_URL,
    apiKey: process.env.OPENCLAW_API_KEY
  }
};