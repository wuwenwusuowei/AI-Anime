<template>
  <div class="auth-layout">
    <!-- 背景装饰：改为方形和三角形，增加变化 -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>

    <div class="auth-container">
      <!-- 左侧：权益展示区 (粉色主题) -->
      <div class="auth-info">
        <div class="brand-badge">
          <span class="logo-text">AI-Anime 🚀</span>
        </div>
        
        <div class="content-wrapper">
          <h1 class="title">加入创作者<br><span>无限宇宙</span></h1>
          <p class="subtitle">注册即送 <strong>100</strong> 积分，<br>开始你的第一部漫改大片。</p>
          
          <!-- 注册权益列表 -->
          <div class="benefit-list">
            <div class="benefit-item">
              <div class="check-box"><el-icon><Check /></el-icon></div>
              <span>免费使用文生图引擎</span>
            </div>
            <div class="benefit-item">
              <div class="check-box"><el-icon><Check /></el-icon></div>
              <span>高清无水印导出</span>
            </div>
            <div class="benefit-item">
              <div class="check-box"><el-icon><Check /></el-icon></div>
              <span>云端素材永久存储</span>
            </div>
          </div>
        </div>
        
        <!-- 底部装饰图 -->
        <div class="art-decoration">
          <div class="circle c1"></div>
          <div class="circle c2"></div>
        </div>
      </div>

      <!-- 右侧：注册表单 -->
      <div class="auth-form">
        <div class="form-header">
          <h2>创建账号 🎨</h2>
          <p>只需 1 分钟，释放你的想象力</p>
        </div>

        <el-form
          ref="formRef"
          :model="registerForm"
          :rules="rules"
          @submit.prevent="handleRegister"
          class="register-form"
        >
          <!-- 用户名 -->
          <el-form-item prop="username">
            <div class="input-label">昵称</div>
            <el-input
              v-model="registerForm.username"
              placeholder="给自己起个酷酷的名字"
              size="large"
              :prefix-icon="User"
              :disabled="loading"
            />
          </el-form-item>

          <!-- 邮箱 -->
          <el-form-item prop="email">
            <div class="input-label">邮箱</div>
            <el-input
              v-model="registerForm.email"
              placeholder="name@example.com"
              size="large"
              :prefix-icon="Message"
              :disabled="loading"
            />
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password">
            <div class="input-label">密码</div>
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="至少6位字符"
              size="large"
              :prefix-icon="Lock"
              :disabled="loading"
              show-password
            />
          </el-form-item>

          <!-- 确认密码 -->
          <el-form-item prop="confirmPassword">
            <div class="input-label">确认密码</div>
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="再次输入密码"
              size="large"
              :prefix-icon="Lock"
              :disabled="loading"
              show-password
            />
          </el-form-item>

          <!-- 同意协议 -->
          <el-form-item prop="agreement">
            <el-checkbox v-model="registerForm.agreement" class="custom-checkbox">
              我已阅读并同意 <a href="#" class="link">服务条款</a> 和 <a href="#" class="link">隐私政策</a>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleRegister"
              class="pop-btn green-theme"
            >
              {{ loading ? '正在注册...' : '✨ 立即注册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p>已有账号？ <router-link to="/login" class="link">直接登录</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Message, Lock, Check } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

// 密码一致性校验
const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ],
  agreement: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请阅读并同意服务条款'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    loading.value = true
    
    // 构造API所需的参数
    const userData = {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    }

    const result = await userStore.register(userData)

    if (result.success) {
      ElMessage.success('注册成功！正在跳转...')
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      ElMessage.error(result.error || '注册失败')
    }
  } catch (error) {
    ElMessage.error('注册失败，请稍后重试')
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
@use "sass:color";

/* 同样使用波普风色板，但调整主次 */
$pop-bg: #FBF8F3;
$pop-dark: #1A1A1A;
$pop-yellow: #FFD93D;
$pop-pink: #FF6B6B;  /* 注册页主色 */
$pop-blue: #4D96FF;
$pop-green: #6BCB77;

.auth-layout {
  min-height: 100vh;
  background-color: $pop-bg;
  /* 注册页用方格纹理，区别于登录页的波点 */
  background-image: linear-gradient($pop-pink 1px, transparent 1px), linear-gradient(90deg, $pop-pink 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: center center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 装饰图形：改为方形 */
.bg-shape {
  position: absolute;
  filter: blur(50px);
  z-index: 0;
  opacity: 0.5;
}
.shape-1 { width: 300px; height: 300px; background: $pop-green; top: -50px; right: -50px; transform: rotate(15deg); }
.shape-2 { width: 250px; height: 250px; background: $pop-blue; bottom: 50px; left: -50px; transform: rotate(-15deg); }

.auth-container {
  width: 100%;
  max-width: 1100px;
  min-height: 700px; /* 比登录页高一点 */
  background: white;
  border-radius: 32px;
  border: 3px solid $pop-dark;
  box-shadow: 12px 12px 0px $pop-dark;
  display: flex;
  overflow: hidden;
  z-index: 1;
}

/* 左侧：粉色主题 */
.auth-info {
  flex: 1;
  background-color: $pop-pink;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 50px;
  position: relative;
  border-right: 3px solid $pop-dark;
  overflow: hidden;
  
  .brand-badge {
    background: $pop-dark;
    color: white;
    padding: 8px 20px;
    border-radius: 50px;
    align-self: flex-start;
    font-weight: 800;
    box-shadow: 4px 4px 0px rgba(0,0,0,0.2);
  }
  
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
    
    .title {
      font-size: 42px;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 20px;
      text-shadow: 3px 3px 0px $pop-dark;
      
      span {
        color: $pop-yellow;
      }
    }
    
    .subtitle {
      font-size: 18px;
      margin-bottom: 40px;
      font-weight: 500;
    }
    
    .benefit-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      .benefit-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 16px;
        font-weight: 700;
        
        .check-box {
          width: 28px;
          height: 28px;
          background: white;
          color: $pop-pink;
          border-radius: 6px;
          border: 2px solid $pop-dark;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 2px 2px 0px $pop-dark;
        }
      }
    }
  }
  
  /* 底部艺术装饰 */
  .art-decoration {
    position: absolute;
    bottom: -50px;
    right: -50px;
    z-index: 1;
    
    .circle {
      border-radius: 50%;
      border: 3px solid $pop-dark;
      position: absolute;
    }
    
    .c1 { width: 200px; height: 200px; background: $pop-yellow; bottom: 0; right: 0; }
    .c2 { width: 150px; height: 150px; background: $pop-blue; bottom: 50px; right: 80px; }
  }
}

