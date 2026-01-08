<template>
  <div class="pop-layout">
    <!-- 顶部标题区 -->
    <div class="page-header">
      <div class="title-badge">
        <el-icon><MagicStick /></el-icon>
        <span>创意工坊</span>
      </div>
      <h1 class="main-title">文生图 <span>Generator</span></h1>
    </div>

    <div class="workspace">
      <!-- 左侧：控制面板 (参数设置) -->
      <div class="control-panel">
        
        <!-- 1. 提示词输入 -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><EditPen /></el-icon> 画面描述
          </div>
          <div class="input-wrapper">
            <el-input
              v-model="form.prompt"
              type="textarea"
              :rows="5"
              placeholder="✨ 描述你的梦境... (例如：赛博朋克少女，银色双马尾，坐在悬浮的霓虹王座上，雨夜背景)"
              resize="none"
              maxlength="2000"
              show-word-limit
            />
          </div>
        </div>

        <!-- 2. 风格选择 -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><Brush /></el-icon> 艺术风格
          </div>
          <div class="style-grid">
            <div
              v-for="option in styleOptions"
              :key="option.value"
              class="style-card"
              :class="{ active: form.style === option.value }"
              @click="form.style = option.value"
            >
              <div class="style-icon">{{ option.icon }}</div>
              <div class="style-name">{{ option.label }}</div>
              <div class="check-mark" v-if="form.style === option.value">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 画幅选择 (可视化按钮) -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><FullScreen /></el-icon> 画幅比例
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
          :disabled="loading || !form.prompt"
        >
          <span v-if="!loading">🚀 开始生成</span>
          <span v-else>
            <el-icon class="is-loading"><Loading /></el-icon> 正在绘制中...
          </span>
        </button>
      </div>

      <!-- 右侧：画布/结果预览 -->
      <div class="preview-panel">
        <!-- 状态A：生成成功 -->
        <div v-if="resultUrl" class="result-container">
          <div class="image-frame">
            <el-image 
              :src="resultUrl" 
              fit="contain" 
              :preview-src-list="[resultUrl]"
              class="main-image"
            />
            <div class="frame-tag">Completed</div>
          </div>
          
          <div class="action-bar">
            <button class="action-btn green" @click="downloadImage">
              <el-icon><Download /></el-icon> 下载
            </button>
            <button class="action-btn yellow" @click="handleRegenerate">
              <el-icon><Refresh /></el-icon> 再来一张
            </button>
            <button class="action-btn red" @click="handleClearAll">
              <el-icon><Delete /></el-icon> 清空
            </button>
          </div>
        </div>

        <!-- 状态B：生成中 -->
        <div v-else-if="loading" class="loading-container">
          <div class="loader-animation">🎨</div>
          <h3>AI 画师正在挥洒创意...</h3>
          <p>任务ID: {{ taskId || 'Preparing' }}</p>
          <div class="loading-bar">
            <div class="bar-fill"></div>
          </div>
        </div>

        <!-- 状态C：空闲/等待 -->
        <div v-else class="empty-state">
          <div class="empty-icon">🖼️</div>
          <h3>预览区域</h3>
          <p>在左侧输入描述，见证奇迹发生</p>
        </div>
        
        <!-- 错误提示条 -->
        <div v-if="error" class="error-toast">
          <el-icon><Warning /></el-icon> {{ error }}
          <button @click="error = ''">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Picture, MagicStick, Clock, SuccessFilled, Loading, Download, Refresh, Delete, 
  EditPen, Brush, FullScreen, Check, Warning 
} from '@element-plus/icons-vue'

// --- 数据定义 ---
const form = reactive({
  prompt: '',
  ratio: '9:16',
  style: 'default'
})

// 风格配置
const styleOptions = [
  { label: '默认风格', value: 'default', icon: '🎨' },
  { label: '国风少女', value: 'guofeng', icon: '🏮' },
  { label: 'AI动漫', value: 'ai_anime', icon: '✨' },
  { label: '日漫风格', value: 'japan_anime', icon: '🗾' },
  { label: '3D动漫', value: '3d_anime', icon: '🧊' },
  { label: '彩绘玻璃', value: 'stained_glass', icon: '🪟' },
  { label: '动漫截图', value: 'screencap', icon: '📺' },
  { label: '半写实', value: 'semi_real', icon: '🖼️' }
]

