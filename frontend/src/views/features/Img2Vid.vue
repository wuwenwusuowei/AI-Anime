<template>
  <div class="pop-layout">
    <!-- 顶部标题 -->
    <div class="page-header">
      <div class="title-badge yellow">
        <el-icon><VideoCamera /></el-icon>
        <span>动态影像</span>
      </div>
      <h1 class="main-title">图生视频 <span>Motion</span></h1>
      <p class="subtitle">让静止的画面流动起来，赋予角色灵魂</p>
    </div>

    <div class="workspace">
      <!-- 左侧：导演控制台 -->
      <div class="control-panel">
        
        <!-- 1. 核心上传区 (场记板风格) -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><Film /></el-icon> 原始素材
          </div>
          
          <div 
            class="clapperboard-upload" 
            :class="{ 'has-image': previewUrl }"
            @click="triggerUpload"
          >
            <!-- 顶部黑白条纹装饰 -->
            <div class="clapper-top"></div>
            
            <div class="upload-content">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileChange"
                accept="image/*"
                hidden
              >
              
              <div v-if="previewUrl" class="preview-wrapper">
                <img :src="previewUrl" class="main-preview" />
                <button class="delete-btn" @click.stop="handleRemove">
                  <el-icon><Delete /></el-icon>
                </button>
                <div class="file-tag" v-if="uploadedFile">
                  {{ (uploadedFile.size / 1024 / 1024).toFixed(2) }} MB
                </div>
              </div>
              
              <div v-else class="placeholder">
                <div class="icon-box">
                  <el-icon><Plus /></el-icon>
                </div>
                <h3>点击上传图片</h3>
                <p>支持 JPG / PNG，建议尺寸 1024px+</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 提示词 -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><Edit /></el-icon> 导演指令
          </div>
          <div class="input-wrapper">
            <el-input
              v-model="form.prompt"
              type="textarea"
              :rows="3"
              placeholder="✨ 描述画面如何运动... (例如：微风吹拂头发，眨眼微笑，背景樱花飘落，运镜缓慢推进)"
              resize="none"
              maxlength="500"
              show-word-limit
            />
          </div>
        </div>

        <!-- 3. 参数设置 (网格布局) -->
        <div class="settings-grid">
          <!-- 画质 -->
          <div class="setting-item">
            <div class="section-label small">画质精度</div>
            <div class="resolution-toggle">
              <div 
                class="res-btn" 
                :class="{ active: form.resolution === '576p' }"
                @click="form.resolution = '576p'"
              >
                <span class="res-tag">SD</span>
                576p
              </div>
              <div 
                class="res-btn" 
                :class="{ active: form.resolution === '720p' }"
                @click="form.resolution = '720p'"
              >
                <span class="res-tag hd">HD</span>
                720p
              </div>
            </div>
          </div>

          <!-- 时长 (滑块) -->
          <div class="setting-item">
            <div class="section-label small">
              视频时长 <span class="value-badge">{{ form.duration }}s</span>
            </div>
            <div class="slider-wrapper">
              <el-slider
                v-model="durationValue"
                :min="1"
                :max="5"
                :step="1"
                :show-tooltip="false"
                class="pop-slider"
              />
              <div class="slider-marks">
                <span>1s</span>
                <span>3s (推荐)</span>
                <span>5s</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成按钮 -->
        <button 
          class="generate-btn" 
          :class="{ loading: isGenerating }"
          @click="handleGenerate"
          :disabled="isGenerating || !uploadedFile"
        >
          <div class="btn-content">
            <span v-if="!isGenerating">🎬 Action! 开始生成</span>
            <span v-else>
              <el-icon class="is-loading"><Loading /></el-icon> 正在渲染中...
            </span>
          </div>
          <!-- 装饰性进度条底纹 -->
          <div class="btn-progress" :style="{ width: progress + '%' }"></div>
        </button>
      </div>

      <!-- 右侧：放映厅 -->
      <div class="preview-panel">
        <!-- 电视机外框 -->
        <div class="tv-frame">
          <!-- 天线装饰 -->
          <div class="antenna left"></div>
          <div class="antenna right"></div>
          
          <!-- 屏幕区域 -->
          <div class="tv-screen" :class="{ 'has-video': generatedVideo }">
            
            <!-- 状态A: 播放视频 -->
            <video
              v-if="generatedVideo"
              :src="generatedVideo"
              controls
              autoplay
              loop
              class="final-video"
            ></video>

            <!-- 状态B: 生成中 -->
            <div v-else-if="isGenerating" class="loading-screen">
              <div class="film-countdown">{{ Math.floor((100 - progress) / 10) }}</div>
              <p>AI 正在逐帧绘制...</p>
              <span class="task-id">ID: {{ taskId }}</span>
            </div>

            <!-- 状态C: 空闲 -->
            <div v-else class="standby-screen">
              <div class="noise-bg"></div> <!-- 噪点背景 -->
              <div class="standby-content">
                <el-icon size="48"><VideoPlay /></el-icon>
                <p>READY TO PLAY</p>
              </div>
            </div>
          </div>

          <!-- 电视机按钮 -->
          <div class="tv-controls">
            <div class="knob"></div>
            <div class="knob"></div>
            <div class="speaker-grill">
              <span></span><span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 操作栏 -->
        <div v-if="generatedVideo" class="action-bar fade-in">
          <button class="action-btn green" @click="downloadVideo">
            <el-icon><Download /></el-icon> 保存
          </button>
          <button class="action-btn red" @click="handleClearAll">
            <el-icon><Delete /></el-icon> 清除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import { 
  VideoCamera, Film, Edit, Plus, Delete, Loading, VideoPlay, Download 
} from '@element-plus/icons-vue'

