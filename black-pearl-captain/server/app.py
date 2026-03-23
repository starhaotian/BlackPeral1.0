#!/usr/bin/env python3
"""AgentBay 代理服务器 - 使用 POP V1 签名"""

import base64
import hashlib
import hmac
import json
import os
import urllib.parse
import uuid
from datetime import datetime, timezone
from pathlib import Path

import requests
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# 加载 .env 文件（从 server 目录的父目录）
env_path = Path(__file__).parent.parent / ".env"
print(f"[配置] 加载 .env: {env_path}")
load_dotenv(env_path)

app = Flask(__name__)
CORS(app)

# ============ 配置 ============
ENDPOINT = "https://wuyingai.cn-shanghai.aliyuncs.com"
API_VERSION = "2026-03-11"
REGION_ID = "cn-shanghai"

# 从环境变量获取 AK/SK
AK = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID", "").strip()
SK = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET", "").strip()


def _pct(s: str) -> str:
    """RFC 3986 URL 编码"""
    return urllib.parse.quote(str(s), safe="-_.~")


def _now_utc() -> str:
    """UTC 时间戳"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _sign_v1(params: dict, sk: str) -> str:
    """计算阿里云 POP V1 签名"""
    pairs = [
        f"{_pct(k)}={_pct(str(v))}"
        for k, v in sorted(params.items())
        if k != "Signature"
    ]
    canonical = "&".join(pairs)
    string_to_sign = f"POST&{_pct('/')}&{_pct(canonical)}"
    key = (sk + "&").encode("utf-8")
    signature = base64.b64encode(
        hmac.new(key, string_to_sign.encode("utf-8"), hashlib.sha1).digest()
    ).decode("ascii")
    return signature


def get_chat_token(external_user_id: str) -> str:
    """获取 ChatToken（使用 V1 签名）"""
    params = {
        "Format": "JSON",
        "Version": API_VERSION,
        "AccessKeyId": AK,
        "SignatureMethod": "HMAC-SHA1",
        "Timestamp": _now_utc(),
        "SignatureVersion": "1.0",
        "SignatureNonce": str(uuid.uuid4()),
        "Action": "GetChatToken",
        "RegionId": REGION_ID,
        "ExternalUserId": external_user_id,
    }
    params["Signature"] = _sign_v1(params, SK)
    
    url = f"{ENDPOINT}/?{urllib.parse.urlencode(params)}"
    print(f"[GetChatToken] 请求 URL: {url[:100]}...")
    
    resp = requests.post(url, headers={"Accept": "application/json"}, timeout=60)
    resp.raise_for_status()
    
    data = resp.json()
    print(f"[GetChatToken] 响应: {json.dumps(data, ensure_ascii=False)[:200]}")
    
    if not data.get("Success") and data.get("Code") not in ("200", "Success", None):
        raise RuntimeError(f"GetChatToken failed: {data}")
    
    token = data.get("AccessToken")
    if not token:
        raise RuntimeError(f"No AccessToken in response: {data}")
    
    return token


def chat_sse_generator(jwt: str, external_user_id: str, session_id: str, text: str):
    """Chat SSE 流式对话 - 生成器"""
    url = f"{ENDPOINT}/api/agent/chat?Authorization={urllib.parse.quote(f'Bearer {jwt}')}"
    
    payload = {
        "ExternalUserId": external_user_id,
        "SessionId": session_id,
        "Input": json.dumps(
            [{"Role": "user", "Content": [{"Type": "text", "Text": text}]}],
            ensure_ascii=False,
        ),
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "x-acs-version": API_VERSION,
        "x-acs-action": "Chat",
        "x-acs-date": _now_utc(),
    }
    
    print(f"[Chat] 请求 URL: {url[:80]}...")
    print(f"[Chat] Payload: {json.dumps(payload, ensure_ascii=False)}")
    
    resp = requests.post(url, json=payload, headers=headers, stream=True, timeout=300)
    resp.raise_for_status()
    
    print(f"[Chat] 响应状态: {resp.status_code}")
    
    # 直接转发 SSE 流
    for line in resp.iter_lines():
        if line:
            decoded = line.decode("utf-8")
            print(f"[Chat] SSE: {decoded[:100]}")
            # SSE 标准格式：每个事件以双换行结束
            yield decoded + "\n\n"


@app.route("/api/chat", methods=["POST", "OPTIONS"])
def api_chat():
    """Chat 接口 - 代理 SSE 流"""
    if request.method == "OPTIONS":
        return "", 200
    
    if not AK or not SK:
        return jsonify({"error": "AK/SK 未配置"}), 500
    
    try:
        data = request.get_json()
        external_user_id = data.get("ExternalUserId", "user-default")
        session_id = data.get("SessionId", f"session-{int(datetime.now().timestamp() * 1000)}")
        
        # 解析 Input
        input_str = data.get("Input", "[]")
        input_arr = json.loads(input_str)
        
        # 获取用户消息
        user_text = ""
        for msg in input_arr:
            if msg.get("Role") == "user":
                for content in msg.get("Content", []):
                    if content.get("Type") == "text":
                        user_text = content.get("Text", "")
                        break
        
        if not user_text:
            return jsonify({"error": "没有找到用户消息"}), 400
        
        print(f"[API] 收到请求: user={external_user_id}, session={session_id}, text={user_text}")
        
        # 获取 Token
        token = get_chat_token(external_user_id)
        print(f"[API] Token 获取成功")
        
        # 返回 SSE 流
        return Response(
            chat_sse_generator(token, external_user_id, session_id, user_text),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    except Exception as e:
        print(f"[API] 错误: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/token", methods=["POST", "OPTIONS"])
def api_token():
    """获取 Token 接口"""
    if request.method == "OPTIONS":
        return "", 200
    
    if not AK or not SK:
        return jsonify({"success": False, "error": "AK/SK 未配置"}), 500
    
    try:
        data = request.get_json()
        external_user_id = data.get("externalUserId", "user-default")
        
        token = get_chat_token(external_user_id)
        return jsonify({"success": True, "token": token})
    except Exception as e:
        print(f"[Token] 错误: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """健康检查"""
    return jsonify({
        "status": "ok",
        "ak_configured": bool(AK),
        "sk_configured": bool(SK),
    })


if __name__ == "__main__":
    print("=" * 50)
    print("AgentBay 代理服务器")
    print("=" * 50)
    
    if not AK or not SK:
        print("警告: 请在 .env 文件中配置 ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET")
    else:
        print(f"AK: {AK[:8]}...")
    
    print("启动服务器: http://localhost:3001")
    print("接口:")
    print("  - POST /api/token  (获取 ChatToken)")
    print("  - POST /api/chat   (SSE 对话)")
    print("  - GET  /health     (健康检查)")
    print("=" * 50)
    
    app.run(host="0.0.0.0", port=3001, debug=True, threaded=True)
