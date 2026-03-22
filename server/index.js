// server/index.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const config = require('./config');
const routes = require('./routes');
const { initDb } = require('./db');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 10
  }
}));

app.use(express.static(path.join(__dirname, '../client/dist')));
app.use('/api', routes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

async function start() {
  await initDb();
  app.listen(config.server.port, () => {
    console.log(`Waybo running on port ${config.server.port}`);
  });
}

start();