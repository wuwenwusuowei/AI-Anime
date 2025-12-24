import request from '@/utils/request'
import type { GenerationTask, GenerationResult } from '@/types/generation'

// 文字生成图片
export const txt2Img = (task: GenerationTask) => {
  const formData = new FormData()
  
  // 添加基本参数
  Object.keys(task).forEach(key => {
    if (task[key] !== undefined && task[key] !== null) {
      if (key === 'file') {
        formData.append('file', task[key])
      } else {
        formData.append(key, String(task[key]))
      }
    }
  })
  
  return request.post('/ai/txt2img', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 图片生成图片
export const img2Img = (task: GenerationTask) => {
  const formData = new FormData()
  
  Object.keys(task).forEach(key => {
    if (task[key] !== undefined && task[key] !== null) {
      if (key === 'file') {
        formData.append('file', task[key])
      } else {
        formData.append(key, String(task[key]))
      }
    }
  })
  
  return request.post('/ai/img2img', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 图片生成视频
export const img2Vid = (task: GenerationTask) => {
  const formData = new FormData()
  
  Object.keys(task).forEach(key => {
    if (task[key] !== undefined && task[key] !== null) {
      if (key === 'file') {
        formData.append('file', task[key])
      } else {
        formData.append(key, String(task[key]))
      }
    }
  })
  
  return request.post('/ai/img2vid', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 文字转语音
export const tts = (task: GenerationTask) => {
  return request.post('/ai/tts', task)
}

// 获取生成进度
export const getProgress = (taskId: string) => {
  return request.get(`/ai/progress/${taskId}`)
}

// 取消生成任务
export const cancelTask = (taskId: string) => {
  return request.delete(`/ai/task/${taskId}`)
}

// 获取预设风格
export const getStylePresets = () => {
  return request.get('/ai/styles')
}

// 上传文件
export const uploadFile = (file: File, type: 'image' | 'video' | 'audio' = 'image') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  
  return request.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}