/* 右侧表单 */
.auth-form {
  flex: 1.2; /* 注册表单稍宽 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 60px;
  background: white;
  
  .form-header {
    margin-bottom: 30px;
    text-align: left;
    
    h2 {
      font-size: 32px;
      font-weight: 800;
      color: $pop-dark;
    }
    
    p {
      color: #666;
    }
  }
  
  .register-form {
    .input-label {
      font-weight: 700;
      margin-bottom: 6px;
      color: $pop-dark;
      font-size: 14px;
    }

    .el-form-item {
      margin-bottom: 20px;
      
      :deep(.el-input__wrapper) {
        padding: 10px 16px;
        border-radius: 12px;
        background: #F5F5F5;
        box-shadow: none;
        border: 2px solid transparent;
        transition: all 0.2s;
        
        &.is-focus {
          background: white;
          border-color: $pop-dark;
          box-shadow: 4px 4px 0px $pop-green !important; /* 注册页用绿色阴影 */
        }
      }
      
      :deep(.el-input__inner) {
        font-weight: 600;
        color: $pop-dark;
      }
    }
    
    /* 绿色主题按钮 */
    .pop-btn {
      width: 100%;
      height: 52px;
      font-size: 18px;
      font-weight: 800;
      border-radius: 14px;
      border: 2px solid $pop-dark;
      transition: all 0.1s;
      margin-top: 10px;
      
      &.green-theme {
        background: $pop-green;
        color: white;
        box-shadow: 4px 4px 0px $pop-dark;

        &:hover {
          background: color.adjust($pop-green, $lightness: 5%);
          transform: translate(-1px, -1px);
          box-shadow: 6px 6px 0px $pop-dark;
        }
        
        &:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px $pop-dark;
        }
      }
    }
    
    .custom-checkbox {
      :deep(.el-checkbox__inner) {
        border: 2px solid $pop-dark;
        width: 18px;
        height: 18px;
        
        &::after {
          border-color: $pop-dark;
          border-width: 2px;
        }
      }
      
      :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
        background-color: $pop-yellow;
        border-color: $pop-dark;
      }
      
      :deep(.el-checkbox__label) {
        color: #666;
        font-weight: 500;
      }
    }
  }
  
  .form-footer {
    text-align: center;
    margin-top: 20px;
    
    .link {
      color: $pop-pink;
      text-decoration: none;
      font-weight: 800;
      border-bottom: 2px solid $pop-pink;
      
      &:hover {
        background: $pop-pink;
        color: white;
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
    
    .art-decoration { display: none; }
  }
  
  .auth-form {
    padding: 40px 30px;
  }
}
</style>