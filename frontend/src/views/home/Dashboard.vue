<template>
  <div class="pop-dashboard">
    <!-- 装饰背景元素 -->
    <div class="bg-decoration circle-1"></div>
    <div class="bg-decoration square-1"></div>

    <!-- 顶部 Hero 区域 -->
    <div class="hero-section">
      <div class="hero-badge">
        <el-icon><StarFilled /></el-icon>
        <span>AI 创意工坊 Beta</span>
      </div>
      
      <h1 class="hero-title">
        AI-Anime <span class="highlight">漫改视频</span>
      </h1>
      
      <p class="hero-subtitle">
        不要复杂操作，只要一点点想象力 ✨<br>
        从文字到动画，好玩得像游戏一样！
      </p>

      <!-- 巨大的主操作按钮 -->
      <button class="hero-cta-btn" @click="startCreating">
        <span class="btn-content">
          <el-icon><VideoPlay /></el-icon> 立即开始创作
        </span>
        <div class="btn-shadow"></div>
      </button>
    </div>

    <!-- 核心功能 Bento Grid -->
    <div class="bento-grid">
      <!-- 1. 文生图 -->
      <div class="pop-card yellow-theme">
        <div class="card-header">
          <div class="icon-box">
            <el-icon><EditPen /></el-icon>
          </div>
          <span class="step-tag">STEP 01</span>
        </div>
        <h3>文生图</h3>
        <p>输入一段咒语，生成你心目中的主角！支持国风、日漫等8种风格。</p>
      </div>

      <!-- 2. 图生图 -->
      <div class="pop-card pink-theme">
        <div class="card-header">
          <div class="icon-box">
            <el-icon><Crop /></el-icon>
          </div>
          <span class="step-tag">STEP 02</span>
        </div>
        <h3>分镜重绘</h3>
        <p>保持角色脸部不变，为她/他设计不同的动作场景，像拼图一样简单。</p>
      </div>

      <!-- 3. 图生视频 -->
      <div class="pop-card blue-theme">
        <div class="card-header">
          <div class="icon-box">
            <el-icon><VideoCamera /></el-icon>
          </div>
          <span class="step-tag">STEP 03</span>
        </div>
        <h3>让画面动起来</h3>
        <p>魔法时刻！将静态分镜转化为流畅的动漫视频片段。</p>
      </div>

      <!-- 4. 配音 -->
      <div class="pop-card green-theme">
        <div class="card-header">
          <div class="icon-box">
            <el-icon><Microphone /></el-icon>
          </div>
          <span class="step-tag">EXTRA</span>
        </div>
        <h3>注入灵魂配音</h3>
        <p>多种声线选择，御姐音、正太音...让角色开口说话。</p>
      </div>

      <!-- 5. 风格化 -->
      <div class="pop-card purple-theme">
        <div class="card-header">
          <div class="icon-box">
            <el-icon><MagicStick /></el-icon>
          </div>
        </div>
        <h3>百变风格</h3>
        <p>3D渲染、二次元、水墨风...总有一款适合你的脑洞。</p>
      </div>

      <!-- 6. 流程 -->
      <div class="pop-card dark-theme">
        <div class="card-header">
          <div class="icon-box">
            <el-icon><Odometer /></el-icon>
          </div>
        </div>
        <h3>一站式搞定</h3>
        <p>无需切换软件，这里就是你的动漫制作工作室。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  EditPen,
  VideoCamera,
  Microphone,
  Crop,
  MagicStick,
  Odometer,
  VideoPlay,
  StarFilled
} from '@element-plus/icons-vue'

const router = useRouter()

const startCreating = () => {
  router.push('/img2vid')
}
</script>

<style lang="scss" scoped>
/* --- Pop Art Color Palette --- */
$bg-color: #FBF8F3;
$dark: #1A1A1A;
$yellow: #FFD93D;
$blue: #4D96FF;
$pink: #FF6B6B;
$green: #6BCB77;
$purple: #9B5DE5;

