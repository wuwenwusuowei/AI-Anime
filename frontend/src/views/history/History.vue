<template>
  <div class="pop-layout">
    <!-- 顶部标题区 -->
    <div class="page-header">
      <div class="header-badge yellow">
        <el-icon><Clock /></el-icon>
        <span>时光机</span>
      </div>
      <h1 class="main-title">创作 <span>History</span></h1>
      
      <!-- Pop 风格的 Tab 切换 -->
      <div class="pop-tabs-wrapper">
        <div 
          class="pop-tab-item" 
          :class="{ active: activeTab === 'all' }"
          @click="handleTabChange('all')"
        >
          全部作品
        </div>
        <div 
          class="pop-tab-item" 
          :class="{ active: activeTab === 'video' }"
          @click="handleTabChange('video')"
        >
          🎬 视频
        </div>
        <div 
          class="pop-tab-item" 
          :class="{ active: activeTab === 'image' }"
          @click="handleTabChange('image')"
        >
          🖼️ 图片
        </div>
        <div 
          class="pop-tab-item" 
          :class="{ active: activeTab === 'audio' }"
          @click="handleTabChange('audio')"
        >
          🎵 音频
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-container" v-loading="loading" element-loading-background="rgba(255, 255, 255, 0.8)">
      
      <!-- 空状态 -->
      <div v-if="historyItems.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>空空如也</h3>
        <p>你的创作宝箱还是空的，快去创造点什么吧！</p>
      </div>

      <!-- 历史记录网格 -->
      <div v-else class="history-grid">
        <div 
          v-for="item in historyItems" 
          :key="item.id" 
          class="pop-card"
          @click="handleItemClick(item)"
        >
          <!-- 卡片头部：类型与状态 -->
          <div class="card-header-bar">
            <span class="type-tag" :class="getTypeColorClass(item.type)">
              {{ getTypeText(item.type) }}
            </span>
            <span class="status-dot" :class="getStatusColorClass(item.status)" :title="getStatusText(item.status)"></span>
          </div>

          <!-- 卡片主体：模拟便利贴/预览 -->
          <div class="preview-area" :class="getRandomNoteColor(item.id)">
            <div class="prompt-content" @click.stop="showPromptDetail(item)">
              <div class="quote-mark">“</div>
              <p>{{ item.description || item.prompt || item.userPrompt || '无提示词' }}</p>
              <div class="quote-mark end">”</div>
            </div>
          </div>
          
          <!-- 卡片底部：信息与操作 -->
          <div class="card-info">
            <h4 class="item-title">{{ item.title || '未命名作品' }}</h4>
            <div class="meta-row">
              <span class="date">{{ formatDate(item.createdAt) }}</span>
            </div>
            
            <div class="action-row">
              <button 
                v-if="item.status === 'COMPLETED' && item.url" 
                class="icon-btn view" 
                title="预览"
                @click.stop="handlePreview(item)"
              >
                <el-icon><VideoPlay /></el-icon>
              </button>
              
              <button 
                v-if="item.status === 'COMPLETED' && item.url" 
                class="icon-btn download" 
                title="下载"
                @click.stop="handleDownload(item)"
              >
                <el-icon><Download /></el-icon>
              </button>
              
              <button 
                class="icon-btn delete" 
                title="删除"
                @click.stop="handleDelete(item)"
              >
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="historyItems.length > 0" class="pop-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[12, 24, 48]"
          layout="prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 预览弹窗 (Pop 风格化) -->
    <el-dialog
      v-model="previewVisible"
      :title="null"
      width="800px"
      :before-close="closePreview"
      class="pop-dialog"
      :show-close="false"
    >
      <div class="pop-dialog-header">
        <span class="title">{{ previewItem?.title || '作品预览' }}</span>
        <button class="close-btn" @click="closePreview">×</button>
      </div>
      
      <div class="preview-container">
        <img
          v-if="previewItem?.type === 'TXT2IMG' || previewItem?.type === 'IMG2IMG'"
          :src="previewItem.url"
          class="preview-content"
        />
        <video
          v-else-if="previewItem?.type === 'IMG2VID' || previewItem?.type === 'video'"
          :src="previewItem.url"
          controls
          class="preview-content"
        />
        <div v-else class="no-preview">
          <p>👀 暂不支持预览</p>
        </div>
      </div>
    </el-dialog>

    <!-- 提示词详情弹窗 -->
    <el-dialog
      v-model="promptVisible"
      :title="null"
      width="600px"
      :before-close="closePromptDetail"
      class="pop-dialog"
      :show-close="false"
    >
      <div class="pop-dialog-header">
        <span class="title">✨ 完整咒语 (Prompt)</span>
        <button class="close-btn" @click="closePromptDetail">×</button>
      </div>
      
      <div class="prompt-detail-container">
        <div class="notepad-bg">
          <p class="prompt-text">{{ promptItem?.description || promptItem?.prompt || promptItem?.userPrompt || '无提示词' }}</p>
        </div>
        <div class="prompt-footer">
          <span class="tag">{{ getTypeText(promptItem?.type) }}</span>
          <span class="date">{{ formatDate(promptItem?.createdAt) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock, VideoPlay, Download, Delete
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

// --- 样式辅助函数 ---
const getTypeColorClass = (type: string) => {
  switch (type) {
    case 'TXT2IMG': return 'blue-bg'
    case 'IMG2IMG': return 'pink-bg'
    case 'IMG2VID': return 'purple-bg'
    case 'video': return 'purple-bg'
    default: return 'grey-bg'
  }
}

const getStatusColorClass = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'status-green'
    case 'PROCESSING': return 'status-yellow'
    case 'FAILED': return 'status-red'
    default: return 'status-grey'
  }
}

