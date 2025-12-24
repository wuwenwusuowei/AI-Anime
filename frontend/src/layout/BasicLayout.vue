<template>
  <div class="basic-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="logo">
        <div class="logo-icon">🎬</div>
        <span v-show="!sidebarCollapsed" class="logo-text">漫改视频</span>
      </div>
      
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
          <span v-show="!sidebarCollapsed" class="nav-text">{{ item.title }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <header class="header">
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
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
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
  History,
  Document
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
    icon: History
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

<style lang="scss" scoped>
.basic-layout {
  display: flex;
  height: 100vh;
  background: var(--bg-page);
}

.sidebar {
  width: 240px;
  background: var(--bg-white);
  border-right: 1px solid var(--border-light);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  
  &.collapsed {
    width: 64px;
  }
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid var(--border-light);
    
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
      color: var(--text-primary);
    }
  }
  
  .nav-menu {
    flex: 1;
    padding: 20px 0;
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: var(--text-regular);
      text-decoration: none;
      transition: all 0.3s ease;
      margin-bottom: 4px;
      
      &:hover {
        background: var(--bg-page);
        color: var(--primary-color);
      }
      
      &.active {
        background: rgba(64, 158, 255, 0.1);
        color: var(--primary-color);
        border-right: 3px solid var(--primary-color);
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
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 60px;
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-light);
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
        background: var(--bg-page);
      }
      
      .username {
        font-size: 14px;
        color: var(--text-primary);
      }
      
      .arrow-down {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(-100%);
    
    &.collapsed {
      transform: translateX(-100%);
    }
    
    &:not(.collapsed) {
      transform: translateX(0);
    }
  }
  
  .main-container {
    margin-left: 0;
  }
}
</style>