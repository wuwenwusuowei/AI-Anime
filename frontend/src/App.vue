<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 引入字体 (通常建议在 index.html 中引入，但为了演示效果放在这里)
import { onMounted } from 'vue'

onMounted(() => {
  // 动态加载 Quicksand 字体
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
})
</script>

<style lang="scss">
/* --- 全局波普配色变量 (CSS Variables) --- */
:root {
  --pop-bg: #FBF8F3;
  --pop-dark: #1A1A1A;
  --pop-yellow: #FFD93D;
  --pop-blue: #4D96FF;
  --pop-pink: #FF6B6B;
  --pop-green: #6BCB77;
  --pop-purple: #9B5DE5;
  --pop-border-radius: 16px;
  --pop-border-width: 3px;
}

/* --- 基础重置 --- */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: var(--pop-bg);
  /* 解决某些浏览器下的字体锯齿问题 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  font-family: 'Quicksand', 'Varela Round', system-ui, -apple-system, sans-serif;
  color: var(--pop-dark);
  height: 100vh;
  width: 100vw;
  overflow: hidden; /* 防止最外层出现双重滚动条 */
}

/* --- 全局盒模型 --- */
* {
  box-sizing: border-box;
}

/* --- 自定义滚动条 (Chunky Scrollbar) --- */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
  background-color: transparent;
}

::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.05);
  border-left: 2px solid var(--pop-dark); /* 轨道左侧加线 */
}

::-webkit-scrollbar-thumb {
  background-color: var(--pop-yellow);
  border: 2px solid var(--pop-dark);
  border-radius: 10px;
  
  &:hover {
    background-color: var(--pop-pink);
  }
}

/* --- Element Plus 全局样式覆盖 (为了更贴合风格) --- */

/* 1. 覆盖默认的 Tooltip 样式，使其变成黑色气泡 */
.el-popper.is-dark {
  background: var(--pop-dark) !important;
  border: 2px solid white !important;
  font-weight: bold !important;
  font-family: 'Quicksand', sans-serif !important;
  
  .el-popper__arrow::before {
    background: var(--pop-dark) !important;
    border-color: white !important;
  }
}

/* 2. 覆盖默认的 Message 样式 */
.el-message {
  border: 3px solid var(--pop-dark) !important;
  border-radius: 12px !important;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.1) !important;
  font-weight: bold !important;
  font-family: 'Quicksand', sans-serif !important;
  
  &.el-message--success {
    background-color: var(--pop-green) !important;
    color: var(--pop-dark) !important;
    .el-message__icon { color: var(--pop-dark) !important; }
  }
  
  &.el-message--warning {
    background-color: var(--pop-yellow) !important;
    color: var(--pop-dark) !important;
    .el-message__icon { color: var(--pop-dark) !important; }
  }
  
  &.el-message--error {
    background-color: var(--pop-pink) !important;
    color: white !important;
    .el-message__icon { color: white !important; }
  }
}

/* 3. 覆盖 MessageBox (弹窗确认框) */
.pop-message-box {
  border: 3px solid var(--pop-dark) !important;
  border-radius: 20px !important;
  box-shadow: 10px 10px 0 rgba(0,0,0,0.2) !important;
  font-family: 'Quicksand', sans-serif !important;
  padding-bottom: 20px !important;
  
  .el-message-box__header {
    padding-top: 20px;
    .el-message-box__title { font-weight: 900; font-size: 20px; }
  }
  
  .el-button {
    border: 2px solid var(--pop-dark) !important;
    font-weight: bold !important;
    border-radius: 8px !important;
    transition: transform 0.1s;
    
    &:hover { transform: scale(1.05); }
    
    &--primary {
      background-color: var(--pop-blue) !important;
      border-color: var(--pop-dark) !important;
    }
  }
}
</style>