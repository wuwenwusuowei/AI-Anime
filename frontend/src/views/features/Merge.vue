<template>
  <div class="pop-layout">
    <div class="page-header">
      <div class="title-badge green">
        <el-icon><Connection /></el-icon>
        <span>漫改视频工作室</span>
      </div>
      <h1 class="main-title">漫改视频 <span>Anime to Video</span></h1>
      <p class="subtitle">将多个视频片段无缝拼接,打造完整作品</p>
    </div>
code
Code
<div class="workspace">
  <!-- 左侧:图片上传区 -->
  <div class="control-panel">
    <!-- 所有内容在一个框里 -->
    <div class="panel-section">
      <div class="section-label">
        <el-icon><Picture /></el-icon> 原始素材
      </div>

      <div
        class="clapperboard-upload"
        :class="{ 'has-image': mergeItems.length > 0 }"
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
            multiple
            hidden
          >
          <input
            type="file"
            ref="multiFileInput"
            @change="handleMultiFileChange"
            accept="image/*"
            multiple
            hidden
          >

          <div v-if="mergeItems.length > 0" class="preview-wrapper">
            <div class="images-grid">
              <div v-for="(item, index) in mergeItems" :key="item.id" class="image-item">
                <img :src="item.originalUrl" class="thumb-image" />
                <button class="thumb-delete-btn" @click.stop="handleRemove(item.id)">
                  <el-icon><Close /></el-icon>
                </button>
              </div>

              <!-- 继续添加按钮 -->
              <div class="image-item add-more-item" @click.stop="triggerUpload">
                <el-icon><Plus /></el-icon>
                <span>添加更多</span>
              </div>
            </div>

            <div class="upload-footer">
              <div class="image-count">已选 {{ mergeItems.length }} 张图片</div>
              <button class="clear-all-btn" @click.stop="handleClearAll">
                <el-icon><Delete /></el-icon>
                清空全部
              </button>
            </div>
          </div>

          <div v-else class="placeholder">
            <div class="icon-box">
              <el-icon><Plus /></el-icon>
            </div>
            <h3>点击上传图片</h3>
            <p>支持 JPG / PNG,建议尺寸 1024px+</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 右侧:预览区 -->
  <div class="control-column">
    <div class="bento-card preview-card">
      <div class="card-label pink">
        <el-icon><VideoPlay /></el-icon> 拼接预览
      </div>

      <!-- 拼接条目列表 -->
      <div class="merge-items-container">
        <!-- 预览条目示例 -->
        <div class="merge-item demo-item" v-if="mergeItems.length === 0">
          <div class="item-left">
            <div class="item-label">原始图片</div>
            <div class="item-image placeholder-box">
              <el-icon><Picture /></el-icon>
              <span>等待上传</span>
            </div>
          </div>

          <div class="item-center">
            <div class="item-label">导演指令</div>
            <el-input
              type="textarea"
              :rows="3"
              placeholder="✨ 描述故事如何进行..."
              resize="none"
              maxlength="5000"
              class="merge-prompt-input demo-input"
              disabled
            />
            <el-button
              type="primary"
              class="merge-generate-btn"
              disabled
            >
              <el-icon><VideoCamera /></el-icon>
              生成图片
            </el-button>
          </div>

          <div class="item-right">
            <div class="item-label">生成结果</div>
            <div class="generated-image-wrapper">
              <div class="generated-image placeholder-box">
                <el-icon><Picture /></el-icon>
                <span>等待生成</span>
              </div>
            </div>
            <el-button
              type="success"
              size="small"
              class="next-step-btn"
              disabled
            >
              <el-icon><Check /></el-icon>
              下一步
            </el-button>
          </div>
        </div>

          <!-- 实际数据条目列表 -->
        <div class="merge-item" v-for="(item, index) in mergeItems" :key="item.id">
          <div class="item-left">
            <div class="item-label">原始图片 {{ index + 1 }}</div>
            <div class="item-image">
              <img v-if="item.originalUrl" :src="item.originalUrl" />
              <div v-else class="reupload-hint">
                <el-icon><Warning /></el-icon>
                <span>图片已失效<br/>请重新上传</span>
              </div>
            </div>
            <!-- 状态标签 -->
            <div class="status-badge" :style="{ backgroundColor: getStatusColor(item.status) }">
              {{ getStatusText(item.status) }}
            </div>
          </div>

          <div class="item-center">
            <div class="item-label">导演指令 {{ index + 1 }}</div>
            <el-input
              v-model="item.prompt"
              type="textarea"
              :rows="3"
              placeholder="✨ 描述故事如何进行..."
              resize="none"
              maxlength="5000"
              class="merge-prompt-input"
              :disabled="item.status === 'i2v'"
            />

            <!-- 画幅选择 (仅在upload或error状态显示) -->
            <div v-if="item.status === 'upload' || item.status === 'error'" class="ratio-selection">
              <div class="ratio-label">目标画幅</div>
              <div class="ratio-grid">
                <div
                  v-for="r in ratioOptions"
                  :key="r.value"
                  class="ratio-btn"
                  :class="{ active: item.ratio === r.value }"
                  @click="item.ratio = r.value"
                >
                  <div class="ratio-box" :style="{ aspectRatio: r.ratioVal }"></div>
                  <span>{{ r.label }}</span>
                </div>
              </div>
            </div>

            <!-- 模型选择 (仅在upload或error状态显示) -->
            <div v-if="item.status === 'upload' || item.status === 'error'" class="model-selection">
              <div class="model-label">
                <el-icon><MagicStick /></el-icon> 图生图模型
              </div>
              <div class="model-grid">
                <div
                  v-for="m in modelOptions"
                  :key="m.value"
                  class="model-card-mini"
                  :class="{ active: item.model === m.value }"
                  @click="item.model = m.value"
                >
                  <span class="model-icon-mini">{{ m.icon }}</span>
                  <span class="model-name-mini">{{ m.label }}</span>
                </div>
              </div>
            </div>

            <!-- 豆包多图模式 (仅在选择豆包模型时显示) -->
            <div v-if="item.model === 'doubao' && (item.status === 'upload' || item.status === 'error')" class="multi-image-section">
              <div class="multi-mode-toggle">
                <span>启用多图参考</span>
                <el-switch v-model="item.multiImageMode" size="small" />
              </div>

              <!-- 多图上传区 -->
              <div v-if="item.multiImageMode" class="multi-images-grid-mini">
                <div
                  v-for="(img, imgIdx) in item.multiPreviewUrls"
                  :key="imgIdx"
                  class="multi-image-item-mini"
                >
                  <img :src="img.url" class="multi-img-mini" />
                  <div class="multi-index-mini">{{ imgIdx + 1 }}</div>
                  <button class="multi-delete-mini" @click="removeMultiImage(item.id, imgIdx)">×</button>
                </div>
                <div class="multi-add-btn-mini" @click="triggerMultiUpload(item.id)">
                  <el-icon><Plus /></el-icon>
                  <span>添加</span>
                </div>
              </div>
              <p v-if="item.multiImageMode && item.multiPreviewUrls.length === 0" class="hint-text-mini">
                💡 添加多张参考图进行融合生成
              </p>
            </div>

            <!-- 阶段1：图生图按钮 -->
            <el-button
              v-if="item.status === 'upload' || item.status === 'error'"
              type="primary"
              class="merge-generate-btn"
              @click="handleGenerateI2I(item.id)"
              :disabled="generating || !item.prompt"
              :loading="generating && item.status === 'i2i'"
            >
              <el-icon><VideoCamera /></el-icon>
              漫改图片
            </el-button>
            
            <!-- 使用原图按钮 -->
            <el-button
              v-if="item.status === 'upload'"
              type="info"
              class="use-original-btn"
              @click="handleUseOriginalImage(item.id)"
              :disabled="generating"
            >
              <el-icon><Picture /></el-icon>
              使用原图
            </el-button>
            
            <!-- 阶段2：视频生成按钮 -->
            <div v-if="item.status === 'i2i' || item.status === 'completed' || item.status === 'error'" class="video-generation-section">
              <!-- 视频分辨率选择 -->
              <div class="video-ratio-selection">
                <div class="ratio-label">视频分辨率</div>
                <div class="video-ratio-grid">
                  <!-- 横屏组 -->
                  <div class="ratio-group">
                    <div class="ratio-group-label">横屏</div>
                    <div class="ratio-row">
                      <div
                        class="res-btn small"
                        :class="{ active: item.ratio === '16:9' }"
                        @click="item.ratio = '16:9'"
                        title="标准横屏 (1024x576)"
                      >
                        16:9
                        <span class="res-tag">SD</span>
                      </div>
                      <div
                        class="res-btn small"
                        :class="{ active: item.ratio === '16:9-hd' }"
                        @click="item.ratio = '16:9-hd'"
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
                        :class="{ active: item.ratio === '9:16' }"
                        @click="item.ratio = '9:16'"
                        title="手机竖屏 (576x1024)"
                      >
                        9:16
                        <span class="res-tag">SD</span>
                      </div>
                      <div
                        class="res-btn small"
                        :class="{ active: item.ratio === '9:16-hd' }"
                        @click="item.ratio = '9:16-hd'"
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
                        :class="{ active: item.ratio === '1:1' }"
                        @click="item.ratio = '1:1'"
                        title="正方形 (832x832)"
                      >
                        1:1
                      </div>
                      <div
                        class="res-btn small"
                        :class="{ active: item.ratio === '3:4' }"
                        @click="item.ratio = '3:4'"
                        title="复古比例 (1024x768)"
                      >
                        3:4
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 时长模式切换 -->
              <div class="duration-mode-switch">
                <button
                  class="duration-mode-btn"
                  :class="{ active: item.durationMode === 'standard' }"
                  @click="item.durationMode = 'standard'; item.duration = '3'"
                >
                  标准视频
                </button>
                <button
                  class="duration-mode-btn"
                  :class="{ active: item.durationMode === 'long' }"
                  @click="item.durationMode = 'long'; item.duration = '10'"
                >
                  长片段视频
                </button>
              </div>

              <!-- 标准模式：单图/首尾帧模式切换 -->
              <div v-if="item.durationMode === 'standard'" class="dual-mode-switch">
                <button
                  class="dual-mode-btn"
                  :class="{ active: !item.dualImageMode }"
                  @click="item.dualImageMode = false"
                >
                  <span class="mode-icon">🖼️</span>
                  <span>单图模式</span>
                </button>
                <button
                  class="dual-mode-btn"
                  :class="{ active: item.dualImageMode }"
                  @click="item.dualImageMode = true"
                >
                  <span class="mode-icon">🔄</span>
                  <span>首尾帧模式</span>
                </button>
              </div>

              <!-- 标准模式：滑块选择1-5秒 -->
              <div v-if="item.durationMode === 'standard'" class="standard-duration">
                <div class="slider-wrapper">
                  <el-slider
                    v-model="item.duration"
                    :min="1"
                    :max="5"
                    :step="1"
                    :show-tooltip="true"
                    :format-tooltip="(val) => `${val}秒`"
                    class="pop-slider"
                  />
                  <div class="slider-marks">
                    <span>1s</span>
                    <span>3s</span>
                    <span>5s</span>
                  </div>
                </div>
              </div>

              <!-- 首尾帧模式：结束帧上传区 -->
              <div v-if="item.durationMode === 'standard' && item.dualImageMode" class="end-frame-section">
                <div class="end-frame-label">
                  <el-icon><VideoCamera /></el-icon> 结束帧 (尾帧)
                </div>
                <div
                  class="end-frame-upload"
                  :class="{ 'has-image': item.endFrameUrl }"
                  @click="triggerEndFrameUpload(item.id)"
                >
                  <div v-if="item.endFrameUrl" class="end-frame-preview">
                    <img :src="item.endFrameUrl" />
                    <button class="end-frame-delete" @click.stop="removeEndFrame(item.id)">
                      <el-icon><Close /></el-icon>
                    </button>
                  </div>
                  <div v-else class="end-frame-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>上传结束帧</span>
                  </div>
                </div>
              </div>

              <!-- 长片段模式：按钮选择12s或20s -->
              <div v-if="item.durationMode === 'long'" class="long-duration">
                <div class="long-duration-toggle">
                  <button
                    class="long-duration-btn"
                    :class="{ active: item.duration === '10' }"
                    @click="item.duration = '10'"
                  >
                    <div class="duration-icon">🎞️</div>
                    <div class="duration-label">~12秒</div>
                  </button>
                  <button
                    class="long-duration-btn"
                    :class="{ active: item.duration === '20' }"
                    @click="item.duration = '20'"
                  >
                    <div class="duration-icon">🎬</div>
                    <div class="duration-label">20秒</div>
                  </button>
                </div>
              </div>

              <el-button
                type="success"
                class="generate-video-btn"
                @click="handleGenerateVideo(item.id)"
                :disabled="generating || !item.prompt"
                :loading="generating && item.status === 'i2v'"
              >
                <el-icon><VideoCamera /></el-icon>
                {{ item.status === 'completed' ? '重新生成视频' : '生成视频' }}
              </el-button>
            </div>
          </div>

          <div class="item-right">
            <div class="item-label">生成结果 {{ index + 1 }}</div>
            <div class="generated-image-wrapper">
              <div class="generated-image">
                <!-- 等待生成图片 -->
                <div v-if="!item.i2iUrl" class="empty-result">
                  <el-icon><Picture /></el-icon>
                  <span>等待生成图片</span>
                </div>
                <!-- 图片已生成，等待生成视频 -->
                <div v-else-if="!item.videoUrl" class="waiting-video">
                  <img :src="item.i2iUrl" />
                  <div class="status-overlay">
                    <el-icon><VideoPlay /></el-icon>
                    <span>等待生成视频</span>
                  </div>
                </div>
                <!-- 视频生成完成 -->
                <div v-else class="generated-content">
                  <img class="source-image" :src="item.i2iUrl" />
                  <div class="video-player">
                    <video
                      :src="item.videoUrl"
                      controls
                      class="preview-video"
                      preload="metadata"
                    >
                      您的浏览器不支持视频播放
                    </video>
                    <div class="video-label">
                      <el-icon><VideoPlay /></el-icon>
                      <span>视频已生成</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="button-group">
              <el-button
                v-if="item.status !== 'upload'"
                type="warning"
                size="small"
                class="reset-btn"
                @click="handleResetItem(item.id)"
                :disabled="generating"
              >
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
              <el-button
                v-if="item.status === 'completed'"
                type="success"
                size="small"
                class="download-btn"
                @click="handleDownload(item.id)"
                :disabled="generating"
              >
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 全局合并导出栏 -->
      <div class="merge-export-bar" :class="{ 'ready': allVideosReady }">
        <div class="export-info">
          <el-icon class="export-icon"><VideoCamera /></el-icon>
          <div class="export-text">
            <div class="export-title">作品合成</div>
            <div class="export-desc">
              已完成 {{ mergeItems.filter(i => i.status === 'completed').length }}/{{ mergeItems.length }} 个视频
            </div>
          </div>
        </div>
        <el-button
          type="success"
          size="large"
          class="export-button"
          @click="handleMergeVideos"
          :disabled="!allVideosReady || mergeProcessing"
          :loading="mergeProcessing"
        >
          <el-icon><Connection /></el-icon>
          导出完整视频
        </el-button>
      </div>
    </div>
  </div>
