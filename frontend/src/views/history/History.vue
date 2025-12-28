<template>
  <div class="history-container">
    <el-card class="history-card">
      <template #header>
        <div class="history-header">
          <h2>历史记录</h2>
          <div class="filter-tabs">
            <el-tabs v-model="activeTab" @tab-change="handleTabChange">
              <el-tab-pane label="全部" name="all" />
              <el-tab-pane label="视频" name="video" />
              <el-tab-pane label="图片" name="image" />
              <el-tab-pane label="音频" name="audio" />
            </el-tabs>
          </div>
        </div>
      </template>

      <div class="history-content" v-loading="loading" element-loading-text="加载中...">
        <div v-if="historyItems.length === 0 && !loading" class="empty-state">
            <el-icon size="64"><DocumentRemove /></el-icon>
            <p>暂无历史记录</p>
          </div>

          <div v-else class="history-grid">
            <div 
              v-for="item in historyItems" 
              :key="item.id" 
              class="history-item"
              @click="handleItemClick(item)"
            >
              <div class="item-preview">
                <!-- 只显示提示词，不加载图片 -->
                <div class="prompt-preview">
                  <p class="prompt-text" @click.stop="showPromptDetail(item)" title="点击查看完整提示词">{{ item.description || item.prompt || item.userPrompt || '无提示词' }}</p>
                  <div class="task-type-badge">
                    <el-tag :type="getTypeTagType(item.type)" size="small">
                      {{ getTypeText(item.type) }}
                    </el-tag>
                  </div>
                </div>
              </div>
              
              <div class="item-info">
                <h4 class="item-title">{{ item.title || '未命名作品' }}</h4>
                <p class="item-description">{{ item.description || item.prompt || '暂无描述' }}</p>
                <div class="item-meta">
                  <el-tag :type="getStatusType(item.status)" size="small">
                    {{ getStatusText(item.status) }}
                  </el-tag>
                  <span class="item-date">{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
              
              <div class="item-actions">
                <el-button 
                  v-if="item.status === 'COMPLETED' && item.url" 
                  type="primary" 
                  size="small" 
                  @click.stop="handlePreview(item)"
                >
                  预览
                </el-button>
                <el-button 
                  v-if="item.status === 'COMPLETED' && item.url" 
                  size="small" 
                  @click.stop="handleDownload(item)"
                >
                  下载
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click.stop="handleDelete(item)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>

        <div v-if="historyItems.length > 0" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[12, 24, 48]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewItem?.title || '预览'"
      width="80%"
      :before-close="closePreview"
    >
      <div class="preview-container">
        <img
          v-if="previewItem?.type === 'TXT2IMG' || previewItem?.type === 'IMG2IMG'"
          :src="previewItem.url"
          :alt="previewItem.title"
          class="preview-img"
        />
        <video
          v-else-if="previewItem?.type === 'IMG2VID'"
          :src="previewItem.url"
          controls
          class="preview-video"
        />
        <div v-else class="no-preview">
          <el-icon><DocumentRemove /></el-icon>
          <p>此类型暂不支持预览</p>
        </div>
      </div>
    </el-dialog>

    <!-- 提示词详情弹窗 -->
    <el-dialog
      v-model="promptVisible"
      title="完整提示词"
      width="60%"
      :before-close="closePromptDetail"
    >
      <div class="prompt-detail-container">
        <div class="prompt-detail-box">
          <p class="prompt-detail-text">{{ promptItem?.description || promptItem?.prompt || promptItem?.userPrompt || '无提示词' }}</p>
        </div>
        <div class="prompt-detail-info">
          <el-tag :type="getTypeTagType(promptItem?.type)" size="small">
            {{ getTypeText(promptItem?.type) }}
          </el-tag>
          <span class="prompt-detail-date">{{ formatDate(promptItem?.createdAt) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock,
  DocumentRemove,
  Picture,
  VideoPlay,
  Microphone
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

// 用户存储
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const historyItems = ref<any[]>([])

// 预览相关
const previewVisible = ref(false)
const previewItem = ref<any>(null)

// 提示词详情相关
const promptVisible = ref(false)
const promptItem = ref<any>(null)

// 获取历史记录
const fetchHistory = async () => {
  loading.value = true
  try {
    const userId = userStore.userInfo?.id
    console.log('📊 [History] 当前用户ID:', userId)

    // 构建查询参数
    const userParams = userId ? `?userId=${userId}` : ''

    // 根据当前tab类型获取数据
    if (activeTab.value === 'all') {
      // 获取所有类型的记录
      const [videosRes, tasksRes] = await Promise.all([
        request.get(`/videos${userParams}`),
        request.get(`/tasks${userParams}`)
      ])

      console.log('📊 [History] Videos响应:', videosRes.length || 0, '条')
      console.log('📊 [History] Tasks响应:', tasksRes.length || 0, '条')

      const videos = videosRes.map((video: any) => ({
        ...video,
        type: 'video',
        url: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        title: video.title,
        description: video.description
      }))

      const tasks = tasksRes.map((task: any) => ({
        ...task,
        type: task.type, // 使用任务的实际类型：TXT2IMG, IMG2IMG, IMG2VID
        url: task.videoUrl || task.resultUrl,
        title: task.userPrompt?.substring(0, 20) + '...',
        description: task.translatedPrompt || task.userPrompt,
        promptId: task.promptId,
        status: task.status
      }))

      const allItems = [...videos, ...tasks]
      console.log('📊 [History] 合并后总记录数:', allItems.length)

      historyItems.value = allItems.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)

      console.log('📊 [History] 当前页显示:', historyItems.value.length, '条')
      total.value = videos.length + tasks.length
    } else if (activeTab.value === 'video') {
      const response = await request.get(`/videos${userParams}`)
      historyItems.value = response.map((item: any) => ({
        ...item,
        type: 'video',
        url: item.videoUrl,
        thumbnailUrl: item.thumbnailUrl,
        duration: item.duration,
        title: item.title,
        description: item.description
      }))
      total.value = response.length
    } else if (activeTab.value === 'image') {
      // 只显示图片类型的任务
      const tasksRes = await request.get(`/tasks${userParams}`)
      historyItems.value = tasksRes
        .filter((task: any) => task.type === 'TXT2IMG' || task.type === 'IMG2IMG')
        .map((task: any) => ({
          ...task,
          url: task.resultUrl,
          title: task.userPrompt?.substring(0, 20) + '...',
          description: task.translatedPrompt || task.userPrompt,
          promptId: task.promptId,
          status: task.status
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
      total.value = tasksRes.filter((task: any) => task.type === 'TXT2IMG' || task.type === 'IMG2IMG').length
    } else if (activeTab.value === 'audio') {
      // 音频任务目前暂无，显示空状态
      historyItems.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    ElMessage.error('获取历史记录失败')
  } finally {
    loading.value = false
  }
}

// Tab切换
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  currentPage.value = 1
  fetchHistory()
}

// 分页相关
const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchHistory()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchHistory()
}

// 项目点击
const handleItemClick = (item: any) => {
  if (item.status === 'COMPLETED' && item.url) {
    handlePreview(item)
  }
}

// 预览
const handlePreview = (item: any) => {
  previewItem.value = item
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
  previewItem.value = null
}

// 显示提示词详情
const showPromptDetail = (item: any) => {
  promptItem.value = item
  promptVisible.value = true
}

const closePromptDetail = () => {
  promptVisible.value = false
  promptItem.value = null
}

// 下载
const handleDownload = async (item: any) => {
  if (!item.url) return

  try {
    // 使用fetch下载文件
    const response = await fetch(item.url)
    if (!response.ok) throw new Error('下载失败')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = item.title || 'download'
    document.body.appendChild(link)
    link.click()

    // 清理
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

// 删除
const handleDelete = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除"${item.title || '未命名作品'}"吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 判断是Video还是VideoTask
    const isVideoTask = item.promptId !== undefined // VideoTask有promptId字段
    
    if (isVideoTask) {
      await request.delete(`/tasks/${item.id}`)
    } else {
      await request.delete(`/videos/${item.id}`)
    }
    
    ElMessage.success('删除成功')
    fetchHistory()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 格式化函数
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'success'
    case 'PROCESSING': return 'warning'
    case 'FAILED': return 'danger'
    case 'PENDING': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED': return '已完成'
    case 'PROCESSING': return '处理中'
    case 'FAILED': return '失败'
    case 'PENDING': return '待处理'
    default: return status
  }
}

const getTypeTagType = (type: string) => {
  switch (type) {
    case 'TXT2IMG': return 'primary'
    case 'IMG2IMG': return 'success'
    case 'IMG2VID': return 'warning'
    default: return 'info'
  }
}

const getTypeText = (type: string) => {
  switch (type) {
    case 'TXT2IMG': return '文生图'
    case 'IMG2IMG': return '图生图'
    case 'IMG2VID': return '图生视频'
    default: return type
  }
}

// 生命周期
onMounted(() => {
  fetchHistory()
})
</script>

<style lang="scss" scoped>
.history-container {
  height: 100%;
  overflow-y: auto;
}

.history-card {
  height: calc(100vh - 140px);
  border: none;
  border-radius: 16px;
  overflow: hidden;

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    
    .filter-tabs {
      .el-tabs__header {
        margin: 0;
      }
    }
  }
}

.history-content {
  height: calc(100% - 120px);
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
  
  .el-icon {
    margin-bottom: 20px;
    color: var(--el-color-info);
  }
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.history-item {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: var(--el-color-primary);
  }
}

.item-preview {
  position: relative;
  height: 180px;
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .prompt-preview {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;

    .prompt-text {
      margin: 0;
      padding: 0 10px;
      font-size: 14px;
      color: var(--el-text-color-regular);
      line-height: 1.6;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      font-style: italic;
    }

    .task-type-badge {
      margin-top: 8px;
    }
  }
}

.item-info {
  padding: 16px;
  
  .item-title {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-description {
    margin: 0 0 12px 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .item-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .item-date {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}

.item-actions {
  padding: 0 16px 16px;
  display: flex;
  gap: 8px;
  
  .el-button {
    flex: 1;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  
  .preview-img {
    max-width: 100%;
    max-height: 70vh;
    border-radius: 8px;
  }
  
  .preview-video {
    max-width: 100%;
    max-height: 70vh;
    border-radius: 8px;
  }

  .no-preview {
    text-align: center;
    padding: 40px;

    .el-icon {
      font-size: 64px;
      color: var(--el-color-info);
      margin-bottom: 20px;
    }

    p {
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .history-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .history-card {
    border-radius: 0;
    height: 100vh;
  }
  
  .history-content {
    padding: 16px;
  }
  
  .history-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}

// 提示词详情弹窗样式
.prompt-detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .prompt-detail-box {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 24px;
    min-height: 200px;
    max-height: 60vh;
    overflow-y: auto;
    
    .prompt-detail-text {
      margin: 0;
      font-size: 15px;
      line-height: 1.8;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
  
  .prompt-detail-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
    
    .prompt-detail-date {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>