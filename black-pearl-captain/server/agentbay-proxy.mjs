// AgentBay API 代理服务器
// 实现阿里云 POP V1 签名，供前端调用

import http from 'http';
import https from 'https';
import crypto from 'crypto';
import url from 'url';
import fs from 'fs';
import path from 'path';

// 加载 .env 文件
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    });
  }
}
loadEnv();

// 配置
const PORT = 3001;
const ENDPOINT = 'wuyingai.cn-shanghai.aliyuncs.com';
const API_VERSION = '2026-03-11';
const REGION_ID = 'cn-shanghai';

// 从环境变量获取 AK/SK
const AK = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
const SK = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

if (!AK || !SK) {
  console.error('错误: 请设置环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET');
  process.exit(1);
}

console.log(`[AgentBay Proxy] AK: ${AK.substring(0, 8)}...`);

/**
 * RFC 3986 URL 编码
 */
function pctEncode(s) {
  return encodeURIComponent(s)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * 获取 UTC 时间戳
 */
function getUTCTime() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * 计算阿里云 POP V1 签名
 */
function signV1(params, secretKey) {
  // 1. 参数排序 + URL 编码
  const sortedKeys = Object.keys(params).sort();
  const pairs = sortedKeys
    .filter(k => k !== 'Signature')
    .map(k => `${pctEncode(k)}=${pctEncode(String(params[k]))}`);
  const canonicalQueryString = pairs.join('&');

  // 2. 构造待签名字符串
  const stringToSign = `POST&${pctEncode('/')}&${pctEncode(canonicalQueryString)}`;

  // 3. HMAC-SHA1 签名
  const key = secretKey + '&';
  const signature = crypto
    .createHmac('sha1', key)
    .update(stringToSign)
    .digest('base64');

  return signature;
}

/**
 * 调用 GetChatToken
 */
async function getChatToken(externalUserId) {
  const params = {
    Format: 'JSON',
    Version: API_VERSION,
    AccessKeyId: AK,
    SignatureMethod: 'HMAC-SHA1',
    Timestamp: getUTCTime(),
    SignatureVersion: '1.0',
    SignatureNonce: crypto.randomUUID(),
    Action: 'GetChatToken',
    RegionId: REGION_ID,
    ExternalUserId: externalUserId,
  };

  // 计算签名
  params.Signature = signV1(params, SK);

  // 构建 URL
  const queryString = Object.entries(params)
    .map(([k, v]) => `${pctEncode(k)}=${pctEncode(String(v))}`)
    .join('&');

  const requestUrl = `https://${ENDPOINT}/?${queryString}`;

  return new Promise((resolve, reject) => {
    const req = https.request(requestUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (!result.Success && result.Code !== '200') {
            reject(new Error(`GetChatToken failed: ${result.Message || result.Code}`));
          } else {
            resolve(result.AccessToken);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 代理 Chat SSE 请求
 */
function proxyChat(req, res, jwt, body) {
  const { ExternalUserId, SessionId, Input } = body;

  const authParam = encodeURIComponent(`Bearer ${jwt}`);
  const requestUrl = `https://${ENDPOINT}/api/agent/chat?Authorization=${authParam}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'x-acs-version': API_VERSION,
    'x-acs-action': 'Chat',
    'x-acs-date': getUTCTime(),
  };

  const payload = JSON.stringify({
    ExternalUserId,
    SessionId,
    Input,
  });

  const proxyReq = https.request(requestUrl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Length': Buffer.byteLength(payload),
    },
  }, (proxyRes) => {
    console.log('[Proxy] Chat API 响应状态:', proxyRes.statusCode);
    console.log('[Proxy] Chat API 响应头:', JSON.stringify(proxyRes.headers));

    // 设置响应头
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // 手动转发数据，以便记录日志
    proxyRes.on('data', (chunk) => {
      const text = chunk.toString();
      console.log('[Proxy] SSE 数据:', text.substring(0, 200));
      res.write(chunk);
    });

    proxyRes.on('end', () => {
      console.log('[Proxy] SSE 流结束');
      res.end();
    });

    proxyRes.on('error', (err) => {
      console.error('[Proxy] 响应错误:', err);
      res.end();
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy] Chat error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  });

  proxyReq.write(payload);
  proxyReq.end();
}

// 创建 HTTP 服务器
const server = http.createServer(async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // 路由: /api/token - 获取 ChatToken
  if (parsedUrl.pathname === '/api/token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { externalUserId } = JSON.parse(body);
        const token = await getChatToken(externalUserId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, token }));
      } catch (err) {
        console.error('[Proxy] GetChatToken error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 路由: /api/chat - 代理 Chat SSE
  if (parsedUrl.pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { externalUserId } = data;

        // 获取 Token
        const token = await getChatToken(externalUserId);

        // 代理 SSE 请求
        proxyChat(req, res, token, data);
      } catch (err) {
        console.error('[Proxy] Chat error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[AgentBay Proxy] Server running on http://localhost:${PORT}`);
  console.log(`[AgentBay Proxy] Endpoints:`);
  console.log(`  - POST http://localhost:${PORT}/api/token  (获取 ChatToken)`);
  console.log(`  - POST http://localhost:${PORT}/api/chat   (SSE 对话)`);
});
