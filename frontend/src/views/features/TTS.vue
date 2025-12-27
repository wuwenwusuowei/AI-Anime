<template>
  <div class="feature-container">
    <el-card class="tts-card">
      <template #header>
        <div class="card-header">
          <h2>
            <el-icon><Microphone /></el-icon>
            文字转语音
          </h2>
        </div>
      </template>

      <div class="tts-content">
        <!-- 文本输入区域 -->
        <div class="text-section">
          <h3>输入文本</h3>
          <el-input
            v-model="ttsForm.text"
            type="textarea"
            :rows="6"
            placeholder="请输入要转换为语音的文本内容..."
            maxlength="2000"
            show-word-limit
            class="text-input"
          />
          <div class="text-info">
            <span class="char-count">{{ ttsForm.text.length }}/2000</span>
            <span class="estimated-duration">
              预计时长: {{ estimatedDuration }}秒
            </span>
          </div>
        </div>

        <!-- 音色选择 -->
        <div class="voice-section">
          <h3>选择音色</h3>
          
          <!-- 音色推荐 -->
          <div class="voice-recommendations">
            <el-alert
              title="音色推荐"
              type="success"
              :closable="false"
              show-icon
            >
              <template #default>
                <div class="recommendation-list">
                  <div><strong>女声推荐</strong>：抒情女声 ✅ (标准中文女声，音色清晰)</div>
                  <div><strong>男声推荐</strong>：港式空少音 ✅ (音色标准，发音清晰)</div>
                </div>
              </template>
            </el-alert>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="声音类型">
                <el-select v-model="ttsForm.voiceType" placeholder="选择声音类型">
                  <el-option
                    v-for="voice in voiceTypes"
                    :key="voice.id"
                    :label="voice.name"
                    :value="voice.id"
                  >
                    <div class="voice-option">
                      <span>{{ voice.name }}</span>
                      <span class="voice-gender">{{ voice.gender }}</span>
                      <span v-if="voice.verified" class="voice-status verified">✅</span>
                      <span v-else class="voice-status unverified">⚠️</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="语言">
                <el-select v-model="ttsForm.language" placeholder="选择语言">
                  <el-option label="中文" value="zh-CN" />
                  <el-option label="英文" value="en-US" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 参数调节 -->
        <div class="params-section">
          <h3>参数调节</h3>
          
          <el-row :gutter="30">
            <el-col :span="12">
              <el-form-item label="语速" class="param-item">
                <div class="enhanced-slider-control">
                  <div class="slider-with-labels">
                    <span class="slider-label">慢</span>
                    <el-slider
                      v-model="ttsForm.speed"
                      :min="0.5"
                      :max="2.0"
                      :step="0.1"
                      :format-tooltip="formatSpeed"
                      class="speed-slider"
                      @change="onSpeedChange"
                    />
                    <span class="slider-label">快</span>
                  </div>
                  <div class="input-control">
                    <el-input-number
                      v-model="ttsForm.speed"
                      :min="0.5"
                      :max="2.0"
                      :step="0.1"
                      :precision="1"
                      controls-position="right"
                      class="speed-input"
                      @change="onSpeedChange"
                    />
                    <span class="unit-label">倍速</span>
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="音量" class="param-item">
                <div class="enhanced-slider-control">
                  <div class="slider-with-labels">
                    <span class="slider-label">静音</span>
                    <el-slider
                      v-model="ttsForm.volume"
                      :min="0"
                      :max="100"
                      :step="1"
                      :format-tooltip="formatVolume"
                      class="volume-slider"
                      @change="onVolumeChange"
                    />
                    <span class="slider-label">最大</span>
                  </div>
                  <div class="input-control">
                    <el-input-number
                      v-model="ttsForm.volume"
                      :min="0"
                      :max="100"
                      :step="1"
                      controls-position="right"
                      class="volume-input"
                      @change="onVolumeChange"
                    />
                    <span class="unit-label">%</span>
                  </div>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 输出格式 -->
        <div class="format-section">
          <h3>输出格式</h3>
          <el-radio-group v-model="ttsForm.outputFormat">
            <el-radio-button label="mp3">MP3</el-radio-button>
            <el-radio-button label="wav">WAV</el-radio-button>
            <el-radio-button label="ogg">OGG</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 操作按钮 -->
        <div class="actions-section">
          <el-button 
            type="primary" 
            size="large"
            :loading="generating"
            :disabled="!canGenerate"
            @click="generateTTS"
            class="generate-btn"
          >
            <el-icon><Microphone /></el-icon>
            {{ generating ? '生成中...' : '生成语音' }}
          </el-button>
          
          <el-button 
            v-if="audioUrl"
            @click="downloadAudio"
            size="large"
            class="download-btn"
          >
            <el-icon><Download /></el-icon>
            下载音频
          </el-button>

          <el-button 
            @click="previewAudio"
            v-if="audioUrl"
            size="large"
            class="preview-btn"
          >
            <el-icon><VideoPlay /></el-icon>
            预览
          </el-button>
        </div>

        <!-- 音频播放器 -->
        <div v-if="audioUrl" class="audio-player">
          <h3>生成的音频</h3>
          <audio 
            ref="audioPlayer"
            :src="audioUrl" 
            controls 
            class="audio-element"
            @loadedmetadata="onAudioLoaded"
          />
          <div class="audio-info">
            <span>时长: {{ audioDuration }}秒</span>
            <span>格式: {{ ttsForm.outputFormat.toUpperCase() }}</span>
            <span>大小: {{ audioSize }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone, Download, VideoPlay } from '@element-plus/icons-vue'

