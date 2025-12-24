<template>
  <BasicLayout>
    <div class="txt2img-container">
      <el-card class="main-card" shadow="hover">
        <div class="content-wrapper">
          <!-- 左侧控制面板 -->
          <div class="control-panel">
            <div class="panel-header">
              <h3>参数配置</h3>
            </div>
            
            <el-form :model="form" label-position="top" class="generation-form">
              <!-- 提示词 -->
              <el-form-item label="提示词">
                <el-input
                  v-model="form.prompt"
                  type="textarea"
                  :rows="4"
                  placeholder="请详细描述您想要生成的图片内容，例如：一个长发少女在樱花树下跳舞，阳光透过花瓣洒在她的脸上..."
                  maxlength="1000"
                  show-word-limit
                  :disabled="isGenerating"
                />
              </el-form-item>

              <!-- 反向提示词 -->
              <el-form-item label="反向提示词">
                <el-input
                  v-model="form.negativePrompt"
                  type="textarea"
                  :rows="2"
                  placeholder="描述您不希望出现的内容，例如：低质量、模糊、变形..."
                  maxlength="500"
                  show-word-limit
                  :disabled="isGenerating"
                />
              </el-form-item>

              <!-- 尺寸选择 -->
              <el-form-item label="图片尺寸">
                <el-select v-model="form.size" placeholder="选择尺寸" :disabled="isGenerating">
                  <el-option label="512x512" value="512x512" />
                  <el-option label="512x768" value="512x768" />
                  <el-option label="768x512" value="768x512" />
                  <el-option label="1024x1024" value="1024x1024" />
                  <el-option label="1024x768" value="1024x768" />
                  <el-option label="768x1024" value="768x1024" />
                </el-select>
              </el-form-item>

              <!-- 风格选择 -->
              <el-form-item label="风格">
                <el-select v-model="form.style" placeholder="选择风格" :disabled="isGenerating">
                  <el-option label="默认" value="" />
                  <el-option label="动漫风格" value="anime" />
                  <el-option label="写实风格" value="realistic" />
                  <el-option label="卡通风格" value="cartoon" />
                  <el-option label="奇幻风格" value="fantasy" />
                  <el-option label="水彩风格" value="watercolor" />
                </el-select>
              </el-form-item>

              <!-- 高级参数 -->
              <div class="advanced-params">
                <el-collapse v-model="activeCollapse">
                  <el-collapse-item title="高级参数" name="advanced">
                    <!-- 生成步数 -->
                    <el-form-item label="生成步数">
                      <el-slider
                        v-model="form.steps"
                        :min="10"
                        :max="50"
                        :step="1"
                        show-input
                        :disabled="isGenerating"
                      />
                    </el-form-item>

                    <!-- 引导系数 -->
                    <el-form-item label="引导系数 (CFG Scale)">
                      <el-slider
                        v-model="form.cfgScale"
                        :min="1"
                        :max="20"
                        :step="0.5"
                        show-input
                        :disabled="isGenerating"
                      />
                    </el-form-item>

                    <!-- 随机种子 -->
                    <el-form-item label="随机种子">
                      <div class="seed-input">
                        <el-input-number
                          v-model="form.seed"
                          :min="-1"
                          :max="4294967295"
                          placeholder="-1为随机"
                          :disabled="isGenerating"
                        />
                        <el-button
                          type="primary"
                          plain
                          size="small"
                          @click="generateRandomSeed"
                          :disabled="isGenerating"
                        >
                          随机
                        </el-button>
                      </div>
                    </el-form-item>
                  </el-collapse-item>
                </el-collapse>
              </div>

              <!-- 生成按钮 -->
              <div class="action-buttons">
                <el-button
                  type="primary"
                  size="large"
                  :loading="isGenerating"
                  :disabled="!form.prompt.trim()"
                  @click="handleGenerate"
                  class="generate-btn"
                >
                  <el-icon v-if="!isGenerating"><Star /></el-icon>
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
                  v-if="generatedImage"
                  type="primary"
                  plain
                  size="small"
                  @click="downloadImage"
                >
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
              </div>
            </div>

            <div class="preview-content">
              <!-- 空状态 -->
              <div v-if="!generatedImage && !isGenerating" class="empty-state">
                <el-icon size="64"><Picture /></el-icon>
                <p>填写提示词后点击生成按钮</p>
              </div>

              <!-- 生成中状态 -->
              <div v-if="isGenerating" class="generating-state">
                <el-progress
                  type="circle"
                  :percentage="progress"
                  :width="120"
                  :stroke-width="8"
                >
                  <template #default="{ percentage }">
                    <span class="progress-text">{{ percentage }}%</span>
                  </template>
                </el-progress>
                <p class="progress-label">{{ progressText }}</p>
              </div>

              <!-- 生成结果 -->
              <div v-if="generatedImage" class="result-state">
                <div class="image-container">
                  <el-image
                    :src="generatedImage.url"
                    :preview-src-list="[generatedImage.url]"
                    fit="contain"
                    class="generated-image"
                  >
                    <template #error>
                      <div class="image-error">
                        <el-icon size="48"><Picture /></el-icon>
                        <p>图片加载失败</p>
                      </div>
                    </template>
                  </el-image>
                </div>
                
                <!-- 图片信息 -->
                <div class="image-info">
                  <div class="info-item">
                    <span class="label">尺寸：</span>
                    <span class="value">{{ generatedImage.width }}x{{ generatedImage.height }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">大小：</span>
                    <span class="value">{{ formatFileSize(generatedImage.size) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">格式：</span>
                    <span class="value">{{ generatedImage.format || 'PNG' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">生成时间：</span>
                    <span class="value">{{ formatDate(generatedImage.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </BasicLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useGenerationStore } from '@/stores/generation'
import { formatFileSize, formatDate } from '@/utils/format'
import BasicLayout from '@/layout/BasicLayout.vue'
import { Star, Picture, Download } from '@element-plus/icons-vue'

const generationStore = useGenerationStore()

// 响应式数据
const activeCollapse = ref<string[]>([])
const isGenerating = ref(false)
const progress = ref(0)
const progressText = ref('')
const generatedImage = ref<any>(null)

const form = reactive({
  prompt: '',
  negativePrompt: '',
  size: '512x512',
  style: '',
  steps: 20,
  cfgScale: 7.5,
  seed: -1
})

// 方法
const generateRandomSeed = () => {
  form.seed = Math.floor(Math.random() * 4294967295)
}

const handleGenerate = async () => {
  if (!form.prompt.trim()) {
    ElMessage.warning('请输入提示词')
    return
  }

  try {
    isGenerating.value = true
    progress.value = 0
    progressText.value = '正在准备生成...'
    generatedImage.value = null

    // 模拟生成进度
    const progressSteps = [
      { progress: 20, text: '正在解析提示词...' },
      { progress: 40, text: '正在生成图片...' },
      { progress: 60, text: '正在优化细节...' },
      { progress: 80, text: '正在处理颜色...' },
      { progress: 100, text: '生成完成！' }
    ]

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      progress.value = step.progress
      progressText.value = step.text
    }

    // 模拟生成结果
    const mockResult = {
      url: 'https://picsum.photos/512/512?random=' + Date.now(),
      width: 512,
      height: 512,
      size: 256000,
      format: 'PNG',
      createdAt: new Date().toISOString()
    }

    generatedImage.value = mockResult
    generationStore.completeGeneration(mockResult)
    ElMessage.success('图片生成成功！')

  } catch (error) {
    console.error('Generate error:', error)
    ElMessage.error('生成失败，请重试')
    generationStore.failGeneration('生成失败')
  } finally {
    isGenerating.value = false
    setTimeout(() => {
      progress.value = 0
      progressText.value = ''
    }, 2000)
  }
}

const handleReset = () => {
  form.prompt = ''
  form.negativePrompt = ''
  form.size = '512x512'
  form.style = ''
  form.steps = 20
  form.cfgScale = 7.5
  form.seed = -1
  generatedImage.value = null
  activeCollapse.value = []
}

const downloadImage = () => {
  if (!generatedImage.value) return

  const link = document.createElement('a')
  link.href = generatedImage.value.url
  link.download = `generated-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('下载已开始')
}
</script>

<style lang="scss" scoped>
.txt2img-container {
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
  max-width: 400px;
  border-right: 1px solid var(--border-light);
  padding-right: 24px;
  
  .panel-header {
    margin-bottom: 24px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
  }
  
  .generation-form {
    .el-form-item {
      margin-bottom: 20px;
      
      :deep(.el-form-item__label) {
        font-weight: 600;
        color: var(--text-primary);
      }
    }
    
    .advanced-params {
      margin: 20px 0;
      
      :deep(.el-collapse-item__header) {
        font-weight: 600;
      }
    }
    
    .seed-input {
      display: flex;
      gap: 12px;
      
      .el-input-number {
        flex: 1;
      }
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
      color: var(--text-primary);
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
    
    .empty-state {
      text-align: center;
      color: var(--text-secondary);
      
      .el-icon {
        margin-bottom: 16px;
        opacity: 0.5;
      }
    }
    
    .generating-state {
      text-align: center;
      
      .progress-text {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-color);
      }
      
      .progress-label {
        margin-top: 16px;
        color: var(--text-secondary);
      }
    }
    
    .result-state {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
      
      .image-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .generated-image {
          max-width: 100%;
          max-height: 100%;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .image-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
        }
      }
      
      .image-info {
        background: var(--bg-page);
        border-radius: 8px;
        padding: 16px;
        
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-lighter);
          
          &:last-child {
            border-bottom: none;
          }
          
          .label {
            font-weight: 600;
            color: var(--text-secondary);
          }
          
          .value {
            color: var(--text-primary);
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
    border-bottom: 1px solid var(--border-light);
    padding-right: 0;
    padding-bottom: 24px;
  }
  
  .preview-panel {
    padding-left: 0;
    padding-top: 24px;
  }
}
</style>