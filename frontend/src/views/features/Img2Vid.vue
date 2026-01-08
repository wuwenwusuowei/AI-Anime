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
        
        <!-- 模式切换 -->
        <div class="mode-switch">
          <button
            class="mode-btn"
            :class="{ active: !showLongVideoMode }"
            @click="showLongVideoMode = false"
          >
            <span class="mode-icon">🎬</span>
            <span>标准视频</span>
          </button>
          <button
            class="mode-btn"
            :class="{ active: showLongVideoMode }"
            @click="showLongVideoMode = true"
          >
            <span class="mode-icon">🎞️</span>
            <span>长片段分镜</span>
          </button>
        </div>
        
        <!-- 标准视频模式 (1-5s) -->
        <div v-if="!showLongVideoMode">

          <!-- 子模式切换：单图 / 首尾帧 -->
          <div class="sub-mode-switch">
            <button
              class="sub-mode-btn"
              :class="{ active: !showDualImageMode }"
              @click="showDualImageMode = false"
            >
              <span class="sub-mode-icon">🖼️</span>
              <span>单图模式</span>
            </button>
            <button
              class="sub-mode-btn"
              :class="{ active: showDualImageMode }"
              @click="showDualImageMode = true"
            >
              <span class="sub-mode-icon">🔄</span>
              <span>首尾帧模式</span>
            </button>
          </div>

          <!-- 1. 核心上传区 (场记板风格) - 单图模式 -->
          <div v-if="!showDualImageMode" class="panel-section">
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

          <!-- 1. 双图上传区 - 首尾帧模式 -->
          <div v-else class="dual-image-upload">
            <!-- 起始帧 -->
            <div class="panel-section">
              <div class="section-label">
                <el-icon><Film /></el-icon> 起始帧 (首帧)
              </div>
              <div
                class="clapperboard-upload dual-upload"
                :class="{ 'has-image': previewUrl }"
                @click="triggerUpload"
              >
                <div class="clapper-top start-frame"></div>
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
                    <div class="file-tag">起始帧</div>
                  </div>
                  <div v-else class="placeholder">
                    <div class="icon-box">
                      <el-icon><Plus /></el-icon>
                    </div>
                    <h3>上传起始帧</h3>
                    <p>视频开始画面</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 结束帧 -->
            <div class="panel-section">
              <div class="section-label">
                <el-icon><Film /></el-icon> 结束帧 (尾帧)
              </div>
              <div
                class="clapperboard-upload dual-upload"
                :class="{ 'has-image': endPreviewUrl }"
                @click="triggerEndUpload"
              >
                <div class="clapper-top end-frame"></div>
                <div class="upload-content">
                  <input
                    type="file"
                    ref="endFileInput"
                    @change="handleEndFileChange"
                    accept="image/*"
                    hidden
                  >
                  <div v-if="endPreviewUrl" class="preview-wrapper">
                    <img :src="endPreviewUrl" class="main-preview" />
                    <button class="delete-btn" @click.stop="handleEndRemove">
                      <el-icon><Delete /></el-icon>
                    </button>
                    <div class="file-tag">结束帧</div>
                  </div>
                  <div v-else class="placeholder">
                    <div class="icon-box">
                      <el-icon><Plus /></el-icon>
                    </div>
                    <h3>上传结束帧</h3>
                    <p>视频结束画面</p>
                  </div>
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
              maxlength="5000"
              show-word-limit
            />
          </div>
        </div>

        <!-- 3. 参数设置 (网格布局) -->
        <div class="settings-grid">
          <!-- 比例设置 -->
          <div class="setting-item">
            <div class="section-label small">视频比例</div>
            <div class="ratio-container">
              <!-- 横屏组 -->
              <div class="ratio-group">
                <div class="ratio-group-label">横屏</div>
                <div class="ratio-row">
                  <div
                    class="res-btn small"
                    :class="{ active: form.ratio === '16:9' }"
                    @click="form.ratio = '16:9'"
                    title="标准横屏 (1024x576)"
                  >
                    16:9
                    <span class="res-tag">SD</span>
                  </div>
                  <div
                    class="res-btn small"
                    :class="{ active: form.ratio === '16:9-hd' }"
                    @click="form.ratio = '16:9-hd'"
                    title="高清横屏 (1280x720) - 需16GB+显存"
                  >
                    16:9 HD
                    <span class="res-tag hd">HD</span>
                  </div>
                </div>
              </div>

              <!-- 竖屏组 -->
              <div class="ratio-group">
                <div class="ratio-group-label">竖屏</div>
                <div class="ratio-row">
                  <div
                    class="res-btn small"
                    :class="{ active: form.ratio === '9:16' }"
                    @click="form.ratio = '9:16'"
                    title="手机竖屏 (576x1024)"
                  >
                    9:16
                    <span class="res-tag">SD</span>
                  </div>
                  <div
                    class="res-btn small"
                    :class="{ active: form.ratio === '9:16-hd' }"
                    @click="form.ratio = '9:16-hd'"
                    title="高清竖屏 (720x1280) - 需16GB+显存"
                  >
                    9:16 HD
                    <span class="res-tag hd">HD</span>
                  </div>
                </div>
              </div>

              <!-- 其他比例 -->
              <div class="ratio-group">
                <div class="ratio-group-label">其他</div>
                <div class="ratio-row">
                  <div
                    class="res-btn small"
                    :class="{ active: form.ratio === '1:1' }"
                    @click="form.ratio = '1:1'"
                    title="正方形 (832x832)"
                  >
                    1:1
                  </div>
                  <div
                    class="res-btn small"
                    :class="{ active: form.ratio === '4:3' }"
                    @click="form.ratio = '4:3'"
                    title="复古比例 (1024x768)"
                  >
                    4:3
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 时长设置 -->
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

        <!-- 长视频模式 (12s/20s) -->
        <div v-else>
          <div class="panel-section">
            <div class="section-label">
              <el-icon><Film /></el-icon> 原始素材
            </div>
            <div
              class="clapperboard-upload long-video-upload"
              :class="{ 'has-image': longPreviewUrl }"
              @click="triggerLongUpload"
            >
              <!-- 顶部彩色条纹装饰 -->
              <div class="clapper-top long-video-top"></div>

              <div class="upload-content">
                <input
                  type="file"
                  ref="longFileInput"
                  @change="handleLongFileChange"
                  accept="image/*"
                  hidden
                >

                <div v-if="longPreviewUrl" class="preview-wrapper">
                  <img :src="longPreviewUrl" class="main-preview" />
                  <button class="delete-btn" @click.stop="handleLongRemove">
                    <el-icon><Delete /></el-icon>
                  </button>
                  <div class="file-tag" v-if="longVideoFile">
                    {{ (longVideoFile.size / 1024 / 1024).toFixed(2) }} MB
                  </div>
                </div>

                <div v-else class="placeholder">
                  <div class="icon-box">
                    <el-icon><Plus /></el-icon>
                  </div>
                  <h3>点击上传图片</h3>
                  <p>长视频生成需要清晰的参考图片</p>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-label">
              <el-icon><Edit /></el-icon> 导演指令
            </div>
            <div class="input-wrapper">
              <el-input
                v-model="longForm.prompt"
                type="textarea"
                :rows="6"
                :placeholder="promptPlaceholder"
                resize="none"
                maxlength="5000"
                show-word-limit
              />
              <div class="prompt-tips">
                <el-icon><InfoFilled /></el-icon>
                <span>长视频模式建议按空行分段描述镜头变化（{{ longForm.duration === '10' ? '10秒3段' : '20秒5段' }}）</span>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-label">
              <el-icon><Film /></el-icon> 分镜设置
            </div>

            <!-- 视频分辨率选择 -->
            <div class="ratio-container">
              <!-- 横屏组 -->
              <div class="ratio-group">
                <div class="ratio-group-label">横屏</div>
                <div class="ratio-row">
                  <div
                    class="res-btn small"
                    :class="{ active: longForm.ratio === '16:9' }"
                    @click="longForm.ratio = '16:9'"
                    title="标准横屏 (1024x576)"
                  >
                    16:9
                    <span class="res-tag">SD</span>
                  </div>
                  <div
                    class="res-btn small"
                    :class="{ active: longForm.ratio === '16:9-hd' }"
                    @click="longForm.ratio = '16:9-hd'"
                    title="高清横屏 (1280x720)"
                  >
                    16:9 HD
                    <span class="res-tag hd">HD</span>
                  </div>
                </div>
              </div>

              <!-- 竖屏组 -->
              <div class="ratio-group">
                <div class="ratio-group-label">竖屏</div>
                <div class="ratio-row">
                  <div
                    class="res-btn small"
                    :class="{ active: longForm.ratio === '9:16' }"
                    @click="longForm.ratio = '9:16'"
                    title="手机竖屏 (576x1024)"
                  >
                    9:16
                    <span class="res-tag">SD</span>
                  </div>
                  <div
                    class="res-btn small"
                    :class="{ active: longForm.ratio === '9:16-hd' }"
                    @click="longForm.ratio = '9:16-hd'"
                    title="高清竖屏 (720x1280)"
                  >
                    9:16 HD
                    <span class="res-tag hd">HD</span>
                  </div>
                </div>
              </div>

              <!-- 其他比例 -->
              <div class="ratio-group">
                <div class="ratio-group-label">其他</div>
                <div class="ratio-row">
                  <div
                    class="res-btn small"
                    :class="{ active: longForm.ratio === '1:1' }"
                    @click="longForm.ratio = '1:1'"
                    title="正方形 (832x832)"
                  >
                    1:1
                  </div>
                  <div
                    class="res-btn small"
                    :class="{ active: longForm.ratio === '3:4' }"
                    @click="longForm.ratio = '3:4'"
                    title="复古比例 (1024x768)"
                  >
                    3:4
                  </div>
                </div>
              </div>
            </div>

            <!-- 长视频时长选择 -->
            <div class="long-video-duration-section">
              <div class="duration-title">选择视频时长</div>
              <div class="long-duration-toggle">
                <div
                  class="long-duration-btn"
                  :class="{ active: longForm.duration === '10' }"
                  @click="longForm.duration = '10'"
                >
                  <div class="duration-icon">🎞️</div>
                  <div class="duration-label">~12秒</div>
                  <div class="duration-desc">超长分镜</div>
                </div>
                <div
                  class="long-duration-btn"
                  :class="{ active: longForm.duration === '20' }"
                  @click="longForm.duration = '20'"
                >
                  <div class="duration-icon">🎬</div>
                  <div class="duration-label">20秒</div>
                  <div class="duration-desc">极致分镜</div>
                </div>
              </div>
              <div class="duration-tips">
                <el-icon><InfoFilled /></el-icon>
                <span>长视频使用 SVI 2.0 技术，分段渲染保证完美一致性</span>
              </div>
            </div>
          </div>

          <!-- 生成长视频按钮 -->
          <button
            class="generate-btn long-generate-btn"
            :class="{ loading: isLongGenerating }"
            @click="handleLongGenerate"
            :disabled="isLongGenerating || !longVideoFile"
          >
            <div class="btn-content">
              <span v-if="!isLongGenerating">🎞️ 生成长片段分镜</span>
              <span v-else>
                <el-icon class="is-loading"><Loading /></el-icon> 正在渲染长视频...
              </span>
            </div>
            <div class="btn-progress" :style="{ width: longProgress + '%' }"></div>
          </button>
        </div>
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
              :key="generatedVideo"
              :src="generatedVideo"
              controls
              autoplay
              loop
              class="final-video"
              @error="handleVideoError"
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
  VideoCamera, Film, Edit, Plus, Delete, Loading, VideoPlay, Download, InfoFilled
} from '@element-plus/icons-vue'

