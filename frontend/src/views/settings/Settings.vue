<template>
  <div class="pop-layout">
    <!-- 顶部标题 -->
    <div class="page-header">
      <div class="title-badge pink">
        <el-icon><Tools /></el-icon>
        <span>控制中心</span>
      </div>
      <h1 class="main-title">账号 <span>Settings</span></h1>
    </div>

    <div class="bento-grid">
      <!-- 左侧：身份卡片 (ID Card) -->
      <div class="pop-card profile-card">
        <div class="card-deco-stripes"></div>
        <div class="card-label yellow">ID CARD</div>
        
        <div class="avatar-section">
          <div class="avatar-frame">
            <el-avatar :size="100" :src="basicSettings.avatar" class="pop-avatar">
              {{ basicSettings.username ? basicSettings.username.charAt(0).toUpperCase() : 'U' }}
            </el-avatar>
            <div class="edit-avatar-btn">
              <el-icon><Camera /></el-icon>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-group">
            <label>NICKNAME</label>
            <div class="display-box">
              <span class="text">{{ basicSettings.username || '未设置用户名' }}</span>
              <button class="icon-btn" @click="showEditUsernameDialog">
                <el-icon><Edit /></el-icon>
              </button>
            </div>
          </div>

          <div class="info-group">
            <label>BIO / SIGNATURE</label>
            <div class="display-box signature-box">
              <span class="text">{{ basicSettings.signature || '这个人很懒，什么都没留下...' }}</span>
              <button class="icon-btn" @click="showEditSignatureDialog">
                <el-icon><Edit /></el-icon>
              </button>
            </div>
          </div>

          <div class="info-group">
            <label>EMAIL</label>
            <div class="display-box locked">
              <el-icon><Message /></el-icon>
              <span class="text">{{ basicSettings.email || 'user@example.com' }}</span>
              <el-icon class="lock-icon"><Lock /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：安全保险箱 (Security Vault) -->
      <div class="pop-card security-card">
        <div class="card-label blue">VAULT</div>
        <div class="vault-header">
          <div class="vault-icon"><el-icon><Key /></el-icon></div>
          <h3>密码修改</h3>
          <p>保护好你的密钥，不要告诉陌生人哦</p>
        </div>

        <el-form 
          :model="passwordForm" 
          :rules="passwordRules" 
          ref="passwordFormRef"
          class="pop-form"
          label-position="top"
        >
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input 
              v-model="passwordForm.currentPassword" 
              type="password"
              placeholder="请输入旧密码..."
              show-password
              class="pop-input"
            />
          </el-form-item>
          
          <el-form-item label="新密码" prop="newPassword">
            <el-input 
              v-model="passwordForm.newPassword" 
              type="password"
              placeholder="设置一个强密码..."
              show-password
              class="pop-input"
            />
          </el-form-item>
          
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input 
              v-model="passwordForm.confirmPassword" 
              type="password"
              placeholder="再输入一次..."
              show-password
              class="pop-input"
            />
          </el-form-item>
          
          <div class="form-actions">
            <button 
              class="pop-btn save-btn" 
              @click.prevent="handleChangePassword"
              :disabled="passwordLoading"
            >
              <span v-if="!passwordLoading">更新密码 🔐</span>
              <span v-else>加密中...</span>
            </button>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 弹窗：编辑用户名 -->
    <el-dialog 
      v-model="editUsernameDialogVisible" 
      :title="null"
      width="400px"
      :show-close="false"
      class="pop-dialog"
    >
      <div class="pop-dialog-header">
        <span class="title">✏️ 修改昵称</span>
        <button class="close-btn" @click="handleUsernameClose">×</button>
      </div>
      <div class="pop-dialog-body">
        <el-form :model="usernameForm" :rules="usernameRules" ref="usernameFormRef">
          <el-form-item prop="username">
            <el-input 
              v-model="usernameForm.username" 
              placeholder="请输入新昵称"
              maxlength="20"
              show-word-limit
              class="pop-input large"
            />
          </el-form-item>
        </el-form>
        <div class="dialog-footer">
          <button class="pop-btn cancel" @click="handleUsernameClose">取消</button>
          <button class="pop-btn confirm" @click="handleUsernameConfirm">保存</button>
        </div>
      </div>
    </el-dialog>

    <!-- 弹窗：编辑签名 -->
    <el-dialog 
      v-model="editSignatureDialogVisible" 
      :title="null" 
      width="400px"
      :show-close="false"
      class="pop-dialog"
    >
      <div class="pop-dialog-header">
        <span class="title">📝 个性签名</span>
        <button class="close-btn" @click="handleSignatureClose">×</button>
      </div>
      <div class="pop-dialog-body">
        <el-form :model="signatureForm" :rules="signatureRules" ref="signatureFormRef">
          <el-form-item prop="signature">
            <el-input 
              v-model="signatureForm.signature" 
              type="textarea"
              :rows="4"
              placeholder="写点什么有趣的..."
              maxlength="50"
              show-word-limit
              class="pop-textarea"
              resize="none"
            />
          </el-form-item>
        </el-form>
        <div class="dialog-footer">
          <button class="pop-btn cancel" @click="handleSignatureClose">取消</button>
          <button class="pop-btn confirm" @click="handleSignatureConfirm">保存</button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Tools, Edit, Lock, Key, Camera, Message
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

