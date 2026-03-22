// server/services/weibo.js
const axios = require('axios');
const config = require('../config');

const WEIBO_API_BASE = 'https://api.weibo.com/2/';

class WeiboAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: WEIBO_API_BASE,
      timeout: 10000
    });
  }

  static getAuthorizeUrl() {
    const params = new URLSearchParams({
      client_id: config.weibo.appKey,
      redirect_uri: config.weibo.redirectUri,
      response_type: 'code'
    });
    return `https://api.weibo.com/oauth2/authorize?${params}`;
  }

  static async getAccessToken(code) {
    const response = await axios.post('https://api.weibo.com/oauth2/access_token', null, {
      params: {
        client_id: config.weibo.appKey,
        client_secret: config.weibo.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: config.weibo.redirectUri,
        code
      }
    });
    return response.data;
  }

  async getUserInfo(uid) {
    const response = await this.client.get('users/show.json', {
      params: { access_token: this.accessToken, uid }
    });
    return response.data;
  }

  async getFollowings(uid, page = 1, count = 50) {
    const response = await this.client.get('friendships/friends.json', {
      params: { access_token: this.accessToken, uid, page, count }
    });
    return response.data;
  }

  async getUserTimeline(uid, page = 1, count = 50) {
    const response = await this.client.get('statuses/user_timeline.json', {
      params: { access_token: this.accessToken, uid, page, count }
    });
    return response.data;
  }

  async getComments(id, count = 50) {
    const response = await this.client.get('comments/show.json', {
      params: { access_token: this.accessToken, id, count }
    });
    return response.data;
  }
}

module.exports = WeiboAPI;