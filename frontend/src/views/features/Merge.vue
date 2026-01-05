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

    <div class="workspace">
      <!-- 左侧:图片上传区 -->
      <div class="control-panel">
        <!-- 所有内容在一个框里 -->
        <div class="panel-section">
          <div class="section-label">
            <el-icon><Picture /></el-icon> 原始素材与描述
          </div>

          <div
            class="clapperboard-upload"
            :class="{ 'has-image': previewUrls.length > 0 }"
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

              <div v-if="uploadedFiles.length > 0" class="preview-wrapper">
                <div class="images-grid">
                  <div v-for="(url, index) in previewUrls" :key="index" class="image-item">
                    <img :src="url" class="thumb-image" />
                    <button class="thumb-delete-btn" @click.stop="handleRemove(index)">
                      <el-icon><Close /></el-icon>
                    </button>
                  </div>
                  <div class="image-count">{{ uploadedFiles.length }} 张图片</div>
                </div>
                <button class="clear-all-btn" @click.stop="handleClearAll">
                  <el-icon><Delete /></el-icon>
                  清空全部
                </button>
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

          <!-- 提示词输入框 - 仅作为批量设置 -->
          <div class="input-wrapper" v-if="uploadedFiles.length === 0">
            <div class="input-label">
              <el-icon><Edit /></el-icon> 导演指令
            </div>
            <el-input
              v-model="prompts[0]"
              type="textarea"
              :rows="3"
              placeholder="✨ 描述故事如何进行..."
              resize="none"
              maxlength="500"
              show-word-limit
            />
          </div>

          <!-- 参数设置 -->
          <div class="settings-grid">
            <!-- 画质 -->
            <div class="setting-item">
              <div class="section-label small">输出分辨率</div>
              <div class="resolution-toggle">
                <div
                  class="res-btn"
                  :class="{ active: resolution === '720p' }"
                  @click="resolution = '720p'"
                >
                  <span class="res-tag hd">HD</span>
                  720p
                </div>
                <div
                  class="res-btn"
                  :class="{ active: resolution === '1080p' }"
                  @click="resolution = '1080p'"
                >
                  <span class="res-tag fhd">FHD</span>
                  1080p
                </div>
              </div>
            </div>

            <!-- 时长 -->
            <div class="setting-item">
              <div class="section-label small">
                时长 <span class="value-badge">{{ duration }}s</span>
              </div>
              <div class="slider-wrapper">
                <el-slider
                  v-model="duration"
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
        </div>

        <!-- 生成按钮 -->
        <button
          class="generate-btn"
          :class="{ loading: generating }"
          @click="handleGenerateAll"
          :disabled="generating || uploadedFiles.length === 0"
        >
          <div class="btn-content">
            <span v-if="!generating">🎬 批量生成</span>
            <span v-else>
              <el-icon class="is-loading"><Loading /></el-icon> 生成中...
            </span>
          </div>
          <div class="btn-progress" :style="{ width: progress + '%' }"></div>
        </button>
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
            <div class="merge-item demo-item" v-if="uploadedFiles.length === 0">
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
                  maxlength="500"
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
            <div class="merge-item" v-for="(url, index) in previewUrls" :key="index">
              <div class="item-left">
                <div class="item-label">原始图片 {{ index + 1 }}</div>
                <div class="item-image">
                  <img :src="url" />
                </div>
              </div>

              <div class="item-center">
                <div class="item-label">导演指令 {{ index + 1 }}</div>
                <el-input
                  v-model="prompts[index]"
                  type="textarea"
                  :rows="3"
                  placeholder="✨ 描述故事如何进行..."
                  resize="none"
                  maxlength="500"
                  class="merge-prompt-input"
                />
                <el-button
                  type="primary"
                  class="merge-generate-btn"
                  @click="handleGenerateItem(index)"
                  :disabled="generating || !prompts[index]"
                  :loading="generating"
                >
                  <el-icon><VideoCamera /></el-icon>
                  {{ awaitingNewPrompt[index] ? '生成视频' : (generatedVideos[index] ? '重新生成' : (generatedUrls[index] ? '重新生成' : '生成图片')) }}
                </el-button>
              </div>

              <div class="item-right">
                <div class="item-label">生成结果 {{ index + 1 }}</div>
                <div class="generated-image-wrapper">
                  <div class="generated-image">
                    <div v-if="!generatedUrls[index]" class="empty-result">
                      <el-icon><Picture /></el-icon>
                      <span>等待生成</span>
                    </div>
                    <div v-else-if="awaitingNewPrompt[index]" class="empty-result">
                      <el-icon><Picture /></el-icon>
                      <span>等待生成视频</span>
                    </div>
                    <div v-else-if="!generatedVideos[index]" class="image-result">
                      <img :src="generatedUrls[index]" />
                    </div>
                    <div v-else class="generated-content">
                      <img class="source-image" :src="generatedUrls[index]" />
                      <div class="video-placeholder">
                        <el-icon><VideoPlay /></el-icon>
                        <span>视频已生成</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="button-group">
                  <el-button
                    type="warning"
                    size="small"
                    class="reset-btn"
                    @click="handleNextStep(index)"
                    :disabled="!generatedUrls[index] || generating"
                  >
                    <el-icon><RefreshRight /></el-icon>
                    重置
                  </el-button>
                  <el-button
                    type="success"
                    size="small"
                    class="generate-video-btn"
                    @click="generatedVideos[index] ? handleDownload(index) : (awaitingNewPrompt[index] ? '' : handleGenerateVideo(index))"
                    :disabled="generating"
                    :loading="false"
                  >
                    <el-icon><VideoCamera /></el-icon>
                    {{ awaitingNewPrompt[index] ? '下载' : (generatedVideos[index] ? '下载' : '生成视频') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Connection,
  Picture,
  Plus,
  VideoPlay,
  Check,
  Film,
  Delete,
  Edit,
  Loading,
  VideoCamera,
  Close,
  RefreshRight
} from '@element-plus/icons-vue'

const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])
const generatedUrls = ref<string[]>([])
const generatedVideos = ref<string[]>([])
const prompts = ref<string[]>([])
const awaitingNewPrompt = ref<boolean[]>([]) // 标记是否等待重新输入提示词
const resolution = ref('1080p')
const duration = ref(3)
const generating = ref(false)
const progress = ref(0)

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    const newFiles = Array.from(files)
    newFiles.forEach(file => {
      uploadedFiles.value.push(file)
      previewUrls.value.push(URL.createObjectURL(file))
      prompts.value.push('')
      generatedUrls.value.push('')
      awaitingNewPrompt.value.push(false)
    })
    ElMessage.success(`已添加 ${newFiles.length} 张图片`)
  }
}

