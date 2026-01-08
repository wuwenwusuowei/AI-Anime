<template>
  <div class="pop-layout">
    <div class="page-header">
      <div class="title-badge green">
        <el-icon><MagicStick /></el-icon>
        <span>分镜工坊</span>
      </div>
      <h1 class="main-title">图生图 <span>Remix</span></h1>
      <p class="subtitle">上传参考图，让 AI 为你的角色绘制全新动作</p>
    </div>

    <div class="workspace">
      <!-- 左侧：操作台 -->
      <div class="control-panel">

        <!-- 1. 单图上传区 (Kontext工作流/豆包单图) -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><Files /></el-icon> 素材上传
          </div>

          <div class="upload-grid">
            <!-- 参考图 -->
            <div class="upload-card main-card" @click="triggerUpload">
              <div class="card-header-tag blue">Kontext 参考图</div>
              <div class="preview-area" :class="{ 'has-image': previewUrl }">
                <input
                  type="file"
                  ref="fileInput"
                  @change="handleFileChange"
                  accept="image/*"
                  hidden
                >
                <img v-if="previewUrl" :src="previewUrl" class="preview-img" />
                <div v-else class="placeholder">
                  <div class="icon-circle blue-bg"><el-icon><User /></el-icon></div>
                  <p>点击上传参考图</p>
                  <span>用于保持角色一致性</span>
                </div>

                <!-- 删除按钮 -->
                <button v-if="previewUrl" class="delete-btn" @click.stop="clearImage">×</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 1.5 豆包多图模式 (仅在选择豆包模型时显示) -->
        <div class="panel-section" v-if="form.model === 'doubao'">
          <div class="section-label">
            <el-icon><Picture /></el-icon> 多图模式设置
          </div>
          <div class="toggle-row">
            <span>启用多图参考</span>
            <el-switch v-model="form.multiImageMode" />
          </div>

          <!-- 多图上传区 -->
          <div v-if="form.multiImageMode" class="multi-upload-area">
            <div class="multi-images-grid">
              <div
                v-for="(img, index) in multiPreviewUrls"
                :key="index"
                class="multi-image-item"
              >
                <img :src="img.url" class="multi-img" />
                <div class="multi-index">{{ index + 1 }}</div>
                <button class="multi-delete" @click="removeMultiImage(index)">×</button>
              </div>
              <div class="multi-add-btn" @click="triggerMultiUpload">
                <el-icon><Plus /></el-icon>
                <span>添加图片</span>
              </div>
            </div>
            <input
              type="file"
              ref="multiFileInput"
              @change="handleMultiFileChange"
              accept="image/*"
              multiple
              hidden
            >
          </div>
          <p v-if="form.multiImageMode && multiPreviewUrls.length === 0" class="hint-text">
            💡 提示：添加多张参考图，AI 将根据图片关系生成新图（例如：图1的服装换为图2的服装）
          </p>
        </div>

        <!-- 2. 动作描述 -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><EditPen /></el-icon> 动作指令
          </div>
          <div class="input-wrapper">
            <el-input
              v-model="form.prompt"
              type="textarea"
              :rows="4"
              placeholder="✨ 想要她做什么动作？(例如：坐在王座上喝茶，战斗姿态，在雨中奔跑...)"
              resize="none"
              maxlength="2000"
              show-word-limit
            />
          </div>
        </div>

        <!-- 3. 模型选择 -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><MagicStick /></el-icon> 选择生成模型
          </div>
          <div class="model-grid">
            <div
              v-for="m in modelOptions"
              :key="m.value"
              class="model-card"
              :class="{ active: form.model === m.value }"
              @click="form.model = m.value"
            >
              <div class="model-icon">{{ m.icon }}</div>
              <div class="model-info">
                <div class="model-name">{{ m.label }}</div>
                <div class="model-desc">{{ m.desc }}</div>
              </div>
              <div v-if="form.model === m.value" class="model-badge">已选择</div>
            </div>
          </div>
        </div>

        <!-- 3. 画幅选择 -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><FullScreen /></el-icon> 目标画幅
          </div>
          <div class="ratio-grid">
            <div 
              v-for="r in ratioOptions" 
              :key="r.value"
              class="ratio-btn"
              :class="{ active: form.ratio === r.value }"
              @click="form.ratio = r.value"
            >
              <div class="ratio-box" :style="{ aspectRatio: r.ratioVal }"></div>
              <span>{{ r.label }}</span>
            </div>
          </div>
        </div>

        <!-- 生成按钮 -->
        <button 
          class="generate-btn" 
          :class="{ loading: loading }"
          @click="handleGenerate"
          :disabled="loading || !isReady"
        >
          <span v-if="!loading">✨ 合成新画面</span>
          <span v-else>
            <el-icon class="is-loading"><Loading /></el-icon> AI 正在融合中...
          </span>
        </button>
      </div>

      <!-- 右侧：结果预览 -->
      <div class="preview-panel">
        <div v-if="resultUrl" class="result-container">
          <div class="image-frame">
            <el-image 
              :src="resultUrl" 
              fit="contain" 
              :preview-src-list="[resultUrl]"
              class="main-image"
            />
            <div class="frame-tag">Remix Complete</div>
          </div>
          
          <div class="action-bar">
            <button class="action-btn green" @click="downloadImage">
              <el-icon><Download /></el-icon> 下载
            </button>
            <button class="action-btn yellow" @click="handleRegenerate">
              <el-icon><Refresh /></el-icon> 重绘
            </button>
            <button class="action-btn red" @click="handleClearAll">
              <el-icon><Delete /></el-icon> 重置
            </button>
          </div>
        </div>

        <div v-else-if="loading" class="loading-container">
          <div class="loader-animation">🧬</div>
          <h3>正在进行特征融合...</h3>
          <p>任务ID: {{ taskId || 'Initiating' }}</p>
          <div class="loading-bar">
            <div class="bar-fill"></div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">🎨</div>
          <h3>创作预览区</h3>
          <p>请在左侧上传参考图并输入分镜指令</p>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-toast">
          <el-icon><Warning /></el-icon> {{ error }}
          <button @click="error = ''">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Picture, MagicStick, Clock, SuccessFilled, Loading, Download, Refresh, Delete,
  User, Avatar, EditPen, FullScreen, Files, Warning, Plus
} from '@element-plus/icons-vue'

