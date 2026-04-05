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
    const vipMap = {};
    for (const v of vips) vipMap[v.weibo_uid] = v;

    let fetched = 0;
    const seenIds = new Set();

    // 获取今天日期（用于筛选）
    const today = new Date().toISOString().split('T')[0];

    // 对每个大V单独拉取他们的微博时间线（参考雪球项目的做法）
    for (const vip of vips) {
      try {
        console.log(`[Waybo] 拉取 ${vip.screen_name}(${vip.weibo_uid}) 的微博...`);
        
        // 分页拉取，直到拉到昨天的数据
        let page = 1;
        let hasMore = true;
        let consecutiveOldPages = 0;
        
        while (hasMore && page <= 5) {  // 最多拉5页
          const data = await weibo.getUserTimeline(vip.weibo_uid, page, 50);
          const statuses = data.statuses || [];
          
          if (statuses.length === 0) {
            hasMore = false;
            break;
          }
          
          let pageHasToday = false;
          
          for (const status of statuses) {
            const statusId = status.idstr || status.id;
            
            // 去重
            if (seenIds.has(statusId)) continue;
            seenIds.add(statusId);
            
            // 检查日期
            const statusDate = parseWeiboDate(status.created_at);
            if (!statusDate) continue;
            
            if (statusDate === today) {
              pageHasToday = true;
            } else if (statusDate < today) {
              // 昨天或更早，继续处理但标记
              consecutiveOldPages++;
              continue;
            }
            
            // 检查是否已存在（按 weibo_id 或内容去重）
            const existing = prepare(`SELECT id, process_status FROM weibo_posts WHERE weibo_id = ? OR content = ?`).get(statusId, status.text);
            
            let postId;
            if (existing) {
              postId = existing.id;
              if (existing.process_status === 'done') continue;
            } else {
              // 新微博，插入
              const result = prepare(`INSERT INTO weibo_posts (weibo_id, vip_id, content, posted_at, reposts_count, comments_count, attitudes_count, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(statusId, vip.id, status.text, status.created_at, status.reposts_count || 0, status.comments_count || 0, status.attitudes_count || 0);
              postId = result.lastInsertRowid;
              fetched++;
              console.log(`[Waybo] 新微博: ${status.text.substring(0, 50)}...`);
            }

            // 处理脱水
            await processDehydration(postId, vip.screen_name, status.created_at, status.text);
            
            // 拉取评论并分析
            await fetchAndAnalyzeComments(postId, statusId, weibo, req.session.accessToken);
          }
          
          // 如果这一页有今天的数据，重置计数
          if (pageHasToday) {
            consecutiveOldPages = 0;
          }
          
          // 连续2页没有今天的数据，停止
          if (consecutiveOldPages >= 2) {
            console.log(`[Waybo] ${vip.screen_name} 连续 ${consecutiveOldPages} 页无今日数据，停止`);
            hasMore = false;
          }
          
          page++;
          
          // 随机延迟，避免被限流
          await sleep(500 + Math.random() * 1000);
        }
        
      } catch (e) {
        console.error(`[Waybo] 拉取 ${vip.screen_name} 失败:`, e.message);
      }
    }

    res.json({ fetched, message: fetched > 0 ? `拉取完成，新增 ${fetched} 条` : '没有新内容' });
  } catch (error) {
    console.error('拉取失败:', error);
    res.status(500).json({ error: '拉取失败' });
  }
});

// 重新处理 pending 状态的微博
router.post('/reprocess', requireAuth, async (req, res) => {
  try {
    // 查找所有 pending 状态的微博
    const pendingPosts = prepare(`
      SELECT wp.id, wp.content, wp.posted_at, v.screen_name 
      FROM weibo_posts wp 
      JOIN vip_list v ON wp.vip_id = v.id 
      WHERE wp.process_status IN ('pending', 'failed')
    `).all();
    
    if (pendingPosts.length === 0) {
      return res.json({ processed: 0, message: '没有待处理的微博' });
    }
    
    console.log(`[Waybo] 开始处理 ${pendingPosts.length} 条待处理微博...`);
    
    let processed = 0;
    for (const post of pendingPosts) {
      try {
        await processDehydration(post.id, post.screen_name, post.posted_at, post.content);
        processed++;
        console.log(`[Waybo] 处理完成: ${post.content.substring(0, 30)}...`);
        
        // 随机延迟，避免 API 限流
        await sleep(1000 + Math.random() * 2000);
      } catch (e) {
        console.error(`[Waybo] 处理失败:`, e.message);
      }
    }
    
    res.json({ processed, message: `处理完成 ${processed} 条` });
  } catch (error) {
    console.error('重新处理失败:', error);
    res.status(500).json({ error: '重新处理失败' });
  }
});

// 解析微博日期格式（如 "Sun Mar 22 10:26:16 +0800 2026"）
function parseWeiboDate(weiboDate) {
  if (!weiboDate) return null;
  try {
    const d = new Date(weiboDate);
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

  sql += ` ORDER BY w.fetched_at DESC LIMIT ? OFFSET ?`;
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
