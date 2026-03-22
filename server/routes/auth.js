// server/routes/auth.js
const express = require('express');
const router = express.Router();
const WeiboAPI = require('../services/weibo');
const { prepare } = require('../db');

router.get('/signin', (req, res) => {
  const url = WeiboAPI.getAuthorizeUrl();
  res.json({ url });
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: '缺少code参数' });

    const tokenData = await WeiboAPI.getAccessToken(code);
    const { access_token, uid, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    prepare(`INSERT OR REPLACE INTO user_session (uid, access_token, expires_at) VALUES (?, ?, ?)`).run(uid, access_token, expiresAt);

    req.session.uid = uid;
    req.session.accessToken = access_token;
    res.redirect('/');
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: '授权失败' });
  }
});

router.get('/status', (req, res) => {
  if (req.session.uid && req.session.accessToken) {
    res.json({ logged_in: true, uid: req.session.uid });
  } else {
    res.json({ logged_in: false });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: '已退出' });
});

module.exports = router;