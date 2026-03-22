# Waybo - 微博投资大V脱水投研工具

个人自用、非商用、非公开的投研辅助工具。

## 功能

- 微博OAuth2.0授权登录
- 大V跟踪管理（从关注列表添加）
- 内容拉取 + AI脱水处理
- 收藏/标记功能
- PC/移动端双端适配

## 技术栈

- 后端：Express 4.x + sql.js (SQLite)
- 前端：Vue 3 + Vite + Tailwind CSS

## 部署

```bash
# 安装依赖
npm install
cd client && npm install && npm run build && cd ..

# 启动服务
systemctl --user start waybo
```

## 访问

- 外部端口：3005
- 内部端口：4005

## 服务管理

```bash
systemctl --user status waybo
systemctl --user restart waybo
systemctl --user stop waybo
```

---

*重构时间：2026-03-22*