const getRandomNoteColor = (id: number) => {
  const colors = ['note-yellow', 'note-pink', 'note-blue', 'note-green']
  return colors[id % colors.length]
}

// 获取历史记录 (保持原有逻辑)
const fetchHistory = async () => {
  loading.value = true
  try {
    const userId = userStore.userInfo?.id
    const userParams = userId ? `?userId=${userId}` : ''

    if (activeTab.value === 'all') {
      const [videosRes, tasksRes] = await Promise.all([
        request.get(`/videos${userParams}`),
        request.get(`/tasks${userParams}`)
      ])

      const videos = videosRes.map((video: any) => ({
        ...video,
        type: 'video',
        url: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        title: video.title,
        description: video.description
      }))

      const tasks = tasksRes.map((task: any) => ({
        ...task,
        type: task.type,
        url: task.videoUrl || task.resultUrl,
        title: task.userPrompt?.substring(0, 20) + '...',
        description: task.translatedPrompt || task.userPrompt,
        promptId: task.promptId,
        status: task.status
      }))

      const allItems = [...videos, ...tasks]
      historyItems.value = allItems.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)

      total.value = videos.length + tasks.length
    } else if (activeTab.value === 'video') {
      // (省略重复逻辑，同原代码)
      const response = await request.get(`/videos${userParams}`)
      historyItems.value = response.map((item: any) => ({
        ...item,
        type: 'video',
        url: item.videoUrl,
        title: item.title,
        description: item.description
      }))
      total.value = response.length
    } else if (activeTab.value === 'image') {
       // (省略重复逻辑，同原代码)
      const tasksRes = await request.get(`/tasks${userParams}`)
      historyItems.value = tasksRes
        .filter((task: any) => task.type === 'TXT2IMG' || task.type === 'IMG2IMG')
        .map((task: any) => ({
          ...task,
          url: task.resultUrl,
          title: task.userPrompt?.substring(0, 20) + '...',
          description: task.translatedPrompt || task.userPrompt,
          status: task.status
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
      total.value = tasksRes.filter((task: any) => task.type === 'TXT2IMG' || task.type === 'IMG2IMG').length
    } else {
        historyItems.value = []
        total.value = 0
    }
  } catch (error) {
    ElMessage.error('获取历史记录失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  currentPage.value = 1
  fetchHistory()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchHistory()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchHistory()
}

const handleItemClick = (item: any) => {
  if (item.status === 'COMPLETED' && item.url) {
    handlePreview(item)
  }
}

const handlePreview = (item: any) => {
  previewItem.value = item
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
  previewItem.value = null
}

const showPromptDetail = (item: any) => {
  promptItem.value = item
  promptVisible.value = true
}

const closePromptDetail = () => {
  promptVisible.value = false
  promptItem.value = null
}

const handleDownload = async (item: any) => {
  if (!item.url) return
  try {
    const response = await fetch(item.url)
    if (!response.ok) throw new Error('下载失败')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = item.title || `download-${Date.now()}`
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    ElMessage.success('下载任务已开始')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

const handleDelete = async (item: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要把"${item.title || '这个作品'}"丢进垃圾桶吗？此操作不可撤销哦！`,
      '删除确认',
      {
        confirmButtonText: '狠心删除',
        cancelButtonText: '我再想想',
        type: 'warning',
        confirmButtonClass: 'pop-confirm-btn',
        cancelButtonClass: 'pop-cancel-btn'
      }
    )
    const isVideoTask = item.promptId !== undefined
    if (isVideoTask) {
      await request.delete(`/tasks/${item.id}`)
    } else {
      await request.delete(`/videos/${item.id}`)
    }
    ElMessage.success('已删除')
    fetchHistory()
  } catch (error: any) {}
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTypeText = (type: string) => {
  switch (type) {
    case 'TXT2IMG': return '文生图'
    case 'IMG2IMG': return '图生图'
    case 'IMG2VID': return '图生视频'
    case 'video': return '视频成品'
    default: return type
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED': return '已完成'
    case 'PROCESSING': return '处理中'
    case 'FAILED': return '失败'
    case 'PENDING': return '排队中'
    default: return status
  }
}

onMounted(() => {
  fetchHistory()
})
</script>

<style lang="scss" scoped>
/* --- Pop Art Palette --- */
$bg-color: #FBF8F3;
$dark: #1A1A1A;
$yellow: #FFD93D;
$blue: #4D96FF;
$pink: #FF6B6B;
$green: #6BCB77;
$purple: #9B5DE5;

.pop-layout {
  min-height: 100vh;
  background-color: $bg-color;
  background-image: radial-gradient(#ddd 2px, transparent 2px);
  background-size: 20px 20px;
  padding: 30px;
  font-family: 'Quicksand', sans-serif;
  color: $dark;
}

/* Header Section */
.page-header {
  margin-bottom: 40px;
  text-align: center;
  
  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 14px;
    background: white;
    border: 2px solid $dark;
    box-shadow: 3px 3px 0 $dark;
    margin-bottom: 12px;
    
    &.yellow { background: $yellow; }
  }
  
  .main-title {
    font-size: 42px;
    font-weight: 900;
    margin: 0 0 30px;
    
    span {
      color: $blue;
      text-decoration: underline wavy $pink 3px;
    }
  }
}

/* Pop Tabs */
.pop-tabs-wrapper {
  display: inline-flex;
  gap: 12px;
  padding: 8px;
  background: white;
  border: 3px solid $dark;
  border-radius: 50px;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.1);

  .pop-tab-item {
    padding: 8px 24px;
    border-radius: 20px;
    font-weight: 800;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;
    user-select: none;
    
    &:hover {
      background: #f0f0f0;
    }
    
    &.active {
      background: $dark;
      color: $yellow;
      border-color: $dark;
      transform: scale(1.05);
      box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
    }
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 0;
  
  .empty-icon {
    font-size: 80px;
    margin-bottom: 20px;
    animation: float 3s ease-in-out infinite;
  }
  
  h3 { font-size: 24px; margin-bottom: 10px; }
  p { color: #888; font-weight: 500; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Grid Layout */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* Pop Card */
.pop-card {
  background: white;
  border: 3px solid $dark;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 6px 6px 0 $dark;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 340px;
  
  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 10px 10px 0 $dark;
    
    .action-row {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Header Bar inside card */
  .card-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .type-tag {
      font-size: 10px;
      font-weight: 900;
      color: white;
      padding: 4px 10px;
      border-radius: 8px;
      border: 2px solid $dark;
      
      &.blue-bg { background: $blue; }
      &.pink-bg { background: $pink; }
      &.purple-bg { background: $purple; }
      &.grey-bg { background: #999; }
    }
    
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid $dark;
      
      &.status-green { background: $green; box-shadow: 0 0 5px $green; }
      &.status-yellow { background: $yellow; animation: blink 1s infinite; }
      &.status-red { background: $pink; }
      &.status-grey { background: #ccc; }
    }
  }

  /* Preview Area (Sticky Note style) */
  .preview-area {
    flex: 1;
    border: 2px solid $dark;
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 16px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.note-yellow { background: #FFF8E1; }
    &.note-pink { background: #FFEBEE; }
    &.note-blue { background: #E3F2FD; }
    &.note-green { background: #E8F5E9; }
    
    .prompt-content {
      text-align: center;
      width: 100%;
      
      .quote-mark {
        font-family: serif;
        font-size: 40px;
        line-height: 20px;
        color: rgba(0,0,0,0.1);
        
        &.end { text-align: right; }
      }
      
      p {
        margin: 10px 0;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.5;
        color: #555;
        /* 显示3行 */
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  /* Footer Info */
  .card-info {
    .item-title {
      margin: 0 0 6px;
      font-size: 16px;
      font-weight: 800;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .meta-row {
      font-size: 12px;
      color: #888;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .action-row {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      opacity: 0.6; /* 默认半透明，hover时全显 */
      transition: all 0.2s;
      
      .icon-btn {
        width: 32px;
        height: 32px;
        border: 2px solid $dark;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        color: $dark;
        background: white;
        transition: transform 0.1s;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 2px 2px 0 $dark;
        }
        
        &.view:hover { background: $blue; color: white; }
        &.download:hover { background: $green; color: white; }
        &.delete:hover { background: $pink; color: white; }
      }
    }
  }
}

/* Pagination Styling Override */
.pop-pagination {
  display: flex;
  justify-content: center;
  
  :deep(.el-pagination) {
    --el-pagination-bg-color: transparent;
    --el-pagination-button-bg-color: white;
    --el-pagination-hover-color: #{$dark};
    
    .btn-prev, .btn-next, .number {
      border: 2px solid $dark;
      border-radius: 8px;
      background: white;
      margin: 0 4px;
      font-weight: bold;
      
      &.is-active {
        background: $dark;
        color: $yellow;
      }
    }
  }
}

/* Dialog Styles (Pop Theme) */
:deep(.pop-dialog) {
  border-radius: 20px;
  border: 4px solid $dark;
  box-shadow: 10px 10px 0 rgba(0,0,0,0.2);
  overflow: hidden;
  
  .el-dialog__header { display: none; }
  .el-dialog__body { padding: 0; }
  
  .pop-dialog-header {
    background: $yellow;
    padding: 16px 20px;
    border-bottom: 3px solid $dark;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .title {
      font-weight: 900;
      font-size: 18px;
      color: $dark;
    }
    
    .close-btn {
      background: $pink;
      border: 2px solid $dark;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 20px;
      line-height: 26px;
      cursor: pointer;
      &:hover { transform: scale(1.1); }
    }
  }
  
  .preview-container {
    background: #000;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .preview-content {
      max-width: 100%;
      max-height: 70vh;
    }
    
    .no-preview { color: white; }
  }
  
  .prompt-detail-container {
    padding: 20px;
    background: $bg-color;
    
    .notepad-bg {
      background: white;
      border: 2px solid $dark;
      border-radius: 12px;
      padding: 20px;
      min-height: 200px;
      /* 模拟横线 */
      background-image: repeating-linear-gradient(transparent, transparent 31px, #eee 32px);
      line-height: 32px;
      
      .prompt-text {
        font-size: 16px;
        color: #333;
        white-space: pre-wrap;
      }
    }
    
    .prompt-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      
      .tag {
        background: $dark;
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 12px;
      }
      
      .date { font-weight: bold; color: #999; }
    }
  }
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

@media (max-width: 768px) {
  .pop-tabs-wrapper {
    width: 100%;
    justify-content: space-between;
    padding: 4px;
    .pop-tab-item { padding: 8px 12px; font-size: 12px; }
  }
  
  .history-grid {
    grid-template-columns: 1fr;
  }
}
</style>