<template>
  <div class="dashboard">
    <!-- 项目标题区域 -->
    <div class="hero-section">
      <div class="hero-content">
      <h1 class="hero-title">AI-Anime漫改视频</h1>
      <p class="hero-subtitle">从文字到完整动漫视频的一站式创作平台</p>
        <p class="hero-description">
          智能文生图创作人物形象，图生图完成分镜设计，图生视频生成动漫片段，
          文字转语音添加配音。无需专业技能，轻松打造你的动漫作品
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
        <h3 class="feature-title">文生图</h3>
        <p class="feature-description">
          根据文字描述生成高质量人物图像，支持8种风格选择（国风、日漫、3D动漫等），
          精准还原角色特征，创作独特的人物形象
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><Crop /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">图生图</h3>
        <p class="feature-description">
          在文生图生成的人物基础上进行分镜制作，创作连贯的动漫场景，
          保持角色一致性，完成故事情节的分镜设计
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><VideoCamera /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">图生视频</h3>
        <p class="feature-description">
          将每个分镜图片转换为流畅的动漫视频片段，动作自然流畅，
          支持多种时长和画质选择，完美呈现分镜内容
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><Microphone /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">文字转语音</h3>
        <p class="feature-description">
          为动漫视频生成自然流畅的配音，支持多种语音风格和情感表达，
          音画同步，让角色更加生动
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><MagicStick /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">风格多样化</h3>
        <p class="feature-description">
          提供丰富的风格选择，从国风古韵到二次元日漫，从3D渲染到半写实风格，
          满足不同题材和创作需求
        </p>
      </div>

      <div class="feature-card">
        <div class="feature-icon-wrapper">
          <div class="feature-icon">
            <el-icon><Odometer /></el-icon>
          </div>
        </div>
        <h3 class="feature-title">完整创作流程</h3>
        <p class="feature-description">
          从人物创作到分镜设计，从视频生成到配音制作，一站式完成动漫视频创作，
          简单易用，快速上手
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
      <p class="action-description">从人物形象到完整视频，开启你的动漫创作之旅</p>
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
  Crop,
  MagicStick,
  Odometer,
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