</div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Connection,
  Picture,
  Plus,
  VideoPlay,
  Check,
  Delete,
  VideoCamera,
  Close,
  RefreshRight,
  Download,
  Warning,
  MagicStick,
  EditPen,
  FullScreen,
  Files,
  Loading
} from '@element-plus/icons-vue'

// 数据结构：每个条目是一个对象
interface MergeItem {
  id: string
  originalFile: File
  originalUrl: string
  i2iUrl: string
  videoUrl: string
  prompt: string
  status: 'upload' | 'i2i' | 'i2v' | 'completed' | 'error'
  duration: string
  durationMode: 'standard' | 'long' // 标准模式(滑块1-5s)或长片段模式(12s/20s)
  ratio: string // 画幅比例
  taskId: string | null
  model: 'comfyui' | 'doubao' // 图生图模型选择
  multiImageMode: boolean // 豆包多图模式
  multiFiles: File[] // 多图文件列表
  multiPreviewUrls: Array<{ file: File, url: string }> // 多图预览
  dualImageMode: boolean // 首尾帧模式
  endFrameFile: File | null // 结束帧文件
  endFrameUrl: string // 结束帧预览
}

const fileInput = ref<HTMLInputElement | null>(null)
const multiFileInput = ref<HTMLInputElement | null>(null)
const mergeItems = ref<MergeItem[]>([])
const generating = ref(false)
const mergeProcessing = ref(false)