// 响应式数据
const generating = ref(false)
const audioUrl = ref('')
const audioPlayer = ref<HTMLAudioElement>()
const audioDuration = ref(0)
const audioSize = ref('')

// TTS表单数据
const ttsForm = reactive({
  text: '',
  voiceType: 'female-shaonv',
  language: 'zh-CN',
  speed: 1.0,
  volume: 80,
  outputFormat: 'mp3'
})

// 音色选项 (动态加载)
const voiceTypes = ref([
  // 默认音色，将在 onMounted 时动态加载
])

// 加载音色列表
const loadVoiceTypes = async () => {
  try {
    console.log('🔊 [音色加载] 正在获取可用音色列表...')
    const response = await fetch('/api/tts/voices')
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ [音色加载] 成功获取音色列表:', result)
      
      // 处理不同格式的音色数据
      let voices = []
      
      if (Array.isArray(result.voices)) {
        voices = result.voices
      } else if (typeof result.voices === 'object') {
        // 合并不同语言的音色
        Object.values(result.voices).forEach(languageVoices => {
          if (Array.isArray(languageVoices)) {
            voices.push(...languageVoices)
          }
        })
      }
      
      // 添加前缀映射的显示名称
      voiceTypes.value = voices.map(voice => ({
        id: voice.id,
        name: voice.name,
        gender: voice.gender || '未知',
        verified: voice.verified !== false, // 默认为已验证
        recommendation: voice.recommendation || ''
      }))
      
      console.log(`🎯 [音色加载] 共加载 ${voiceTypes.value.length} 个音色`)
      
      // 如果有音色，默认选择第一个女声
      if (voiceTypes.value.length > 0) {
        const femaleVoice = voiceTypes.value.find(v => v.gender === '女')
        ttsForm.voiceType = femaleVoice ? femaleVoice.id : voiceTypes.value[0].id
      }
      
    } else {
      console.warn('⚠️ [音色加载] 使用预定义音色列表')
      // 使用预定义的音色列表作为备用
      voiceTypes.value = [
        { id: 'moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85', name: '少女音', gender: '女' },
        { id: 'moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d', name: '温柔女声', gender: '女' },
        { id: 'Chinese (Mandarin)_Lyrical_Voice', name: '抒情女声', gender: '女' },
        { id: 'Chinese (Mandarin)_HK_Flight_Attendant', name: '港式空少音', gender: '男' },
        { id: 'male-qn-qingse', name: '青春男声', gender: '男' },
        { id: 'moss_audio_6dc281eb-713c-11f0-a447-9613c873494c', name: '成熟男声', gender: '男' },
        { id: 'English_radiant_girl', name: '英文女声', gender: '女' },
        { id: 'English_Persuasive_Man', name: '英文男声', gender: '男' }
      ]
    }
  } catch (error) {
    console.error('❌ [音色加载] 失败:', error)
    ElMessage.warning('音色列表加载失败，使用默认音色')
    
    // 硬编码的备用音色列表
    voiceTypes.value = [
      { id: 'moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85', name: '少女音', gender: '女' },
      { id: 'moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d', name: '温柔女声', gender: '女' },
      { id: 'Chinese (Mandarin)_Lyrical_Voice', name: '抒情女声', gender: '女' }
    ]
  }
}

// 计算属性
const canGenerate = computed(() => {
  return ttsForm.text.trim().length > 0 && !generating.value
})

const estimatedDuration = computed(() => {
  const textLength = ttsForm.text.trim().length
  const baseSpeed = textLength / 4 // 基础语速: 每秒4个字符
  return Math.ceil(baseSpeed / ttsForm.speed)
})

// 格式化工具函数
const formatSpeed = (value: number) => `${value}x 语速`
const formatVolume = (value: number) => `${value}% 音量`

