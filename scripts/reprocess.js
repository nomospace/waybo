#!/usr/bin/env node
/**
 * 重新处理 pending 状态的微博
 * 用法: node scripts/reprocess.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initDb, prepare, saveDb } = require('../server/db');
const { dehydrate } = require('../server/services/ai');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function reprocess() {
  // 先初始化数据库
  await initDb();
  
  console.log('[Reprocess] 开始处理 pending 状态的微博...\n');
  
  // 查找所有 pending 状态的微博
  const pendingPosts = prepare(`
    SELECT wp.id, wp.content, wp.posted_at, v.screen_name 
    FROM weibo_posts wp 
    JOIN vip_list v ON wp.vip_id = v.id 
    WHERE wp.process_status IN ('pending', 'failed')
  `).all();
  
  if (pendingPosts.length === 0) {
    console.log('[Reprocess] 没有待处理的微博');
    return;
  }
  
  console.log(`[Reprocess] 找到 ${pendingPosts.length} 条待处理微博\n`);
  
  let processed = 0;
  let failed = 0;
  
  for (const post of pendingPosts) {
    console.log(`[Reprocess] 处理: ${post.content.substring(0, 50)}...`);
    
    try {
      // 标记为处理中
      prepare(`UPDATE weibo_posts SET process_status = 'processing' WHERE id = ?`).run(post.id);
      saveDb();
      
      // 调用 AI 脱水
      const result = await dehydrate(post.screen_name, post.posted_at, post.content);
      
      if (result.invalid) {
        console.log(`[Reprocess] 无效内容，跳过`);
        prepare(`UPDATE weibo_posts SET process_status = 'invalid' WHERE id = ?`).run(post.id);
        saveDb();
        continue;
      }
      
      // 保存脱水结果
      const existing = prepare(`SELECT id FROM dehydrated_content WHERE post_id = ?`).get(post.id);
      if (existing) {
        prepare(`UPDATE dehydrated_content SET 
          core_viewpoint = ?, 
          targets = ?, 
          logic = ?, 
          time_frame = ?, 
          risk_warning = ? 
          WHERE post_id = ?`).run(
          result.core_viewpoint, 
          JSON.stringify(result.targets), 
          result.logic, 
          result.time_frame, 
          result.risk_warning, 
          post.id
        );
      } else {
        prepare(`INSERT INTO dehydrated_content (post_id, core_viewpoint, targets, logic, time_frame, risk_warning) 
          VALUES (?, ?, ?, ?, ?, ?)`).run(
          post.id, 
          result.core_viewpoint, 
          JSON.stringify(result.targets), 
          result.logic, 
          result.time_frame, 
          result.risk_warning
        );
      }
      
      // 标记为完成
      prepare(`UPDATE weibo_posts SET process_status = 'done' WHERE id = ?`).run(post.id);
      saveDb();
      
      processed++;
      console.log(`[Reprocess] ✅ 完成: ${result.core_viewpoint?.substring(0, 50)}...\n`);
      
      // 随机延迟，避免 API 限流
      await sleep(2000 + Math.random() * 3000);
      
    } catch (e) {
      failed++;
      console.error(`[Reprocess] ❌ 失败: ${e.message}\n`);
      prepare(`UPDATE weibo_posts SET process_status = 'failed' WHERE id = ?`).run(post.id);
      saveDb();
    }
  }
  
  console.log(`\n[Reprocess] 处理完成: 成功 ${processed} 条, 失败 ${failed} 条`);
}

reprocess().catch(console.error);