// 模型选项
const modelOptions = [
  { label: 'ComfyUI', value: 'comfyui', icon: '🎨', desc: '本地部署, 稳定快速' },
  { label: '豆包(即梦)', value: 'doubao', icon: '🌟', desc: '云端AI, 效果卓越' }
]

// 画幅选项
const ratioOptions = [
  { label: '9:16', value: '9:16', ratioVal: '9/16' },
  { label: '1:1', value: '1:1', ratioVal: '1/1' },
  { label: '16:9', value: '16:9', ratioVal: '16/9' },
  { label: '3:4', value: '3:4', ratioVal: '3/4' },
]

// 计算属性：检查是否所有条目都已完成视频生成
const allVideosReady = computed(() => {
  return mergeItems.value.length > 0 &&
         mergeItems.value.every(item => item.status === 'completed' || item.status === 'error')
})

// --- 状态持久化 ---
const STORAGE_KEY = 'merge_state'

// 保存状态到localStorage
const saveState = () => {
  try {
    // 只保存必要的数据（不保存File对象，因为无法序列化）
    const itemsToSave = mergeItems.value.map(item => ({
      id: item.id,
      originalUrl: item.originalUrl,
      i2iUrl: item.i2iUrl,
      videoUrl: item.videoUrl,
      prompt: item.prompt,
      status: item.status,
      duration: item.duration,
      durationMode: item.durationMode,
      ratio: item.ratio,
      taskId: item.taskId
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave))
  } catch (e) {
    console.error('保存状态失败:', e)
  }
}

// 从localStorage加载状态
const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const items = JSON.parse(saved)
      // 标记所有项目为需要重新上传（因为File对象无法序列化）
      const restoredItems = items.map(item => ({
        ...item,
        originalFile: null, // File对象无法序列化，置为null
        status: item.videoUrl ? item.status : 'upload', // 如果有视频URL，保留状态，否则重置为upload
        originalUrl: item.videoUrl ? item.originalUrl : '', // 如果没有视频，清除预览URL（blob已失效）
        model: item.model || 'comfyui', // 恢复模型选择
        multiImageMode: item.multiImageMode || false, // 恢复多图模式
        multiFiles: [], // File对象无法序列化，置为空
        multiPreviewUrls: [], // 预览URL无法序列化，置为空
        dualImageMode: item.dualImageMode || false, // 恢复首尾帧模式
        endFrameFile: null, // File对象无法序列化
        endFrameUrl: '' // 预览URL无法序列化
      }))
      mergeItems.value = restoredItems
      console.log(`✅ [状态恢复] 已加载 ${restoredItems.length} 个项目`)
      if (restoredItems.some(i => i.status === 'completed')) {
        ElMessage.success(`已恢复 ${restoredItems.filter(i => i.status === 'completed').length} 个完成的视频`)
      }
    }
  } catch (e) {
    console.error('加载状态失败:', e)
  }
}

// 清除状态
const clearState = () => {
  localStorage.removeItem(STORAGE_KEY)
}

// 监听mergeItems变化，自动保存
watch(mergeItems, () => saveState(), { deep: true })

// 组件挂载时加载状态
onMounted(() => loadState())

const triggerUpload = () => {
  fileInput.value?.click()
}

// 多图上传逻辑（豆包多图模式）
const triggerMultiUpload = (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (!item) return

  // 临时存储当前操作的item ID
  ;(window as any).currentMultiUploadItemId = id
  multiFileInput.value?.click()
}

const handleMultiFileChange = (e: Event) => {
  const uploadedFiles = (e.target as HTMLInputElement).files
  if (!uploadedFiles) return

  const itemId = (window as any).currentMultiUploadItemId
  if (!itemId) {
    console.error('未找到对应的条目ID')
    return
  }

  const item = mergeItems.value.find(i => i.id === itemId)
  if (!item) return

  for (const uploadedFile of Array.from(uploadedFiles)) {
    if (!uploadedFile.type.startsWith('image/')) continue
    if (uploadedFile.size > 10 * 1024 * 1024) {
      ElMessage.error(`图片 ${uploadedFile.name} 不能超过10MB`)
      continue
    }

    const url = URL.createObjectURL(uploadedFile)
    item.multiPreviewUrls.push({ file: uploadedFile, url })
    item.multiFiles.push(uploadedFile)
  }

  if (multiFileInput.value) multiFileInput.value.value = ''
  delete (window as any).currentMultiUploadItemId

  ElMessage.success(`已添加 ${Array.from(uploadedFiles).length} 张图片`)
}

