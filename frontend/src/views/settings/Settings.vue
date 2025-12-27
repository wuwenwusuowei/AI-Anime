<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <div class="settings-content">
        <!-- 基础设置 -->
        <div class="settings-section">
          <el-form :model="basicSettings" label-position="top">
            <el-form-item>
              <div class="user-profile">
                <el-avatar :size="80" class="user-avatar">
                  {{ basicSettings.username ? basicSettings.username.charAt(0).toUpperCase() : 'U' }}
                </el-avatar>
                <div class="user-info">
                  <div class="info-item">
                    <div class="username">{{ basicSettings.username || '未设置用户名' }}</div>
                    <el-button 
                      :icon="Edit" 
                      text 
                      @click="showEditUsernameDialog"
                      class="inline-edit-btn"
                    />
                  </div>
                  <div class="info-item">
                    <div class="signature">{{ basicSettings.signature || '这个人很懒，什么都没留下' }}</div>
                    <el-button 
                      :icon="Edit" 
                      text 
                      @click="showEditSignatureDialog"
                      class="inline-edit-btn"
                    />
                  </div>
                </div>
              </div>
            </el-form-item>
            
            <el-form-item label="邮箱">
              <el-input :model-value="basicSettings.email" placeholder="请输入邮箱" disabled />
            </el-form-item>
          </el-form>
        </div>

        <div class="settings-section">
          <div class="section-title">
            <el-icon><Lock /></el-icon>
            <span>账户安全</span>
          </div>
          
          <el-form :model="passwordForm" label-position="top" :rules="passwordRules" ref="passwordFormRef">
            <el-form-item label="当前密码" prop="currentPassword">
              <el-input 
                v-model="passwordForm.currentPassword" 
                type="password"
                placeholder="请输入当前密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="新密码" prop="newPassword">
              <el-input 
                v-model="passwordForm.newPassword" 
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input 
                v-model="passwordForm.confirmPassword" 
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleChangePassword"
                :loading="passwordLoading"
              >
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </div>






      </div>
    </el-card>

    <!-- 编辑用户名弹窗 -->
    <el-dialog 
      v-model="editUsernameDialogVisible" 
      title="编辑用户名" 
      width="400px"
      :before-close="handleUsernameClose"
    >
      <el-form :model="usernameForm" label-position="top" :rules="usernameRules" ref="usernameFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="usernameForm.username" 
            placeholder="请输入用户名"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleUsernameClose">取消</el-button>
          <el-button type="primary" @click="handleUsernameConfirm" :loading="usernameLoading">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑个性签名弹窗 -->
    <el-dialog 
      v-model="editSignatureDialogVisible" 
      title="编辑个性签名" 
      width="400px"
      :before-close="handleSignatureClose"
    >
      <el-form :model="signatureForm" label-position="top" :rules="signatureRules" ref="signatureFormRef">
        <el-form-item label="个性签名" prop="signature">
          <el-input 
            v-model="signatureForm.signature" 
            type="textarea"
            :rows="3"
            placeholder="写点什么介绍一下自己吧..."
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleSignatureClose">取消</el-button>
          <el-button type="primary" @click="handleSignatureConfirm" :loading="signatureLoading">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Bell,
  UserFilled,
  Edit,
  Lock
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

// 用户存储
const userStore = useUserStore()

const saving = ref(false)

// 编辑用户名相关
const editUsernameDialogVisible = ref(false)
const usernameLoading = ref(false)
const usernameFormRef = ref()

const usernameForm = reactive({
  username: ''
})

const usernameRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 编辑个性签名相关
const editSignatureDialogVisible = ref(false)
const signatureLoading = ref(false)
const signatureFormRef = ref()

const signatureForm = reactive({
  signature: ''
})

const signatureRules = {
  signature: [
    { max: 50, message: '个性签名不能超过 50 个字符', trigger: 'blur' }
  ]
}

// 基础设置 - 从用户存储获取数据
const basicSettings = reactive({
  username: computed(() => userStore.userInfo?.username || ''),
  email: computed(() => userStore.userInfo?.email || ''),
  avatar: computed(() => userStore.userInfo?.avatar || ''),
  signature: computed(() => userStore.userInfo?.signature || '')
})

// 密码修改相关
const passwordLoading = ref(false)
const passwordFormRef = ref()

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 生成设置
const generationSettings = reactive({
  image: {
    quality: 'high',
    style: 'anime',
    size: '768x768'
  },
  video: {
    resolution: '720p',
    duration: 3,
    fps: '30'
  },
  tts: {
    voice: 'female_gentle',
    speed: 1.0,
    autoGenerate: false
  }
})

