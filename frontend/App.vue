<template>
  <div class="container">
    <h1>🎨 EduMatch 漫改视频生成器</h1>

    <div class="input-section">
      <!-- 1. 图片上传区 -->
      <div class="upload-box" @click="triggerUpload" :class="{ 'has-image': previewUrl }">
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileChange" 
          accept="image/*" 
          style="display: none"
        >
        <div v-if="!previewUrl" class="placeholder">
          <span class="icon">🖼️</span>
          <p>点击上传一张彩色漫画/二次元图片</p>
        </div>
        <img v-else :src="previewUrl" class="preview-img" />
      </div>

      <!-- 2. 动作描述 -->
      <textarea 
        v-model="prompt" 
        placeholder="想让它怎么动？（例如：微风吹拂，头发飘动，微笑，眨眼）"
        rows="3"
      ></textarea>
      
      <div class="controls">
        <select v-model="style">
          <option value="anime">日式动漫</option>
          <option value="cyberpunk">赛博朋克</option>
          <option value="ink">水墨国风</option>
        </select>
        
        <button @click="handleGenerate" :disabled="loading || !selectedFile">
          {{ loading ? '正在施法中...' : '让图动起来 ✨' }}
        </button>
      </div>
    </div>

    <!-- 3. 状态与结果 -->
    <div v-if="taskId" class="status-box">
      <p>任务 ID: {{ taskId }}</p>
      <p>状态: <span :class="status">{{ status }}</span></p>
      <p v-if="status === 'PROCESSING'" class="loading-text">AI 正在疯狂绘制中 (约需2-3分钟)...</p>
    </div>

    <div v-if="videoUrl" class="result-section">
      <h3>🎉 生成成功！</h3>
      <video controls :src="videoUrl" autoplay loop></video>
      <div style="margin-top: 10px;">
        <a :href="videoUrl" target="_blank" download>
          <button class="download-btn">下载视频</button>
        </a>
      </div>
    </div>
    
    <div v-if="error" class="error-msg">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const prompt = ref('')
const style = ref('anime')
const loading = ref(false)
const taskId = ref(null)
const status = ref('')
const videoUrl = ref('')
const error = ref('')
const selectedFile = ref(null)
const previewUrl = ref('')
const fileInput = ref(null)

// 触发文件选择
const triggerUpload = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file) // 本地预览
  }
}

// 点击生成
const handleGenerate = async () => {
  if (!selectedFile.value) return alert('请先上传图片！')
  
  loading.value = true
  error.value = ''
  videoUrl.value = ''
  status.value = '提交中...'
  
  try {
    // ⚠️ 关键变化：构建 FormData 对象
    const formData = new FormData()
    formData.append('image', selectedFile.value) // 必须叫 'image'，对应后端 upload.single('image')
    formData.append('prompt', prompt.value)
    formData.append('style', style.value)

    // 发送请求 (不需要设置 Content-Type，浏览器会自动识别)
    const res = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: formData
    })
    
    const data = await res.json()
    
    if (data.success) {
      taskId.value = data.taskId
      status.value = 'PENDING'
      pollStatus(data.taskId)
    } else {
      error.value = '提交失败: ' + data.error
      loading.value = false
    }
  } catch (err) {
    error.value = '网络错误: ' + err.message
    loading.value = false
  }
}

// 轮询状态
const pollStatus = async (id) => {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/status/${id}`)
      const data = await res.json()
      
      status.value = data.status
      
      if (data.status === 'COMPLETED') {
        videoUrl.value = data.videoUrl
        loading.value = false
        clearInterval(interval)
      }
      
      if (data.status === 'FAILED') {
        error.value = '生成失败，请检查后端日志'
        loading.value = false
        clearInterval(interval)
      }
      
    } catch (err) {
      console.error('轮询出错', err)
    }
  }, 3000) // 3秒查一次
}
</script>

<style scoped>
.container { 
  max-width: 600px; 
  margin: 0 auto; 
  padding: 20px; 
  font-family: sans-serif; 
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 2.5em;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.upload-box { 
  border: 3px dashed #ccc; 
  border-radius: 12px; 
  height: 250px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  margin-bottom: 20px; 
  overflow: hidden; 
  position: relative;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-box:hover { 
  border-color: #646cff; 
  background: #f0f4ff; 
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 108, 255, 0.15);
}

.upload-box.has-image { 
  border-style: solid; 
  border-color: #646cff; 
  background: #fff;
}

.preview-img { 
  width: 100%; 
  height: 100%; 
  object-fit: contain; 
  background: #000; 
}

.placeholder { 
  text-align: center; 
  color: #666; 
}

.icon { 
  font-size: 50px; 
  display: block; 
  margin-bottom: 15px; 
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

textarea { 
  width: 100%; 
  padding: 15px; 
  border-radius: 12px; 
  border: 2px solid #e0e0e0; 
  margin-bottom: 20px; 
  box-sizing: border-box; 
  font-size: 16px;
  font-family: inherit;
  transition: border-color 0.3s ease;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #646cff;
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.controls { 
  display: flex; 
  gap: 15px; 
  margin-bottom: 20px;
}

button { 
  flex: 1; 
  background: linear-gradient(135deg, #646cff 0%, #7b8bff 100%); 
  color: white; 
  border: none; 
  padding: 15px 20px; 
  border-radius: 12px; 
  cursor: pointer; 
  font-size: 16px; 
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(100, 108, 255, 0.3);
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(100, 108, 255, 0.4);
}

button:disabled { 
  background: #ccc; 
  cursor: not-allowed; 
  transform: none;
  box-shadow: none;
}

select { 
  padding: 15px; 
  border-radius: 12px; 
  border: 2px solid #e0e0e0; 
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

select:focus {
  outline: none;
  border-color: #646cff;
}

.result-section video { 
  width: 100%; 
  border-radius: 16px; 
  margin-top: 20px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
}

.status-box { 
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
  padding: 20px; 
  margin-top: 20px; 
  border-radius: 16px; 
  text-align: center; 
  border: 1px solid #dee2e6;
}

.COMPLETED { 
  color: #28a745; 
  font-weight: bold; 
  font-size: 1.1em;
}

.PROCESSING { 
  color: #fd7e14; 
  font-weight: bold; 
  font-size: 1.1em;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.error-msg { 
  color: #dc3545; 
  margin-top: 20px; 
  text-align: center; 
  padding: 15px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 12px;
}

.loading-text {
  color: #6c757d;
  font-style: italic;
  margin-top: 10px;
}

.download-btn { 
  background: linear-gradient(135deg, #28a745 0%, #34ce57 100%); 
  width: auto; 
  padding: 12px 30px; 
  margin-top: 15px;
  text-decoration: none;
  display: inline-block;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
}
</style>