.pop-dashboard {
  min-height: calc(100vh - 80px); /* 减去header高度，填满剩余空间 */
  height: 100%;
  background-color: transparent;
  padding: 40px 20px;
  font-family: 'Quicksand', 'Varela Round', sans-serif;
  color: $dark;
  position: relative;
  overflow-x: hidden;
  width: 100%;
}

/* 背景装饰几何体 */
.bg-decoration {
  position: absolute;
  z-index: 0;
  opacity: 0.6;
  border: 3px solid $dark;
  
  &.circle-1 {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: $yellow;
    top: 50px;
    left: 5%;
    animation: float 6s ease-in-out infinite;
  }
  
  &.square-1 {
    width: 80px;
    height: 80px;
    background: $blue;
    bottom: 100px;
    right: 5%;
    transform: rotate(15deg);
    animation: float 8s ease-in-out infinite reverse;
  }
}

/* Hero Section */
.hero-section {
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: $dark;
    color: white;
    padding: 8px 16px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 20px;
    transform: rotate(-2deg);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
  }

  .hero-title {
    font-size: 48px;
    font-weight: 900;
    margin: 0 0 20px;
    line-height: 1.2;
    letter-spacing: -1px;

    .highlight {
      display: inline-block;
      color: $blue;
      position: relative;
      z-index: 1;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 5px;
        left: -5px;
        width: 105%;
        height: 15px;
        background: $yellow;
        z-index: -1;
        transform: rotate(-1deg);
        border-radius: 4px;
      }
    }
  }

  .hero-subtitle {
    font-size: 18px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 40px;
    font-weight: 600;
  }
}

/* 巨大的 CTA 按钮 */
.hero-cta-btn {
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s;
  display: inline-block;

  .btn-content {
    display: flex;
    align-items: center;
    gap: 10px;
    background: $dark;
    color: white;
    font-size: 20px;
    font-weight: 900;
    padding: 18px 48px;
    border-radius: 16px;
    border: 3px solid $dark;
    position: relative;
    z-index: 2;
    transition: transform 0.1s;
  }

  .btn-shadow {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 100%;
    height: 100%;
    background: $pink;
    border-radius: 16px;
    border: 3px solid $dark;
    z-index: 1;
  }

  &:hover .btn-content {
    transform: translate(-2px, -2px);
  }

  &:active {
    .btn-content {
      transform: translate(6px, 6px);
    }
    .btn-shadow {
      background: $dark;
    }
  }
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

/* 卡片样式 */
.pop-card {
  background: white;
  border: 3px solid $dark;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 8px 8px 0 $dark;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  min-height: 200px; /* 增加卡片最小高度 */
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 12px 12px 0 $dark;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .icon-box {
      width: 60px;
      height: 60px;
      border: 3px solid $dark;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: $dark;
    }

    .step-tag {
      font-size: 12px;
      font-weight: 900;
      background: $dark;
      color: white;
      padding: 4px 10px;
      border-radius: 8px;
      transform: rotate(3deg);
    }
  }

  h3 {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 12px;
  }

  p {
    font-size: 16px;
    color: #666;
    line-height: 1.6;
    margin: auto 0 0 0;
    font-weight: 500;
  }

  /* 主题色定制 */
  &.yellow-theme .icon-box { background: $yellow; }
  &.pink-theme .icon-box { background: $pink; }
  &.blue-theme .icon-box { background: $blue; }
  &.green-theme .icon-box { background: $green; }
  &.purple-theme .icon-box { background: $purple; color: white;}
  &.dark-theme {
    background: white;
    color: $dark;
    .icon-box { background: $yellow; color: $dark; }
    h3 { color: $dark; }
    p { color: #666; }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 32px;
  }

  .bento-grid {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .hero-cta-btn {
    width: 100%;
    .btn-content {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>