const removeMultiImage = (itemId: string, index: number) => {
  const item = mergeItems.value.find(i => i.id === itemId)
  if (!item) return

  // 释放blob URL
  URL.revokeObjectURL(item.multiPreviewUrls[index].url)
  item.multiPreviewUrls.splice(index, 1)
  item.multiFiles.splice(index, 1)
}

const clearMultiImages = (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (!item) return

  // 释放所有blob URL
  item.multiPreviewUrls.forEach(preview => URL.revokeObjectURL(preview.url))
  item.multiFiles = []
  item.multiPreviewUrls = []
}

// 结束帧上传逻辑（首尾帧模式）
const triggerEndFrameUpload = (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (!item) return

  // 临时存储当前操作的item ID
  ;(window as any).currentEndFrameUploadItemId = id
  // 复用multiFileInput作为结束帧上传
  multiFileInput.value?.click()
}

const handleEndFrameChange = (e: Event) => {
  const uploadedFile = (e.target as HTMLInputElement).files?.[0]
  if (!uploadedFile) return

  const itemId = (window as any).currentEndFrameUploadItemId
  if (!itemId) {
    console.error('未找到对应的条目ID')
    return
  }

  const item = mergeItems.value.find(i => i.id === itemId)
  if (!item) return

  if (!uploadedFile.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }

  if (uploadedFile.size > 10 * 1024 * 1024) {
    ElMessage.error('图片不能超过10MB')
    return
  }

  // 释放之前的blob URL
  if (item.endFrameUrl) {
    URL.revokeObjectURL(item.endFrameUrl)
  }

  item.endFrameFile = uploadedFile
  item.endFrameUrl = URL.createObjectURL(uploadedFile)

  if (multiFileInput.value) multiFileInput.value.value = ''
  delete (window as any).currentEndFrameUploadItemId

  ElMessage.success('结束帧上传成功')
}

const removeEndFrame = (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (!item) return

  // 释放blob URL
  if (item.endFrameUrl) {
    URL.revokeObjectURL(item.endFrameUrl)
  }
  item.endFrameFile = null
  item.endFrameUrl = ''

  ElMessage.success('已删除结束帧')
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    const newFiles = Array.from(files)
    newFiles.forEach(file => {
      mergeItems.value.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        originalFile: file,
        originalUrl: URL.createObjectURL(file),
        i2iUrl: '',
        videoUrl: '',
        prompt: '',
        status: 'upload',
        duration: '3',
        durationMode: 'standard',
        ratio: '1:1',
        taskId: null,
        model: 'comfyui', // 默认模型
        multiImageMode: false,
        multiFiles: [],
        multiPreviewUrls: [],
        dualImageMode: false, // 默认单图模式
        endFrameFile: null,
        endFrameUrl: ''
      })
    })
    ElMessage.success(`已添加 ${newFiles.length} 张图片`)
    target.value = ''
  }
}

const handleRemove = (id: string) => {
  const index = mergeItems.value.findIndex(item => item.id === id)
  if (index > -1) {
    URL.revokeObjectURL(mergeItems.value[index].originalUrl)
    mergeItems.value.splice(index, 1)
    ElMessage.success('已删除该图片')
  }
}

const handleClearAll = () => {
  mergeItems.value.forEach(item => URL.revokeObjectURL(item.originalUrl))
  mergeItems.value = []
  clearState()
  ElMessage.success('已清空所有图片')
}

