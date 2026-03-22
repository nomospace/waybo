// server/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const vipRoutes = require('./vip');
const contentRoutes = require('./content');
const marksRoutes = require('./marks');

router.use('/auth', authRoutes);
router.use('/vip', vipRoutes);
router.use('/content', contentRoutes);
router.use('/marks', marksRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;