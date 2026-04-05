#!/usr/bin/env node
/**
 * 从首页时间线拉取关注的微博数据
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const WeiboAPI = require('../server/services/weibo');
const { dehydrate } = require('../server/services/ai');
const { initDb, prepare, saveDb } = require('../server/db');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseWeiboDate(weiboDate) {
  if (!weiboDate) return null;
  try {
    const d = new Date(weiboDate);
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

async function fetchAndProcess() {
  await initDb();
  
  const vips = prepare(`SELECT * FROM vip_list WHERE is_tracking = 1`).all();
  if (vips.length === 0) {
    console.log('[Fetch] 没有跟踪的大V');
    return;
  }
  
  console.log(`[Fetch] 跟踪 ${vips.length} 个大V\n`);
  
  const weiboToken = process.env.WEIBO_ACCESS_TOKEN;
  if (!weiboToken) {
    console.error('[Fetch] 请设置 WEIBO_ACCESS_TOKEN 环境变量');
    return;
  }
  
  // 创建大V UID 集合
  const vipUids = new Set(vips.map(v => v.weibo_uid));
  const vipMap = {};
  for (const v of vips) vipMap[v.weibo_uid] = v;
  
  const weibo = new WeiboAPI(weiboToken);
  const today = new Date().toISOString().split('T')[0];
  
  let totalFetched = 0;
  const seenIds = new Set();
  
  try {
    console.log('[Fetch] 从首页时间线拉取...');
    
    // 拉取首页时间线
    const home = await weibo.client.get('statuses/home_timeline.json', {
      params: { access_token: weiboToken, count: 100 }
    });
    
    const statuses = home.data.statuses || [];
    console.log(`[Fetch] 获取到 ${statuses.length} 条微博`);
    
    for (const status of statuses) {
      const uid = status.user?.idstr || String(status.user?.id);
      
      // 只处理跟踪的大V
      if (!vipUids.has(uid)) continue;
      
      const statusId = status.idstr || String(status.id);
      if (seenIds.has(statusId)) continue;
      seenIds.add(statusId);
      
      const vip = vipMap[uid];
      
      // 检查是否已存在（按 weibo_id 或内容去重）
      const existing = prepare(`SELECT id FROM weibo_posts WHERE weibo_id = ? OR content = ?`).get(statusId, status.text);
      if (existing) continue;
      
      // 插入新微博
      const result = prepare(`INSERT INTO weibo_posts (weibo_id, vip_id, content, posted_at, reposts_count, comments_count, attitudes_count, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
        statusId, 
        vip.id, 
        status.text, 
        status.created_at, 
        status.reposts_count || 0, 
        status.comments_count || 0, 
        status.attitudes_count || 0
      );
      
      const postId = result.lastInsertRowid;
      totalFetched++;
      console.log(`\n[Fetch] 新微博 @${vip.screen_name}: ${status.text.substring(0, 50)}...`);
      
      // AI 脱水处理
      try {
        prepare(`UPDATE weibo_posts SET process_status = 'processing' WHERE id = ?`).run(postId);
        saveDb();
        
        const aiResult = await dehydrate(vip.screen_name, status.created_at, status.text);
        
        if (aiResult.invalid) {
          prepare(`UPDATE weibo_posts SET process_status = 'invalid' WHERE id = ?`).run(postId);
          saveDb();
          console.log('  ⚠️ 无效内容');
        } else {
          prepare(`INSERT INTO dehydrated_content (post_id, core_viewpoint, targets, logic, time_frame, risk_warning) VALUES (?, ?, ?, ?, ?, ?)`).run(
            postId, 
            aiResult.core_viewpoint, 
            JSON.stringify(aiResult.targets), 
            aiResult.logic, 
            aiResult.time_frame, 
            aiResult.risk_warning
          );
          prepare(`UPDATE weibo_posts SET process_status = 'done' WHERE id = ?`).run(postId);
          saveDb();
          console.log('  ✅ 脱水完成');
        }
        
        await sleep(2000 + Math.random() * 2000);
        
      } catch (e) {
        console.error(`  ❌ 脱水失败: ${e.message}`);
        prepare(`UPDATE weibo_posts SET process_status = 'failed' WHERE id = ?`).run(postId);
        saveDb();
      }
    }
    
  } catch (e) {
    console.error(`[Fetch] 拉取失败: ${e.message}`);
    if (e.response) {
      console.error('API 响应:', e.response.data);
    }
  }
  
  console.log(`\n[Fetch] 完成！共拉取 ${totalFetched} 条新微博`);
}

fetchAndProcess().catch(console.error);