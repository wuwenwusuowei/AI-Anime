<template>
  <BasicLayout>
    <div class="history-container">
      <el-card>
        <div class="coming-soon">
          <el-icon size="64"><Clock /></el-icon>
          <h2>历史记录</h2>
          <p>历史记录功能正在开发中...</p>
          <el-button type="primary" @click="$router.push('/dashboard')">返回控制台</el-button>
        </div>
      </el-card>
    </div>
  </BasicLayout>
</template>

<script setup lang="ts">
import { Clock } from '@element-plus/icons-vue'
import BasicLayout from '@/layout/BasicLayout.vue'
</script>

<style lang="scss" scoped>
.history-container {
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