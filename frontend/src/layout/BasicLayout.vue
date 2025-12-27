<template>
  <div class="app-wrapper">
    <el-container class="layout-container">
      <!-- 顶部导航栏（包含Logo和横向菜单） -->
      <el-header class="top-header">
        <div class="header-content">
          <!-- Logo -->
          <div class="logo-container">
            <div class="logo-icon">🎬</div>
            <span class="logo-text">AI-Anime漫改视频</span>
          </div>
          
          <!-- 横向导航菜单 -->
          <nav class="top-nav-menu">
            <router-link
              v-for="item in menuItems"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              :class="{ active: $route.path === item.path }"
            >
              <el-icon class="nav-icon">
                <component :is="item.icon" />
              </el-icon>
              <span class="nav-text">{{ item.title }}</span>
            </router-link>
          </nav>
          
          <!-- 用户菜单 -->
          <div class="header-right">
            <el-dropdown @command="handleUserCommand">
              <div class="user-info">
                <el-avatar :src="userInfo?.avatar" :size="32">
                  {{ userInfo?.username?.charAt(0).toUpperCase() || 'U' }}
                </el-avatar>
                <span class="username">{{ userInfo?.username || '用户' }}</span>
                <el-icon class="arrow-down">
                  <ArrowDown />
                </el-icon>
              </div>
              
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                  <el-dropdown-item command="clear-login">
                    <el-icon><SwitchButton /></el-icon>
                    清除登录状态(测试用)
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-container">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  User,
  Setting,
  SwitchButton,
  House,
  Picture,
  VideoPlay,
  Microphone,
  Clock
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 计算属性
const userInfo = computed(() => userStore.userInfo)

// 菜单项
const menuItems = [
  {
    path: '/dashboard',
    title: '首页',
    icon: House
  },
  {
    path: '/txt2img',
    title: '文字生成图片',
    icon: Picture
  },
  {
    path: '/img2img',
    title: '图片生成图片',
    icon: Picture
  },
  {
    path: '/img2vid',
    title: '图片生成视频',
    icon: VideoPlay
  },
  {
    path: '/tts',
    title: '文字转语音',
    icon: Microphone
  },
  {
    path: '/history',
    title: '历史记录',
    icon: Clock
  },
  {
    path: '/settings',
    title: '设置',
    icon: Setting
  }
]



// 方法
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        userStore.logout()
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
    case 'clear-login':
      userStore.logout()
      // 清除所有存储
      localStorage.clear()
      router.push('/login')
      break
  }
}
</script>

<style scoped>
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

.layout-container {
  height: 100vh;
}

.el-header {
  padding: 0;
  height: 80px; /* 增加高度以容纳横向导航 */
}

.top-header {
  background-color: #fff;
  border-bottom: 2px solid #e6e8eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 40px; /* 增加各部分间距 */
}

.logo-container {
  display: flex;
  align-items: center;
  flex-shrink: 0; /* 防止Logo被压缩 */
  
  .logo-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin-right: 12px;
  }
  
  .logo-text {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
}

.top-nav-menu {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px; /* 导航项之间的间距 */
  
  .nav-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    color: #606266;
    text-decoration: none;
    transition: all 0.3s ease;
    border-radius: 8px;
    font-size: 14px;
    white-space: nowrap; /* 防止文字换行 */
    
    &:hover {
      background-color: #f5f7fa;
      color: #409eff;
      transform: translateY(-2px);
    }
    
    &.active {
      background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
      color: #fff;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
    
    .nav-icon {
      font-size: 18px;
      margin-right: 8px;
      display: flex;
      align-items: center;
    }
    
    .nav-text {
      font-weight: 500;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px; /* 调整间距 */
  flex-shrink: 0; /* 防止右侧元素被压缩 */
}



.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid #e6e8eb;
  
  &:hover {
    background: #f5f7fa;
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
  
  .username {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
  }
  
  .arrow-down {
    font-size: 12px;
    color: #909399;
  }
}

.main-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 80px); /* 减去顶部header高度 */
}

/* 过渡动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-content {
    padding: 0 16px;
    gap: 24px;
  }
  
  .top-nav-menu .nav-item {
    padding: 10px 14px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .top-header {
    height: auto;
  }
  
  .header-content {
    flex-direction: column;
    padding: 12px;
    gap: 12px;
  }
  
  .top-nav-menu {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }
  
  .top-nav-menu .nav-item {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .logo-container .logo-icon {
    width: 28px;
    height: 28px;
    font-size: 20px;
  }
  
  .logo-container .logo-text {
    font-size: 16px;
  }
  
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  

  
  .main-container {
    padding: 16px;
  }
}
</style>