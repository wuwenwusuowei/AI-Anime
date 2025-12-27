<template>
  <div class="dashboard">
    <!-- 项目标题区域 -->
    <div class="hero-section">
      <div class="hero-content">
      <h1 class="hero-title">AI-Anime漫改视频</h1>
      <p class="hero-subtitle">AI动态漫画视频生成平台，让创意变为现实</p>
        <p class="hero-description">
          通过先进的生成式AI技术，将您的文字描述转换为精美的动态漫画作品，
          无需专业绘画技能，人人都能成为漫画创作者
        </p>
      </div>
    </div>

    <!-- 六大功能特点标签 -->
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><EditPen /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">智能文字解析</h3>
        <p class="feature-description">
          支持自然语言文字输入，AI智能解析角色特征、场景信息、动作指令和情感倾向，
          精准还原您的创作构思
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><VideoCamera /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">AI动态视频生成</h3>
        <p class="feature-description">
          基于文字描述生成高质量动态漫画视频，支持单镜头多镜头连续生成，
          角色动作流畅自然，场景细节丰富
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><Microphone /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">智能音效生成</h3>
        <p class="feature-description">
          根据视频内容自动匹配背景音乐、角色语音、环境音效和动作音效，
          音画同步，完美融合
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><Scissor /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">专业时间轴编辑</h3>
        <p class="feature-description">
          直观的时间轴界面，支持视频片段拖放、分割、合并，添加转场特效、文字字幕，
          轻松完成专业剪辑
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><FolderOpened /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">云端素材管理</h3>
        <p class="feature-description">
          生成的素材自动保存至个人云端素材库，支持分类标签、智能搜索、
          收藏管理，跨设备同步使用
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><MagicStick /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">零门槛操作</h3>
        <p class="feature-description">
          界面简洁直观，操作流程清晰，提供新手引导和一键应用功能，
          无需专业技能，快速上手创作
        </p>
      </div>
    </div>

    <!-- 开始创作按钮 -->
    <div class="action-section">
      <el-button 
        type="primary" 
        size="large" 
        class="start-btn"
        @click="startCreating"
      >
        <el-icon><VideoPlay /></el-icon>
        开始创作
      </el-button>
      <p class="action-description">立即体验AI动态漫画创作的魅力</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  EditPen,
  VideoCamera,
  Microphone,
  Scissor,
  FolderOpened,
  MagicStick,
  VideoPlay
} from '@element-plus/icons-vue'

const router = useRouter()

const startCreating = () => {
  router.push('/img2vid')
}
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.hero-section {
  text-align: center;
  padding: 50px 24px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>') repeat;
    opacity: 0.3;
  }
  
  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .hero-title {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 12px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
      font-size: 28px;
    }
  }
  
  .hero-subtitle {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 16px;
    opacity: 0.9;
    
    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
  
  .hero-description {
    font-size: 14px;
    line-height: 1.5;
    opacity: 0.8;
    max-width: 500px;
    margin: 0 auto;
    
    @media (max-width: 768px) {
      font-size: 13px;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 20px;
  padding: 40px 24px;
  max-width: 1000px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    max-width: 800px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
    padding: 30px 16px;
    gap: 16px;
  }
  
  .feature-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
      background-size: 300% 100%;
      transition: background-position 0.6s ease;
      background-position: 0% 0%;
    }
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(74, 144, 226, 0.15);
      
      &::before {
        background-position: 100% 0%;
      }
    }
    
    .feature-icon-wrapper {
      display: inline-block;
      margin-bottom: 16px;
      transition: all 0.3s ease;
    }
    
    .feature-icon {
      width: 60px;
      height: 60px;
      border-radius: 14px;
      background: #4A90E2;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      transition: all 0.3s ease;
      
      @media (max-width: 768px) {
        width: 50px;
        height: 50px;
        font-size: 20px;
      }
    }
    
    .feature-title {
      font-size: 18px;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 12px;
      line-height: 1.3;
      
      @media (max-width: 768px) {
        font-size: 16px;
      }
    }
    
    .feature-description {
      font-size: 13px;
      color: #5a6c7d;
      line-height: 1.6;
      margin-bottom: 0;
      min-height: 60px;
      
      @media (max-width: 768px) {
        font-size: 12px;
        min-height: auto;
      }
    }
  }
}

.action-section {
  text-align: center;
  padding: 40px 24px 60px;
  
  .start-btn {
    font-size: 18px;
    font-weight: 600;
    padding: 16px 40px;
    height: auto;
    border-radius: 50px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
      background: linear-gradient(135deg, #5a6fd8, #6a4190);
    }
    
    .el-icon {
      margin-right: 8px;
      font-size: 20px;
    }
  }
  
  .action-description {
    margin-top: 16px;
    color: #5a6c7d;
    font-size: 14px;
    font-weight: 500;
  }
}

// 动画效果
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

.feature-card:nth-child(1) { .feature-icon-wrapper { animation: float 6s ease-in-out infinite; } }
.feature-card:nth-child(2) { .feature-icon-wrapper { animation: float 6s ease-in-out infinite; animation-delay: 1s; } }
.feature-card:nth-child(3) { .feature-icon-wrapper { animation: float 6s ease-in-out infinite; animation-delay: 2s; } }
.feature-card:nth-child(4) { .feature-icon-wrapper { animation: float 6s ease-in-out infinite; animation-delay: 3s; } }
.feature-card:nth-child(5) { .feature-icon-wrapper { animation: float 6s ease-in-out infinite; animation-delay: 4s; } }
.feature-card:nth-child(6) { .feature-icon-wrapper { animation: float 6s ease-in-out infinite; animation-delay: 5s; } }
</style>