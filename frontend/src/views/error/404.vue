<template>
  <div class="pop-404-container">
    <!-- 背景装饰漂浮物 -->
    <div class="deco-shape circle-1"></div>
    <div class="deco-shape square-1"></div>
    <div class="deco-shape triangle-1"></div>

    <div class="error-card">
      <!-- 顶部胶带装饰 -->
      <div class="tape-strip"></div>
      
      <!-- 核心内容 -->
      <div class="card-content">
        <div class="visual-area">
          <div class="glitch-text" data-text="404">404</div>
          <div class="icon-sticker">
            <el-icon><Compass /></el-icon>
          </div>
        </div>
        
        <h2 class="error-title">
          Oops! <span class="highlight">迷路了?</span>
        </h2>
        
        <p class="error-desc">
          这个页面似乎穿越到了二次元...<br>
          AI 正在努力寻找，但建议你先撤退。
        </p>
        
        <button class="pop-btn home-btn" @click="goHome">
          <span class="btn-text">🚀 发射回首页</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Compass } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}
</script>

<style lang="scss" scoped>
/* --- Pop Color Palette --- */
$bg-color: #FBF8F3;
$dark: #1A1A1A;
$yellow: #FFD93D;
$blue: #4D96FF;
$pink: #FF6B6B;
$green: #6BCB77;

.pop-404-container {
  height: 100vh;
  width: 100%;
  background-color: $bg-color;
  /* 波点背景 */
  background-image: radial-gradient(#ddd 2px, transparent 2px);
  background-size: 30px 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: 'Quicksand', sans-serif;
  color: $dark;
}

/* 背景漂浮装饰 */
.deco-shape {
  position: absolute;
  border: 3px solid $dark;
  z-index: 0;
  opacity: 0.6;
  
  &.circle-1 {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: $yellow;
    top: 15%;
    left: 10%;
    animation: float 6s ease-in-out infinite;
  }
  
  &.square-1 {
    width: 60px;
    height: 60px;
    background: $blue;
    bottom: 20%;
    right: 15%;
    transform: rotate(15deg);
    animation: float 7s ease-in-out infinite reverse;
  }
  
  &.triangle-1 {
    width: 0;
    height: 0;
    border-left: 25px solid transparent;
    border-right: 25px solid transparent;
    border-bottom: 50px solid $pink;
    border-top: none;
    top: 20%;
    right: 25%;
    /* 三角形border特殊处理，这里简化用伪元素模拟或者直接用图片，这里仅示意 */
    background: transparent;
    border: none;
    
    &::after {
      content: '';
      display: block;
      width: 0;
      height: 0;
      border-left: 30px solid transparent;
      border-right: 30px solid transparent;
      border-bottom: 60px solid $pink;
      filter: drop-shadow(3px 3px 0 $dark);
    }
    animation: float 5s ease-in-out infinite 1s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

/* 核心卡片 */
.error-card {
  position: relative;
  background: white;
  border: 3px solid $dark;
  border-radius: 24px;
  padding: 40px;
  width: 400px;
  text-align: center;
  box-shadow: 10px 10px 0 $dark;
  z-index: 1;
  transform: rotate(-2deg); /* 微微倾斜增加俏皮感 */
  transition: transform 0.3s;
  
  &:hover {
    transform: rotate(0deg) scale(1.02);
  }

  /* 胶带效果 */
  .tape-strip {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 35px;
    background: rgba(255, 255, 255, 0.4);
    border-left: 2px dashed rgba(0,0,0,0.1);
    border-right: 2px dashed rgba(0,0,0,0.1);
    background-color: #E0E0E0; /* 胶带色 */
    opacity: 0.8;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 2;
  }
}

.visual-area {
  position: relative;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  
  .glitch-text {
    font-size: 100px;
    font-weight: 900;
    color: $pink;
    text-shadow: 4px 4px 0 $dark;
    position: relative;
    letter-spacing: -5px;
    z-index: 1;
  }
  
  .icon-sticker {
    position: absolute;
    right: 40px;
    bottom: 0;
    font-size: 50px;
    color: $dark;
    background: $yellow;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    border: 3px solid $dark;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(15deg);
    z-index: 2;
    box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
    
    animation: bounce 2s infinite;
  }
}

@keyframes bounce {
  0%, 100% { transform: rotate(15deg) translateY(0); }
  50% { transform: rotate(15deg) translateY(-10px); }
}

.error-title {
  font-size: 28px;
  font-weight: 900;
  margin: 0 0 16px;
  
  .highlight {
    background: $blue;
    color: white;
    padding: 0 8px;
    border-radius: 4px;
    display: inline-block;
    transform: rotate(2deg);
    border: 2px solid $dark;
  }
}

.error-desc {
  font-size: 16px;
  color: #666;
  font-weight: 600;
  line-height: 1.6;
  margin-bottom: 30px;
}

/* 按钮样式 */
.pop-btn {
  background: $green;
  color: $dark;
  border: 3px solid $dark;
  border-radius: 16px;
  padding: 14px 32px;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.1s;
  box-shadow: 5px 5px 0 $dark;
  
  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 7px 7px 0 $dark;
    background: #5EBC69;
  }
  
  &:active {
    transform: translate(3px, 3px);
    box-shadow: 2px 2px 0 $dark;
  }
}

/* 移动端适配 */
@media (max-width: 480px) {
  .error-card {
    width: 90%;
    padding: 30px 20px;
  }
  
  .glitch-text {
    font-size: 80px;
  }
}
</style>