// 模式切换
const showLongVideoMode = ref(false)
const showDualImageMode = ref(false)  // 首尾帧模式切换

// 响应式数据
const isGenerating = ref(false)
const progress = ref(0)
const generatedVideo = ref('')
const uploadedFile = ref<File | null>(null)
const previewUrl = ref('')
const taskId = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
let pollingTimer: any = null

// 双图上传相关数据（首尾帧模式）
const endUploadedFile = ref<File | null>(null)
const endPreviewUrl = ref('')
const endFileInput = ref<HTMLInputElement | null>(null)

// 长视频相关数据
const isLongGenerating = ref(false)
const longProgress = ref(0)
const longGeneratedVideo = ref('')
const longVideoFile = ref<File | null>(null)
const longPreviewUrl = ref('')
const longTaskId = ref<number | null>(null)
const longFileInput = ref<HTMLInputElement | null>(null)
let longPollingTimer: any = null

// 表单数据
const form = reactive({
  prompt: '',
  ratio: '16:9',
  duration: '3'
})

// 长视频表单数据
const longForm = reactive({
  prompt: '',
  duration: '10',
  ratio: '9:16'  // 默认竖屏比例
})

// 提示词占位符（根据时长动态变化）
const promptPlaceholder = computed(() => {
  const segmentsCount = longForm.duration === '10' ? 3 : 5;
  return `✨ 描述镜头变化... (用空行分段，建议填写 ${segmentsCount} 段)

例如：
第1段：少女站在樱花树下，微风轻拂长发

第2段：她缓缓抬起手，接住飘落的花瓣
${longForm.duration === '20' ? '\n第3段：背景逐渐过渡到日落黄昏\n\n第4段：少女转身走向远方\n\n第5段：画面慢慢淡出，留下美好回忆' : '\n第3段：少女闭上眼睛，嘴角微微上扬，露出温柔微笑'}`;
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
      form.ratio = state.ratio || '16:9'
      form.duration = state.duration || '3'
      showDualImageMode.value = state.showDualImageMode || false
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
    ratio: form.ratio,
    duration: form.duration,
    showDualImageMode: showDualImageMode.value,
    status: isGenerating.value ? 'PROCESSING' : (generatedVideo.value ? 'COMPLETED' : ''),
    generatedVideo: generatedVideo.value
  }
  localStorage.setItem('img2vid_state', JSON.stringify(state))
}

