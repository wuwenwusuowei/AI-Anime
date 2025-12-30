<template>
  <div class="pop-layout">
    <!-- 顶部标题 -->
    <div class="page-header">
      <div class="title-badge purple">
        <el-icon><Microphone /></el-icon>
        <span>配音工作室</span>
      </div>
      <h1 class="main-title">文字转语音 <span>TTS Maker</span></h1>
      <p class="subtitle">输入文字，让 AI 赋予它有趣的灵魂</p>
    </div>

    <div class="workspace">
      <!-- 左侧：脚本输入区 -->
      <div class="bento-card input-zone">
        <div class="card-label yellow">
          <el-icon><EditPen /></el-icon> 脚本台词
        </div>
        <div class="textarea-wrapper">
          <el-input
            v-model="ttsForm.text"
            type="textarea"
            :rows="12"
            placeholder="在此输入台词... (例如：今天天气真不错，要不要一起去喝杯奶茶？)"
            maxlength="2000"
            show-word-limit
            resize="none"
          />
        </div>
        <div class="input-footer">
           <span class="tag">📝 字数: {{ ttsForm.text.length }}/2000</span>
           <span class="tag">⏱️ 预计: {{ estimatedDuration }}秒</span>
        </div>
      </div>

      <!-- 右侧：调音台 -->
      <div class="control-column">
        
        <!-- 1. 角色选择 -->
        <div class="bento-card voice-card">
          <div class="card-label pink">
            <el-icon><Headset /></el-icon> 声优选择
          </div>
          
          <div class="voice-selector">
            <div class="selector-group">
              <label>声音类型</label>
              <el-select 
                v-model="ttsForm.voiceType" 
                popper-class="pop-select-dropdown"
                placeholder="请选择"
              >
                <el-option
                  v-for="voice in voiceTypes"
                  :key="voice.id"
                  :label="voice.name"
                  :value="voice.id"
                >
                  <span class="option-row">
                    <span class="name">{{ voice.name }}</span>
                    <span class="badge" :class="voice.gender === '女' ? 'pink-bg' : 'blue-bg'">
                      {{ voice.gender }}
                    </span>
                  </span>
                </el-option>
              </el-select>
            </div>

            <div class="selector-group">
              <label>输出格式</label>
              <div class="format-toggles">
                <div 
                  v-for="fmt in ['mp3', 'wav', 'ogg']"
                  :key="fmt"
                  class="toggle-btn"
                  :class="{ active: ttsForm.outputFormat === fmt }"
                  @click="ttsForm.outputFormat = fmt"
                >
                  {{ fmt.toUpperCase() }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 参数调节 -->
        <div class="bento-card param-card">
          <div class="card-label blue">
            <el-icon><Operation /></el-icon> 调音台
          </div>
          
          <div class="slider-group">
            <div class="slider-row">
              <span class="label">语速 ({{ ttsForm.speed }}x)</span>
              <el-slider 
                v-model="ttsForm.speed" 
                :min="0.5" :max="2.0" :step="0.1" 
                class="pop-slider"
              />
            </div>
            <div class="slider-row">
              <span class="label">音量 ({{ ttsForm.volume }}%)</span>
              <el-slider 
                v-model="ttsForm.volume" 
                :min="0" :max="100" 
                class="pop-slider"
              />
            </div>
          </div>
        </div>

        <!-- 3. 操作与结果 -->
        <div class="action-area">
          <button 
            class="pop-btn main-btn"
            :class="{ loading: generating }"
            :disabled="!canGenerate"
            @click="generateTTS"
          >
            <span v-if="!generating">⚡ 开始合成</span>
            <span v-else>
              <el-icon class="is-loading"><Loading /></el-icon> 正在录制...
            </span>
          </button>

          <!-- 结果卡带 -->
          <transition name="bounce">
            <div v-if="audioUrl" class="cassette-player">
              <div class="cassette-header">
                <span class="tape-name">MIX_TAPE_{{ new Date().getFullYear() }}</span>
                <div class="holes">
                  <span></span><span></span>
                </div>
              </div>
              
              <audio ref="audioPlayer" :src="audioUrl" controls @loadedmetadata="onAudioLoaded" class="native-audio" />
              
              <div class="cassette-actions">
                <button class="icon-btn download" @click="downloadAudio" title="下载">
                  <el-icon><Download /></el-icon>
                </button>
                <div class="meta-info">
                  {{ audioDuration }}s / {{ audioSize }}
                </div>
                <button class="icon-btn clear" @click="handleClearAll" title="删除">
                  <el-icon><Delete /></el-icon>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Microphone, EditPen, Headset, Operation, Loading, 
  Download, Delete, VideoPlay 
} from '@element-plus/icons-vue'

