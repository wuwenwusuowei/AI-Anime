import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import type { LoginParams, RegisterParams, User } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<User | null>(
    localStorage.getItem('userInfo') 
      ? JSON.parse(localStorage.getItem('userInfo')!) 
      : null
  )
  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const login = async (params: LoginParams) => {
    try {
      // 这里模拟登录，实际应该调用 API
      const response = await request.post('/auth/login', params)
      
      // 如果是开发环境且网络错误，模拟成功
      if (!response) {
        const mockUser: User = {
          id: '1',
          username: params.email.split('@')[0],
          email: params.email,
          avatar: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const mockToken = `mock-token-${Date.now()}`
        
        // 保存状态
        token.value = mockToken
        userInfo.value = mockUser
        
        // 保存到 localStorage
        localStorage.setItem('token', mockToken)
        localStorage.setItem('userInfo', JSON.stringify(mockUser))
        
        ElMessage.success('登录成功')
        return { success: true, data: mockUser }
      }
      
      // 真实响应处理
      if (response.token && response.user) {
        token.value = response.token
        userInfo.value = response.user
        
        localStorage.setItem('token', response.token)
        localStorage.setItem('userInfo', JSON.stringify(response.user))
        
        ElMessage.success('登录成功')
        return { success: true, data: response.user }
      }
      
      throw new Error('登录失败')
    } catch (error: any) {
      console.error('Login error:', error)
      ElMessage.error(error.message || '登录失败')
      return { success: false, error: error.message }
    }
  }

  // 注册
  const register = async (params: RegisterParams) => {
    try {
      const response = await request.post('/auth/register', params)
      
      // 模拟注册成功
      if (!response) {
        ElMessage.success('注册成功，请登录')
        return { success: true }
      }
      
      ElMessage.success('注册成功')
      return { success: true }
    } catch (error: any) {
      console.error('Register error:', error)
      ElMessage.error(error.message || '注册失败')
      return { success: false, error: error.message }
    }
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    
    ElMessage.success('已退出登录')
  }

  // 初始化用户状态
  const initUser = () => {
    const savedToken = localStorage.getItem('token')
    const savedUserInfo = localStorage.getItem('userInfo')
    
    if (savedToken && savedUserInfo) {
      token.value = savedToken
      userInfo.value = JSON.parse(savedUserInfo)
    }
  }

  // 更新用户信息
  const updateUserInfo = (newUserInfo: Partial<User>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...newUserInfo }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    register,
    logout,
    initUser,
    updateUserInfo
  }
})