// 阶段1：图生图（i2i）
const handleGenerateI2I = async (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (!item || !item.prompt || item.prompt.trim() === '') {
    ElMessage.warning('请输入导演指令')
    return
  }

  item.status = 'i2i'
  generating.value = true

  try {
    const formData = new FormData()
    formData.append('prompt', item.prompt)
    formData.append('ratio', item.ratio)
    formData.append('model', item.model) // 传递模型选择
    formData.append('multiImageMode', String(item.multiImageMode)) // 多图模式标志

    if (item.model === 'doubao' && item.multiImageMode) {
      // 豆包多图模式：合并单图区域和多图区域的图片
      if (item.originalFile) {
        formData.append('images', item.originalFile) // 添加单图区域的图片
      }
      item.multiFiles.forEach(f => {
        formData.append('images', f) // 添加多图区域的图片
      })
    } else {
      // 单图模式：上传单张图片
      formData.append('imageBody', item.originalFile)
    }

    const response = await fetch('http://localhost:3000/api/generate/img2img', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    if (result.success) {
      item.taskId = result.taskId
      ElMessage.success(`第 ${mergeItems.value.indexOf(item) + 1} 张图片漫改中...`)

      // 轮询查询结果
      pollI2IResult(id, result.taskId)
    } else {
      item.status = 'error'
      ElMessage.error(result.error || '漫改失败')
    }
  } catch (error) {
    console.error('图生图失败:', error)
    item.status = 'error'
    ElMessage.error('漫改失败，请重试')
  }
}

const pollI2IResult = async (itemId: string, taskId: string) => {
  const maxAttempts = 60
  let attempts = 0

  const poll = async () => {
    if (attempts >= maxAttempts) {
      const item = mergeItems.value.find(i => i.id === itemId)
      if (item) item.status = 'error'
      generating.value = false
      ElMessage.error('漫改超时，请重试')
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/api/status/${taskId}`)
      const result = await response.json()

      if (result.status === 'COMPLETED') {
        const item = mergeItems.value.find(i => i.id === itemId)
        if (item) {
          item.i2iUrl = result.resultUrl
          item.status = 'i2i'
          ElMessage.success(`第 ${mergeItems.value.indexOf(item) + 1} 张图片漫改完成!`)
        }
        generating.value = false
      } else if (result.status === 'FAILED') {
        const item = mergeItems.value.find(i => i.id === itemId)
        if (item) item.status = 'error'
        generating.value = false
        ElMessage.error('漫改失败')
      } else {
        attempts++
        setTimeout(poll, 2000)
      }
    } catch (error) {
      console.error('查询失败:', error)
      attempts++
      setTimeout(poll, 2000)
    }
  }

  poll()
}

// 使用原图（跳过i2i）
const handleUseOriginalImage = (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (item) {
    item.i2iUrl = item.originalUrl
    item.status = 'i2i'
    ElMessage.success(`第 ${mergeItems.value.indexOf(item) + 1} 张已使用原图!`)
  }
}

// 阶段2：图生视频（i2v）
const handleGenerateVideo = async (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (!item || !item.i2iUrl) {
    ElMessage.warning('请先生成图片或使用原图')
    return
  }

  if (!item.prompt || item.prompt.trim() === '') {
    ElMessage.warning('请输入导演指令')
    return
  }

  // 首尾帧模式验证
  if (item.durationMode === 'standard' && item.dualImageMode) {
    if (!item.endFrameFile) {
      ElMessage.warning('请上传结束帧')
      return
    }
  }

  item.status = 'i2v'
  generating.value = true

  try {
    // 下载i2i图片为Blob
    const imageResponse = await fetch(item.i2iUrl)
    const imageBlob = await imageResponse.blob()
    const imageFile = new File([imageBlob], `i2i_${item.id}.png`, { type: 'image/png' })

    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('prompt', item.prompt)

    // 首尾帧模式：添加结束帧
    if (item.durationMode === 'standard' && item.dualImageMode && item.endFrameFile) {
      formData.append('imageEnd', item.endFrameFile)
    }

    // 处理时长参数（标准模式1-5秒，长模式10/20秒）
    const durationNum = parseInt(item.duration)
    if (item.durationMode === 'long') {
      // 长视频模式：使用原始时长值（10或20）
      formData.append('duration', item.duration)
    } else {
      // 标准模式：直接传递duration参数
      formData.append('duration', item.duration)
    }

    // 处理ratio参数映射（前端是1:1等格式，后端需要16:9等）
    const ratioMap: Record<string, string> = {
      '9:16': '9:16',
      '9:16-hd': '9:16-hd',
      '1:1': '1:1',
      '16:9': '16:9',
      '16:9-hd': '16:9-hd',
      '3:4': '3:4'
    }
    formData.append('ratio', ratioMap[item.ratio] || '16:9')

    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    if (result.success) {
      item.taskId = result.taskId
      ElMessage.success(`第 ${mergeItems.value.indexOf(item) + 1} 张视频生成中...`)

      // 轮询查询结果
      pollI2VResult(id, result.taskId)
    } else {
      item.status = 'error'
      ElMessage.error(result.error || '视频生成失败')
      generating.value = false
    }
  } catch (error) {
    console.error('图生视频失败:', error)
    item.status = 'error'
    generating.value = false
    ElMessage.error('视频生成失败，请重试')
  }
}

const pollI2VResult = async (itemId: string, taskId: string) => {
  const maxAttempts = 120
  let attempts = 0

  const poll = async () => {
    if (attempts >= maxAttempts) {
      const item = mergeItems.value.find(i => i.id === itemId)
      if (item) item.status = 'error'
      generating.value = false
      ElMessage.error('视频生成超时，请重试')
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/api/status/${taskId}`)
      const result = await response.json()

      if (result.status === 'COMPLETED') {
        const item = mergeItems.value.find(i => i.id === itemId)
        if (item) {
          item.videoUrl = result.resultUrl
          item.status = 'completed'
          ElMessage.success(`第 ${mergeItems.value.indexOf(item) + 1} 张视频生成完成!`)
        }
        generating.value = false
      } else if (result.status === 'FAILED') {
        const item = mergeItems.value.find(i => i.id === itemId)
        if (item) item.status = 'error'
        generating.value = false
        ElMessage.error('视频生成失败')
      } else {
        attempts++
        setTimeout(poll, 2000)
      }
    } catch (error) {
      console.error('查询失败:', error)
      attempts++
      setTimeout(poll, 2000)
    }
  }

  poll()
}

// 重置单个条目
const handleResetItem = (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (item) {
    item.i2iUrl = ''
    item.videoUrl = ''
    item.status = 'upload'
    item.taskId = null
    // 清除多图相关状态
    clearMultiImages(id)
    // 清除结束帧
    removeEndFrame(id)
    // 重置首尾帧模式
    item.dualImageMode = false
    ElMessage.success('已重置，可以重新生成')
  }
}

