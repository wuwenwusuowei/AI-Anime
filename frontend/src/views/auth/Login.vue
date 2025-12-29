<template>
  <div class="auth-layout">
    <!-- 背景装饰球，增加活力感 -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>

    <div class="auth-container">
      <!-- 左侧信息区：变成一个充满活力的展示板 -->
      <div class="auth-info">
        <div class="brand-badge">
          <div class="logo-box">
            <el-icon size="32" color="#000"><VideoPlay /></el-icon>
          </div>
          <span class="logo-text">AI-Anime</span>
        </div>
        
        <div class="content-wrapper">
          <h1 class="title">打破次元壁<br><span>一键生成</span></h1>
          <p class="subtitle">普通人的动漫画室，让创意像呼吸一样简单。</p>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="icon-circle pink"><el-icon><Picture /></el-icon></div>
              <span>文生图</span>
            </div>
            <div class="feature-card">
              <div class="icon-circle yellow"><el-icon><Star /></el-icon></div>
              <span>图生视频</span>
            </div>
            <div class="feature-card">
              <div class="icon-circle blue"><el-icon><Edit /></el-icon></div>
              <span>智能编辑</span>
            </div>
            <div class="feature-card">
              <div class="icon-circle green"><el-icon><Microphone /></el-icon></div>
              <span>AI配音</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单：干净、圆润、有质感 -->
      <div class="auth-form">
        <div class="form-header">
          <h2>Hi, 欢迎回来! 👋</h2>
          <p>准备好开始新的创作了吗？</p>
        </div>

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <el-form-item prop="email">
            <div class="input-label">邮箱账号</div>
            <el-input
              v-model="loginForm.email"
              placeholder="name@example.com"
              size="large"
              :prefix-icon="Message"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-label">密码</div>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="••••••••"
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
              class="pop-btn"
            >
              {{ loading ? '启动引擎...' : '🚀 立即登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p>还没加入漫改小队？ <router-link to="/register" class="link">免费注册账号</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { VideoPlay, Picture, Star, Edit, Microphone, Message, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

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

const handleLogin = async () => {
  if (!formRef.value) return
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    loading.value = true
    const result = await userStore.login(loginForm)
    if (result.success) {
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    } else {
      ElMessage.error(result.error || '登录失败')
    }
  } catch (error) {
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    router.push('/dashboard')
  }
})
</script>

<style lang="scss" scoped>
@use "sass:color" as *;

/* 定义波普风色板 */
$pop-bg: #FBF8F3;       /* 米白背景 */
$pop-dark: #1A1A1A;     /* 近乎黑的深灰 */
$pop-yellow: #FFD93D;   /* 亮黄 */
$pop-pink: #FF6B6B;     /* 珊瑚红 */
$pop-blue: #4D96FF;     /* 电光蓝 */
$pop-green: #6BCB77;    /* 清新绿 */

.auth-layout {
  height: 100vh;
  background-color: $pop-bg;
  /* 波点背景纹理 */
  background-image: radial-gradient($pop-blue 1px, transparent 1px);
  background-size: 30px 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰图形 */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  z-index: 0;
  opacity: 0.6;
}
.shape-1 { width: 300px; height: 300px; background: $pop-yellow; top: -50px; left: -50px; }
.shape-2 { width: 400px; height: 400px; background: $pop-pink; bottom: -100px; right: -100px; }

.auth-container {
  width: 100%;
  max-width: 1100px;
  height: 650px;
  background: white;
  border-radius: 32px;
  /* 核心波普风格：粗边框 + 硬阴影 */
  border: 3px solid $pop-dark;
  box-shadow: 12px 12px 0px $pop-dark;
  display: flex;
  overflow: hidden;
  z-index: 1;
  transition: transform 0.3s;
}