// 画幅配置 (用于渲染可视化按钮)
const ratioOptions = [
  { label: '9:16', value: '9:16', ratioVal: '9/16' },
  { label: '1:1', value: '1:1', ratioVal: '1/1' },
  { label: '16:9', value: '16:9', ratioVal: '16/9' },
  { label: '3:4', value: '3:4', ratioVal: '3/4' },
]

// 状态管理
const loading = ref(false)
const taskId = ref<number | null>(null)
const status = ref('')
const resultUrl = ref('')
const error = ref('')
let pollTimer: any = null

// --- 逻辑部分 (保持原有力，增加样式联动) ---

const loadState = () => {
  try {
    const saved = localStorage.getItem('txt2img_state')
    if (saved) {
      const state = JSON.parse(saved)
      form.prompt = state.prompt || ''
      form.ratio = state.ratio || '9:16'
      form.style = state.style || 'default'

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
  const previousState = JSON.parse(localStorage.getItem('txt2img_state') || '{}')

  const state = {
    prompt: form.prompt,
    ratio: form.ratio,
    style: form.style,
    taskId: taskId.value,
    status: status.value,
    // 如果当前有结果就用当前的，否则保留之前的结果
    resultUrl: resultUrl.value || previousState.resultUrl || ''
  }
  localStorage.setItem('txt2img_state', JSON.stringify(state))
}

watch([form, taskId, status, resultUrl], () => saveState(), { deep: true })

onMounted(() => loadState())
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

const handleGenerate = async () => {
  if (!form.prompt) return
  
  loading.value = true
  error.value = ''
  resultUrl.value = ''
  status.value = 'PENDING'
  
  try {
    const response = await fetch('http://localhost:3000/api/generate/txt2img', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await response.json()
    
    if (data.success) {
      taskId.value = data.taskId
      pollStatus(data.taskId)
    } else {
      throw new Error(data.error || '提交失败')
    }
  } catch (err: any) {
    error.value = err.message
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
        resultUrl.value = data.resultUrl || data.videoUrl // 兼容后端返回字段
        ElMessage.success('绘制完成！')
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
  localStorage.removeItem('txt2img_state')
  form.prompt = ''
  resultUrl.value = ''
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
    link.download = `anime-gen-${Date.now()}.png`
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
  background-image: radial-gradient($blue 1px, transparent 1px);
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
  }
  
  .main-title {
    font-size: 36px;
    font-weight: 900;
    margin: 0;
    
    span {
      color: $blue;
      text-decoration: underline wavy $yellow 3px;
    }
  }
}

/* 工作区布局 */
.workspace {
  display: grid;
  grid-template-columns: 400px 1fr; /* 左固定，右自适应 */
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}

/* --- 左侧控制面板 --- */
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

/* 风格选择网格 */
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.style-card {
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  padding: 10px 4px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  
  &:hover {
    border-color: $blue;
    transform: translateY(-2px);
  }
  
  &.active {
    border-color: $dark;
    background: #ECF5FF;
    box-shadow: 3px 3px 0 $blue;
    
    .check-mark {
      position: absolute;
      top: -6px;
      right: -6px;
      background: $blue;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
  }
  
  .style-icon { font-size: 24px; margin-bottom: 4px; }
  .style-name { font-size: 12px; font-weight: bold; }
}

/* 画幅选择 (Radio Button 改造) */
.ratio-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
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
    background: #FFF8E1; /* 浅黄背景 */
    box-shadow: 3px 3px 0 $yellow;
    
    .ratio-box {
      background: white;
      border-color: $dark;
    }
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
  box-shadow: 6px 6px 0 $green; /* 绿色硬阴影 */
  transition: all 0.1s;
  
  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 $green;
  }
  
  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 $green;
  }
  
  &:disabled {
    background: #999;
    box-shadow: none;
    cursor: not-allowed;
  }
}

/* --- 右侧预览面板 --- */
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

/* 1. 空状态 */
.empty-state {
  text-align: center;
  color: #999;
  .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
  h3 { color: $dark; margin-bottom: 8px; }
}

/* 2. 加载状态 */
.loading-container {
  text-align: center;
  
  .loader-animation {
    font-size: 48px;
    animation: bounce 1s infinite;
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
        $blue,
        $blue 10px,
        $yellow 10px,
        $yellow 20px
      );
      width: 100%;
      animation: progress 20s linear infinite; /* 假进度条 */
    }
  }
}

/* 3. 结果展示 */
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
      background: $green;
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

/* 错误提示 */
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

/* 动画 */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(0); }
}

/* 移动端适配 */
@media (max-width: 900px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  
  .style-grid, .ratio-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>