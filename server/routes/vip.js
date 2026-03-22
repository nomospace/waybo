// server/routes/vip.js
const express = require('express');
const router = express.Router();
const WeiboAPI = require('../services/weibo');
const { prepare } = require('../db');
const requireAuth = require('../middleware/auth');

router.get('/followings', requireAuth, async (req, res) => {
  try {
    const weibo = new WeiboAPI(req.session.accessToken);
    const allUsers = [];
    let page = 1;
    let total = 0;

    // 循环加载所有关注（每页50条，最多20页=1000条）
    while (page <= 20) {
      const data = await weibo.getFollowings(req.session.uid, page, 50);
      const users = data.users || [];
      if (users.length === 0) break;
      allUsers.push(...users);
      total = data.total_number || allUsers.length;
      if (allUsers.length >= total) break;
      page++;
    }

    res.json({ users: allUsers, total, page: 'all' });
  } catch (error) {
    console.error('获取关注列表失败:', error.response?.data || error.message);
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/list', requireAuth, (req, res) => {
  const rows = prepare(`SELECT * FROM vip_list ORDER BY created_at DESC`).all();
  res.json({ list: rows, total: rows.length });
});

router.post('/add', requireAuth, (req, res) => {
  const { weibo_uid, screen_name, avatar_url } = req.body;
  if (!weibo_uid) return res.status(400).json({ error: '缺少weibo_uid' });
  try {
    const result = prepare(`INSERT OR IGNORE INTO vip_list (weibo_uid, screen_name, avatar_url) VALUES (?, ?, ?)`).run(weibo_uid, screen_name, avatar_url);
    res.json({ id: result.lastInsertRowid, message: '添加成功' });
  } catch (error) {
    res.status(500).json({ error: '添加失败' });
  }
});

router.patch('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { is_tracking } = req.body;
  try {
    prepare(`UPDATE vip_list SET is_tracking = ? WHERE id = ?`).run(is_tracking ? 1 : 0, id);
    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  try {
    prepare(`DELETE FROM vip_list WHERE id = ?`).run(id);
    res.json({ message: '已移除' });
  } catch (error) {
    res.status(500).json({ error: '移除失败' });
  }
});

module.exports = router;