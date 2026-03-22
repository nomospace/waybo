// server/routes/content.js
const express = require('express');
const router = express.Router();
const WeiboAPI = require('../services/weibo');
const { dehydrate, analyzeComments } = require('../services/ai');
const { prepare, saveDb } = require('../db');
const requireAuth = require('../middleware/auth');

router.post('/fetch', requireAuth, async (req, res) => {
  try {
    const vips = prepare(`SELECT * FROM vip_list WHERE is_tracking = 1`).all();
    if (vips.length === 0) return res.json({ fetched: 0, message: '没有跟踪的大V' });

    const weibo = new WeiboAPI(req.session.accessToken);
    const vipUids = new Set(vips.map(v => v.weibo_uid));
    const vipMap = {};
    for (const v of vips) vipMap[v.weibo_uid] = v;

    let fetched = 0;

    // 从首页timeline获取，筛选跟踪的大V
    try {
      const home = await weibo.client.get('statuses/home_timeline.json', {
        params: { access_token: req.session.accessToken, count: 100 }
      });
      const statuses = home.data.statuses || [];

      for (const status of statuses) {
        const uid = status.user?.idstr;
        if (!vipUids.has(uid)) continue; // 只处理跟踪的大V

        // 检查是否已存在（比对weibo_id）
        const existing = prepare(`SELECT id, process_status FROM weibo_posts WHERE weibo_id = ?`).get(status.id);
        
        let postId;
        if (existing) {
          postId = existing.id;
          // 已存在且已处理完成，跳过
          if (existing.process_status === 'done') continue;
        } else {
          // 新微博，插入
          const result = prepare(`INSERT INTO weibo_posts (weibo_id, vip_id, content, posted_at, reposts_count, comments_count, attitudes_count, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(status.id, vipMap[uid].id, status.text, status.created_at, status.reposts_count || 0, status.comments_count || 0, status.attitudes_count || 0);
          postId = result.lastInsertRowid;
          fetched++;
        }

        // 处理脱水（如果是新的或未完成的）
        await processDehydration(postId, vipMap[uid].screen_name, status.created_at, status.text);
        
        // 拉取评论并分析
        await fetchAndAnalyzeComments(postId, status.id, weibo, req.session.accessToken);
      }
    } catch (e) {
      console.error('拉取首页timeline失败:', e.message);
    }

    res.json({ fetched, message: fetched > 0 ? '拉取完成' : '没有新内容' });
  } catch (error) {
    console.error('拉取失败:', error);
    res.status(500).json({ error: '拉取失败' });
  }
});

async function processDehydration(postId, screenName, postedAt, content) {
  try {
    prepare(`UPDATE weibo_posts SET process_status = 'processing' WHERE id = ?`).run(postId);
    saveDb();
    const result = await dehydrate(screenName, postedAt, content);
    if (result.invalid) {
      prepare(`UPDATE weibo_posts SET process_status = 'invalid' WHERE id = ?`).run(postId);
      saveDb();
      return;
    }
    
    // 检查是否已有脱水内容
    const existing = prepare(`SELECT id FROM dehydrated_content WHERE post_id = ?`).get(postId);
    if (existing) {
      prepare(`UPDATE dehydrated_content SET core_viewpoint = ?, targets = ?, logic = ?, time_frame = ?, risk_warning = ? WHERE post_id = ?`).run(result.core_viewpoint, JSON.stringify(result.targets), result.logic, result.time_frame, result.risk_warning, postId);
    } else {
      prepare(`INSERT INTO dehydrated_content (post_id, core_viewpoint, targets, logic, time_frame, risk_warning) VALUES (?, ?, ?, ?, ?, ?)`).run(postId, result.core_viewpoint, JSON.stringify(result.targets), result.logic, result.time_frame, result.risk_warning);
    }
    
    prepare(`UPDATE weibo_posts SET process_status = 'done' WHERE id = ?`).run(postId);
    saveDb();
  } catch (error) {
    prepare(`UPDATE weibo_posts SET process_status = 'failed' WHERE id = ?`).run(postId);
    saveDb();
    console.error('脱水处理失败:', error.message);
  }
}

async function fetchAndAnalyzeComments(postId, weiboId, weibo, accessToken) {
  try {
    // 拉取评论
    const comments = await weibo.getComments(weiboId, 50);
    if (!comments || comments.length === 0) return;

    // 保存评论原文
    for (const c of comments) {
      const existing = prepare(`SELECT id FROM weibo_comments WHERE post_id = ? AND content = ?`).get(postId, c.text);
      if (!existing) {
        prepare(`INSERT INTO weibo_comments (post_id, content, author_name, likes_count, created_at) VALUES (?, ?, ?, ?, ?)`).run(postId, c.text, c.user?.screen_name || '', c.like_count || 0, c.created_at);
      }
    }
    saveDb();

    // AI分析评论
    const commentTexts = comments.slice(0, 20).map(c => c.text).join('\n---\n');
    const analysis = await analyzeComments(commentTexts);
    
    if (analysis && !analysis.invalid) {
      // 更新脱水内容的评论分析
      prepare(`UPDATE dehydrated_content SET comment_sentiment = ?, comment_summary = ? WHERE post_id = ?`).run(
        analysis.sentiment,
        analysis.summary,
        postId
      );
      saveDb();
    }
  } catch (e) {
    console.error('评论分析失败:', e.message);
  }
}

router.post('/fetch-comments/:postId', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = prepare(`SELECT * FROM weibo_posts WHERE id = ?`).get(postId);
    if (!post) return res.status(404).json({ error: '微博不存在' });

    const weibo = new WeiboAPI(req.session.accessToken);
    const data = await weibo.getComments(post.weibo_id, 50);
    const comments = data.comments || [];

    for (const c of comments) {
      prepare(`INSERT OR IGNORE INTO weibo_comments (post_id, content, author_name, likes_count, created_at) VALUES (?, ?, ?, ?, ?)`).run(postId, c.text, c.user?.screen_name || '', c.like_count || 0, c.created_at);
    }
    saveDb();
    res.json({ fetched: comments.length });
  } catch (error) {
    res.status(500).json({ error: '拉取评论失败' });
  }
});

router.get('/list', requireAuth, (req, res) => {
  const { vip_id, keyword, date, page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;

  let sql = `SELECT d.id, d.post_id, d.core_viewpoint, d.targets, d.logic, d.time_frame, d.risk_warning, d.comment_sentiment, d.comment_summary, w.content as original_content, w.posted_at, v.screen_name as vip_name, v.avatar_url as vip_avatar FROM dehydrated_content d JOIN weibo_posts w ON d.post_id = w.id JOIN vip_list v ON w.vip_id = v.id WHERE 1=1`;
  const params = [];

  if (vip_id) { sql += ` AND w.vip_id = ?`; params.push(vip_id); }
  if (keyword) { sql += ` AND (d.core_viewpoint LIKE ? OR d.targets LIKE ?)`; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (date) { sql += ` AND date(w.posted_at) = date(?)`; params.push(date); }

  sql += ` ORDER BY w.posted_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(page_size), Number(offset));

  const list = prepare(sql).all(...params);
  const { total } = prepare(`SELECT COUNT(*) as total FROM dehydrated_content d JOIN weibo_posts w ON d.post_id = w.id WHERE 1=1${date ? ' AND date(w.posted_at) = date(?)' : ''}${vip_id ? ' AND w.vip_id = ?' : ''}`).get(...(date ? [date] : []).concat(vip_id ? [vip_id] : [])) || { total: 0 };

  res.json({ list, total, page: Number(page), page_size: Number(page_size) });
});

// 每日摘要 - 必须在 /:id 之前
router.get('/summary', requireAuth, (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // 获取所有脱水内容，然后按日期筛选
  const contents = prepare(`
    SELECT d.*, w.posted_at, v.id as vip_id, v.screen_name as vip_nickname, v.avatar_url as vip_avatar
    FROM dehydrated_content d
    JOIN weibo_posts w ON d.post_id = w.id
    JOIN vip_list v ON w.vip_id = v.id
    ORDER BY w.posted_at DESC
  `).all();
  
  // 按日期筛选（微博日期格式：Sun Mar 22 10:26:16 +0800 2026）
  const filteredContents = contents.filter(c => {
    if (!c.posted_at) return false;
    const d = new Date(c.posted_at);
    const contentDate = d.toISOString().split('T')[0];
    return contentDate === targetDate;
  });
  
  // 按大V分组
  const vipMap = {};
  filteredContents.forEach(c => {
    if (!vipMap[c.vip_id]) {
      vipMap[c.vip_id] = {
        vip_id: c.vip_id,
        vip_nickname: c.vip_nickname,
        vip_avatar: c.vip_avatar,
        post_count: 0,
        emotion_change: '中性',
        attitude_distribution: { '看多': 0, '看空': 0, '中性': 0 },
        emotion_trajectory: [],
        key_findings: [],
        related_stocks: [],
        core_insight: ''
      };
    }
    
    const vip = vipMap[c.vip_id];
    vip.post_count++;
    
    // 根据评论情绪或默认判断态度
    const sentiment = c.comment_sentiment || '中性';
    vip.attitude_distribution[sentiment] = (vip.attitude_distribution[sentiment] || 0) + 1;
    
    // 情绪轨迹
    if (c.core_viewpoint) {
      vip.emotion_trajectory.push({
        time: formatTime(c.posted_at),
        content: c.core_viewpoint.substring(0, 50),
        attitude: sentiment,
        viewpoint: c.core_viewpoint.substring(0, 80)
      });
    }
    
    // 关键发现
    if (c.logic) {
      vip.key_findings.push(c.logic.substring(0, 100));
    }
    
    // 相关标的
    if (c.targets) {
      try {
        const targets = JSON.parse(c.targets);
        targets.forEach(t => {
          if (t && !vip.related_stocks.find(s => s.name === t)) {
            vip.related_stocks.push({ name: t, sentiment: sentiment });
          }
        });
      } catch {}
    }
    
    // 核心观点（取最新的）
    if (!vip.core_insight && c.core_viewpoint) {
      vip.core_insight = c.core_viewpoint;
    }
  });
  
  // 计算每个大V的整体情绪
  Object.values(vipMap).forEach(vip => {
    const total = vip.attitude_distribution['看多'] + vip.attitude_distribution['看空'] + vip.attitude_distribution['中性'];
    if (total > 0) {
      if (vip.attitude_distribution['看多'] > vip.attitude_distribution['看空']) {
        vip.emotion_change = '看多';
      } else if (vip.attitude_distribution['看空'] > vip.attitude_distribution['看多']) {
        vip.emotion_change = '看空';
      }
    }
    
    // 限制数量
    vip.emotion_trajectory = vip.emotion_trajectory.slice(0, 3);
    vip.key_findings = vip.key_findings.slice(0, 2);
    vip.related_stocks = vip.related_stocks.slice(0, 5);
  });
  
  const summaries = Object.values(vipMap);
  
  // 计算总数
  const totalPosts = filteredContents.length;
  const totalVips = summaries.length;
  
  res.json({
    date: targetDate,
    collect_time: new Date().toISOString(),
    total_posts: totalPosts,
    total_vips: totalVips,
    summaries
  });
});

router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const item = prepare(`SELECT d.*, w.content as original_content, w.weibo_id, w.posted_at, v.screen_name as vip_name, v.avatar_url as vip_avatar FROM dehydrated_content d JOIN weibo_posts w ON d.post_id = w.id JOIN vip_list v ON w.vip_id = v.id WHERE d.id = ?`).get(id);
  if (!item) return res.status(404).json({ error: '内容不存在' });
  const comments = prepare(`SELECT * FROM weibo_comments WHERE post_id = ? ORDER BY likes_count DESC`).all(item.post_id);
  res.json({ ...item, comments });
});

function formatTime(time) {
  if (!time) return '';
  const d = new Date(time);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

module.exports = router;