// 下载单个视频
const handleDownload = async (id: string) => {
  const item = mergeItems.value.find(i => i.id === id)
  if (item && item.videoUrl) {
    try {
      ElMessage.info('正在下载视频...')
      const response = await fetch(item.videoUrl)
      if (!response.ok) throw new Error('下载失败')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `video_${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      ElMessage.success('视频下载成功！')
    } catch (error) {
      console.error('下载失败:', error)
      ElMessage.error('下载失败，请重试')
    }
  }
}

// 全局合并视频
const handleMergeVideos = async () => {
  const readyItems = mergeItems.value.filter(item => item.status === 'completed')
  
  if (readyItems.length === 0) {
    ElMessage.warning('没有可合并的视频')
    return
  }

  mergeProcessing.value = true

  try {
    const videoUrls = readyItems.map(item => item.videoUrl)
    
    const response = await fetch('http://localhost:3000/api/merge-videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoUrls })
    })

    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('视频合并成功!')
      // 下载合并后的视频
      const link = document.createElement('a')
      link.href = result.mergeUrl
      link.download = 'merged_video.mp4'
      link.click()
    } else {
      ElMessage.error(result.error || '合并失败')
    }
  } catch (error) {
    console.error('合并失败:', error)
    ElMessage.error('视频合并失败，请重试')
  } finally {
    mergeProcessing.value = false
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    'upload': '待处理',
    'i2i': '漫改中...',
    'i2v': '视频生成中...',
    'completed': '已就绪',
    'error': '失败'
  }
  return statusMap[status] || status
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap = {
    'upload': '#909399',
    'i2i': '#409EFF',
    'i2v': '#E6A23C',
    'completed': '#67C23A',
    'error': '#F56C6C'
  }
  return colorMap[status] || '#909399'
}
</script>
<style lang="scss" scoped>
$bg-color: #FBF8F3;
$dark: #1A1A1A;
$yellow: #FFD93D;
$blue: #4D96FF;
$pink: #FF6B6B;
$green: #6BCB77;

.pop-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;

  .title-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 14px;
    border: 2px solid $dark;
    margin-bottom: 15px;

    &.green { background: $green; color: white; }
    &.yellow { background: $yellow; }
    &.pink { background: $pink; color: white; }
    &.blue { background: $blue; color: white; }
  }

  .main-title {
    font-size: 2.5em;
    font-weight: 900;
    margin: 10px 0;
    color: $dark;

    span {
      background: linear-gradient(135deg, $blue 0%, $pink 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .subtitle {
    color: #666;
    font-size: 1.1em;
    margin: 0;
  }
}

.workspace {
  display: grid;
  grid-template-columns: 420px 1.2fr;
  gap: 24px;
  align-items: start;
}

.control-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-section {
  background: white;
  border: 3px solid $dark;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
  height: 100%;
  min-height: 600px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 15px;
  border: 2px solid $dark;
  background: $yellow;

  &.small {
    font-size: 12px;
    padding: 6px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.clapperboard-upload {
  border: 3px solid $dark;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 6px 6px 0 rgba(0,0,0,0.1);
  }

  .clapper-top {
    height: 20px;
    background: repeating-linear-gradient(
      -45deg,
      $dark,
      $dark 10px,
      white 10px,
      white 20px
    );
  }

  .upload-content {
    padding: 24px;
    min-height: 450px;
    display: flex;
    flex-direction: column;
  }

  .preview-wrapper {
    position: relative;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;

    .images-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;

      .image-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 10px;
        overflow: hidden;
        border: 2px solid $dark;

        .thumb-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumb-delete-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: $pink;
          color: white;
          border: 1px solid $dark;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
      }

      /* 继续添加按钮样式 */
      .add-more-item {
        border: 2px dashed #999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.2s;
        background: white;

        &:hover {
          border-color: $blue;
          color: $blue;
          background: rgba(77, 150, 255, 0.05);
        }

        .el-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        span {
          font-size: 11px;
          font-weight: bold;
        }
      }
    }

    .upload-footer {
      margin-top: auto;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }

    .image-count {
      text-align: center;
      padding: 10px;
      font-weight: bold;
      color: #666;
    }

    .clear-all-btn {
      width: 100%;
      padding: 12px;
      background: #f5f5f5;
      border: 2px solid $dark;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: bold;

      &:hover {
        background: #eee;
      }
    }
  }

  .placeholder {
    text-align: center;
    width: 100%;

    .icon-box {
      width: 80px;
      height: 80px;
      margin: 0 auto 15px;
      border: 3px dashed $blue;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: $blue;
      transition: all 0.3s;
    }

    &:hover .icon-box {
      border-color: $pink;
      color: $pink;
      transform: rotate(90deg);
    }

    h3 {
      font-size: 18px;
      font-weight: bold;
      margin: 10px 0;
      color: $dark;
    }

    p {
      font-size: 13px;
      color: #666;
      margin: 0;
    }
  }

  &.has-image {
    .clapper-top {
      background: repeating-linear-gradient(
        -45deg,
        $green,
        $green 10px,
        white 10px,
        white 20px
      );
    }
  }
}

.input-wrapper {
  margin-top: 20px;
  margin-bottom: 20px;

  .input-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 17px;
    margin-bottom: 10px;
    color: $dark;
  }

  :deep(.el-textarea__inner) {
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;

    &:focus {
      border-color: $blue;
      box-shadow: 0 0 0 2px rgba(77, 150, 255, 0.1);
    }
  }
}

.preview-card {
  background: white;
  border: 3px solid $dark;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
  min-height: 600px;
  display: flex;
  flex-direction: column;

  .card-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 12px;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 15px;
    border: 2px solid $dark;

    &.pink { background: $pink; color: white; }
  }
}

.merge-items-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.merge-item {
  display: grid;
  grid-template-columns: 180px 1fr 180px;
  gap: 20px;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  align-items: start;
  grid-template-rows: auto;
}

.demo-item {
  opacity: 0.7;
}

.placeholder-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #999;

  .el-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  span {
    font-size: 11px;
  }
}

.item-label {
  font-size: 12px;
  font-weight: bold;
  color: #666;
  margin-bottom: 8px;
  text-align: center;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-left {
  display: flex;
  flex-direction: column;
  position: relative;

  .item-image {
    width: 180px;
    height: 180px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid $dark;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .reupload-hint {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FFF9E1;
      color: $pink;

      .el-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      span {
        font-size: 10px;
        font-weight: bold;
        text-align: center;
        line-height: 1.4;
      }
    }
  }

  .status-badge {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
    color: white;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
}

.item-center {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;

  .merge-prompt-input {
    :deep(.el-textarea__inner) {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 13px;

      &:focus {
        border-color: $blue;
      }
    }

    &.demo-input {
      :deep(.el-textarea__inner) {
        background: #f5f5f5;
        color: #999;
      }
    }
  }

  // 画幅选择
  .ratio-selection {
    margin-top: 8px;

    .ratio-label {
      font-size: 11px;
      font-weight: bold;
      color: #666;
      margin-bottom: 6px;
    }

    .ratio-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .ratio-btn {
      border: 2px solid #E0E0E0;
      border-radius: 6px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;

      .ratio-box {
        width: 18px;
        background: #DDD;
        border: 2px solid #999;
        border-radius: 2px;
      }

      span {
        font-size: 10px;
        font-weight: bold;
        color: #666;
      }

      &.active {
        border-color: $dark;
        background: #FFF8E1;
        box-shadow: 2px 2px 0 $yellow;

        .ratio-box {
          background: white;
          border-color: $dark;
        }
        span {
          color: $dark;
        }
      }

      &:hover:not(.active) {
        border-color: $blue;
        background: rgba(77, 150, 255, 0.05);
      }
    }
  }

  // 模型选择
  .model-selection {
    margin-top: 8px;

    .model-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: bold;
      color: #666;
      margin-bottom: 6px;
    }

    .model-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    .model-card-mini {
      border: 2px solid #E0E0E0;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;

      .model-icon-mini {
        font-size: 16px;
      }

      .model-name-mini {
        font-size: 11px;
        font-weight: bold;
        color: #666;
      }

      &.active {
        border-color: $dark;
        background: linear-gradient(135deg, #FFF9E1 0%, #FFE0B2 100%);
        box-shadow: 2px 2px 0 $yellow;

        .model-name-mini {
          color: $dark;
        }
      }

      &:hover:not(.active) {
        border-color: $blue;
        background: rgba(77, 150, 255, 0.05);
      }
    }
  }

  // 多图模式
  .multi-image-section {
    margin-top: 8px;

    .multi-mode-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #F5F5F5;
      border-radius: 6px;
      border: 2px solid #E0E0E0;

      span {
        font-size: 11px;
        font-weight: bold;
        color: $dark;
      }
    }

    .multi-images-grid-mini {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-top: 8px;
    }

    .multi-image-item-mini {
      position: relative;
      aspect-ratio: 1;
      border: 2px solid $dark;
      border-radius: 6px;
      overflow: hidden;

      .multi-img-mini {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .multi-index-mini {
        position: absolute;
        top: 2px;
        left: 2px;
        background: $dark;
        color: white;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
      }

      .multi-delete-mini {
        position: absolute;
        top: 2px;
        right: 2px;
        background: $pink;
        color: white;
        border: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .multi-add-btn-mini {
      aspect-ratio: 1;
      border: 2px dashed $blue;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      background: #F0F9FF;
      transition: all 0.2s;

      &:hover {
        background: #E1F5FE;
        transform: scale(1.02);
      }

      .el-icon {
        font-size: 18px;
        color: $blue;
      }

      span {
        font-size: 10px;
        font-weight: bold;
        color: $blue;
      }
    }

    .hint-text-mini {
      margin-top: 8px;
      font-size: 10px;
      color: #666;
      line-height: 1.4;
      padding: 6px 8px;
      background: #FFF3E0;
      border-radius: 6px;
      border-left: 2px solid #FFB300;
    }
  }

  // 首尾帧模式切换
  .dual-mode-switch {
    display: flex;
    gap: 6px;
    margin-top: 4px;

    .dual-mode-btn {
      flex: 1;
      padding: 6px 12px;
      border: 2px solid #E0E0E0;
      border-radius: 6px;
      font-size: 11px;
      font-weight: bold;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;

      .mode-icon {
        font-size: 12px;
      }

      &.active {
        border-color: $dark;
        background: linear-gradient(135deg, #FFF9E1 0%, #FFE0B2 100%);
        color: $dark;
        box-shadow: 2px 2px 0 $dark;
      }

      &:hover:not(.active) {
        border-color: $blue;
        background: rgba(77, 150, 255, 0.05);
      }
    }
  }

  // 结束帧上传区
  .end-frame-section {
    margin-top: 8px;

    .end-frame-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: bold;
      color: #666;
      margin-bottom: 6px;
    }

    .end-frame-upload {
      border: 2px solid $dark;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
      background: #fafafa;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 2px 2px 0 rgba(0,0,0,0.1);
      }

      &.has-image {
        background: #fff;
      }

      .end-frame-preview {
        position: relative;
        width: 100%;
        height: 100%;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .end-frame-delete {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: $pink;
          color: white;
          border: 1px solid $dark;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;

          &:hover {
            transform: scale(1.1);
          }
        }
      }

      .end-frame-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: #999;

        .el-icon {
          font-size: 20px;
        }

        span {
          font-size: 10px;
          font-weight: bold;
        }
      }
    }
  }

  .merge-generate-btn {
    width: 100%;
    height: 45px;
    border: 2px solid $dark;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 2px 2px 0 $dark;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 $dark;
    }

    &:disabled {
      opacity: 0.5;
      transform: none;
      box-shadow: none;
    }

    .el-icon {
      margin-right: 6px;
    }
  }

  .use-original-btn {
    width: 100%;
    height: 38px;
    border: 2px solid $dark;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 2px 2px 0 $dark;
    transition: all 0.2s;
    margin-top: 8px;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 $dark;
      background: #e6f7ff;
    }

    &:disabled {
      opacity: 0.5;
      transform: none;
      box-shadow: none;
    }

    .el-icon {
      margin-right: 6px;
    }
  }

  .video-generation-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;

    // 视频分辨率选择
    .video-ratio-selection {
      .ratio-label {
        font-size: 11px;
        font-weight: bold;
        color: #666;
        margin-bottom: 6px;
      }

      .video-ratio-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;

        .ratio-group {
          .ratio-group-label {
            font-size: 10px;
            color: #999;
            margin-bottom: 4px;
            font-weight: 500;
          }

          .ratio-row {
            display: flex;
            gap: 4px;

            .res-btn {
              flex: 1;
              border: 2px solid #DDD;
              border-radius: 6px;
              padding: 6px 4px;
              text-align: center;
              font-size: 10px;
              font-weight: bold;
              cursor: pointer;
              position: relative;
              background: white;
              transition: all 0.2s;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2px;

              .res-tag {
                font-size: 8px;
                padding: 1px 4px;
                border-radius: 3px;
                background: #E0E0E0;
                color: #666;
                font-weight: bold;

                &.hd {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                }
              }

              &.active {
                border-color: $dark;
                background: $yellow;
                box-shadow: 2px 2px 0 $dark;
              }

              &:hover:not(.active) {
                border-color: $blue;
                background: rgba(77, 150, 255, 0.05);
              }
            }
          }
        }
      }
    }

    // 时长模式切换
    .duration-mode-switch {
      display: flex;
      gap: 6px;

      .duration-mode-btn {
        flex: 1;
        padding: 6px 12px;
        border: 2px solid #E0E0E0;
        border-radius: 6px;
        font-size: 11px;
        font-weight: bold;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        color: #666;

        &.active {
          border-color: $dark;
          background: $yellow;
          color: $dark;
          box-shadow: 2px 2px 0 $dark;
        }

        &:hover:not(.active) {
          border-color: $blue;
          background: rgba(77, 150, 255, 0.05);
        }
      }
    }

    // 标准时长：滑块
    .standard-duration {
      .slider-wrapper {
        margin-top: 4px;

        :deep(.el-slider) {
          .el-slider__bar {
            background-color: $blue;
            height: 6px;
            border-radius: 3px;
          }
          .el-slider__runway {
            height: 6px;
            background-color: #DDD;
            border: 1px solid #CCC;
          }
          .el-slider__button {
            width: 14px;
            height: 14px;
            border: 2px solid $dark;
            background: $yellow;
          }
        }

        .slider-marks {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #999;
          margin-top: 2px;
        }
      }
    }

    // 长片段时长：按钮
    .long-duration {
      .long-duration-toggle {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-top: 4px;

        .long-duration-btn {
          padding: 8px;
          border: 2px solid #E0E0E0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;

          &:hover:not(.active) {
            border-color: $blue;
            background: rgba(77, 150, 255, 0.05);
          }

          &.active {
            border-color: $dark;
            background: $yellow;
            box-shadow: 2px 2px 0 $dark;
          }

          .duration-icon {
            font-size: 18px;
            margin-bottom: 2px;
          }

          .duration-label {
            font-size: 11px;
            font-weight: bold;
            color: $dark;
          }
        }
      }
    }

    .generate-video-btn {
      height: 32px;
      border: 2px solid $dark;
      border-radius: 6px;
      font-weight: bold;
      box-shadow: 2px 2px 0 $dark;
      transition: all 0.2s;
      margin-top: 4px;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 4px 4px 0 $dark;
      }

      &:disabled {
        opacity: 0.5;
        transform: none;
        box-shadow: none;
      }

      .el-icon {
        margin-right: 6px;
      }
    }
  }

  .status-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(103, 194, 58, 0.9);
    color: white;
    padding: 4px;
    font-size: 11px;
    font-weight: bold;
    text-align: center;
  }
}

.item-right {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .generated-image-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .generated-image {
    width: 180px;
    height: 180px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid $dark;
    background: #f0f0f0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .image-result {
    width: 180px;
    height: 180px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid $dark;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .waiting-video {
    width: 180px;
    height: 180px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid $dark;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .status-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(77, 150, 255, 0.9);
      color: white;
      padding: 6px 8px;
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;

      .el-icon {
        font-size: 14px;
      }
    }
  }

  .button-group {
    display: flex;
    flex-direction: row;
    gap: 8px;
    width: 180px;
  }

  .reset-btn,
  .back-btn {
    width: calc(50% - 4px);
    height: 32px;
    border: 2px solid $dark;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 2px 2px 0 $dark;
    transition: all 0.2s;
    font-size: 12px;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 $dark;
    }

    &:disabled {
      opacity: 0.5;
      transform: none;
      box-shadow: none;
    }

    .el-icon {
      margin-right: 4px;
      font-size: 14px;
    }
  }

  .download-btn {
    width: calc(50% - 4px);
    height: 32px;
    border: 2px solid $dark;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 2px 2px 0 $dark;
    transition: all 0.2s;
    font-size: 12px;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 $dark;
    }

    &:disabled {
      opacity: 0.5;
      transform: none;
      box-shadow: none;
    }

    .el-icon {
      margin-right: 4px;
      font-size: 14px;
    }
  }

  .back-btn {
    &:hover:not(:disabled) {
      background: #e6f7ff;
      border-color: #1890ff;
    }
  }

  .generate-video-btn {
    width: calc(50% - 4px);
    height: 32px;
    border: 2px solid $dark;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 2px 2px 0 $dark;
    transition: all 0.2s;
    font-size: 12px;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 $dark;
    }

    &:disabled {
      opacity: 0.5;
      transform: none;
      box-shadow: none;
    }

    .el-icon {
      margin-right: 4px;
      font-size: 14px;
    }
  }

  .generated-content {
    position: relative;
    width: 100%;
    height: 100%;

    .source-image {
      width: 100%;
      height: 60%;
      object-fit: cover;
      border-bottom: 2px solid $dark;
    }

    .video-player {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40%;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .preview-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-top: 2px solid $dark;
      }

      .video-label {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
          font-size: 12px;
        }

        span {
          font-size: 10px;
          font-weight: bold;
        }
      }
    }
  }

  .next-step-btn {
    width: 100%;
    height: 36px;
    border: 2px solid $dark;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 2px 2px 0 $dark;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 $dark;
    }

    &:disabled {
      opacity: 0.5;
      transform: none;
      box-shadow: none;
    }

    .el-icon {
      margin-right: 6px;
    }
  }

  .use-original-btn {
    width: 100%;
    height: 38px;
    border: 2px solid $dark;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 2px 2px 0 $dark;
    transition: all 0.2s;
    margin-top: 8px;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 4px 4px 0 $dark;
      background: #e6f7ff;
    }

    &:disabled {
      opacity: 0.5;
      transform: none;
      box-shadow: none;
    }

    .el-icon {
      margin-right: 6px;
    }
  }

  .video-generation-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;

    // 视频分辨率选择
    .video-ratio-selection {
      .ratio-label {
        font-size: 11px;
        font-weight: bold;
        color: #666;
        margin-bottom: 6px;
      }

      .video-ratio-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;

        .ratio-group {
          .ratio-group-label {
            font-size: 10px;
            color: #999;
            margin-bottom: 4px;
            font-weight: 500;
          }

          .ratio-row {
            display: flex;
            gap: 4px;

            .res-btn {
              flex: 1;
              border: 2px solid #DDD;
              border-radius: 6px;
              padding: 6px 4px;
              text-align: center;
              font-size: 10px;
              font-weight: bold;
              cursor: pointer;
              position: relative;
              background: white;
              transition: all 0.2s;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 2px;

              .res-tag {
                font-size: 8px;
                padding: 1px 4px;
                border-radius: 3px;
                background: #E0E0E0;
                color: #666;
                font-weight: bold;

                &.hd {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                }
              }

              &.active {
                border-color: $dark;
                background: $yellow;
                box-shadow: 2px 2px 0 $dark;
              }

              &:hover:not(.active) {
                border-color: $blue;
                background: rgba(77, 150, 255, 0.05);
              }
            }
          }
        }
      }
    }

    // 时长模式切换
    .duration-mode-switch {
      display: flex;
      gap: 6px;

      .duration-mode-btn {
        flex: 1;
        padding: 6px 12px;
        border: 2px solid #E0E0E0;
        border-radius: 6px;
        font-size: 11px;
        font-weight: bold;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        color: #666;

        &.active {
          border-color: $dark;
          background: $yellow;
          color: $dark;
          box-shadow: 2px 2px 0 $dark;
        }

        &:hover:not(.active) {
          border-color: $blue;
          background: rgba(77, 150, 255, 0.05);
        }
      }
    }

    // 标准时长：滑块
    .standard-duration {
      .slider-wrapper {
        margin-top: 4px;

        :deep(.el-slider) {
          .el-slider__bar {
            background-color: $blue;
            height: 6px;
            border-radius: 3px;
          }
          .el-slider__runway {
            height: 6px;
            background-color: #DDD;
            border: 1px solid #CCC;
          }
          .el-slider__button {
            width: 14px;
            height: 14px;
            border: 2px solid $dark;
            background: $yellow;
          }
        }

        .slider-marks {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #999;
          margin-top: 2px;
        }
      }
    }

    // 长片段时长：按钮
    .long-duration {
      .long-duration-toggle {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-top: 4px;

        .long-duration-btn {
          padding: 8px;
          border: 2px solid #E0E0E0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;

          &:hover:not(.active) {
            border-color: $blue;
            background: rgba(77, 150, 255, 0.05);
          }

          &.active {
            border-color: $dark;
            background: $yellow;
            box-shadow: 2px 2px 0 $dark;
          }

          .duration-icon {
            font-size: 18px;
            margin-bottom: 2px;
          }

          .duration-label {
            font-size: 11px;
            font-weight: bold;
            color: $dark;
          }
        }
      }
    }

    .generate-video-btn {
      height: 32px;
      border: 2px solid $dark;
      border-radius: 6px;
      font-weight: bold;
      box-shadow: 2px 2px 0 $dark;
      transition: all 0.2s;
      margin-top: 4px;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 4px 4px 0 $dark;
      }

      &:disabled {
        opacity: 0.5;
        transform: none;
        box-shadow: none;
      }

      .el-icon {
        margin-right: 6px;
      }
    }
  }

  .status-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(103, 194, 58, 0.9);
    color: white;
    padding: 4px;
    font-size: 11px;
    font-weight: bold;
    text-align: center;
  }
}

.empty-result {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;

  .el-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  span {
    font-size: 11px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 10px;
    color: #ccc;
  }

  p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
}

.merge-export-bar {
  margin-top: 20px;
  padding: 20px;
  border: 3px solid $dark;
  border-radius: 12px;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  transition: all 0.3s;

  &:not(.ready) {
    opacity: 0.6;
    pointer-events: none;
  }

  &.ready {
    background: linear-gradient(135deg, #fff9e6 0%, #e6f7ff 100%);
    border-color: $yellow;
    box-shadow: 0 4px 12px rgba(255, 217, 61, 0.2);
  }

  .export-info {
    display: flex;
    align-items: center;
    gap: 15px;
    flex: 1;

    .export-icon {
      font-size: 40px;
      color: $blue;
    }

    .export-text {
      flex: 1;

      .export-title {
        font-size: 18px;
        font-weight: bold;
        color: $dark;
        margin-bottom: 4px;
      }

      .export-desc {
        font-size: 13px;
        color: #666;
      }
    }
  }

  .export-button {
    min-width: 180px;
    height: 48px;
    border: 2px solid $dark;
    border-radius: 10px;
    font-weight: bold;
    font-size: 15px;
    box-shadow: 3px 3px 0 $dark;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 5px 5px 0 $dark;
    }

    &:disabled {
      opacity: 0.4;
      transform: none;
      box-shadow: none;
    }

    .el-icon {
      margin-right: 8px;
      font-size: 18px;
    }
  }
}



@media (max-width: 1024px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    .main-title { font-size: 1.8em; }
    .subtitle { font-size: 0.9em; }
  }

  .resolution-toggle {
    flex-direction: column;
  }
}
</style>