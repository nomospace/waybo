// server/routes/marks.js
const express = require('express');
const router = express.Router();
const { prepare, saveDb } = require('../db');
const requireAuth = require('../middleware/auth');

router.post('/favorite/:contentId', requireAuth, (req, res) => {
  const { contentId } = req.params;
  try {
    const existing = prepare(`SELECT id FROM user_marks WHERE content_id = ?`).get(contentId);
    if (existing) {
      prepare(`UPDATE user_marks SET is_favorite = 1 WHERE id = ?`).run(existing.id);
    } else {
      prepare(`INSERT INTO user_marks (content_id, is_favorite) VALUES (?, 1)`).run(contentId);
    }
    saveDb();
    res.json({ message: '已收藏' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.delete('/favorite/:contentId', requireAuth, (req, res) => {
  prepare(`UPDATE user_marks SET is_favorite = 0 WHERE content_id = ?`).run(req.params.contentId);
  saveDb();
  res.json({ message: '已取消收藏' });
});

router.post('/star/:contentId', requireAuth, (req, res) => {
  const { contentId } = req.params;
  try {
    const existing = prepare(`SELECT id FROM user_marks WHERE content_id = ?`).get(contentId);
    if (existing) {
      prepare(`UPDATE user_marks SET is_starred = 1 WHERE id = ?`).run(existing.id);
    } else {
      prepare(`INSERT INTO user_marks (content_id, is_starred) VALUES (?, 1)`).run(contentId);
    }
    saveDb();
    res.json({ message: '已标记' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.delete('/star/:contentId', requireAuth, (req, res) => {
  prepare(`UPDATE user_marks SET is_starred = 0 WHERE content_id = ?`).run(req.params.contentId);
  saveDb();
  res.json({ message: '已取消标记' });
});

router.patch('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { user_note } = req.body;
  prepare(`UPDATE user_marks SET user_note = ? WHERE id = ?`).run(user_note, id);
  saveDb();
  res.json({ message: '已更新' });
});

router.get('/favorites', requireAuth, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;
  const list = prepare(`SELECT d.*, w.posted_at, v.screen_name as vip_name, v.avatar_url as vip_avatar, m.user_note FROM user_marks m JOIN dehydrated_content d ON m.content_id = d.id JOIN weibo_posts w ON d.post_id = w.id JOIN vip_list v ON w.vip_id = v.id WHERE m.is_favorite = 1 ORDER BY m.created_at DESC LIMIT ? OFFSET ?`).all(Number(page_size), Number(offset));
  res.json({ list });
});

module.exports = router;