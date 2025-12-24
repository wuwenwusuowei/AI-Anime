<template>
  <div class="img2vid-container">
    <el-card class="main-card" shadow="hover">
      <div class="content-wrapper">
        <!-- 左侧控制面板 -->
        <div class="control-panel">
          <div class="panel-header">
            <h3>参数配置</h3>
          </div>

          <el-form :model="form" label-position="top" class="generation-form">
            <!-- 图片上传 -->
            <el-form-item label="上传图片">
              <el-upload
                v-model:file-list="fileList"
                :auto-upload="false"
                :limit="1"
                :on-change="handleFileChange"
                :on-exceed="handleExceed"
                :on-remove="handleRemove"
                list-type="picture-card"
                accept="image/*"
                :disabled="isGenerating"
                drag
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
            </el-form-item>

            <!-- 提示词 -->
            <el-form-item label="视频描述">
              <el-input
                v-model="form.prompt"
                type="textarea"
                :rows="3"
                placeholder="描述您想要的视频内容，例如：人物挥手微笑、樱花飘落..."
                maxlength="500"
                show-word-limit
                :disabled="isGenerating"
              />
            </el-form-item>

            <!-- 画质选择 -->
            <el-form-item label="视频画质">
              <el-radio-group v-model="form.resolution" :disabled="isGenerating">
                <el-radio label="576p" border>576p (1024×576)</el-radio>
                <el-radio label="720p" border>720p (1280×720)</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 时长选择 -->
            <el-form-item label="视频时长">
              <el-slider
                v-model="durationValue"
                :min="1"
                :max="5"
                :step="1"
                :marks="durationMarks"
                show-input
                :disabled="isGenerating"
              />
              <div class="slider-hint">推荐：3秒（显存占用适中）</div>
            </el-form-item>

            <!-- 生成按钮 -->
            <div class="action-buttons">
              <el-button
                type="primary"
                size="large"
                :loading="isGenerating"
                :disabled="!uploadedFile"
                @click="handleGenerate"
                class="generate-btn"
              >
                <el-icon v-if="!isGenerating"><VideoPlay /></el-icon>
                {{ isGenerating ? '生成中...' : '开始生成' }}
              </el-button>

              <el-button
                size="large"
                @click="handleReset"
                :disabled="isGenerating"
                class="reset-btn"
              >
                重置
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 右侧预览区 -->
        <div class="preview-panel">
          <div class="panel-header">
            <h3>生成结果</h3>
            <div class="header-actions">
              <el-button
                v-if="generatedVideo"
                type="primary"
                plain
                size="small"
                @click="downloadVideo"
              >
                <el-icon><Download /></el-icon>
                下载视频
              </el-button>
            </div>
          </div>

          <div class="preview-content">
            <!-- 空状态 -->
            <div v-if="!uploadedFile && !isGenerating" class="empty-state">
              <el-icon size="64"><VideoCamera /></el-icon>
              <p>请上传图片后点击生成按钮</p>
            </div>

            <!-- 已上传，未生成状态 -->
            <div v-if="uploadedFile && !isGenerating && !generatedVideo" class="uploaded-state">
              <img v-if="previewUrl" :src="previewUrl" class="preview-image" alt="预览" />
              <p class="preview-text">准备就绪，点击"开始生成"</p>
            </div>

            <!-- 生成中状态 -->
            <div v-if="isGenerating" class="generating-state">
              <el-progress
                type="circle"
                :percentage="progress"
                :width="120"
                :stroke-width="8"
                :status="progressStatus"
              >
                <template #default="{ percentage }">
                  <span class="progress-text">{{ percentage }}%</span>
                </template>
              </el-progress>
              <p class="progress-label">{{ progressText }}</p>
              <p v-if="taskId" class="task-id">任务ID: {{ taskId }}</p>
            </div>

            <!-- 生成结果 -->
            <div v-if="generatedVideo" class="result-state">
              <div class="video-container">
                <video
                  :src="generatedVideo"
                  controls
                  class="generated-video"
                  @error="handleVideoError"
                >
                  您的浏览器不支持视频播放。
                </video>
              </div>

              <!-- 视频信息 -->
              <div class="video-info">
                <div class="info-item">
                  <span class="label">状态：</span>
                  <span class="value success">✓ 生成成功</span>
                </div>
                <div class="info-item">
                  <span class="label">画质：</span>
                  <span class="value">{{ form.resolution === '576p' ? '576p (1024×576)' : '720p (1280×720)' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">时长：</span>
                  <span class="value">{{ form.duration }} 秒</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadUserFile, UploadFile } from 'element-plus'
import axios from 'axios'
import { VideoPlay, Download, Plus, VideoCamera } from '@element-plus/icons-vue'

// 配置 axios baseURL
const apiBaseUrl = 'http://localhost:3000'

// 响应式数据
const isGenerating = ref(false)
const progress = ref(0)
const progressText = ref('')
const progressStatus = ref<'' | 'success' | 'exception'>('')
const generatedVideo = ref('')
const fileList = ref<UploadUserFile[]>([])
const uploadedFile = ref<File | null>(null)
const previewUrl = ref('')
const taskId = ref<number | null>(null)
let pollingTimer: any = null

// 表单数据
const form = reactive({
  prompt: '',
  resolution: '576p',
  duration: '3'
})

// 计算属性：duration 的滑块值（数字类型）
const durationValue = computed({
  get: () => parseInt(form.duration),
  set: (val: number) => {
    form.duration = val.toString()
  }
})

// 时长刻度
const durationMarks = {
  1: '1s',
  2: '2s',
  3: '3s',
  4: '4s',
  5: '5s'
}

// 文件处理
const handleFileChange = (file: UploadFile, newFileList: UploadUserFile[]) => {
  if (newFileList.length > 0) {
    uploadedFile.value = newFileList[0].raw as File
    // 生成预览URL
    if (file.url) {
      previewUrl.value = file.url
    } else if (file.raw) {
      previewUrl.value = URL.createObjectURL(file.raw)
    }
  }
}

const handleExceed = () => {
  ElMessage.warning('只能上传一张图片')
}

const handleRemove = () => {
  uploadedFile.value = null
  previewUrl.value = ''
}

// 提交任务
const handleGenerate = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  isGenerating.value = true
  progress.value = 10
  progressText.value = '正在上传图片...'
  progressStatus.value = ''
  generatedVideo.value = ''

  const formData = new FormData()
  formData.append('image', uploadedFile.value)
  formData.append('prompt', form.prompt)
  formData.append('resolution', form.resolution)
  formData.append('duration', form.duration)

  try {
    // 提交任务
    const res = await axios.post(`${apiBaseUrl}/api/generate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.data.success) {
      taskId.value = res.data.taskId
      progress.value = 20
      progressText.value = '任务已提交，正在处理...'
      // 开始轮询
      startPolling(res.data.taskId)
    } else {
      throw new Error('任务提交失败')
    }
  } catch (error: any) {
    console.error('Generate error:', error)
    ElMessage.error(error.response?.data?.error || '任务提交失败')
    isGenerating.value = false
    progress.value = 0
  }
}

// 轮询状态
const startPolling = (id: number) => {
  pollingTimer = setInterval(async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/status/${id}`)
      const { status, videoUrl } = res.data

      if (status === 'PENDING') {
        progress.value = 30
        progressText.value = '等待处理...'
      } else if (status === 'PROCESSING') {
        progress.value = Math.min(80, progress.value + 5)
        progressText.value = '正在生成视频，请稍候...'
      } else if (status === 'COMPLETED') {
        clearInterval(pollingTimer)
        progress.value = 100
        progressText.value = '生成完成！'
        progressStatus.value = 'success'
        generatedVideo.value = videoUrl
        ElMessage.success('视频生成成功！')

        setTimeout(() => {
          isGenerating.value = false
        }, 1000)
      } else if (status === 'FAILED') {
        clearInterval(pollingTimer)
        progress.value = 0
        progressStatus.value = 'exception'
        progressText.value = '生成失败'
        ElMessage.error('生成失败，请重试')
        isGenerating.value = false
      }
    } catch (e: any) {
      console.error('Polling error:', e)
      clearInterval(pollingTimer)
      isGenerating.value = false
      ElMessage.error('查询状态失败')
    }
  }, 2000)
}

