<template>
  <BasicLayout>
    <div class="dashboard">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-left">
              <div class="stat-value">{{ stats.totalVideos }}</div>
              <div class="stat-label">生成视频</div>
              <div class="stat-change positive">
                <el-icon><TrendCharts /></el-icon>
                <span>12% 较上月</span>
              </div>
            </div>
            <div class="stat-icon video">
              <el-icon><VideoPlay /></el-icon>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-left">
              <div class="stat-value">{{ stats.totalCredits }}</div>
              <div class="stat-label">可用积分</div>
              <div class="stat-change positive">
                <el-icon><TrendCharts /></el-icon>
                <span>+500 今日</span>
              </div>
            </div>
            <div class="stat-icon credits">
              <el-icon><Coin /></el-icon>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-left">
              <div class="stat-value">{{ stats.totalTime }}</div>
              <div class="stat-label">总时长(分钟)</div>
              <div class="stat-change positive">
                <el-icon><TrendCharts /></el-icon>
                <span>8% 增长</span>
              </div>
            </div>
            <div class="stat-icon time">
              <el-icon><Clock /></el-icon>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-left">
              <div class="stat-value">{{ stats.storageUsed }}GB</div>
              <div class="stat-label">存储使用</div>
              <div class="stat-change negative">
                <el-icon><TrendCharts /></el-icon>
                <span>2% 减少</span>
              </div>
            </div>
            <div class="stat-icon storage">
              <el-icon><FolderOpened /></el-icon>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 功能卡片 -->
      <div class="features-section">
        <h2 class="section-title">功能中心</h2>
        <div class="features-grid">
          <el-card
            class="feature-card"
            shadow="hover"
            @click="navigateToFeature('/txt2img')"
          >
            <div class="feature-content">
              <div class="feature-icon txt2img">
                <el-icon><EditPen /></el-icon>
              </div>
              <h3 class="feature-title">文字生成图片</h3>
              <p class="feature-description">
                使用先进的AI技术将您的文字描述转换为高质量的动漫风格图片
              </p>
              <div class="feature-status">
                <el-tag type="success" size="small">
                  <el-icon><Check /></el-icon>
                  可用
                </el-tag>
              </div>
            </div>
          </el-card>

          <el-card
            class="feature-card"
            shadow="hover"
            @click="navigateToFeature('/img2img')"
          >
            <div class="feature-content">
              <div class="feature-icon img2img">
                <el-icon><Picture /></el-icon>
              </div>
              <h3 class="feature-title">图片生成图片</h3>
              <p class="feature-description">
                基于参考图片生成新的创意图片，支持风格迁移和内容重绘
              </p>
              <div class="feature-status">
                <el-tag type="success" size="small">
                  <el-icon><Check /></el-icon>
                  可用
                </el-tag>
              </div>
            </div>
          </el-card>

          <el-card
            class="feature-card"
            shadow="hover"
            @click="navigateToFeature('/img2vid')"
          >
            <div class="feature-content">
              <div class="feature-icon img2vid">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <h3 class="feature-title">图片生成视频</h3>
              <p class="feature-description">
                将静态图片转换为动态视频，让您的创作更加生动有趣
              </p>
              <div class="feature-status">
                <el-tag type="success" size="small">
                  <el-icon><Check /></el-icon>
                  可用
                </el-tag>
              </div>
            </div>
          </el-card>

          <el-card
            class="feature-card coming-soon"
            shadow="hover"
            @click="navigateToFeature('/tts')"
          >
            <div class="feature-content">
              <div class="feature-icon tts">
                <el-icon><Microphone /></el-icon>
              </div>
              <h3 class="feature-title">文字转语音</h3>
              <p class="feature-description">
                使用自然语音合成技术将文字转换为逼真的语音输出
              </p>
              <div class="feature-status">
                <el-tag type="warning" size="small">
                  <el-icon><Clock /></el-icon>
                  敬请期待
                </el-tag>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 最近作品 -->
      <el-card class="recent-works" shadow="hover">
        <template #header>
          <div class="works-header">
            <h3>最近作品</h3>
            <el-button type="primary" plain @click="navigateToFeature('/history')">
              查看全部
            </el-button>
          </div>
        </template>

        <div v-if="recentWorks.length > 0" class="works-grid">
          <div
            v-for="work in recentWorks"
            :key="work.id"
            class="work-item"
            @click="viewWork(work)"
          >
            <div class="work-preview">
              <el-image
                :src="work.thumbnail || '/placeholder.png'"
                fit="cover"
                class="work-image"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon size="32"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="work-overlay">
                <el-icon size="24" v-if="work.type === 'img2vid'"><VideoPlay /></el-icon>
                <el-icon size="24" v-else><ZoomIn /></el-icon>
              </div>
            </div>
            <div class="work-info">
              <h4 class="work-title">{{ work.title }}</h4>
              <p class="work-time">{{ formatTime(work.createdAt) }}</p>
            </div>
          </div>
        </div>

        <el-empty v-else description="还没有创作记录">
          <el-button type="primary" @click="navigateToFeature('/img2vid')">
            开始创作
          </el-button>
        </el-empty>
      </el-card>
    </div>
  </BasicLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGenerationStore } from '@/stores/generation'