// --- 数据定义 ---
const form = reactive({
  prompt: '',
  ratio: '9:16',
  model: 'comfyui', // 默认使用ComfyUI
  multiImageMode: false // 豆包多图模式
})

const ratioOptions = [
  { label: '9:16', value: '9:16', ratioVal: '9/16' },
  { label: '1:1', value: '1:1', ratioVal: '1/1' },
  { label: '16:9', value: '16:9', ratioVal: '16/9' },
  { label: '3:4', value: '3:4', ratioVal: '3/4' },
]

const modelOptions = [
  { label: 'ComfyUI', value: 'comfyui', icon: '🎨', desc: '本地部署, 稳定快速' },
  { label: '豆包(即梦)', value: 'doubao', icon: '🌟', desc: '云端AI, 效果卓越' }
]

// 状态
const loading = ref(false)
const taskId = ref<number | null>(null)
const status = ref('')
const resultUrl = ref('')
const error = ref('')
let pollTimer: any = null

// 文件相关（改为单图）
const file = ref<File | null>(null)
const previewUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// 多图相关（豆包多图模式）
const multiFiles = ref<File[]>([])
const multiPreviewUrls = ref<Array<{ file: File, url: string }>>([])
const multiFileInput = ref<HTMLInputElement | null>(null)

// 计算属性：是否准备好生成
const isReady = computed(() => {
  if (form.model === 'doubao' && form.multiImageMode) {
    // 豆包多图模式：需要多张图片或单张图片 + 提示词
    return (multiPreviewUrls.value.length > 0 || file.value) && form.prompt
  }
  // 单图模式
  return file.value && form.prompt
})

// --- 逻辑部分 (复用核心逻辑，适配新UI) ---

const loadState = () => {
  try {
    const saved = localStorage.getItem('img2img_state')
    if (saved) {
      const state = JSON.parse(saved)
      form.prompt = state.prompt || ''
      form.ratio = state.ratio || '9:16'
      form.model = state.model || 'comfyui' // 恢复模型选择

      // 恢复之前的结果（只要 resultUrl 不为空）
      if (state.resultUrl) {
        resultUrl.value = state.resultUrl
        status.value = state.status || 'COMPLETED'
      }

      // 恢复进行中的任务
      if (state.taskId && (state.status === 'PROCESSING' || state.status === 'PENDING')) {
        taskId.value = state.taskId
        status.value = state.status
        loading.value = true
        pollStatus(state.taskId)
      }
    }
  } catch (e) { console.error(e) }
}

const saveState = () => {
  // 获取之前保存的状态
  const previousState = JSON.parse(localStorage.getItem('img2img_state') || '{}')

  const state = {
    prompt: form.prompt,
    ratio: form.ratio,
    model: form.model, // 保存模型选择
    status: status.value,
    // 如果当前有结果就用当前的，否则保留之前的结果
    resultUrl: resultUrl.value || previousState.resultUrl || ''
  }
  localStorage.setItem('img2img_state', JSON.stringify(state))
}