const durationMarks = {
  1: '1s',
  2: '2s',
  3: '3s',
  4: '4s',
  5: '5s'
}

// 事件处理
const saveSettings = async () => {
  saving.value = true
  try {
    // 保存生成设置到localStorage
    localStorage.setItem('settings', JSON.stringify({
      generation: generationSettings
    }))
    
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('设置保存失败')
  } finally {
    saving.value = false
  }
}

const resetSettings = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置为默认值吗？此操作不可撤销。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 重置为默认值
    Object.assign(generationSettings, {
      image: {
        quality: 'high',
        style: 'anime',
        size: '768x768'
      },
      video: {
        resolution: '720p',
        duration: 3,
        fps: '30'
      },
      tts: {
        voice: 'female_gentle',
        speed: 1.0,
        autoGenerate: false
      }
    })
    
    ElMessage.success('设置已重置为默认值')
  } catch {
    // 用户取消
  }
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('settings')
    if (saved) {
      const settings = JSON.parse(saved)
      Object.assign(generationSettings, settings.generation || {})
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 编辑用户名相关函数
const showEditUsernameDialog = () => {
  usernameForm.username = basicSettings.username || ''
  editUsernameDialogVisible.value = true
}

const handleUsernameClose = () => {
  editUsernameDialogVisible.value = false
  usernameFormRef.value?.resetFields()
}

const handleUsernameConfirm = async () => {
  if (!usernameFormRef.value) return
  
  try {
    await usernameFormRef.value.validate()
    usernameLoading.value = true
    
    // 更新用户名到用户存储
    userStore.updateUserInfo({
      username: usernameForm.username
    })
    
    ElMessage.success('用户名更新成功')
    editUsernameDialogVisible.value = false
    usernameFormRef.value?.resetFields()
  } catch (error) {
    console.error('更新用户名失败:', error)
  } finally {
    usernameLoading.value = false
  }
}

// 编辑个性签名相关函数
const showEditSignatureDialog = () => {
  signatureForm.signature = basicSettings.signature || ''
  editSignatureDialogVisible.value = true
}

const handleSignatureClose = () => {
  editSignatureDialogVisible.value = false
  signatureFormRef.value?.resetFields()
}

const handleSignatureConfirm = async () => {
  if (!signatureFormRef.value) return
  
  try {
    await signatureFormRef.value.validate()
    signatureLoading.value = true
    
    // 更新个性签名到用户存储
    userStore.updateUserInfo({
      signature: signatureForm.signature
    })
    
    ElMessage.success('个性签名更新成功')
    editSignatureDialogVisible.value = false
    signatureFormRef.value?.resetFields()
  } catch (error) {
    console.error('更新个性签名失败:', error)
  } finally {
    signatureLoading.value = false
  }
}

// 修改密码相关函数
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    
    // 调用修改密码API
    const result = await request.post('/auth/change-password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (result.success) {
      ElMessage.success('密码修改成功')
      passwordFormRef.value?.resetFields()
    } else {
      ElMessage.error(result.error || '密码修改失败')
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.response?.data?.error || '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// 监听用户信息变化
watch(() => userStore.userInfo, (newUserInfo) => {
  if (newUserInfo) {
    console.log('用户信息已更新:', newUserInfo)
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 初始化用户状态
  userStore.initUser()
  loadSettings()
})
</script>

<style lang="scss" scoped>
.settings-container {
  height: 100%;
  overflow-y: auto;
}

.settings-card {
  height: calc(100vh - 140px);
  border: none;
  border-radius: 16px;
  overflow: hidden;

  .card-header {
    text-align: center;
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }
    
    p {
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }
}

.settings-content {
  height: calc(100% - 120px);
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.settings-section {
  margin-bottom: 32px;
  width: 100%;
  max-width: 800px;
  
  .section-title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    
    .el-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      margin-right: 8px;
    }
    
    span {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  
  .el-form {
    max-width: 600px;
    margin: 0 auto;
    
    .form-hint {
      font-size: 12px;
      color: var(--el-color-info);
      margin-top: 4px;
      line-height: 1.4;
    }
  }
}

.user-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  
  .user-avatar {
    background-color: #409eff;
    color: white;
    font-size: 32px;
    font-weight: 600;
  }
  
  .user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .username {
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .signature {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.4;
      }
      
      .inline-edit-btn {
        padding: 4px;
        color: var(--el-text-color-secondary);
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }
}



// 响应式设计
@media (max-width: 768px) {
  .settings-card {
    border-radius: 0;
    height: 100vh;
  }
  
  .settings-content {
    padding: 16px;
  }
  
  .settings-section {
    margin-bottom: 24px;
    
    .el-form {
      max-width: 100%;
      margin: 0 auto;
    }
  }
}
</style>