// server/middleware/auth.js
module.exports = function requireAuth(req, res, next) {
  if (!req.session.uid || !req.session.accessToken) {
    return res.status(401).json({ error: '未登录' });
  }
  next();
};