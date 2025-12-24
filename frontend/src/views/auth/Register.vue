<template>
  <div class="auth-layout">
    <div class="auth-container">
      <!-- 左侧信息区 -->
      <div class="auth-info">
        <div class="logo">
          <el-icon size="48"><VideoPlay /></el-icon>
          <span class="logo-text">漫改视频</span>
        </div>
        <h1 class="title">开启创作之旅</h1>
        <p class="subtitle">注册账户，解锁全部功能，让创意变为现实</p>
        
        <div class="benefits">
          <div class="benefit-item">
            <el-icon><Star /></el-icon>
            <span>免费使用基础功能</span>
          </div>
          <div class="benefit-item">
            <el-icon><Connection /></el-icon>
            <span>高速视频生成体验</span>
          </div>
          <div class="benefit-item">
            <el-icon><Folder /></el-icon>
            <span>云端存储作品</span>
          </div>
          <div class="benefit-item">
            <el-icon><Tools /></el-icon>
            <span>专业创作工具</span>
          </div>
          <div class="benefit-item">
            <el-icon><Service /></el-icon>
            <span>专属技术支持</span>
          </div>
        </div>
      </div>

      <!-- 右侧注册表单 -->
      <div class="auth-form">
        <div class="form-header">
          <h2>创建账户</h2>
          <p>加入我们，开启您的创作之旅</p>
        </div>

        <el-form
          ref="formRef"
          :model="registerForm"
          :rules="rules"
          @submit.prevent="handleRegister"
          class="register-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱地址"
              size="large"
              :prefix-icon="Message"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              :disabled="loading"
              show-password
              @input="checkPasswordStrength"
            />
            <!-- 密码强度指示器 -->
            <div v-if="registerForm.password" class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill" :class="passwordStrength.class"></div>
              </div>
              <div class="strength-text">{{ passwordStrength.text }}</div>
            </div>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              size="large"
              :prefix-icon="Lock"
              :disabled="loading"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="agreeTerms" :disabled="loading">
              我已阅读并同意 
              <el-button link @click="showTerms">服务条款</el-button> 和 
              <el-button link @click="showPrivacy">隐私政策</el-button>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              :disabled="!agreeTerms"
              @click="handleRegister"
              class="submit-btn"
            >
              {{ loading ? '注册中...' : '创建账户' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p>已有账户？ <router-link to="/login" class="link">立即登录</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { 
  VideoPlay, Star, Connection, Folder, Tools, Service,
  User, Message, Lock 
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const formRef = ref<FormInstance>()
const loading = ref(false)
const agreeTerms = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const passwordStrength = reactive({
  class: '',
  text: ''
})

// 表单验证规则
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const checkPasswordStrength = () => {
  const password = registerForm.password
  if (!password) {
    passwordStrength.class = ''
    passwordStrength.text = ''
    return
  }
  
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++
  
  if (strength <= 2) {
    passwordStrength.class = 'weak'
    passwordStrength.text = '密码强度：弱'
  } else if (strength <= 3) {
    passwordStrength.class = 'medium'
    passwordStrength.text = '密码强度：中等'
  } else {
    passwordStrength.class = 'strong'
    passwordStrength.text = '密码强度：强'
  }
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    if (!agreeTerms.value) {
      ElMessage.warning('请先同意服务条款和隐私政策')
      return
    }
    
    loading.value = true
    const result = await userStore.register(registerForm)
    
    if (result.success) {
      // 注册成功，跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    }
  } catch (error) {
    console.error('Register error:', error)
  } finally {
    loading.value = false
  }
}

const showTerms = () => {
  ElMessageBox.alert(
    '1. 用户须遵守相关法律法规\n2. 禁止生成违法内容\n3. 保护个人隐私信息\n4. 尊重知识产权\n\n完整条款请访问官网查看',
    '服务条款',
    {
      confirmButtonText: '我已了解',
      type: 'info'
    }
  )
}

const showPrivacy = () => {
  ElMessageBox.alert(
    '1. 我们重视用户隐私保护\n2. 收集信息仅用于改善服务\n3. 不向第三方泄露个人信息\n4. 用户有权查询和删除数据\n\n完整政策请访问官网查看',
    '隐私政策',
    {
      confirmButtonText: '我已了解',
      type: 'info'
    }
  )
}

// 生命周期
onMounted(() => {
  // 如果已经登录，直接跳转
  if (userStore.isLoggedIn) {
    router.push('/dashboard')
  }
})
</script>

<style lang="scss" scoped>
.auth-layout {
  height: 100vh;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 1200px;
  height: 700px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
}

.auth-info {
  flex: 1;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
  
  .benefits {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    
    .benefit-item {
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
  padding: 50px;
  
  .form-header {
    margin-bottom: 30px;
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
  
  .register-form {
    .el-form-item {
      margin-bottom: 20px;
      
      :deep(.el-input__wrapper) {
        padding: 16px;
        border-radius: 12px;
        background: var(--bg-page);
      }
      
      :deep(.el-checkbox__label) {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
    
    .password-strength {
      margin-top: 8px;
      
      .strength-bar {
        height: 4px;
        background: var(--border-light);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 4px;
        
        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s ease;
          
          &.weak {
            width: 33%;
            background: #f56c6c;
          }
          
          &.medium {
            width: 66%;
            background: #e6a23c;
          }
          
          &.strong {
            width: 100%;
            background: #67c23a;
          }
        }
      }
      
      .strength-text {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
    
    .submit-btn {
      width: 100%;
      height: 50px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      border: none;
      margin-top: 20px;
    }
  }
  
  .form-footer {
    text-align: center;
    margin-top: 25px;
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