// 响应式数据
const isGenerating = ref(false)
const progress = ref(0)
const generatedVideo = ref('')
const uploadedFile = ref<File | null>(null)
const previewUrl = ref('')
const taskId = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let pollingTimer: any = null

// 表单数据
const form = reactive({
  prompt: '',
  resolution: '576p',
  duration: '3'
})

// 滑块双向绑定
const durationValue = computed({
  get: () => parseInt(form.duration),
  set: (val: number) => { form.duration = val.toString() }
})

// --- 核心逻辑 (复用原逻辑，适配新UI) ---

const loadState = () => {
  try {
    const saved = localStorage.getItem('img2vid_state')
    if (saved) {
      const state = JSON.parse(saved)
      form.prompt = state.prompt || ''
      form.resolution = state.resolution || '576p'
      form.duration = state.duration || '3'
      if (state.status === 'COMPLETED') {
        generatedVideo.value = state.generatedVideo
      }
      // 恢复上传预览需重新上传，此处略过
    }
  } catch (e) { console.error(e) }
}

const saveState = () => {
  const state = {
    prompt: form.prompt,
    resolution: form.resolution,
    duration: form.duration,
    status: isGenerating.value ? 'PROCESSING' : (generatedVideo.value ? 'COMPLETED' : ''),
    generatedVideo: generatedVideo.value
  }
  localStorage.setItem('img2vid_state', JSON.stringify(state))
}

watch([form, generatedVideo, isGenerating], () => saveState(), { deep: true })

onMounted(() => loadState())
onUnmounted(() => { if (pollingTimer) clearInterval(pollingTimer) })

// 上传逻辑
const triggerUpload = () => fileInput.value?.click()

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return ElMessage.error('请上传图片')
  
  uploadedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

const handleRemove = () => {
  uploadedFile.value = null
  previewUrl.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// 生成逻辑
const handleGenerate = async () => {
  if (!uploadedFile.value) return
  
  isGenerating.value = true
  progress.value = 0
  generatedVideo.value = ''
  
  try {
    const formData = new FormData()
    formData.append('image', uploadedFile.value)
    formData.append('prompt', form.prompt)
    formData.append('resolution', form.resolution)
    formData.append('duration', form.duration)

    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: formData
    })
    const data = await response.json()
    
    if (data.success) {
      taskId.value = data.taskId
      startPolling(data.taskId)
    } else {
      throw new Error('提交失败')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '网络错误')
    isGenerating.value = false
  }
}