watch([form, status, resultUrl], () => saveState(), { deep: true })

onMounted(() => loadState())
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

// 上传处理逻辑（改为单图）
const triggerUpload = () => fileInput.value?.click()

const handleFileChange = (e: Event) => {
  const uploadedFile = (e.target as HTMLInputElement).files?.[0]
  if (!uploadedFile) return

  if (!uploadedFile.type.startsWith('image/')) return ElMessage.error('请选择图片')
  if (uploadedFile.size > 10 * 1024 * 1024) return ElMessage.error('图片不能超过10MB')

  const url = URL.createObjectURL(uploadedFile)
  file.value = uploadedFile
  previewUrl.value = url
}

const clearImage = () => {
  file.value = null
  previewUrl.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

// 多图上传逻辑
const triggerMultiUpload = () => multiFileInput.value?.click()

const handleMultiFileChange = (e: Event) => {
  const uploadedFiles = (e.target as HTMLInputElement).files
  if (!uploadedFiles) return

  for (const uploadedFile of Array.from(uploadedFiles)) {
    if (!uploadedFile.type.startsWith('image/')) continue
    if (uploadedFile.size > 10 * 1024 * 1024) {
      ElMessage.error(`图片 ${uploadedFile.name} 不能超过10MB`)
      continue
    }

    const url = URL.createObjectURL(uploadedFile)
    multiPreviewUrls.value.push({ file: uploadedFile, url })
    multiFiles.value.push(uploadedFile)
  }

  if (multiFileInput.value) multiFileInput.value.value = ''
}

const removeMultiImage = (index: number) => {
  multiPreviewUrls.value.splice(index, 1)
  multiFiles.value.splice(index, 1)
}

const clearMultiImages = () => {
  multiFiles.value = []
  multiPreviewUrls.value = []
  if (multiFileInput.value) multiFileInput.value.value = ''
}

// 生成逻辑
const handleGenerate = async () => {
  if (!isReady.value) return

  loading.value = true
  error.value = ''
  resultUrl.value = ''
  status.value = 'PENDING'

  try {
    const formData = new FormData()
    formData.append('prompt', form.prompt)
    formData.append('ratio', form.ratio)
    formData.append('model', form.model) // 传递模型选择
    formData.append('multiImageMode', String(form.multiImageMode)) // 多图模式标志

    if (form.model === 'doubao' && form.multiImageMode) {
      // 豆包多图模式：合并单图区域和多图区域的图片
      if (file.value) {
        formData.append('images', file.value) // 添加单图区域的图片
      }
      multiFiles.value.forEach(f => {
        formData.append('images', f) // 添加多图区域的图片
      })
    } else {
      // 单图模式：上传单张图片
      formData.append('imageBody', file.value!)
    }

    // 创建30分钟的超时控制器（冷启动可能需要很长时间）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000)

    const response = await fetch('http://localhost:3000/api/generate/img2img', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    const data = await response.json()

    if (data.success) {
      taskId.value = data.taskId
      pollStatus(data.taskId)
    } else {
      throw new Error(data.error || '提交失败')
    }
  } catch (err: any) {
    console.error('❌ [生成失败] 错误详情:', err)

    // 处理超时错误
    if (err.name === 'AbortError') {
      error.value = '请求超时，请稍后重试或检查网络连接'
    } else {
      error.value = err.message || '生成失败，请检查网络连接'
    }
    loading.value = false
    status.value = 'FAILED'
  }
}

const pollStatus = (id: number) => {
  if (pollTimer) clearInterval(pollTimer)
  
  pollTimer = setInterval(async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/status/${id}`)
      const data = await response.json()
      status.value = data.status
      
      if (data.status === 'COMPLETED') {
        clearInterval(pollTimer)
        loading.value = false
        resultUrl.value = data.resultUrl || data.videoUrl
        ElMessage.success('合成完成！')
      } else if (data.status === 'FAILED') {
        clearInterval(pollTimer)
        loading.value = false
        error.value = '生成失败，请检查后端日志'
      }
    } catch (e) { console.error(e) }
  }, 3000)
}

const handleRegenerate = () => handleGenerate()

const handleClearAll = () => {
  localStorage.removeItem('img2img_state')
  form.prompt = ''
  form.model = 'comfyui' // 重置模型选择
  form.multiImageMode = false // 重置多图模式
  resultUrl.value = ''
  clearImage()
  clearMultiImages()
  error.value = ''
  taskId.value = null
  status.value = ''
  loading.value = false
  if (pollTimer) clearInterval(pollTimer)
}

const downloadImage = async () => {
  if (!resultUrl.value) return
  try {
    const response = await fetch(resultUrl.value)
    if (!response.ok) throw new Error('下载失败')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `flux-remix-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
  } catch (error) {
    console.error('下载失败:', error)
  }
}
</script>

<style lang="scss" scoped>
/* 核心波普色板 */
$bg-color: #FBF8F3;
$dark: #1A1A1A;
$yellow: #FFD93D;
$blue: #4D96FF;
$pink: #FF6B6B;
$green: #6BCB77;

.pop-layout {
  min-height: 100vh;
  background-color: $bg-color;
  background-image: radial-gradient($pink 1px, transparent 1px); /* 图生图用粉色点 */
  background-size: 30px 30px;
  padding: 20px;
  color: $dark;
}

/* 顶部标题 */
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
    
    &.green { background: $green; color: $dark; }
  }
  
  .main-title {
    font-size: 36px;
    font-weight: 900;
    margin: 0;
    
    span {
      color: $pink;
      text-decoration: underline wavy $yellow 3px;
    }
  }
  
  .subtitle {
    margin-top: 8px;
    color: #666;
    font-weight: 500;
  }
}