// --- 核心逻辑保持不变 ---

const generating = ref(false)
const audioUrl = ref('')
const audioPlayer = ref<HTMLAudioElement>()
const audioDuration = ref(0)
const audioSize = ref('')

const ttsForm = reactive({
  text: '',
  voiceType: 'zhang-miss',
  language: 'zh-CN',
  speed: 1.0,
  volume: 80,
  outputFormat: 'mp3'
})

// 默认数据
const voiceTypes = ref<any[]>([])

// 状态管理
const loadState = () => {
  try {
    const saved = localStorage.getItem('tts_pop_state')
    if (saved) {
      const state = JSON.parse(saved)
      Object.assign(ttsForm, state.form)
      // 注意：实际项目中 blob URL 刷新会失效，这里仅作演示恢复 UI 状态
      // audioUrl.value = state.audioUrl 
    }
  } catch (e) {}
}

const saveState = () => {
  localStorage.setItem('tts_pop_state', JSON.stringify({
    form: ttsForm,
    audioUrl: audioUrl.value
  }))
}

watch(ttsForm, saveState, { deep: true })

onMounted(() => {
  loadVoiceTypes() // 模拟加载
  loadState()
})

// 模拟 API 加载音色
const loadVoiceTypes = () => {
  // 音色列表
  voiceTypes.value = [
    { id: 'zhang-miss', name: '嚣张小姐', gender: '女' },
    { id: 'bujiji-qingnian', name: '不羁青年', gender: '男' },
    { id: 'aojiao-yujie', name: '傲娇御姐', gender: '女' },
    { id: 'shulang-nan', name: '舒朗男声', gender: '男' },
    { id: 'rexin-dashen', name: '热心大婶', gender: '女' },
    { id: 'gaoxiao-daye', name: '搞笑大爷', gender: '男' },
    { id: 'wenrun-nan', name: '温润男声', gender: '男' },
    { id: 'wennuan-guimi', name: '温暖闺蜜', gender: '女' },
    { id: 'xinwen-nv', name: '新闻女声', gender: '女' },
    { id: 'chenwen-gaoguan', name: '沉稳高管', gender: '男' },
    { id: 'tianmei-nv', name: '甜美女声', gender: '女' },
    { id: 'nanfang-xiaoge', name: '南方小哥', gender: '男' },
    { id: 'wenrun-qingnian', name: '温润青年', gender: '男' },
    { id: 'yueli-jiejie', name: '阅历姐姐', gender: '女' },
    { id: 'wenrou-shaonv', name: '温柔少女', gender: '女' },
    { id: 'huajia-nainai', name: '花甲奶奶', gender: '女' },
    { id: 'hanhan-mengshou', name: '憨憨萌兽', gender: '女' },
    { id: 'diantai-nanzhubo', name: '电台男主播', gender: '男' },
    { id: 'shuqing-nan', name: '抒情男声', gender: '男' },
    { id: 'lvzhen-didi', name: '率真弟弟', gender: '男' },
    { id: 'zhencheng-qingnian', name: '真诚青年', gender: '男' },
    { id: 'wenrou-xuejie', name: '温柔学姐', gender: '女' },
    { id: 'zuiying-zhuma', name: '嘴硬竹马', gender: '男' },
    { id: 'qingcui-shaonv', name: '清脆少女', gender: '女' },
    { id: 'qingche-didi', name: '清澈邻家弟弟', gender: '男' },
    { id: 'nanfang-ruanruan', name: '南方软软女孩', gender: '女' },
  ]
}

const canGenerate = computed(() => ttsForm.text.trim().length > 0 && !generating.value)
const estimatedDuration = computed(() => Math.ceil(ttsForm.text.trim().length / 4 / ttsForm.speed))