const startPolling = (id: number) => {
  if (pollingTimer) clearInterval(pollingTimer)
  
  pollingTimer = setInterval(async () => {
    try {
      // 模拟进度条增长 (为了视觉效果)
      if (progress.value < 90) progress.value += Math.random() * 5
      
      const response = await fetch(`http://localhost:3000/api/status/${id}`)
      const data = await response.json()
      
      if (data.status === 'COMPLETED') {
        clearInterval(pollingTimer)
        progress.value = 100
        generatedVideo.value = data.videoUrl
        isGenerating.value = false
        ElMessage.success('视频生成成功！')
      } else if (data.status === 'FAILED') {
        clearInterval(pollingTimer)
        isGenerating.value = false
        ElMessage.error('生成失败')
      }
    } catch (e) { console.error(e) }
  }, 2000)
}

const handleClearAll = () => {
  form.prompt = ''
  handleRemove()
  generatedVideo.value = ''
  localStorage.removeItem('img2vid_state')
}

const downloadVideo = () => {
  if (!generatedVideo.value) return
  const link = document.createElement('a')
  link.href = generatedVideo.value
  link.download = `motion-${Date.now()}.mp4`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style lang="scss" scoped>
@use "sass:color";

/* Pop-Energy 色板 (强调黄/紫) */
$bg-color: #FBF8F3;
$dark: #1A1A1A;
$yellow: #FFD93D;
$purple: #764BA2;
$blue: #4D96FF;
$green: #6BCB77;
$red: #FF6B6B;

.pop-layout {
  min-height: 100vh;
  background-color: $bg-color;
  /* 动态条纹背景 */
  background-image: repeating-linear-gradient(
    45deg,
    #f0f0f0 25%,
    transparent 25%,
    transparent 75%,
    #f0f0f0 75%,
    #f0f0f0
  );
  background-size: 20px 20px;
  padding: 20px;
  color: $dark;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  
  .title-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: $dark;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 10px;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
    
    &.yellow { background: $yellow; color: $dark; }
  }
  
  .main-title {
    font-size: 36px;
    font-weight: 900;
    margin: 0;
    
    span {
      color: $purple;
      font-style: italic;
      font-family: 'Courier New', Courier, monospace;
    }
  }
  .subtitle { margin-top: 8px; color: #666; }
}

.workspace {
  display: grid;
  grid-template-columns: 450px 1fr;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}

/* --- 左侧控制台 --- */
.control-panel {
  background: white;
  border: 3px solid $dark;
  border-radius: 24px;
  box-shadow: 8px 8px 0 $dark;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-section .section-label {
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 场记板上传区 */
.clapperboard-upload {
  border: 3px solid $dark;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: #FAFAFA;
  
  &:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 rgba(0,0,0,0.1); }
  &.has-image { background: $dark; }
  
  .clapper-top {
    height: 24px;
    background: repeating-linear-gradient(
      135deg,
      $dark,
      $dark 20px,
      white 20px,
      white 40px
    );
    border-bottom: 3px solid $dark;
  }
  
  .upload-content {
    height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    
    .placeholder {
      text-align: center;
      .icon-box {
        width: 50px;
        height: 50px;
        background: $yellow;
        border: 2px solid $dark;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin: 0 auto 10px;
      }
      h3 { margin: 0; font-size: 16px; }
      p { font-size: 12px; color: #999; margin-top: 4px; }
    }
    
    .preview-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      
      .main-preview {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #000;
      }
      
      .delete-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: $red;
        color: white;
        border: 2px solid white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover { transform: scale(1.1); }
      }
      
      .file-tag {
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
    }
  }
}

/* 输入框 */
.input-wrapper :deep(.el-textarea__inner) {
  border: 2px solid $dark;
  border-radius: 12px;
  background: #F5F5F5;
  box-shadow: none;
  &:focus { background: white; box-shadow: 4px 4px 0 $yellow; }
}

/* 参数网格 */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  .setting-item {
    background: #F9F9F9;
    border: 2px solid #E0E0E0;
    border-radius: 12px;
    padding: 12px;
    
    .section-label.small {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      
      .value-badge {
        background: $purple;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
  }
}

/* 画质切换按钮 */
.resolution-toggle {
  display: flex;
  gap: 8px;
  
  .res-btn {
    flex: 1;
    border: 2px solid #DDD;
    border-radius: 8px;
    padding: 8px 0;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    position: relative;
    background: white;
    
    .res-tag {
      position: absolute;
      top: -6px;
      right: -6px;
      font-size: 8px;
      background: #999;
      color: white;
      padding: 1px 4px;
      border-radius: 4px;
      &.hd { background: $blue; }
    }
    
    &.active {
      border-color: $dark;
      background: $yellow;
      box-shadow: 2px 2px 0 $dark;
    }
  }
}

/* 滑块样式重置 */
.pop-slider {
  :deep(.el-slider__bar) { background-color: $purple; height: 8px; border-radius: 4px; }
  :deep(.el-slider__runway) { height: 8px; background-color: #DDD; border: 1px solid #CCC; }
  :deep(.el-slider__button) { 
    width: 16px; height: 16px; border: 3px solid $dark; background: $yellow; 
  }
}
.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

/* 生成按钮 */
.generate-btn {
  width: 100%;
  height: 60px;
  background: $dark;
  color: white;
  border: none;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 6px 6px 0 $purple;
  transition: all 0.1s;
  
  &:hover:not(:disabled) { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 $purple; }
  &:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: 2px 2px 0 $purple; }
  &:disabled { background: #999; box-shadow: none; cursor: not-allowed; }
  
  .btn-content {
    position: relative;
    z-index: 2;
    font-size: 18px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
  }
  
  .btn-progress {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: repeating-linear-gradient(45deg, $purple, $purple 10px, color.adjust($purple, $lightness: 10%) 10px, color.adjust($purple, $lightness: 10%) 20px);
    z-index: 1;
    opacity: 0.5;
    transition: width 0.3s;
  }
}

/* --- 右侧放映厅 --- */
.preview-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 电视机外框 */
.tv-frame {
  width: 100%;
  max-width: 800px;
  aspect-ratio: 16/9;
  background: $dark;
  border-radius: 30px;
  padding: 20px;
  position: relative;
  box-shadow: 12px 12px 0 rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  
  /* 天线 */
  .antenna {
    position: absolute;
    width: 4px;
    height: 60px;
    background: $dark;
    top: -50px;
    z-index: -1;
    &.left { left: 40px; transform: rotate(-20deg); }
    &.right { left: 80px; transform: rotate(20deg); }
    &::after {
      content: '';
      position: absolute;
      top: -10px;
      left: -6px;
      width: 16px;
      height: 16px;
      background: $red;
      border-radius: 50%;
      border: 3px solid $dark;
    }
  }
  
  .tv-screen {
    flex: 1;
    background: #111;
    border-radius: 16px; /* 屏幕圆角 */
    border: 4px solid #333;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
    
    &.has-video { border-color: #000; }
    
    .final-video { width: 100%; height: 100%; object-fit: contain; }
    
    .standby-screen {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      
      .noise-bg {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        background-image: url('data:image/svg+xml;base64,...'); /* 可选：噪点图 */
        opacity: 0.1;
      }
      .standby-content {
        text-align: center;
        z-index: 1;
        p { font-family: 'Courier New', monospace; font-weight: bold; margin-top: 10px; }
      }
    }
    
    .loading-screen {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      
      .film-countdown {
        font-size: 80px;
        font-weight: bold;
        border: 4px solid white;
        border-radius: 50%;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        background: rgba(255,255,255,0.1);
      }
      .task-id { margin-top: 10px; font-size: 12px; opacity: 0.5; font-family: monospace; }
    }
  }
  
  .tv-controls {
    height: 40px;
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 15px;
    padding-left: 10px;
    
    .knob {
      width: 24px;
      height: 24px;
      background: #333;
      border-radius: 50%;
      border: 2px solid #555;
      box-shadow: 2px 2px 0 black;
    }
    .speaker-grill {
      margin-left: auto;
      display: flex;
      gap: 4px;
      span { width: 4px; height: 16px; background: #222; border-radius: 2px; }
    }
  }
}

.action-bar {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  
  .action-btn {
    padding: 10px 24px;
    border: 3px solid $dark;
    border-radius: 50px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    background: white;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
    
    &:hover { transform: translateY(-2px); }
    &:active { transform: translateY(1px); box-shadow: none; }
    
    &.green { color: $dark; background: $green; }
    &.red { color: $dark; background: $red; }
  }
}

/* 响应式 */
@media (max-width: 1024px) {
  .workspace { grid-template-columns: 1fr; }
  .settings-grid { grid-template-columns: 1fr; }
}
</style>
