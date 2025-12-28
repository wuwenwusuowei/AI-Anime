# Minimax TTS 免费额度配置指南

## 🎯 当前配置优化

我已经对你的 Minimax TTS 配置进行了以下优化：

### 1. 降低成本参数
```env
# 使用更经济的 turbo 模型
MINIMAX_TTS_MODEL=speech-2.6-turbo

# 尝试不同的 API 端点
MINIMAX_TTS_URL=https://api.minimax.chat/v1/t2a_v2
```

### 2. 音频参数优化
- **采样率**: 从 32kHz 降至 16kHz（节省50%成本）
- **比特率**: 从 128kbps 降至 64kbps（节省50%成本）
- **格式**: 优先使用 MP3（比 WAV 更小）

## 🔧 解决余额不足问题的步骤

### 步骤 1: 检查账户状态
1. 访问 [Minimax 控制台](https://www.minimax.chat)
2. 登录你的账户
3. 查看 **账户余额** 和 **免费额度** 使用情况

### 步骤 2: 领取免费额度
新用户通常有以下免费额度：
- **注册赠送**: 一定量的免费额度
- **每日免费**: 部分模型有每日免费调用次数
- **试用额度**: 新模型的试用机会

### 步骤 3: 选择免费模型
根据搜索结果，以下模型更适合免费使用：

```env
# 推荐：使用免费或低成本模型
MINIMAX_TTS_MODEL=speech-01-turbo    # 最便宜
# MINIMAX_TTS_MODEL=speech-02-turbo   # 性价比高
# MINIMAX_TTS_MODEL=speech-2.6-turbo  # 当前使用
```

### 步骤 4: API 端点优化
当前已配置多个端点自动回退：
- 主端点: `https://api.minimax.chat/v1/t2a_v2`
- 北京备用: `https://api-bj.minimaxi.com/v1/t2a_v2`
- 原始端点: `https://api.minimaxi.com/v1/t2a_v2`

## 🎛️ 高级配置选项

### 选项 1: 使用更低的音频质量
如果仍然余额不足，可以进一步降低质量：

```javascript
audio_setting: {
    sample_rate: 8000,   // 进一步降低采样率
    bitrate: 32000,      // 进一步降低比特率
    format: "mp3",       // 使用最小格式
    channel: 1
}
```

### 选项 2: 限制文本长度
在 `server.js` 中添加文本长度限制：

```javascript
// 限制每次调用最大字符数（免费用户建议100字符以内）
if (text.length > 100) {
    text = text.substring(0, 100) + '...';
}
```

### 选项 3: 实现缓存机制
避免重复调用相同内容：

```javascript
// 简单的缓存机制
const ttsCache = new Map();
const cacheKey = `${text}-${voiceType}-${speed}`;

if (ttsCache.has(cacheKey)) {
    return ttsCache.get(cacheKey);
}
```

## 📊 免费额度管理建议

### 1. 每日使用计划
- **限制调用次数**: 每天最多调用 10-20 次
- **优先重要内容**: 先处理最重要的语音需求
- **使用短文本**: 每次调用控制在 50 字符以内

### 2. 监控使用情况
定期检查：
- 账户余额: `curl -H "Authorization: Bearer $MINIMAX_API_KEY" https://api.minimax.chat/v1/query/balance`
- 使用记录: Minimax 控制台的使用统计
- 错误日志: `logs/tts-errors.log`

### 3. 备用方案
当免费额度用完时：
- 使用离线 TTS（如 Web Speech API）
- 提前批量生成常用语音
- 使用其他免费 TTS 服务

## 🚀 测试当前配置

运行以下命令测试：
```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text":"测试","voiceType":"female-shaonv","language":"zh-CN","speed":1.0,"volume":80,"outputFormat":"mp3"}'
```

## 💡 故障排除

### 如果仍然显示 "insufficient balance":
1. **检查 API Key**: 确保 API Key 有效且有权限
2. **查看控制台**: 登录 Minimax 控制台查看具体余额
3. **联系客服**: 如果账户有余额但仍报错，联系 Minimax 客服

### 如果显示其他错误:
1. **检查网络**: 确保能访问 Minimax API
2. **查看日志**: 检查 `server.js` 的控制台输出
3. **更换端点**: 尝试不同的 API 端点

## 📞 获取帮助

- **官方文档**: https://www.minimax.chat/document/
- **客服支持**: 登录控制台后联系在线客服
- **开发者社区**: Minimax 开发者交流群

---

**提示**: 免费额度有限，建议主要用于测试和开发。生产环境建议充值以获得稳定服务。