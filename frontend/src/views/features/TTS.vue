<template>
  <div class="feature-container">
    <el-card>
      <div class="coming-soon">
        <el-icon size="64"><Microphone /></el-icon>
        <h2>文字转语音</h2>
        <p>此功能正在开发中，敬请期待...</p>
        <el-button type="primary" @click="$router.push('/dashboard')">返回控制台</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Microphone } from '@element-plus/icons-vue'
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
  }
}
</style>