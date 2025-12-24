<template>
  <div class="app-wrapper">
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside width="220px" class="sidebar-container">
        <div class="sidebar-content">
          <!-- Logo -->
          <div class="logo-container">
            <div class="logo-icon">🎬</div>
            <span class="logo-text">漫改视频</span>
          </div>
          
          <!-- 导航菜单 -->
          <nav class="nav-menu">
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
        </div>
      </el-aside>

      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header-container">
          <div class="header-left">
            <el-button
              type="text"
              class="collapse-btn"
              @click="toggleSidebar"
            >
              <el-icon>
                <Expand v-if="sidebarCollapsed" />
                <Fold v-else />
              </el-icon>
            </el-button>
            
            <el-breadcrumb separator="/">
              <el-breadcrumb-item
                v-for="item in breadcrumbs"
                :key="item.path"
                :to="item.path"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <!-- 用户菜单 -->
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
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>
                    设置
                  </el-dropdown-item>
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
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import {
  Expand,
  Fold,
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

// 响应式数据
const sidebarCollapsed = ref(false)

// 计算属性
const userInfo = computed(() => userStore.userInfo)

// 菜单项
const menuItems = [
  {
    path: '/dashboard',
    title: '控制台',
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

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title as string
  }))
})

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
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

// 监听路由变化，自动展开侧边栏
watch(
  () => route.path,
  () => {
    if (window.innerWidth < 768) {
      sidebarCollapsed.value = true
    }
  }
)
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
  height: 60px;
}

.el-aside {
  background-color: #304156; /* 深色侧边栏背景 */
  color: #fff;
  height: 100vh;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #263445;
  
  .logo-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  
  .logo-text {
    margin-left: 12px;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }
}

.nav-menu {
  flex: 1;
  padding: 20px 0;
  
  .nav-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: #bfcbd9;
    text-decoration: none;
    transition: all 0.3s ease;
    margin-bottom: 4px;
    
    &:hover {
      background: #263445;
      color: #409eff;
    }
    
    &.active {
      background: #409eff;
      color: #fff;
      border-right: 3px solid #409eff;
    }
    
    .nav-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }
    
    .nav-text {
      margin-left: 12px;
      font-size: 14px;
    }
  }
}

.header-container {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .collapse-btn {
      font-size: 18px;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 8px;
      transition: background 0.3s ease;
      
      &:hover {
        background: #f5f7fa;
      }
      
      .username {
        font-size: 14px;
        color: #303133;
      }
      
      .arrow-down {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.main-container {
  padding: 20px;
  background-color: #f2f3f5;
}

/* 过渡动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>