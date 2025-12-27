<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-content">
        <h1 class="logo">
          <i class="fas fa-video"></i>
          漫改视频生成器
        </h1>
        <nav class="nav">
          <router-link to="/dashboard" class="nav-link active">控制台</router-link>
          <router-link to="/videos" class="nav-link">我的视频</router-link>
        </nav>
        <div class="user-actions">
          <el-button type="primary" @click="showGenerateDialog = true">
            <i class="fas fa-plus"></i>
            生成视频
          </el-button>
          <el-dropdown>
            <span class="user-info">
              <i class="fas fa-user"></i>
              用户
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-video"></i>
            </div>
            <div class="stat-info">
              <h3>总视频数</h3>
              <p class="stat-number">{{ stats.totalVideos }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
              <h3>处理中</h3>
              <p class="stat-number">{{ stats.processing }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-info">
              <h3>已完成</h3>
              <p class="stat-number">{{ stats.completed }}</p>
            </div>
          </div>
        </div>

        <div class="recent-videos">
          <h2>最近生成的视频</h2>
          <div class="video-grid" v-if="recentVideos.length > 0">
            <div v-for="video in recentVideos" :key="video.id" class="video-card">
              <div class="video-thumbnail">
                <img :src="video.thumbnailUrl || '/placeholder.jpg'" :alt="video.title" />
              </div>
              <div class="video-info">
                <h4>{{ video.title }}</h4>
                <p>{{ video.prompt }}</p>
                <div class="video-meta">
                  <span class="status" :class="video.status.toLowerCase()">
                    {{ getStatusText(video.status) }}
                  </span>
                  <span class="duration">{{ video.duration }}s</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-video-slash"></i>
            <p>还没有生成任何视频</p>
            <el-button type="primary" @click="showGenerateDialog = true">
              立即生成第一个视频
            </el-button>
          </div>
        </div>
      </div>
    </main>

    <!-- 生成视频对话框 -->
    <el-dialog v-model="showGenerateDialog" title="生成新视频" width="600px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="动作描述">
          <el-input
            v-model="generateForm.prompt"
            placeholder="描述你想要生成的动作，例如：挥手、跳跃、转身等"
            rows="3"
            type="textarea"
          />
        </el-form-item>
        <el-form-item label="画质">
          <el-select v-model="generateForm.resolution">
            <el-option label="576p (推荐)" value="576p" />
            <el-option label="720p" value="720p" />
          </el-select>
        </el-form-item>
        <el-form-item label="时长">
          <el-select v-model="generateForm.duration">
            <el-option label="1秒" value="1" />
            <el-option label="2秒" value="2" />
            <el-option label="3秒 (推荐)" value="3" />
            <el-option label="4秒" value="4" />
            <el-option label="5秒" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">
              将图片拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                请上传 JPG/PNG 格式的图片文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showGenerateDialog = false">取消</el-button>
          <el-button type="primary" @click="generateVideo" :loading="generating">
            开始生成
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

interface Video {
  id: number
  title: string
  prompt: string
  status: string
  duration?: number
  thumbnailUrl?: string
  videoUrl?: string
}

const showGenerateDialog = ref(false)
const generating = ref(false)
const selectedFile = ref<File | null>(null)

const stats = reactive({
  totalVideos: 0,
  processing: 0,
  completed: 0
})

const recentVideos = ref<Video[]>([])

const generateForm = reactive({
  prompt: '',
  resolution: '576p',
  duration: '3'
})

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'PENDING': '等待中',
    'PROCESSING': '处理中',
    'COMPLETED': '已完成',
    'FAILED': '失败'
  }
  return statusMap[status] || status
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
}

const generateVideo = async () => {
  if (!selectedFile.value) {
    ElMessage.error('请上传图片')
    return
  }
  
  if (!generateForm.prompt) {
    ElMessage.error('请输入动作描述')
    return
  }

  generating.value = true
  
  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)
    formData.append('prompt', generateForm.prompt)
    formData.append('resolution', generateForm.resolution)
    formData.append('duration', generateForm.duration)

    const response = await fetch('/api/generate', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('视频生成任务已提交，请稍后查看结果')
      showGenerateDialog.value = false
      loadRecentVideos()
    } else {
      ElMessage.error(result.error || '生成失败')
    }
  } catch (error) {
    console.error('生成失败:', error)
    ElMessage.error('生成失败，请稍后重试')
  } finally {
    generating.value = false
  }
}

const loadRecentVideos = async () => {
  try {
    // 模拟数据，实际应该从API获取
    recentVideos.value = []
    stats.totalVideos = 0
    stats.processing = 0
    stats.completed = 0
  } catch (error) {
    console.error('加载视频失败:', error)
  }
}

onMounted(() => {
  loadRecentVideos()
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f7fafc;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover,
.nav-link.active {
  background-color: rgba(255,255,255,0.2);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: rgba(255,255,255,0.2);
}

.main {
  padding: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-info h3 {
  font-size: 1rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
  margin: 0;
}

.recent-videos h2 {
  margin-bottom: 1.5rem;
  color: #2d3748;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.video-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.video-thumbnail {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info {
  padding: 1rem;
}

.video-info h4 {
  margin-bottom: 0.5rem;
  color: #2d3748;
}

.video-info p {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status.pending {
  background: #fef5e7;
  color: #f39c12;
}

.status.processing {
  background: #e8f5e8;
  color: #27ae60;
}

.status.completed {
  background: #e8f4f8;
  color: #3498db;
}

.status.failed {
  background: #fdedec;
  color: #e74c3c;
}

.duration {
  color: #718096;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e0;
}

.empty-state p {
  margin-bottom: 1.5rem;
}
</style>