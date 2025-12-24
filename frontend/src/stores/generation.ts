import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GenerationTask, GenerationHistory } from '@/types/generation'

export const useGenerationStore = defineStore('generation', () => {
  // 状态
  const isGenerating = ref(false)
  const currentTask = ref<GenerationTask | null>(null)
  const progress = ref(0)
  const history = ref<GenerationHistory[]>([])
  const generatingType = ref<string>('')

  // 开始生成
  const startGeneration = (type: string, task: GenerationTask) => {
    isGenerating.value = true
    generatingType.value = type
    currentTask.value = task
    progress.value = 0
  }

  // 更新进度
  const updateProgress = (newProgress: number) => {
    progress.value = Math.min(newProgress, 100)
  }

  // 完成生成
  const completeGeneration = (result: any) => {
    if (currentTask.value) {
      const historyItem: GenerationHistory = {
        id: Date.now().toString(),
        type: generatingType.value,
        prompt: currentTask.value.prompt,
        result,
        createdAt: new Date().toISOString(),
        status: 'completed'
      }
      
      // 添加到历史记录开头
      history.value.unshift(historyItem)
      
      // 限制历史记录数量
      if (history.value.length > 50) {
        history.value = history.value.slice(0, 50)
      }
    }
    
    isGenerating.value = false
    currentTask.value = null
    progress.value = 0
    generatingType.value = ''
  }

  // 生成失败
  const failGeneration = (error: string) => {
    if (currentTask.value) {
      const historyItem: GenerationHistory = {
        id: Date.now().toString(),
        type: generatingType.value,
        prompt: currentTask.value.prompt,
        error,
        createdAt: new Date().toISOString(),
        status: 'failed'
      }
      
      history.value.unshift(historyItem)
    }
    
    isGenerating.value = false
    currentTask.value = null
    progress.value = 0
    generatingType.value = ''
  }

  // 取消生成
  const cancelGeneration = () => {
    isGenerating.value = false
    currentTask.value = null
    progress.value = 0
    generatingType.value = ''
  }

  // 清空历史记录
  const clearHistory = () => {
    history.value = []
  }

  // 删除历史记录项
  const removeFromHistory = (id: string) => {
    const index = history.value.findIndex(item => item.id === id)
    if (index > -1) {
      history.value.splice(index, 1)
    }
  }

  // 从本地存储加载历史记录
  const loadHistory = () => {
    const savedHistory = localStorage.getItem('generationHistory')
    if (savedHistory) {
      try {
        history.value = JSON.parse(savedHistory)
      } catch (error) {
        console.error('Failed to load history:', error)
        history.value = []
      }
    }
  }

  // 保存历史记录到本地存储
  const saveHistory = () => {
    localStorage.setItem('generationHistory', JSON.stringify(history.value))
  }

  return {
    isGenerating,
    currentTask,
    progress,
    history,
    generatingType,
    startGeneration,
    updateProgress,
    completeGeneration,
    failGeneration,
    cancelGeneration,
    clearHistory,
    removeFromHistory,
    loadHistory,
    saveHistory
  }
})