const handleRemove = (index: number) => {
  URL.revokeObjectURL(previewUrls.value[index])
  uploadedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
  prompts.value.splice(index, 1)
  generatedUrls.value.splice(index, 1)
  awaitingNewPrompt.value.splice(index, 1)
  ElMessage.success('已删除该图片')
}

const handleClearAll = () => {
  previewUrls.value.forEach(url => URL.revokeObjectURL(url))
  uploadedFiles.value = []
  previewUrls.value = []
  prompts.value = []
  generatedUrls.value = []
  awaitingNewPrompt.value = []
  ElMessage.success('已清空所有图片')
}

const handleGenerateItem = (index: number) => {
  if (!prompts.value[index] || prompts.value[index].trim() === '') {
    ElMessage.warning('请输入导演指令')
    return
  }

  generating.value = true
  progress.value = 0

  const interval = setInterval(() => {
    progress.value += 10
    if (progress.value >= 100) {
      clearInterval(interval)
      generating.value = false
      generatedUrls.value[index] = previewUrls.value[index]
      ElMessage.success(`第 ${index + 1} 张图片生成完成!`)
    }
  }, 300)
}

const handleNextStep = (index: number) => {
  // 删除该条目的所有数据
  URL.revokeObjectURL(previewUrls.value[index])
  uploadedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
  prompts.value.splice(index, 1)
  generatedUrls.value.splice(index, 1)
  generatedVideos.value.splice(index, 1)
  awaitingNewPrompt.value.splice(index, 1)
  ElMessage.success('已重置该条目')
}

const handleGenerateVideo = (index: number) => {
  // 如果处于等待重新输入提示词的状态
  if (awaitingNewPrompt.value[index]) {
    // 检查用户是否已输入新的提示词
    if (!prompts.value[index] || prompts.value[index].trim() === '') {
      ElMessage.warning('请输入导演指令')
      return
    }
    // 用户已输入新提示词，开始生成视频
    generating.value = true
    progress.value = 0

    const interval = setInterval(() => {
      progress.value += 10
      if (progress.value >= 100) {
        clearInterval(interval)
        generating.value = false
        // 使用图片代替视频
        generatedVideos.value[index] = generatedUrls.value[index]
        awaitingNewPrompt.value[index] = false
        prompts.value[index] = ''
        // 强制更新
        generatedVideos.value = [...generatedVideos.value]
        ElMessage.success(`第 ${index + 1} 张图片视频生成完成!`)
      }
    }, 300)
  } else {
    // 第一次点击，进入等待输入提示词状态
    if (!generatedUrls.value[index]) {
      ElMessage.warning('请先生成图片')
      return
    }
    // 清空右侧生成结果，并标记为等待生成视频状态
    awaitingNewPrompt.value[index] = true
    prompts.value[index] = ''
    ElMessage.info('请输入导演指令生成视频')
  }
}

