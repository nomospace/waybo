// server/services/ai.js
const axios = require('axios');
const config = require('../config');

const SYSTEM_PROMPT = `你是一个专业克制、仅服务于个人非商用投研的新浪微博投资内容脱水助手。
所有处理仅用于用户个人跟踪自己关注的投资类大V观点，不对外输出、不提供投资建议、不预测市场涨跌、不添加任何主观解读。

核心规则：
1. 处理对象：用户提供的财经/投资/股市/基金类大V的公开内容
2. 处理要求：完全去除情绪化表达、广告、抽奖、段子、闲聊水文、无关生活内容
3. 输出要求：严格遵循固定结构输出，优先把最核心的观点放在最前
4. 异常处理：
   - 内容与投资完全无关：返回【无效内容】非投资相关内容，已跳过
   - 内容无有效投研信息：返回【无效内容】无有效投研信息，已跳过`;

function buildPrompt(screenName, postedAt, content, comments = '') {
  return `请对以下微博内容进行脱水处理，严格遵循系统规则，仅输出符合固定格式的内容。

【待处理内容】
【大V昵称】${screenName}
【发布时间】${postedAt}
【微博正文】${content}
${comments ? `【热门评论】${comments}` : ''}

【固定输出格式】
【大V昵称】
【发布时间】
【核心观点】
【涉及标的/板块】
【核心逻辑与依据】
【时间周期】
【风险提示】`;
}

function parseDehydratedContent(text) {
  if (text.includes('【无效内容】')) {
    return { invalid: true, reason: text };
  }

  const fields = {
    '大V昵称': 'screen_name',
    '发布时间': 'posted_at',
    '核心观点': 'core_viewpoint',
    '涉及标的/板块': 'targets',
    '核心逻辑与依据': 'logic',
    '时间周期': 'time_frame',
    '风险提示': 'risk_warning'
  };

  const result = { invalid: false };
  
  for (const [cnName, enName] of Object.entries(fields)) {
    const regex = new RegExp(`【${cnName}】([^【]*)`);
    const match = text.match(regex);
    if (match) {
      result[enName] = match[1].trim();
    }
  }

  if (result.targets) {
    result.targets = result.targets.split(/[,、，]/).map(s => s.trim()).filter(Boolean);
  }

  return result;
}

async function dehydrate(screenName, postedAt, content, comments = '') {
  try {
    const prompt = buildPrompt(screenName, postedAt, content, comments);
    
    const response = await axios.post(config.openclaw.apiUrl, {
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${config.openclaw.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const text = response.data.choices?.[0]?.message?.content || '';
    return parseDehydratedContent(text);
  } catch (error) {
    console.error('AI脱水失败:', error.message);
    throw error;
  }
}

module.exports = { dehydrate, parseDehydratedContent };