watch([form, generatedVideo, isGenerating, showDualImageMode], () => saveState(), { deep: true })

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

// 结束帧上传逻辑
const triggerEndUpload = () => endFileInput.value?.click()

const handleEndFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return ElMessage.error('请上传图片')

  endUploadedFile.value = file
  endPreviewUrl.value = URL.createObjectURL(file)
  ElMessage.success('结束帧已上传')
}

const handleEndRemove = () => {
  endUploadedFile.value = null
  endPreviewUrl.value = ''
  if (endFileInput.value) endFileInput.value.value = ''
  ElMessage.success('已删除结束帧')
}

// 生成逻辑
const handleGenerate = async () => {
  if (!uploadedFile.value) return
  if (showDualImageMode.value && !endUploadedFile.value) {
    ElMessage.warning('请上传结束帧')
    return
  }

  isGenerating.value = true
  progress.value = 0
  generatedVideo.value = ''

  try {
    const formData = new FormData()
    formData.append('image', uploadedFile.value)
    formData.append('prompt', form.prompt)
    formData.append('ratio', form.ratio)
    formData.append('duration', form.duration)

    // 如果是首尾帧模式，添加结束帧
    if (showDualImageMode.value && endUploadedFile.value) {
      formData.append('imageEnd', endUploadedFile.value)
      console.log('📤 [提交] 首尾帧模式 - 已上传起始帧和结束帧')
    } else {
      console.log('📤 [提交] 单图模式 - 仅上传起始帧')
    }

    console.log('📤 [提交] 正在发送生成请求...')

    // 创建30分钟的超时控制器（冷启动可能需要很长时间）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000)

    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    console.log('✅ [提交] 服务器已响应，状态码:', response.status)
    const data = await response.json()
    console.log('📦 [提交] 响应数据:', data)
    if (data.success) {
      taskId.value = data.taskId
      startPolling(data.taskId)
    } else {
      throw new Error('提交失败')
    }
  } catch (e: any) {
    console.error('❌ [生成失败] 错误详情:', e)

    // 处理超时错误
    if (e.name === 'AbortError') {
      ElMessage.error('请求超时，请稍后重试。冷启动可能需要较长时间，请耐心等待')
    } else {
      ElMessage.error(e.message || '网络错误')
    }
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
      if (!response.ok) {
        console.error(`❌ [轮询] 状态查询失败: ${response.status} ${response.statusText}`)
        return
      }
      const data = await response.json()
      console.log(`⏳ [轮询] 任务${id}状态:`, data.status)

      if (data.status === 'COMPLETED') {
        clearInterval(pollingTimer)
        progress.value = 100
        // 使用 resultUrl 而不是 videoUrl（后端返回的字段名）
        const videoUrl = data.resultUrl || data.videoUrl
        if (videoUrl) {
          generatedVideo.value = videoUrl
          console.log('✅ 视频URL:', videoUrl)
        } else {
          console.error('❌ 未收到视频URL:', data)
          ElMessage.error('视频URL错误')
        }
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

const downloadVideo = async () => {
  if (!generatedVideo.value) return
  try {
    const response = await fetch(generatedVideo.value)
    if (!response.ok) throw new Error('下载失败')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `motion-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// 长视频上传逻辑
const triggerLongUpload = () => longFileInput.value?.click()

const handleLongFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return ElMessage.error('请上传图片')

  longVideoFile.value = file
  longPreviewUrl.value = URL.createObjectURL(file)
}

const handleLongRemove = () => {
  longVideoFile.value = null
  longPreviewUrl.value = ''
  if (longFileInput.value) longFileInput.value.value = ''
}

// 长视频生成逻辑
const handleLongGenerate = async () => {
  if (!longVideoFile.value) return

  isLongGenerating.value = true
  longProgress.value = 0
  longGeneratedVideo.value = ''

  try {
    const formData = new FormData()
    formData.append('image', longVideoFile.value)
    formData.append('prompt', longForm.prompt)
    formData.append('ratio', longForm.ratio)
    formData.append('duration', longForm.duration)

    // 处理分段提示词：按空行分割（两个或更多连续换行符）
    const segments = longForm.prompt
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(s => s.length > 0)

    // 如果有分段，添加到 FormData
    if (segments.length > 0) {
      console.log(`📝 [前端] 提示词已分成 ${segments.length} 段`)
      formData.append('promptSegments', JSON.stringify(segments))
    }

    console.log('📤 [提交] 正在发送生成请求...')
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: formData
    })
    console.log('✅ [提交] 服务器已响应，状态码:', response.status)
    const data = await response.json()
    console.log('📦 [提交] 响应数据:', data)

    if (data.success) {
      longTaskId.value = data.taskId
      startLongPolling(data.taskId)
    } else {
      throw new Error('提交失败')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '网络错误')
    isLongGenerating.value = false
  }
}

const startLongPolling = (id: number) => {
  if (longPollingTimer) clearInterval(longPollingTimer)

  longPollingTimer = setInterval(async () => {
    try {
      // 模拟进度条增长 (长视频需要更长时间)
      if (longProgress.value < 85) longProgress.value += Math.random() * 2

      const response = await fetch(`http://localhost:3000/api/status/${id}`)
      const data = await response.json()

      if (data.status === 'COMPLETED') {
        clearInterval(longPollingTimer)
        longProgress.value = 100
        const videoUrl = data.resultUrl || data.videoUrl
        if (videoUrl) {
          longGeneratedVideo.value = videoUrl
          console.log('✅ 长视频URL:', videoUrl)
          // 更新右侧预览区显示长视频
          generatedVideo.value = videoUrl
        } else {
          console.error('❌ 未收到视频URL:', data)
          ElMessage.error('视频URL错误')
        }
        isLongGenerating.value = false
        ElMessage.success('长视频生成成功！')
      } else if (data.status === 'FAILED') {
        clearInterval(longPollingTimer)
        isLongGenerating.value = false
        ElMessage.error('生成失败')
      }
    } catch (e) { console.error(e) }
  }, 2000)
}

// 视频加载错误处理
const handleVideoError = (e: Event) => {
  console.error('❌ 视频加载失败:', e)
  ElMessage.error('视频加载失败，请检查URL是否正确')
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

/* 比例选择容器 */
.ratio-container {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .ratio-group {
    .ratio-group-label {
      font-size: 12px;
      color: #999;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .ratio-row {
      display: flex;
      gap: 8px;

      .res-btn {
        flex: 1;
        border: 2px solid #DDD;
        border-radius: 8px;
        padding: 10px 8px;
        text-align: center;
        font-size: 13px;
        font-weight: bold;
        cursor: pointer;
        position: relative;
        background: white;
        transition: all 0.2s;

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
          transform: translateY(-1px);
        }

        &:hover:not(.active) {
          background: #f5f5f5;
        }

        &.small {
          padding: 8px 6px;
          font-size: 12px;
        }
      }
    }
  }
}

/* 画质切换按钮 (保留旧样式兼容) */
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

/* 长视频时长选择按钮 */
.long-duration-toggle {
  display: flex;
  gap: 12px;
  margin-top: 8px;

  .long-duration-btn {
    flex: 1;
    padding: 12px 0;
    border: 2px solid #DDD;
    border-radius: 10px;
    text-align: center;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    background: white;
    transition: all 0.2s;

    &:hover:not(.active) {
      border-color: $blue;
      background: rgba(77, 150, 255, 0.05);
      transform: translateY(-2px);
      box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
    }

    &.active {
      border-color: $dark;
      background: $yellow;
      box-shadow: 3px 3px 0 $dark;
      transform: translateY(-2px);
    }
  }
}

/* 顶部模式切换器 */
.mode-switch {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .mode-btn {
    flex: 1;
    padding: 14px 0;
    border: 3px solid #E0E0E0;
    border-radius: 12px;
    text-align: center;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    background: white;
    transition: all 0.2s;
    color: #666;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    .mode-icon {
      font-size: 28px;
    }

    &:hover:not(.active) {
      border-color: $blue;
      background: rgba(77, 150, 255, 0.05);
      color: $blue;
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
    }

    &.active {
      border-color: $dark;
      background: $yellow;
      color: $dark;
      box-shadow: 4px 4px 0 $dark;
      transform: translateY(-2px);
    }
  }
}