// 参数变化处理函数
const onSpeedChange = (value: number) => {
  // 确保值在有效范围内
  if (value < 0.5) ttsForm.speed = 0.5
  else if (value > 2.0) ttsForm.speed = 2.0
  else ttsForm.speed = value
  
  console.log(`🎯 语速调整为: ${ttsForm.speed}x`)
}

const onVolumeChange = (value: number) => {
  // 确保值在有效范围内
  if (value < 0) ttsForm.volume = 0
  else if (value > 100) ttsForm.volume = 100
  else ttsForm.volume = value
  
  console.log(`🔊 音量调整为: ${ttsForm.volume}%`)
}

// 生成TTS
const generateTTS = async () => {
  if (!ttsForm.text.trim()) {
    ElMessage.warning('请输入要转换的文本')
    return
  }

  generating.value = true
  audioUrl.value = ''

  try {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ttsForm)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        audioUrl.value = result.audioUrl
        ElMessage.success('语音生成成功！')
      } else {
        // 检查是否是余额不足错误
        if (result.error && result.error.includes('insufficient balance')) {
          ElMessage({
            message: 'Minimax API余额不足，已切换到演示模式',
            type: 'warning',
            duration: 5000,
            showClose: true
          })
          
          // 模拟生成成功（用于演示界面功能）
          setTimeout(() => {
            // 创建一个简单的音频URL用于演示
            audioUrl.value = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH3/PaSwUOYLLjt6qNVGwlBlefw8uKVNCzNj2/LTcqUEGWXrzi0q6AWBQd0pWHf2IaVDnBh1ypXxsByGjx4r1VVKyNWz/UrqyJQxzYg9Bysk3LQo1YcA8MpDVuQScyrgYAQ3MeivLVK2C02Ldqu7WAbu8PWj7s1iBaOS8siPW5+CswR2o5qFeiwGjlq56vW1zJNzt6N3Y0ysx'
            audioDuration.value = estimatedDuration.value
            audioSize.value = Math.ceil(estimatedDuration.value * 32) + ' KB'
            ElMessage.success('演示音频生成成功（模拟数据）')
            generating.value = false
          }, 1500)
          return
        }
        ElMessage.error(result.error || '生成失败')
      }
    } else {
      throw new Error(`服务器错误 (${response.status})`)
    }
  } catch (error) {
    console.error('TTS生成失败:', error)
    ElMessage.error(`TTS生成失败: ${error.message}`)
  } finally {
    generating.value = false
  }
}

// 预览音频
const previewAudio = () => {
  if (audioPlayer.value) {
    audioPlayer.value.play()
  }
}