const handleDownload = (index: number) => {
  if (awaitingNewPrompt.value[index]) {
    ElMessage.warning('请先完成视频生成')
    return
  }
  if (!generatedVideos.value[index]) {
    ElMessage.warning('请先生成视频')
    return
  }
  // 这里添加下载逻辑
  ElMessage.success(`第 ${index + 1 } 个视频下载中...`)
}

const handleGenerateAll = () => {
  if (uploadedFiles.value.length === 0) {
    ElMessage.warning('请先上传图片')
    return
  }

  const emptyPrompts = prompts.value.filter((p, i) => !p || p.trim() === '')
  if (emptyPrompts.length > 0) {
    ElMessage.warning('请为所有图片输入导演指令')
    return
  }

  generating.value = true
  progress.value = 0

  let completed = 0
  const total = uploadedFiles.value.length

  const interval = setInterval(() => {
    progress.value += 10
    if (progress.value >= 100) {
      completed++
      if (completed >= total) {
        clearInterval(interval)
        generating.value = false
        uploadedFiles.value.forEach((_, i) => {
          generatedUrls.value[i] = previewUrls.value[i]
        })
        ElMessage.success('所有图片生成完成!')
      } else {
        progress.value = 0
      }
    }
  }, 300)
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
  grid-template-columns: 400px 1.2fr;
  gap: 20px;
  align-items: start;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-section {
  background: white;
  border: 3px solid $dark;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
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
    padding: 20px;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-wrapper {
    position: relative;
    width: 100%;
    height: 200px;

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      margin-bottom: 10px;

      .image-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 8px;
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
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: $pink;
          color: white;
          border: 1px solid $dark;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;

          &:hover {
            transform: scale(1.1);
          }

          .el-icon {
            font-size: 14px;
          }
        }
      }

      .image-count {
        grid-column: 1 / -1;
        text-align: center;
        padding: 10px;
        font-weight: bold;
        color: $dark;
        background: #f0f0f0;
        border-radius: 8px;
      }
    }

    .clear-all-btn {
      width: 100%;
      padding: 10px;
      background: #f0f0f0;
      border: 2px solid $dark;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: bold;
      transition: all 0.2s;

      &:hover {
        background: #e0e0e0;
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

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.setting-item {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;

  .value-badge {
    padding: 4px 10px;
    background: $blue;
    color: white;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
  }
}

.resolution-toggle {
  display: flex;
  gap: 8px;

  .res-btn {
    flex: 1;
    padding: 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    font-weight: bold;
    color: $dark;
    background: white;

    .res-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 900;
      margin-bottom: 4px;

      &.hd {
        background: $blue;
        color: white;
      }

      &.fhd {
        background: $green;
        color: white;
      }
    }

    &:hover {
      border-color: $blue;
      background: #f0f4ff;
    }

    &.active {
      border-color: $dark;
      box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
  }
}

.slider-wrapper {
  padding: 8px 0;

  :deep(.el-slider__runway) {
    height: 8px;
    border-radius: 4px;
    background: #e0e0e0;
  }

  :deep(.el-slider__bar) {
    background: linear-gradient(90deg, $blue, $pink);
    height: 8px;
  }

  :deep(.el-slider__button) {
    width: 20px;
    height: 20px;
    border: 3px solid $dark;
    background: white;
  }

  .slider-marks {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 12px;
    color: #999;
    font-weight: bold;
  }
}

.generate-btn {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, $blue 0%, $pink 100%);
  border: 3px solid $dark;
  border-radius: 16px;
  color: white;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 6px 6px 0 $dark;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 8px 8px 0 $dark;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 4px 4px 0 $dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .btn-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    background: white;
    opacity: 0.5;
    transition: width 0.3s;
  }

  &.loading {
    .btn-content {
      opacity: 0.8;
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

  .button-group {
    display: flex;
    flex-direction: row;
    gap: 8px;
    width: 180px;
  }

  .reset-btn {
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

    .video-placeholder {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40%;
      background: linear-gradient(135deg, $blue, $pink);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;

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