.workspace {
  display: grid;
  grid-template-columns: 450px 1fr; /* 左侧稍宽一点，放两个上传框 */
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}

/* 左侧控制面板 */
.control-panel {
  background: white;
  border: 3px solid $dark;
  border-radius: 20px;
  box-shadow: 8px 8px 0 $dark;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  
  .panel-section {
    .section-label {
      font-weight: 800;
      font-size: 16px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: $dark;
    }
  }
}

/* 上传网格 */
.upload-grid {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .plus-sign {
    font-size: 24px;
    font-weight: 900;
    color: $dark;
  }
  
  .upload-card {
    flex: 1;
    border: 2px dashed #ccc;
    border-radius: 12px;
    height: 180px;
    position: relative;
    cursor: pointer;
    background: #FAFAFA;
    transition: all 0.2s;
    overflow: hidden;
    
    &:hover {
      border-color: $blue;
      background: #F0F9FF;
    }
    
    .card-header-tag {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      padding: 4px;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      color: white;
      z-index: 2;
      
      &.blue { background: $blue; }
      &.pink { background: $pink; }
    }
    
    .preview-area {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: 20px;
      
      &.has-image {
        padding: 0;
        border: 2px solid $dark; /* 上传后变实线 */
      }
      
      .preview-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .placeholder {
        text-align: center;
        
        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
          color: white;
          
          &.blue-bg { background: $blue; }
          &.pink-bg { background: $pink; }
        }
        
        p { font-size: 12px; font-weight: bold; margin: 0; color: $dark; }
        span { font-size: 10px; color: #999; }
      }
      
      .delete-btn {
        position: absolute;
        top: 24px; /* 避开 header tag */
        right: 4px;
        background: $pink;
        color: white;
        border: 1px solid white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        line-height: 18px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover { transform: scale(1.1); }
      }
    }
  }
}

/* 输入框美化 */
.input-wrapper {
  :deep(.el-textarea__inner) {
    border: 2px solid $dark;
    border-radius: 12px;
    background: #F5F5F5;
    padding: 12px;
    font-size: 14px;
    box-shadow: none;
    transition: all 0.2s;

    &:focus {
      background: white;
      box-shadow: 4px 4px 0 $pink;
    }
  }
}

/* 多图模式设置 */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #F5F5F5;
  border-radius: 12px;
  border: 2px solid #E0E0E0;

  span {
    font-weight: bold;
    font-size: 14px;
    color: $dark;
  }
}

.multi-upload-area {
  margin-top: 16px;
}