// 用户存储
const userStore = useUserStore()

// --- 状态逻辑保持不变 ---
const editUsernameDialogVisible = ref(false)
const usernameLoading = ref(false)
const usernameFormRef = ref()
const usernameForm = reactive({ username: '' })

const editSignatureDialogVisible = ref(false)
const signatureLoading = ref(false)
const signatureFormRef = ref()
const signatureForm = reactive({ signature: '' })

const passwordLoading = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 校验规则
const usernameRules = {
  username: [{ required: true, message: '昵称不能为空', trigger: 'blur' }, { min: 2, max: 20, message: '长度在 2-20 个字符', trigger: 'blur' }]
}
const signatureRules = {
  signature: [{ max: 50, message: '签名太长啦 (max 50)', trigger: 'blur' }]
}
const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, max: 20, message: '长度 6-20 位', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (r:any, v:string, cb:Function) => v !== passwordForm.newPassword ? cb(new Error('密码不一致')) : cb(), trigger: 'blur' }
  ]
}

// 基础数据
const basicSettings = reactive({
  username: computed(() => userStore.userInfo?.username || ''),
  email: computed(() => userStore.userInfo?.email || ''),
  avatar: computed(() => userStore.userInfo?.avatar || ''),
  signature: computed(() => userStore.userInfo?.signature || '')
})

// 方法
const showEditUsernameDialog = () => {
  usernameForm.username = basicSettings.username
  editUsernameDialogVisible.value = true
}
const handleUsernameClose = () => {
  editUsernameDialogVisible.value = false
  usernameFormRef.value?.resetFields()
}
const handleUsernameConfirm = async () => {
  if (!usernameFormRef.value) return
  await usernameFormRef.value.validate()
  usernameLoading.value = true
  try {
    userStore.updateUserInfo({ username: usernameForm.username })
    ElMessage.success('昵称更新成功！')
    handleUsernameClose()
  } catch(e) { console.error(e) } finally { usernameLoading.value = false }
}

const showEditSignatureDialog = () => {
  signatureForm.signature = basicSettings.signature
  editSignatureDialogVisible.value = true
}
const handleSignatureClose = () => {
  editSignatureDialogVisible.value = false
  signatureFormRef.value?.resetFields()
}
const handleSignatureConfirm = async () => {
  if (!signatureFormRef.value) return
  await signatureFormRef.value.validate()
  signatureLoading.value = true
  try {
    userStore.updateUserInfo({ signature: signatureForm.signature })
    ElMessage.success('签名更新成功！')
    handleSignatureClose()
  } catch(e) { console.error(e) } finally { signatureLoading.value = false }
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate()
  passwordLoading.value = true
  try {
    const res = await request.post('/auth/change-password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    if (res.success) {
      ElMessage.success('密码修改成功，请牢记新密码！')
      passwordFormRef.value.resetFields()
    } else {
      ElMessage.error(res.error || '修改失败')
    }
  } catch(e: any) {
    ElMessage.error(e.response?.data?.error || '修改失败')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  userStore.initUser()
})
</script>

<style lang="scss" scoped>
/* --- Pop Art Palette --- */
$bg-color: #FBF8F3;
$dark: #1A1A1A;
$yellow: #FFD93D;
$blue: #4D96FF;
$pink: #FF6B6B;
$green: #6BCB77;
$purple: #9B5DE5;

.pop-layout {
  min-height: 100vh;
  background-color: $bg-color;
  background-image: radial-gradient(#ddd 2px, transparent 2px);
  background-size: 20px 20px;
  padding: 30px;
  font-family: 'Quicksand', 'Varela Round', sans-serif;
  color: $dark;
}

/* Header */
.page-header {
  margin-bottom: 40px;
  
  .title-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 50px;
    font-weight: bold;
    font-size: 14px;
    background: white;
    border: 2px solid $dark;
    box-shadow: 3px 3px 0 $dark;
    margin-bottom: 12px;
    
    &.pink { background: $pink; color: white; }
  }
  
  .main-title {
    font-size: 42px;
    font-weight: 900;
    margin: 0;
    
    span {
      color: $blue;
      text-decoration: underline wavy $yellow 3px;
    }
  }
}

/* Grid Layout */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  max-width: 1200px;
}

/* Base Pop Card */
.pop-card {
  background: white;
  border: 3px solid $dark;
  border-radius: 24px;
  padding: 0;
  box-shadow: 8px 8px 0 $dark;
  position: relative;
  overflow: hidden;
  
  .card-label {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 14px;
    font-weight: 900;
    padding: 4px 12px;
    border-radius: 8px;
    border: 2px solid $dark;
    z-index: 2;
    
    &.yellow { background: $yellow; transform: rotate(5deg); }
    &.blue { background: $blue; color: white; transform: rotate(-3deg); }
  }
}