// 重置表单
const handleReset = () => {
  if (isGenerating.value && pollingTimer) {
    clearInterval(pollingTimer)
  }

  form.prompt = ''
  form.resolution = '576p'
  form.duration = '3'
  uploadedFile.value = null
  fileList.value = []
  generatedVideo.value = ''
  previewUrl.value = ''
  taskId.value = null
  progress.value = 0
  progressText.value = ''
  progressStatus.value = ''
}

// 下载视频
const downloadVideo = () => {
  if (!generatedVideo.value) return

  const link = document.createElement('a')
  link.href = generatedVideo.value
  link.download = `video-${Date.now()}.mp4`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('下载已开始')
}

// 视频错误处理
const handleVideoError = () => {
  ElMessage.error('视频加载失败，请检查视频链接')
}

// 组件卸载时清理轮询
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style lang="scss" scoped>
.img2vid-container {
  height: 100%;

  .main-card {
    height: calc(100vh - 140px);
    border: none;
    border-radius: 16px;

    .content-wrapper {
      display: flex;
      height: 100%;
      gap: 24px;
    }
  }
}

.control-panel {
  flex: 1;
  max-width: 450px;
  border-right: 1px solid var(--el-border-color-light);
  padding-right: 24px;

  .panel-header {
    margin-bottom: 24px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
    }
  }

  .generation-form {
    .el-form-item {
      margin-bottom: 24px;

      :deep(.el-form-item__label) {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .slider-hint {
      text-align: center;
      margin-top: 8px;
      color: var(--el-color-info);
      font-size: 12px;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 24px;

    .generate-btn {
      flex: 1;
      height: 44px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
    }

    .reset-btn {
      height: 44px;
      border-radius: 8px;
    }
  }
}

.preview-panel {
  flex: 1;
  padding-left: 24px;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .preview-content {
    height: calc(100% - 60px);
    display: flex;
    align-items: center;
    justify-content: center;

    .empty-state,
    .uploaded-state {
      text-align: center;
      color: var(--el-text-color-secondary);

      .el-icon {
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .preview-image {
        max-width: 300px;
        max-height: 300px;
        border-radius: 12px;
        box-shadow: var(--el-box-shadow-light);
        margin-bottom: 16px;
      }

      .preview-text {
        font-size: 16px;
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }

    .generating-state {
      text-align: center;

      .progress-text {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-color-primary);
      }

      .progress-label {
        margin-top: 16px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }

      .task-id {
        margin-top: 8px;
        color: var(--el-text-color-placeholder);
        font-size: 12px;
      }
    }

    .result-state {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .video-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-fill-color-light);
      border-radius: 12px;
      padding: 20px;

      .generated-video {
        max-width: 100%;
        max-height: 100%;
        border-radius: 8px;
        box-shadow: var(--el-box-shadow);
      }
    }

    .video-info {
      background: var(--el-bg-color);
      border-radius: 12px;
      padding: 16px;

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 600;
          color: var(--el-text-color-secondary);
        }

        .value {
          color: var(--el-text-color-primary);

          &.success {
            color: var(--el-color-success);
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .content-wrapper {
    flex-direction: column !important;
  }

  .control-panel {
    max-width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
    padding-right: 0;
    padding-bottom: 24px;
  }

  .preview-panel {
    padding-left: 0;
    padding-top: 24px;
  }
}
</style>
