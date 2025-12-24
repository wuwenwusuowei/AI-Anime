<template>
  <div class="auth-layout">
    <div class="auth-container">
      <!-- 左侧信息区 -->
      <div class="auth-info">
        <div class="logo">
          <el-icon size="48"><VideoPlay /></el-icon>
          <span class="logo-text">漫改视频</span>
        </div>
        <h1 class="title">AI 漫改视频生成器</h1>
        <p class="subtitle">使用先进的人工智能技术，将您的创意转化为精美的动漫视频作品</p>
        
        <div class="features">
          <div class="feature-item">
            <el-icon><Picture /></el-icon>
            <span>文字生成视频</span>
          </div>
          <div class="feature-item">
            <el-icon><Star /></el-icon>
            <span>图片生成视频</span>
          </div>
          <div class="feature-item">
            <el-icon><Edit /></el-icon>
            <span>文字生成图片</span>
          </div>
          <div class="feature-item">
            <el-icon><Microphone /></el-icon>
            <span>文字转语音</span>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="auth-form">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p>登录您的漫改视频生成器账户</p>
        </div>

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <el-form-item prop="email">
            <el-input
              v-model="loginForm.email"
              placeholder="请输入邮箱地址"
              size="large"
              :prefix-icon="Message"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              :disabled="loading"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleLogin"
              class="submit-btn"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p>还没有账户？ <router-link to="/register" class="link">立即注册</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { VideoPlay, Picture, Star, Edit, Microphone, Message, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

// 表单验证规则
const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 方法
const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    loading.value = true
    const result = await userStore.login(loginForm)
    
    if (result.success) {
      // 登录成功，跳转到目标页面
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    }
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  // 如果已经登录，直接跳转
  if (userStore.isLoggedIn) {
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  }
})
</script>

<style lang="scss" scoped>
.auth-layout {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 1200px;
  height: 600px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
}

.auth-info {
  flex: 1;
  background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 40px;
  text-align: center;
  
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 30px;
    
    .logo-text {
      font-size: 24px;
      font-weight: bold;
    }
  }
  
  .title {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 20px;
  }
  
  .subtitle {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 40px;
    line-height: 1.6;
  }
  
  .features {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    
    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      background: rgba(255, 255, 255, 0.1);
      padding: 12px 20px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
  }
}

.auth-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 50px;
  
  .form-header {
    margin-bottom: 40px;
    text-align: center;
    
    h2 {
      font-size: 32px;
      color: var(--text-primary);
      margin-bottom: 10px;
    }
    
    p {
      color: var(--text-secondary);
      font-size: 16px;
    }
  }
  
  .login-form {
    .el-form-item {
      margin-bottom: 24px;
      
      :deep(.el-input__wrapper) {
        padding: 16px;
        border-radius: 12px;
        background: var(--bg-page);
      }
    }
    
    .submit-btn {
      width: 100%;
      height: 50px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      margin-top: 20px;
    }
  }
  
  .form-footer {
    text-align: center;
    margin-top: 30px;
    color: var(--text-secondary);
    
    .link {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
    max-width: 400px;
    height: auto;
    margin: 20px;
  }
  
  .auth-info {
    display: none;
  }
  
  .auth-form {
    padding: 40px 30px;
  }
}
</style>