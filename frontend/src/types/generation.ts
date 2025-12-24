export interface GenerationTask {
  id?: string
  prompt: string
  negativePrompt?: string
  style?: string
  width?: number
  height?: number
  duration?: number
  steps?: number
  cfgScale?: number
  seed?: number
  file?: File
  [key: string]: any
}

export interface GenerationResult {
  id: string
  url: string
  thumbnail?: string
  duration?: number
  size?: number
  format?: string
}

export interface GenerationHistory {
  id: string
  type: 'txt2img' | 'img2img' | 'img2vid' | 'tts'
  prompt: string
  result?: GenerationResult
  error?: string
  createdAt: string
  status: 'completed' | 'failed' | 'pending'
}

export interface GenerationConfig {
  txt2img: {
    defaultWidth: number
    defaultHeight: number
    maxSteps: number
    defaultSteps: number
    maxCfgScale: number
    defaultCfgScale: number
  }
  img2vid: {
    defaultWidth: number
    defaultHeight: number
    maxDuration: number
    defaultDuration: number
    fps: number
  }
  tts: {
    defaultSpeed: number
    maxSpeed: number
    minSpeed: number
    voices: Array<{
      id: string
      name: string
      language: string
      gender: 'male' | 'female'
    }>
  }
}

export interface StylePreset {
  id: string
  name: string
  description: string
  prompt: string
  negativePrompt?: string
  thumbnail?: string
}