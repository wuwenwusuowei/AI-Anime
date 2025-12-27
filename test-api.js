// 测试API请求路径
import request from '@/utils/request'

// 测试生成任务
const testGenerate = async () => {
  try {
    console.log('Testing API path...')
    // 这应该发送到: http://localhost:5177/api/generate (通过代理转发到 http://localhost:3000/api/generate)
    const res = await request.post('/generate', { test: true })
    console.log('API response:', res)
  } catch (error) {
    console.error('API error:', error)
  }
}

testGenerate()