/* --- Profile Card Styles --- */
.profile-card {
  display: flex;
  flex-direction: column;

  .card-deco-stripes {
    height: 120px;
    background: repeating-linear-gradient(
      45deg,
      $yellow,
      $yellow 20px,
      white 20px,
      white 40px
    );
    border-bottom: 3px solid $dark;
  }
  
  .avatar-section {
    margin-top: -60px;
    display: flex;
    justify-content: center;
    position: relative;
    
    .avatar-frame {
      position: relative;
      
      .pop-avatar {
        border: 4px solid $dark;
        background: white;
        color: $dark;
        font-size: 40px;
        font-weight: 900;
      }
      
      .edit-avatar-btn {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 32px;
        height: 32px;
        background: $pink;
        border: 2px solid $dark;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: transform 0.2s;
        
        &:hover { transform: scale(1.1); }
      }
    }
  }

  .info-section {
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    .info-group {
      label {
        display: block;
        font-size: 12px;
        font-weight: 900;
        color: #999;
        margin-bottom: 6px;
        letter-spacing: 1px;
      }
      
      .display-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: $bg-color;
        border: 2px solid $dark;
        border-radius: 12px;
        padding: 12px 16px;
        font-weight: bold;
        position: relative;
        
        &.signature-box {
          align-items: flex-start;
          min-height: 80px;
          background: #FFF8E1; /* Sticky note color */
          .text { font-weight: 500; font-size: 14px; line-height: 1.5; }
        }
        
        &.locked {
          background: #E0E0E0;
          color: #666;
          justify-content: flex-start;
          gap: 10px;
          .lock-icon { margin-left: auto; opacity: 0.5; }
        }

        .icon-btn {
          width: 30px;
          height: 30px;
          border: 2px solid $dark;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          margin-left: 10px;
          
          &:hover {
            background: $blue;
            color: white;
            box-shadow: 2px 2px 0 $dark;
          }
        }
      }
    }
  }
}

/* --- Security Card Styles --- */
.security-card {
  padding: 40px;
  background: white;
  
  .vault-header {
    text-align: center;
    margin-bottom: 30px;
    
    .vault-icon {
      font-size: 40px;
      color: $green;
      margin-bottom: 10px;
      filter: drop-shadow(3px 3px 0 $dark);
    }
    
    h3 { margin: 0; font-size: 24px; font-weight: 900; }
    p { margin: 5px 0 0; color: #888; font-size: 14px; }
  }

  .form-actions {
    margin-top: 30px;
    
    .save-btn {
      width: 100%;
      height: 50px;
      background: $green;
      color: $dark;
      font-size: 16px;
      
      &:hover:not(:disabled) {
        box-shadow: 6px 6px 0 $dark;
        transform: translate(-2px, -2px);
      }
    }
  }
}

/* --- Common Components --- */

/* Input Override */
:deep(.pop-input), :deep(.pop-textarea) {
  .el-input__wrapper, .el-textarea__inner {
    box-shadow: none !important;
    border: 2px solid $dark;
    border-radius: 12px;
    background: white;
    padding: 8px 16px;
    transition: all 0.2s;
    
    &:focus, &.is-focus {
      border-color: $dark;
      box-shadow: 4px 4px 0 $blue !important;
      transform: translate(-2px, -2px);
    }
  }
  
  .el-textarea__inner {
    padding: 12px;
  }
}

/* Button */
.pop-btn {
  border: 3px solid $dark;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: none !important;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    color: #888;
  }
}

/* Dialog Styles */
:deep(.pop-dialog) {
  border-radius: 20px;
  border: 4px solid $dark;
  box-shadow: 10px 10px 0 rgba(0,0,0,0.2);
  overflow: hidden;
  
  .el-dialog__header, .el-dialog__footer { display: none; }
  .el-dialog__body { padding: 0; }
  
  .pop-dialog-header {
    background: $yellow;
    padding: 16px 20px;
    border-bottom: 3px solid $dark;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .title { font-weight: 900; font-size: 18px; }
    
    .close-btn {
      background: $pink;
      border: 2px solid $dark;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: bold;
      &:hover { transform: scale(1.1); }
    }
  }
  
  .pop-dialog-body {
    padding: 30px;
    background: white;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    margin-top: 20px;
    
    .pop-btn {
      padding: 10px 24px;
      
      &.cancel { background: white; &:hover { background: #eee; } }
      &.confirm { background: $blue; color: white; &:hover { box-shadow: 4px 4px 0 $dark; } }
    }
  }
}

/* Responsive */
@media (max-width: 900px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  
  .pop-card {
    border-width: 2px;
    box-shadow: 4px 4px 0 $dark;
  }
}
</style>