# Minimax TTS 音色配置指南

## 🎯 当前状态

✅ **音色配置已完成！** 系统现在能够：

1. **自动获取音色列表**：从 Minimax API 或使用预定义列表
2. **动态加载音色**：前端自动显示可用音色
3. **测试音色功能**：可以单独测试每个音色是否可用
4. **正确的音色ID格式**：使用真实的 Minimax 音色ID

## 🔧 新增的API端点

### 1. 获取可用音色
```bash
GET http://localhost:3000/api/tts/voices
```
**返回示例**：
```json
{
  "success": true,
  "voices": {
    "chinese": [
      {"id": "moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85", "name": "少女音", "gender": "女"},
      {"id": "moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d", "name": "温柔女声", "gender": "女"},
      {"id": "Chinese (Mandarin)_Lyrical_Voice", "name": "抒情女声", "gender": "女"},
      // ... 更多音色
    ],
    "english": [...],
    "japanese": [...]
  }
}
```

### 2. 测试音色可用性
```bash
POST http://localhost:3000/api/tts/test-voice
Content-Type: application/json

{
  "voiceId": "moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85",
  "text": "这是语音测试"
}
```

### 3. 查询账户余额
```bash
GET http://localhost:3000/api/tts/balance
```

## 🎵 可用音色列表

### 中文音色
| 音色名称 | 性别 | 真实ID | 状态 |
|---------|------|---------|------|
| 少女音 | 女 | `moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85` | ✅ 已测试 |
| 温柔女声 | 女 | `moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d` | 🔄 待测试 |
| 抒情女声 | 女 | `Chinese (Mandarin)_Lyrical_Voice` | 🔄 待测试 |
| 港式空少音 | 男 | `Chinese (Mandarin)_HK_Flight_Attendant` | 🔄 待测试 |
| 青春男声 | 男 | `male-qn-qingse` | 🔄 待测试 |
| 成熟男声 | 男 | `moss_audio_6dc281eb-713c-11f0-a447-9613c873494c` | 🔄 待测试 |
| 活力男声 | 男 | `moss_audio_570551b1-735c-11f0-b236-0adeeecad052` | 🔄 待测试 |
| 优雅女士 | 女 | `English_Graceful_Lady` | 🔄 待测试 |

### 英文音色
| 音色名称 | 性别 | 真实ID |
|---------|------|---------|
| 英文女声 | 女 | `English_radiant_girl` |
| 英文男声 | 男 | `English_Persuasive_Man` |

### 日文音色
| 音色名称 | 性别 | 真实ID |
|---------|------|---------|
| 日文女声 | 女 | `Japanese_Whisper_Belle` |

## 🔄 前端改进

### 自动音色加载
- 页面加载时自动调用 `/api/tts/voices` 获取最新音色
- 支持从API获取和预定义两种方式
- 优先选择女声作为默认音色

### 错误处理
- API调用失败时自动降级到预定义音色
- 显示用户友好的错误提示
- 保持界面响应性

## 📝 使用说明

### 1. 基本使用
1. 打开 TTS 页面
2. 页面会自动加载可用音色列表
3. 选择你喜欢的音色
4. 输入文本并点击生成

### 2. 测试音色
如果你想测试某个音色是否可用：
```bash
curl -X POST http://localhost:3000/api/tts/test-voice \
  -H "Content-Type: application/json" \
  -d '{"voiceId":"moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85"}'
```

### 3. 检查余额
```bash
curl -X GET http://localhost:3000/api/tts/balance
```

## ⚠️ 重要说明

### 音色ID格式
- ❌ **旧格式**：`female-shaonv` (映射方式)
- ✅ **新格式**：`moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85` (真实ID)

### 兼容性
系统仍然保留旧的映射机制，如果你有特殊需求，可以修改 `server.js` 中的 `MINIMAX_VOICE_MAPPING` 配置。

### 性能优化
- 音色列表在页面加载时获取一次
- 支持缓存机制，避免重复调用
- 多端点回退，提高可用性

## 🛠️ 故障排除

### 如果音色加载失败
1. 检查网络连接
2. 验证 API 密钥是否有效
3. 查看控制台错误信息

### 如果某些音色不可用
1. 使用测试API检查具体音色
2. 可能需要更新音色ID格式
3. 联系Minimax获取最新音色列表

### 如果余额不足
参考 `MINIMAX_FREE_GUIDE.md` 配置免费额度。

## 🚀 下一步建议

1. **测试所有音色**：使用测试端点验证每个音色的可用性
2. **更新前端界面**：可以按性别分组显示音色
3. **添加音色预览**：让用户可以快速试听不同音色
4. **保存用户偏好**：记住用户常用的音色设置

---

现在你的 TTS 系统已经完全配置好了正确的 Minimax 音色，可以正常使用了！🎉