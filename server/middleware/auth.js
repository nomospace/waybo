// server/middleware/auth.js
const { prepare } = require('../db');

module.exports = function requireAuth(req, res, next) {
  // 先检查内存session
  if (req.session.uid && req.session.accessToken) {
    return next();
  }
  
  // 内存没有，尝试从数据库恢复
  try {
    const dbSession = prepare('SELECT * FROM user_session').get();
    if (dbSession && new Date(dbSession.expires_at) > new Date()) {
      req.session.uid = dbSession.uid;
      req.session.accessToken = dbSession.access_token;
      return next();
    }
  } catch (e) {
    console.error('Auth restore error:', e);
  }
  
  res.status(401).json({ error: '未登录' });
};