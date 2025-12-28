# Minimax TTS 配置指南（基于官方API文档）

## 🔑 API信息配置位置

### 1. 环境变量配置 (.env文件)
打开项目根目录下的 `.env` 文件，找到以下配置项：

```env
# Minimax TTS Configuration
# 🔑 请在这里填写你的Minimax API密钥
MINIMAX_API_KEY=your_minimax_api_key_here
# 🌐 Minimax TTS API地址（官方备用地址）
MINIMAX_TTS_URL=https://api-bj.minimaxi.com/v1/t2a_v2
# 🎯 TTS模型名称（支持多种模型）
MINIMAX_TTS_MODEL=speech-2.6-hd
```

**你需要填写的位置：**
1. `MINIMAX_API_KEY` - 替换 `your_minimax_api_key_here` 为你的真实API密钥
2. `MINIMAX_TTS_URL` - 使用官方推荐的备用地址
3. `MINIMAX_TTS_MODEL` - 选择合适的模型

**支持的模型：**
- `speech-2.6-hd` - 高清版本（推荐）
- `speech-2.6-turbo` - 快速版本
- `speech-02-hd` - 高清版本
- `speech-02-turbo` - 快速版本
- `speech-01-hd` - 高清版本
- `speech-01-turbo` - 快速版本

### 2. 音色映射配置 (server.js文件)
在 `server.js` 文件中找到音色映射配置：

```javascript
const MINIMAX_VOICE_MAPPING = {
    // 中文音色（根据官方文档）
    'female-shaonv': 'moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85',
    'female-qianxi': 'moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d',
    'female-chengshu': 'Chinese (Mandarin)_Lyrical_Voice',
    'male-qingnian': 'Chinese (Mandarin)_HK_Flight_Attendant',
    'male-wennuan': 'male-qn-qingse',
    'male-laoren': 'moss_audio_6dc281eb-713c-11f0-a447-9613c873494c',
    'child-tong': 'moss_audio_570551b1-735c-11f0-b236-0adeeecad052',
    'female-yujie': 'English_Graceful_Lady',
    
    // 英文音色
    'english-female': 'English_radiant_girl',
    'english-male': 'English_Persuasive_Man',
    
    // 日文音色
    'japanese-female': 'Japanese_Whisper_Belle'
};
```

**配置说明：**
- 左边的值是前端使用的ID
- 右边的值是Minimax API实际支持的音色ID
- 可以使用[查询可用音色API](https://platform.minimaxi.com/docs)获取完整列表

## 🚀 启动步骤

1. **填写API信息**
   - 在 `.env` 文件中填写你的Minimax API密钥
   - 在 `server.js` 中配置正确的音色映射

2. **重启服务**
   ```bash
   # 停止当前运行的服务（如果有）
   # 然后重新启动
   node server.js
   ```

3. **测试功能**
   - 访问前端页面
   - 进入TTS功能模块
   - 输入文本并选择音色进行测试

## 🎯 官方音色ID参考

根据Minimax官方API文档，系统音色包括：

**中文音色：**
- `moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85` - 少女音
- `moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d` - 温柔女声
- `Chinese (Mandarin)_Lyrical_Voice` - 抒情女声
- `Chinese (Mandarin)_HK_Flight_Attendant` - 港式空少音
- `male-qn-qingse` - 青春男声（文档示例）

**英文音色：**
- `English_Graceful_Lady` - 优雅女士
- `English_Insightful_Speaker` - 洞察力演讲者
- `English_radiant_girl` - 灿烂女孩
- `English_Persuasive_Man` - 有说服力的男士

**日文音色：**
- `Japanese_Whisper_Belle` - 日文低语美女

## 🔧 API参数说明

**语速设置：**
- 范围：[0.5, 2.0]
- 1.0 = 正常语速
- >1.0 = 更快语速
- <1.0 = 更慢语速

**音量设置：**
- 范围：(0, 10.0]
- 系统会自动将前端百分比转换为小数值
- 80% → 0.8

**音频格式：**
- 支持：mp3, wav, flac
- 采样率：8000, 16000, 22050, 24000, 32000, 44100
- 比特率：32000, 64000, 128000, 256000

**情绪设置：**
- happy - 高兴
- sad - 悲伤
- angry - 愤怒
- fearful - 害怕
- disgusted - 厌恶
- surprised - 惊讶
- calm - 中性
- fluent - 生动（仅turbo模型）
- whisper - 低语（仅turbo模型）

## ⚠️ 注意事项

1. **API密钥安全**：不要将 `.env` 文件提交到版本控制系统
2. **音色兼容性**：确保使用的音色ID在你的API套餐中可用
3. **费用控制**：TTS调用会产生费用，请注意使用量
4. **错误处理**：系统会在API调用失败时显示具体错误信息

## 🔧 调试模式

如果遇到问题，可以查看服务器控制台输出：
- `[Minimax TTS]` 相关日志显示API调用状态
- `[音频下载]` 相关日志显示文件下载状态
- 错误信息会显示具体的失败原因

## 📞 获取帮助

1. **获取API密钥**：
   - 访问 [Minimax控制台](https://platform.minimaxi.com/user-center/basic-information/interface-key)
   - 在"账户管理 > 接口密钥"中查看和创建API密钥

2. **查看完整文档**：
   - [Minimax API文档](https://platform.minimaxi.com/docs)
   - [查询可用音色API](https://platform.minimaxi.com/docs/api-reference/voice-management-get)
   - [系统音色列表](https://platform.minimaxi.com/docs/faq/system-voice-id)

3. **测试API**：
   - 可以使用Postman等工具先测试API连通性
   - API端点：`https://api-bj.minimaxi.com/v1/t2a_v2`
   - 认证方式：`Bearer <你的API密钥>`

## 💡 使用建议

1. **模型选择**：
   - 高质量需求 → `speech-2.6-hd`
   - 快速响应 → `speech-2.6-turbo`
   - 成本优化 → `speech-01-turbo`

2. **音色测试**：
   - 建议先测试不同音色效果
   - 中文文本建议使用中文音色
   - 英文文本使用英文音色效果更佳

3. **参数调优**：
   - 语速建议在0.8-1.2之间
   - 音量建议使用默认值
   - 情绪参数让模型自动判断即可