import { formatDate } from '@/utils/format'
import BasicLayout from '@/layout/BasicLayout.vue'
import {
  VideoPlay,
  TrendCharts,
  Coin,
  Clock,
  FolderOpened,
  EditPen,
  Picture,
  VideoCamera,
  Microphone,
  Check,
  ZoomIn
} from '@element-plus/icons-vue'

const router = useRouter()
const generationStore = useGenerationStore()

// 响应式数据
const stats = ref({
  totalVideos: 12,
  totalCredits: 2500,
  totalTime: 45,
  storageUsed: 2.3
})

const recentWorks = ref<any[]>([])

// 方法
const navigateToFeature = (path: string) => {
  // 检查是否是"敬请期待"的功能
  if (path === '/tts') {
    ElMessage.info('此功能正在开发中，敬请期待！')
    return
  }
  router.push(path)
}

const viewWork = (work: any) => {
  // 实现查看作品详情的逻辑
  console.log('View work:', work)
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else {
    return '刚刚'
  }
}

// 生命周期
onMounted(() => {
  // 加载最近作品
  generationStore.loadHistory()
  recentWorks.value = generationStore.history.slice(0, 6)
})
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  
  .stat-card {
    border: none;
    border-radius: 16px;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    
    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .stat-left {
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }
        
        .stat-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          
          &.positive {
            color: var(--success-color);
          }
          
          &.negative {
            color: var(--danger-color);
          }
        }
      }
      
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
        
        &.video {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }
        
        &.credits {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }
        
        &.time {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
        
        &.storage {
          background: linear-gradient(135deg, #fa709a, #fee140);
        }
      }
    }
  }
}

.features-section {
  margin-bottom: 32px;
  
  .section-title {
    font-size: 24px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 20px;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    
    .feature-card {
      border: none;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      }
      
      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      }
      
      &.coming-soon {
        opacity: 0.8;
        cursor: not-allowed;
        
        &:hover {
          transform: translateY(-4px);
        }
      }
      
      .feature-content {
        text-align: center;
        padding: 20px;
        
        .feature-icon {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 36px;
          color: white;
          
          &.txt2img {
            background: linear-gradient(135deg, #667eea, #764ba2);
          }
          
          &.img2img {
            background: linear-gradient(135deg, #f093fb, #f5576c);
          }
          
          &.img2vid {
            background: linear-gradient(135deg, #4facfe, #00f2fe);
          }
          
          &.tts {
            background: linear-gradient(135deg, #fa709a, #fee140);
          }
        }
        
        .feature-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        
        .feature-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
          min-height: 48px;
        }
        
        .feature-status {
          .el-tag {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }
  }
}

.recent-works {
  border: none;
  border-radius: 16px;
  
  .works-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
  }
  
  .works-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    
    .work-item {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--bg-page);
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        
        .work-overlay {
          opacity: 1;
        }
      }
      
      .work-preview {
        position: relative;
        aspect-ratio: 16/9;
        
        .work-image {
          width: 100%;
          height: 100%;
        }
        
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-page);
          color: var(--text-secondary);
        }
        
        .work-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }
      
      .work-info {
        padding: 12px;
        
        .work-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .work-time {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .works-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>