/* 子模式切换器（单图/首尾帧） */
.sub-mode-switch {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  .sub-mode-btn {
    flex: 1;
    padding: 10px 0;
    border: 2px solid #DDD;
    border-radius: 8px;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: white;
    transition: all 0.2s;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    .sub-mode-icon {
      font-size: 18px;
    }

    &:hover:not(.active) {
      border-color: $blue;
      background: rgba(77, 150, 255, 0.05);
      color: $blue;
      transform: translateY(-1px);
    }

    &.active {
      border-color: $dark;
      background: $yellow;
      color: $dark;
      box-shadow: 2px 2px 0 $dark;
      transform: translateY(-1px);
    }
  }
}

/* 双图上传区域 */
.dual-image-upload {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .dual-upload {
    .clapper-top {
      &.start-frame {
        background: linear-gradient(135deg, $yellow 0%, darken($yellow, 10%) 100%);
      }

      &.end-frame {
        background: linear-gradient(135deg, $purple 0%, darken($purple, 10%) 100%);
      }
    }

    .file-tag {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
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

/* 长视频模式样式 */
.long-video-upload {
  .long-video-top {
    background: repeating-linear-gradient(-45deg, $green, $green 12px, #FF6B6B 12px, #FF6B6B 24px);
  }
}

.long-generate-btn {
  background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%);
  box-shadow: 6px 6px 0 #1A1A1A;

  &:hover:not(:disabled) {
    box-shadow: 8px 8px 0 #1A1A1A;
  }

  &:active:not(:disabled) {
    box-shadow: 2px 2px 0 #1A1A1A;
  }

  .btn-progress {
    background: repeating-linear-gradient(45deg, #FF6B6B, #FF6B6B 10px, #FFD93D 10px, #FFD93D 20px);
  }
}

.long-video-duration-section {
  margin-top: 12px;

  .duration-title {
    font-size: 13px;
    font-weight: bold;
    color: #666;
    margin-bottom: 12px;
  }

  .long-duration-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .long-duration-btn {
    border: 3px solid #E0E0E0;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    background: white;
    transition: all 0.2s;
    text-align: center;

    &:hover:not(.active) {
      border-color: $blue;
      background: rgba(77, 150, 255, 0.05);
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
    }

    &.active {
      border-color: $dark;
      background: linear-gradient(135deg, $yellow 0%, color.adjust($yellow, $lightness: -10%) 100%);
      box-shadow: 4px 4px 0 $dark;
      transform: translateY(-2px);
    }

    .duration-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .duration-label {
      font-size: 18px;
      font-weight: 900;
      color: $dark;
      margin-bottom: 4px;
    }

    .duration-desc {
      font-size: 12px;
      color: #666;
      font-weight: normal;
    }
  }

  .duration-tips {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(77, 150, 255, 0.05);
    border: 2px dashed $blue;
    border-radius: 10px;
    font-size: 12px;
    color: #666;

    .el-icon {
      color: $blue;
      font-size: 16px;
      flex-shrink: 0;
    }
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
        background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
        background-size: 4px 4px;
        opacity: 0.3;
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