const generateTTS = async () => {
  if (!ttsForm.text.trim()) return ElMessage.warning('请先输入台词哦！')

  generating.value = true
  audioUrl.value = '' // 重置

  try {
    console.log('🎤 [TTS] 开始生成语音:', ttsForm.text.substring(0, 30) + '...')

    const response = await fetch('http://localhost:3000/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: ttsForm.text,
        voiceType: ttsForm.voiceType,
        language: ttsForm.language,
        speed: ttsForm.speed,
        volume: ttsForm.volume,
        outputFormat: ttsForm.outputFormat
      })
    })

    const data = await response.json()

    if (data.success) {
      audioUrl.value = data.audioUrl
      audioDuration.value = data.duration || 0
      audioSize.value = (data.fileSize / 1024).toFixed(1) + ' KB'
      ElMessage.success('语音合成完成！🎉')
    } else {
      ElMessage.error(data.error || '生成失败')
    }
  } catch (error: any) {
    console.error('❌ [TTS] 生成失败:', error)
    ElMessage.error(error.message || '网络错误，请重试')
  } finally {
    generating.value = false
    saveState()
  }
}

const onAudioLoaded = () => {
  if (audioPlayer.value) {
    audioDuration.value = Math.round(audioPlayer.value.duration)
    audioSize.value = '1.2 MB' // 模拟数据
  }
}