/* 左侧：活力展示区 */
.auth-info {
  flex: 1.2;
  background-color: $pop-yellow;
  color: $pop-dark;
  display: flex;
  flex-direction: column;
  padding: 40px;
  position: relative;
  border-right: 3px solid $pop-dark; /* 分割线 */
  
  .brand-badge {
    display: flex;
    align-items: center;
    gap: 12px;
    background: white;
    padding: 10px 20px;
    border-radius: 50px;
    border: 2px solid $pop-dark;
    box-shadow: 4px 4px 0px $pop-dark;
    align-self: flex-start;
    
    .logo-text {
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.5px;
    }
  }
  
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 20px;
    
    .title {
      font-size: 48px;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 20px;
      letter-spacing: -1px;
      
      span {
        color: white;
        text-shadow: 
          -2px -2px 0 $pop-dark,  
           2px -2px 0 $pop-dark,
          -2px  2px 0 $pop-dark,
           2px  2px 0 $pop-dark,
           4px  4px 0 $pop-dark; /* 文字描边效果 */
      }
    }
    
    .subtitle {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 50px;
      opacity: 0.9;
    }
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    
    .feature-card {
      background: white;
      padding: 15px;
      border-radius: 16px;
      border: 2px solid $pop-dark;
      box-shadow: 4px 4px 0px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      transition: transform 0.2s;
      
      &:hover {
        transform: translateY(-4px);
      }
      
      .icon-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid $pop-dark;
        
        &.pink { background: $pop-pink; color: white; }
        &.yellow { background: $pop-yellow; color: $pop-dark; }
        &.blue { background: $pop-blue; color: white; }
        &.green { background: $pop-green; color: white; }
      }
    }
  }
}

/* 右侧：表单区 */
.auth-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 60px;
  background: white;
  
  .form-header {
    margin-bottom: 40px;
    
    h2 {
      font-size: 32px;
      font-weight: 800;
      color: $pop-dark;
      margin-bottom: 8px;
    }
    
    p {
      color: #666;
      font-size: 16px;
    }
  }
  
  .login-form {
    .input-label {
      font-weight: 700;
      margin-bottom: 8px;
      color: $pop-dark;
      font-size: 14px;
    }

    .el-form-item {
      margin-bottom: 24px;
      
      /* 深度修改 Element Plus 输入框样式 */
      :deep(.el-input__wrapper) {
        padding: 12px 16px;
        border-radius: 12px;
        background: #F5F5F5;
        box-shadow: none; /* 移除默认阴影 */
        border: 2px solid transparent;
        transition: all 0.2s;
        
        &.is-focus {
          background: white;
          border-color: $pop-dark;
          box-shadow: 4px 4px 0px $pop-pink !important; /* 聚焦时的波普风阴影 */
        }
      }
      
      :deep(.el-input__inner) {
        font-weight: 600;
        color: $pop-dark;
      }
    }
    
    /* 波普风按钮 */
    .pop-btn {
      width: 100%;
      height: 56px;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 1px;
      border-radius: 14px;
      background: $pop-dark;
      color: white;
      border: 2px solid $pop-dark;
      box-shadow: 4px 4px 0px $pop-blue; /* 蓝色硬阴影 */
      transition: all 0.1s;
      margin-top: 10px;
      
      &:hover {
        background: color.lighten($pop-dark, 10%);
        transform: translate(-1px, -1px);
        box-shadow: 6px 6px 0px $pop-blue;
      }
      
      &:active {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px $pop-blue;
      }
    }
  }
  
  .form-footer {
    text-align: center;
    margin-top: 30px;
    color: #666;
    font-weight: 500;
    
    .link {
      color: $pop-blue;
      text-decoration: none;
      font-weight: 800;
      position: relative;
      
      /* 下划线动画 */
      &::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 2px;
        bottom: -2px;
        left: 0;
        background-color: $pop-blue;
        transform: scaleX(0);
        transition: transform 0.3s;
      }
      
      &:hover::after {
        transform: scaleX(1);
      }
    }
  }
}

// 响应式
@media (max-width: 900px) {
  .auth-container {
    flex-direction: column;
    height: auto;
    max-width: 450px;
  }
  
  .auth-info {
    padding: 30px;
    border-right: none;
    border-bottom: 3px solid $pop-dark;
    
    .features-grid {
      display: none; /* 移动端隐藏特征列表，简化页面 */
    }
  }
  
  .auth-form {
    padding: 40px 30px;
  }
}
</style>