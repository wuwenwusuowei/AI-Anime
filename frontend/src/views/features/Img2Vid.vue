<template>
  <BasicLayout>
    <div class="feature-container">
      <el-card>
        <div class="coming-soon">
          <el-icon size="64"><VideoCamera /></el-icon>
          <h2>图片生成视频</h2>
          <p>此功能已实现，请访问 <a href="http://localhost:3000/frontend/index.html">原版本</a> 进行体验</p>
          <el-button type="primary" @click="$router.push('/dashboard')">返回控制台</el-button>
        </div>
      </el-card>
    </div>
  </BasicLayout>
</template>

<script setup lang="ts">
import { VideoCamera } from '@element-plus/icons-vue'
import BasicLayout from '@/layout/BasicLayout.vue'
</script>

<style lang="scss" scoped>
.feature-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 140px);
}

.coming-soon {
  text-align: center;
  padding: 60px 40px;
  
  .el-icon {
    color: var(--primary-color);
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 24px;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: 24px;
    
    a {
      color: var(--primary-color);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>