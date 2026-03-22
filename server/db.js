// server/db.js
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'waybo.db');

let db = null;

async function initDb() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_session (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE,
      access_token TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS vip_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weibo_uid TEXT UNIQUE,
      screen_name TEXT,
      avatar_url TEXT,
      is_tracking INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS weibo_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weibo_id TEXT UNIQUE,
      vip_id INTEGER,
      content TEXT,
      posted_at DATETIME,
      reposts_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      attitudes_count INTEGER DEFAULT 0,
      fetched_at DATETIME,
      process_status TEXT DEFAULT 'pending',
      FOREIGN KEY (vip_id) REFERENCES vip_list(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dehydrated_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER UNIQUE,
      core_viewpoint TEXT,
      targets TEXT,
      logic TEXT,
      time_frame TEXT,
      risk_warning TEXT,
      comment_sentiment TEXT,
      comment_summary TEXT,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES weibo_posts(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER,
      is_favorite INTEGER DEFAULT 0,
      is_starred INTEGER DEFAULT 0,
      user_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_id) REFERENCES dehydrated_content(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS weibo_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      content TEXT,
      author_name TEXT,
      likes_count INTEGER DEFAULT 0,
      created_at DATETIME,
      FOREIGN KEY (post_id) REFERENCES weibo_posts(id)
    )
  `);

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// 兼容better-sqlite3 API
function prepare(sql) {
  return {
    run(...params) {
      db.run(sql, params);
      saveDb();
      return { lastInsertRowid: db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] };
    },
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  };
}

module.exports = { initDb, saveDb, prepare, getDb: () => db };