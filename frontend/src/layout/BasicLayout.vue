<template>
  <div class="pop-layout-wrapper">
    <el-container class="layout-container">
      <!-- 顶部悬浮导航栏 -->
      <el-header class="pop-header">
        <div class="header-inner">
          <!-- Logo Badge -->
          <div class="logo-badge">
            <div class="icon-box">🎬</div>
            <span class="logo-text">AI-Anime</span>
            <span class="beta-tag">BETA</span>
          </div>
          
          <!-- 胶囊导航菜单 -->
          <nav class="pop-nav">
            <router-link
              v-for="(item, index) in menuItems"
              :key="item.path"
              :to="item.path"
              class="nav-pill"
              :class="[
                { active: $route.path.startsWith(item.path) },
                `color-${index % 4}` // 循环分配颜色类
              ]"
            >
              <el-icon class="nav-icon">
                <component :is="item.icon" />
              </el-icon>
              <span class="nav-text">{{ item.title }}</span>
            </router-link>
          </nav>
          
          <!-- 用户胶囊 -->
          <div class="header-right">
            <el-dropdown 
              @command="handleUserCommand" 
              popper-class="pop-user-dropdown"
              trigger="click"
            >
              <div class="user-capsule">
                <div class="avatar-circle">
                  <img v-if="userInfo?.avatar" :src="userInfo.avatar" />
                  <span v-else>{{ userInfo?.username?.charAt(0).toUpperCase() || 'U' }}</span>
                </div>
                <span class="username">{{ userInfo?.username || 'Guest' }}</span>
                <el-icon class="arrow-icon"><CaretBottom /></el-icon>
              </div>
              
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="settings">
                    <span class="pop-menu-item">⚙️ 设置</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="logout">
                    <span class="pop-menu-item">🚪 退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="pop-main">
        <router-view v-slot="{ Component, route }">
          <transition name="pop-bounce" mode="out-in">
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
  CaretBottom,
  House,
  Picture,
  VideoPlay,
  Microphone,
  Tools,
  MagicStick,
  Connection
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)

// 菜单配置
const menuItems = [
  { path: '/dashboard', title: '首页', icon: House },
  { path: '/txt2img', title: '文生图', icon: MagicStick },
  { path: '/img2img', title: '图生图', icon: Picture },
  { path: '/img2vid', title: '图生视频', icon: VideoPlay },
  { path: '/tts', title: '配音', icon: Microphone },
  { path: '/merge', title: '漫改视频', icon: Connection }
]

const handleUserCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('准备开溜了吗？', '退出确认', {
        confirmButtonText: '溜了溜了',
        cancelButtonText: '再玩会',
        type: 'warning',
        // 自定义 Class 以匹配风格 (需要在全局样式定义，这里仅作示意)
        customClass: 'pop-message-box'
      })
      userStore.logout()
      router.push('/login')
    } catch {}
  } else if (command === 'settings') {
    router.push('/settings')
  }
}
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

.pop-layout-wrapper {
  height: 100vh;
  width: 100%;
  background-color: $bg-color;
  /* 波点背景 */
  background-image: radial-gradient(#E0E0E0 2px, transparent 2px);
  background-size: 24px 24px;
  overflow: hidden;
}

.layout-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* --- Header Styling --- */
.pop-header {
  height: 80px;
  padding: 0 24px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-inner {
  width: 100%;
  max-width: 1400px;
  height: 60px;
  background: white;
  border: 3px solid $dark;
  border-radius: 50px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.1); /* 浮起感 */
  justify-content: space-between;
}

/* Logo Badge */
.logo-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: $yellow;
  padding: 6px 16px;
  border-radius: 30px;
  border: 2px solid $dark;
  transform: rotate(-2deg); /* 俏皮的旋转 */
  box-shadow: 2px 2px 0 $dark;
  transition: transform 0.2s;
  cursor: default;
  
  &:hover {
    transform: rotate(0deg) scale(1.05);
  }

  .icon-box { font-size: 20px; }
  
  .logo-text {
    font-weight: 900;
    font-size: 16px;
    color: $dark;
    letter-spacing: -0.5px;
  }
  
  .beta-tag {
    font-size: 10px;
    background: $pink;
    color: white;
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid $dark;
    font-weight: bold;
  }
}

/* Navigation Pills */
.pop-nav {
  display: flex;
  gap: 12px;
  margin: 0 20px;
  overflow-x: auto;
  
  /* 隐藏滚动条 */
  &::-webkit-scrollbar { display: none; }

  .nav-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 20px;
    text-decoration: none;
    color: $dark;
    font-weight: 700;
    font-size: 14px;
    border: 2px solid transparent;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性动画 */
    
    .nav-icon { font-size: 18px; }

    /* Hover State */
    &:hover {
      background: rgba(0,0,0,0.05);
      transform: translateY(-2px);
    }

    /* Active State based on index color */
    &.active {
      border: 2px solid $dark;
      color: white;
      box-shadow: 3px 3px 0 $dark;
      transform: translateY(-2px);
      
      &.color-0 { background: $blue; }
      &.color-1 { background: $pink; }
      &.color-2 { background: $green; }
      &.color-3 { background: $purple; }
    }
  }
}

/* User Capsule */
.user-capsule {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  border: 2px solid $dark;
  border-radius: 30px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
  
  &:hover {
    background: #f0f0f0;
    box-shadow: 2px 2px 0 $dark;
  }

  .avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $dark;
    color: $yellow;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    border: 2px solid $dark;
    overflow: hidden;
    
    img { width: 100%; height: 100%; object-fit: cover; }
  }
  
  .username {
    font-weight: 800;
    font-size: 14px;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .arrow-icon { font-size: 12px; color: #666; }
}

/* --- Main Content --- */
.pop-main {
  padding: 10px 24px 24px; /* 顶部留少一点，因为 Header 是悬浮的 */
  overflow-y: auto;
  
  /* 滚动条美化 */
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 10px;
    border: 2px solid $bg-color;
  }
}

/* --- Animations --- */
.pop-bounce-enter-active {
  animation: bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-bounce-leave-active {
  animation: fade-out 0.2s ease-in;
}

@keyframes bounce-in {
  0% { opacity: 0; transform: scale(0.95) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes fade-out {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* --- Responsive --- */
@media (max-width: 1024px) {
  .nav-text { display: none; } /* 平板模式隐藏文字，只留图标 */
  .pop-nav .nav-pill { padding: 8px 12px; }
}

@media (max-width: 768px) {
  .pop-header { padding: 0 10px; }
  .header-inner { padding: 0 8px; height: 50px; }
  
  .logo-badge { 
    padding: 4px 8px; 
    .logo-text, .beta-tag { display: none; } /* 手机模式只留 Logo 图标 */
  }
  
  .pop-nav { margin: 0 10px; gap: 4px; }
  .user-capsule .username { display: none; }
}
</style>

<!-- 下拉菜单样式需要全局定义，因为它是挂载在 body 上的 -->
<style lang="scss">
.pop-user-dropdown {
  border: 3px solid #1A1A1A !important;
  border-radius: 16px !important;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.1) !important;
  overflow: hidden;
  padding: 0 !important;
  
  .el-dropdown-menu__item {
    font-weight: bold !important;
    padding: 10px 20px !important;
    color: #1A1A1A !important;
    
    &:hover {
      background-color: #FFD93D !important; /* 黄色高亮 */
      color: #1A1A1A !important;
    }
  }
  
  .el-popper__arrow { display: none !important; }
}
</style>