const downloadAudio = () => {
  const link = document.createElement('a')
  link.href = audioUrl.value
  link.download = `pop-tts-${Date.now()}.${ttsForm.outputFormat}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleClearAll = () => {
  ttsForm.text = ''
  audioUrl.value = ''
  localStorage.removeItem('tts_pop_state')
  ElMessage.success('画板已清空')
}
</script>

<style lang="scss" scoped>
/* --- Pop Art Color Palette --- */
$bg-color: #FBF8F3;
$dark: #1A1A1A;
$yellow: #FFD93D;
$blue: #4D96FF;
$pink: #FF6B6B;
$green: #6BCB77;
$purple: #9B5DE5;
$grey-light: #F2F2F2;

.pop-layout {
  min-height: 100vh;
  background-color: $bg-color;
  background-image: radial-gradient(#ddd 1px, transparent 1px);
  background-size: 24px 24px;
  padding: 40px 20px;
  font-family: 'Quicksand', 'Varela Round', sans-serif;
  color: $dark;
}

/* 顶部 Header */
.page-header {
  text-align: center;
  margin-bottom: 40px;

  .title-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: $dark;
    color: white;
    padding: 6px 16px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 12px;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
    
    &.purple { background: $purple; }
  }

  .main-title {
    font-size: 42px;
    font-weight: 900;
    margin: 0;
    letter-spacing: -1px;
    
    span {
      color: $blue;
      font-family: monospace;
      font-size: 0.8em;
      background: $yellow;
      padding: 0 8px;
      transform: rotate(-3deg);
      display: inline-block;
      border: 2px solid $dark;
      border-radius: 4px;
    }
  }

  .subtitle {
    color: #666;
    margin-top: 10px;
    font-weight: 600;
  }
}

/* 布局网格 */
.workspace {
  display: grid;
  grid-template-columns: 1.5fr 1fr; /* 左宽右窄 */
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: start;
}

/* 通用卡片风格 */
.bento-card {
  background: white;
  border: 3px solid $dark;
  border-radius: 24px;
  box-shadow: 8px 8px 0 $dark;
  padding: 24px;
  position: relative;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  .card-label {
    position: absolute;
    top: -16px;
    left: 20px;
    background: $dark;
    color: white;
    padding: 6px 16px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    border: 2px solid $dark;
    z-index: 2;

    &.yellow { background: $yellow; color: $dark; }
    &.pink { background: $pink; color: white; }
    &.blue { background: $blue; color: white; }
  }
}

/* 左侧：输入区 */
.input-zone {
  min-height: 500px;
  display: flex;
  flex-direction: column;

  .textarea-wrapper {
    flex: 1;
    margin-top: 10px;
    
    :deep(.el-textarea__inner) {
      border: none;
      background: repeating-linear-gradient(
        transparent,
        transparent 31px,
        #E0E0E0 32px
      );
      line-height: 32px;
      padding: 8px 16px;
      font-size: 16px;
      resize: none;
      box-shadow: none;
      
      &:focus {
        background-color: #FAFAFA;
      }
    }
  }

  .input-footer {
    display: flex;
    gap: 10px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 2px dashed #eee;

    .tag {
      background: $grey-light;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      color: #666;
    }
  }
}

/* 右侧：控制区 */
.control-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 1. 声音选择 */
.voice-selector {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  label {
    font-size: 12px;
    font-weight: 800;
    color: #999;
    margin-bottom: 4px;
    display: block;
    text-transform: uppercase;
  }

  /* 改造 Element Select */
  :deep(.el-select) {
    .el-input__wrapper {
      background: $grey-light;
      border: 2px solid $dark;
      border-radius: 12px;
      box-shadow: none !important;
      padding: 4px 12px;
      height: 48px;
      transition: all 0.1s;
      
      &:hover {
        background: white;
      }
      &.is-focus {
        border-color: $blue;
        box-shadow: 4px 4px 0 $blue !important;
      }
    }
    
    .el-input__inner {
      font-weight: bold;
      color: $dark;
    }
  }
}

/* 自定义开关按钮 */
.format-toggles {
  display: flex;
  border: 2px solid $dark;
  border-radius: 12px;
  overflow: hidden;
  background: white;

  .toggle-btn {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    font-weight: bold;
    font-size: 12px;
    cursor: pointer;
    border-right: 2px solid $dark;
    transition: all 0.2s;
    background: white;

    &:last-child { border-right: none; }

    &:hover { background: #f0f0f0; }

    &.active {
      background: $dark;
      color: $yellow;
    }
  }
}

/* 2. 滑动条 */
.slider-group {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .slider-row {
    .label {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 8px;
      display: block;
    }
  }

  /* 改造 Element Slider */
  :deep(.el-slider) {
    --el-slider-main-bg-color: #{$dark};
    --el-slider-runway-bg-color: #eee;
    
    .el-slider__runway {
      height: 10px;
      border: 2px solid $dark;
      border-radius: 10px;
      background: white;
    }

    .el-slider__bar {
      height: 10px;
      border-radius: 10px;
      background: $green;
      border-right: 2px solid $dark;
    }

    .el-slider__button {
      width: 20px;
      height: 20px;
      border: 3px solid $dark;
      background: $yellow;
      box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
    }
  }
}

/* 3. 按钮与结果 */
.action-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pop-btn {
  width: 100%;
  height: 60px;
  border: 3px solid $dark;
  border-radius: 16px;
  font-size: 20px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.1s;
  
  &.main-btn {
    background: $green;
    color: $dark;
    box-shadow: 6px 6px 0 $dark;

    &:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 8px 8px 0 $dark;
    }
    
    &:active:not(:disabled) {
      transform: translate(4px, 4px);
      box-shadow: 2px 2px 0 $dark;
    }

    &:disabled {
      background: #ccc;
      color: #888;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }
  }
}

/* 复古磁带播放器 */
.cassette-player {
  background: $pink;
  border: 3px solid $dark;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.2);
  color: white;
  position: relative;
  overflow: hidden;

  .cassette-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .tape-name {
      font-family: monospace;
      font-weight: bold;
      background: white;
      color: $dark;
      padding: 2px 8px;
      font-size: 12px;
      transform: rotate(-2deg);
    }
    
    .holes span {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: $dark;
      border-radius: 50%;
      margin-left: 5px;
    }
  }

  .native-audio {
    width: 100%;
    height: 32px;
    margin-bottom: 12px;
    filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.5));
  }

  .cassette-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0,0,0,0.1);
    padding: 8px;
    border-radius: 8px;

    .meta-info {
      font-size: 12px;
      font-weight: bold;
      font-family: monospace;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border: 2px solid white;
      background: transparent;
      color: white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;

      &:hover {
        background: white;
        color: $pink;
        transform: scale(1.1);
      }
      
      &.clear:hover {
         color: $dark;
      }
    }
  }
}

/* 动画 */
.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.3s reverse;
}
@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 响应式 */
@media (max-width: 900px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  .input-zone {
    min-height: 300px;
  }
}
</style>

<!-- 下拉菜单样式需要放在 global 才能生效 -->
<style lang="scss">
.pop-select-dropdown {
  border: 2px solid #1A1A1A !important;
  border-radius: 12px !important;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.2) !important;
  
  .el-select-dropdown__item {
    &.selected {
      color: #4D96FF;
      font-weight: 900;
    }
  }
  
  .option-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      color: white;
      
      &.pink-bg { background: #FF6B6B; }
      &.blue-bg { background: #4D96FF; }
    }
  }
}
</style>