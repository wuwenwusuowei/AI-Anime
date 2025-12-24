<template>
  <div class="not-found">
    <div class="content">
      <el-icon size="120" color="#409eff"><Warning /></el-icon>
      <h1>404</h1>
      <p>页面不存在</p>
      <el-button type="primary" @click="$router.push('/dashboard')">
        返回控制台
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Warning } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page);
}

.content {
  text-align: center;
  
  h1 {
    font-size: 72px;
    color: var(--text-primary);
    margin: 20px 0;
  }
  
  p {
    font-size: 18px;
    color: var(--text-secondary);
    margin-bottom: 30px;
  }
}
</style>