.multi-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.multi-image-item {
  position: relative;
  aspect-ratio: 1;
  border: 2px solid $dark;
  border-radius: 8px;
  overflow: hidden;

  .multi-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .multi-index {
    position: absolute;
    top: 4px;
    left: 4px;
    background: $dark;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
  }

  .multi-delete {
    position: absolute;
    top: 4px;
    right: 4px;
    background: $pink;
    color: white;
    border: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.multi-add-btn {
  aspect-ratio: 1;
  border: 2px dashed $blue;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  background: #F0F9FF;
  transition: all 0.2s;

  &:hover {
    background: #E1F5FE;
    transform: scale(1.02);
  }

  .el-icon {
    font-size: 24px;
    color: $blue;
  }

  span {
    font-size: 12px;
    font-weight: bold;
    color: $blue;
  }
}

.hint-text {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  padding: 10px;
  background: #FFF3E0;
  border-radius: 8px;
  border-left: 3px solid #FFB300;
}

/* 画幅选择 */
.ratio-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

/* 模型选择 */
.model-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.model-card {
  position: relative;
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;

  .model-icon {
    font-size: 32px;
  }

  .model-info {
    flex: 1;

    .model-name {
      font-size: 14px;
      font-weight: bold;
      color: $dark;
      margin-bottom: 4px;
    }

    .model-desc {
      font-size: 11px;
      color: #666;
    }
  }

  .model-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: $green;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
  }

  &.active {
    border-color: $dark;
    background: linear-gradient(135deg, #FFF9E1 0%, #FFE0B2 100%);
    box-shadow: 3px 3px 0 $dark;

    .model-name {
      color: $dark;
    }
  }

  &:hover:not(.active) {
    border-color: $blue;
    background: rgba(77, 150, 255, 0.05);
    transform: translateY(-2px);
    box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
  }
}

.ratio-btn {
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  .ratio-box {
    width: 24px;
    background: #DDD;
    border: 2px solid #999;
    border-radius: 4px;
  }
  
  span { font-size: 12px; font-weight: bold; color: #666; }
  
  &.active {
    border-color: $dark;
    background: #FFF8E1;
    box-shadow: 3px 3px 0 $yellow;
    
    .ratio-box { background: white; border-color: $dark; }
    span { color: $dark; }
  }
}

/* 生成按钮 */
.generate-btn {
  width: 100%;
  height: 56px;
  background: $dark;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 6px 6px 0 $pink; /* 换成粉色阴影 */
  transition: all 0.1s;
  
  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 $pink;
  }
  
  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 $pink;
  }
  
  &:disabled {
    background: #999;
    box-shadow: none;
    cursor: not-allowed;
  }
}

/* 右侧预览面板 */
.preview-panel {
  min-height: 600px;
  background: white;
  border: 3px solid $dark;
  border-radius: 20px;
  box-shadow: 8px 8px 0 rgba(0,0,0,0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.empty-state {
  text-align: center;
  color: #999;
  .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
  h3 { color: $dark; margin-bottom: 8px; }
}

.loading-container {
  text-align: center;
  
  .loader-animation {
    font-size: 48px;
    animation: pulse 1.5s infinite;
    margin-bottom: 16px;
  }
  
  .loading-bar {
    width: 200px;
    height: 10px;
    background: #eee;
    border-radius: 10px;
    margin: 10px auto;
    overflow: hidden;
    border: 1px solid $dark;
    
    .bar-fill {
      height: 100%;
      background: repeating-linear-gradient(
        45deg,
        $green,
        $green 10px,
        $yellow 10px,
        $yellow 20px
      );
      width: 100%;
      animation: progress 20s linear infinite;
    }
  }
}

.result-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  
  .image-frame {
    position: relative;
    padding: 10px;
    background: white;
    border: 3px solid $dark;
    box-shadow: 8px 8px 0 $dark;
    border-radius: 4px;
    
    .main-image {
      max-height: 600px;
      display: block;
      border: 1px solid #eee;
    }
    
    .frame-tag {
      position: absolute;
      top: -15px;
      right: -10px;
      background: $blue;
      color: white;
      padding: 4px 12px;
      font-weight: bold;
      font-size: 12px;
      border: 2px solid $dark;
      transform: rotate(5deg);
    }
  }
  
  .action-bar {
    display: flex;
    gap: 16px;
    
    .action-btn {
      padding: 10px 20px;
      border: 2px solid $dark;
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      background: white;
      box-shadow: 3px 3px 0 rgba(0,0,0,0.2);
      
      &:hover { transform: translateY(-2px); }
      &:active { transform: translateY(1px); box-shadow: none; }
      
      &.green { color: $green; &:hover { background: #E8F5E9; } }
      &.yellow { color: #F57C00; &:hover { background: #FFF3E0; } }
      &.red { color: $pink; &:hover { background: #FFEBEE; } }
    }
  }
}

.error-toast {
  position: absolute;
  bottom: 20px;
  background: $pink;
  color: white;
  padding: 10px 20px;
  border-radius: 50px;
  border: 2px solid $dark;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
  
  button {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(0); }
}

@media (max-width: 900px) {
  .workspace { grid-template-columns: 1fr; }
  .upload-grid { flex-direction: column; }
  .plus-sign { transform: rotate(90deg); margin: 5px 0; }
  .ratio-grid { grid-template-columns: repeat(4, 1fr); }
  .model-grid { grid-template-columns: 1fr; }
}
</style>