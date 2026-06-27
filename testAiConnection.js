#!/usr/bin/env node
/**
 * AI API 连接测试脚本
 * 支持 OpenAI 官方和兼容端点
 */

import 'dotenv/config';

const API_KEY = process.env.AI_API_KEY;
const BASE_URL = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
const MODEL = process.env.AI_MODEL || 'gpt-4o';
const PROVIDER = process.env.AI_PROVIDER || 'openai';

console.log('🔍 检查AI配置...\n');
console.log('Provider:', PROVIDER);
console.log('Base URL:', BASE_URL);
console.log('Model:', MODEL);
console.log('API Key:', API_KEY ? `${API_KEY.slice(0, 15)}...${API_KEY.slice(-4)}` : '❌ 未配置');
console.log('');

if (!API_KEY) {
  console.error('❌ 错误: AI_API_KEY 未配置');
  console.log('\n请在 .env 文件中设置:');
  console.log('AI_API_KEY=your-api-key-here');
  process.exit(1);
}

console.log('📡 正在测试API连接...\n');

const testPrompt = '请用一句话介绍你自己';

async function testConnection() {
  try {
    const endpoint = `${BASE_URL}/chat/completions`;
    console.log('请求端点:', endpoint);
    console.log('');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: testPrompt }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      throw new Error(
        `API错误 (${response.status}): ${errorData.error?.message || errorData.message || errorText}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error('API响应格式异常: ' + JSON.stringify(data));
    }

    const reply = data.choices[0].message.content;

    console.log('✅ API连接测试成功！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('模型响应:', data.model);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(reply);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (data.usage) {
      console.log('用量统计:');
      console.log('  Prompt tokens:', data.usage.prompt_tokens);
      console.log('  Completion tokens:', data.usage.completion_tokens);
      console.log('  Total tokens:', data.usage.total_tokens);

      // 根据模型估算成本
      let cost = 0;
      if (MODEL.includes('gpt-4o-mini')) {
        cost = data.usage.total_tokens * 0.00000015;  // $0.15/1M
      } else if (MODEL.includes('gpt-4o')) {
        cost = data.usage.total_tokens * 0.0000025;   // $2.50/1M
      } else if (MODEL.includes('gpt-3.5-turbo')) {
        cost = data.usage.total_tokens * 0.0000005;   // $0.50/1M
      }

      if (cost > 0) {
        console.log('  估算成本: $' + cost.toFixed(6));
      }
    }

    console.log('\n🎉 配置正确，可以开始使用AI分析功能！');
    console.log('\n下一步: 在 .env 中设置 ENABLE_AI_ANALYSIS=true');

    return true;
  } catch (error) {
    console.error('❌ API连接失败\n');
    console.error('错误信息:', error.message);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('常见问题排查:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. 检查 AI_API_KEY 是否正确');
    console.log('2. 确认 AI_API_BASE_URL 是否正确（赛事方提供的端点）');
    console.log('3. 检查 AI_MODEL 是否被支持');
    console.log('4. 确认网络连接正常');
    console.log('5. 如果使用赛事方端点，确认访问权限');
    console.log('');
    console.log('示例配置（自定义端点）:');
    console.log('AI_API_BASE_URL=https://api.your-competition.com/v1');
    console.log('AI_API_KEY=your-competition-key');
    console.log('AI_MODEL=gpt-4o');

    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