// 下载音频
const downloadAudio = () => {
  if (audioUrl.value) {
    const link = document.createElement('a')
    link.href = audioUrl.value
    link.download = `tts_${Date.now()}.${ttsForm.outputFormat}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 音频加载完成
const onAudioLoaded = () => {
  if (audioPlayer.value) {
    audioDuration.value = Math.round(audioPlayer.value.duration)
    // 估算文件大小
    const estimatedSize = Math.ceil(audioDuration.value * 32 * (ttsForm.outputFormat === 'wav' ? 4 : 1))
    audioSize.value = estimatedSize + ' KB'
  }
}

// 生命周期
onMounted(() => {
  // 加载音色列表
  loadVoiceTypes()
})
</script>

<style lang="scss" scoped>
.feature-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.tts-card {
  .card-header {
    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 20px;
      color: var(--text-primary);
    }
  }
}

.tts-content {
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.text-section {
  margin-bottom: 30px;
  
  .text-input {
    margin-bottom: 10px;
    
    :deep(.el-textarea__inner) {
      font-size: 14px;
      line-height: 1.6;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid var(--border-light);
    }
  }
  
  .text-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.voice-section {
  margin-bottom: 30px;
  
  .voice-recommendations {
    margin-bottom: 20px;
    
    .recommendation-list {
      div {
        margin-bottom: 8px;
        font-size: 14px;
        
        strong {
          color: var(--primary-color);
        }
      }
    }
  }
  
  .voice-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 8px;
    
    .voice-gender {
      color: var(--text-secondary);
      font-size: 12px;
      flex-shrink: 0;
    }
    
    .voice-status {
      font-size: 14px;
      flex-shrink: 0;
      
      &.verified {
        color: #67c23a; // 绿色
      }
      
      &.unverified {
        color: #e6a23c; // 橙色
        cursor: help;
      }
    }
  }
}

.params-section {
  margin-bottom: 30px;
  
  .param-item {
    margin-bottom: 25px;
    
    .el-form-item__label {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 15px;
    }
  }
  
  .slider-horizontal {
    display: flex;
    align-items: center;
    gap: 15px;
    
    .slider-label {
      font-size: 12px;
      color: var(--text-secondary);
      min-width: 30px;
      text-align: center;
    }
    
    .speed-slider,
    .volume-slider {
      flex: 1;
      margin: 0 15px;
      
      :deep(.el-slider__runway) {
        height: 6px;
        background-color: var(--border-light);
        border-radius: 3px;
      }
      
      :deep(.el-slider__bar) {
        height: 6px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 3px;
      }
      
      :deep(.el-slider__button) {
        width: 18px;
        height: 18px;
        border: 2px solid #667eea;
        background-color: #fff;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        transition: all 0.2s ease;
        
        &:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
        }
      }
      
      :deep(.el-slider__tooltip) {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }
    }
    
    .current-value {
      min-width: 60px;
      text-align: center;
      font-weight: 600;
      color: var(--primary-color);
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 14px;
      border: 1px solid rgba(102, 126, 234, 0.2);
    }
  }
  
  // 新增强滑块控制样式
  .enhanced-slider-control {
    .slider-with-labels {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
      
      .slider-label {
        font-size: 12px;
        color: var(--text-secondary);
        min-width: 30px;
        text-align: center;
      }
      
      .speed-slider,
      .volume-slider {
        flex: 1;
        margin: 0 10px;
        
        :deep(.el-slider__runway) {
          height: 6px;
          background-color: var(--border-light);
          border-radius: 3px;
        }
        
        :deep(.el-slider__bar) {
          height: 6px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
        }
        
        :deep(.el-slider__button) {
          width: 18px;
          height: 18px;
          border: 2px solid #667eea;
          background-color: #fff;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
          transition: all 0.2s ease;
          
          &:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
          }
        }
        
        :deep(.el-slider__tooltip) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
      }
    }
    
    .input-control {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
      
      .speed-input,
      .volume-input {
        width: 120px;
        
        :deep(.el-input__inner) {
          text-align: center;
          font-weight: 600;
          border-radius: 6px;
          border: 2px solid var(--border-light);
          transition: all 0.3s ease;
          
          &:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
          }
        }
        
        :deep(.el-input-number__decrease),
        :deep(.el-input-number__increase) {
          border-radius: 0 6px 6px 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border: 1px solid rgba(102, 126, 234, 0.2);
          
          &:hover {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
        }
      }
      
      .unit-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-color);
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid rgba(102, 126, 234, 0.2);
        min-width: 45px;
        text-align: center;
      }
    }
  }
}

.format-section {
  margin-bottom: 30px;
  
  :deep(.el-radio-button__inner) {
    border-radius: 6px;
    margin-right: 5px;
    
    &:hover {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
  }
  
  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
  }
}

.actions-section {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px 0;
  border-top: 1px solid var(--border-light);
  
  .generate-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    min-width: 120px;
    height: 45px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }
    
    &:disabled {
      background: var(--border-light);
      color: var(--text-secondary);
      box-shadow: none;
      transform: none;
    }
  }
  
  .download-btn,
  .preview-btn {
    height: 45px;
    min-width: 100px;
    border-radius: 8px;
    font-weight: 600;
    
    &:hover {
      transform: translateY(-2px);
    }
  }
}

.audio-player {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  
  .audio-element {
    width: 100%;
    height: 40px;
    margin-bottom: 15px;
    border-radius: 6px;
    
    &::-webkit-media-controls-panel {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }
  
  .audio-info {
    display: flex;
    gap: 20px;
    font-size: 14px;
    color: var(--text-secondary);
    
    span {
      background: white;
      padding: 4px 10px;
      border-radius: 15px;
      border: 1px solid var(--border-light);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .feature-container {
    padding: 10px;
  }
  
  .actions-section {
    flex-direction: column;
    
    .generate-btn,
    .download-btn,
    .preview-btn {
      width: 100%;
    }
  }
  
  .audio-info {
    flex-direction: column;
    gap: 10px;
    
    span {
      text-align: center;
    }
  }
  
  .slider-horizontal {
    flex-direction: column;
    gap: 10px;
    
    .slider-label {
      min-width: auto;
    }
    
    .speed-slider,
    .volume-slider {
      margin: 0;
      width: 100%;
    }
    
    .current-value {
      align-self: center;
    }
  }
  
  // 新增强控件的响应式样式
  .enhanced-slider-control {
    .slider-with-labels {
      flex-direction: column;
      gap: 15px;
      margin-bottom: 20px;
      
      .slider-label {
        min-width: auto;
        margin-bottom: 5px;
      }
      
      .speed-slider,
      .volume-slider {
        margin: 0;
        width: 100%;
      }
    }
    
    .input-control {
      flex-direction: column;
      gap: 10px;
      
      .speed-input,
      .volume-input {
        width: 100%;
        
        :deep(.el-input__inner) {
          font-size: 16px; // 防止iOS缩放
        }
      }
      
      .unit-label {
        align-self: center;
        margin-top: 5px;
      }
    }
  }
}
</style>