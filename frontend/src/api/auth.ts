import request from '@/utils/request'
import type { LoginParams, RegisterParams, User } from '@/types/user'

// 登录
export const login = (params: LoginParams) => {
  return request.post('/auth/login', params)
}

// 注册
export const register = (params: RegisterParams) => {
  return request.post('/auth/register', params)
}

// 获取用户信息
export const getUserInfo = () => {
  return request.get('/auth/userinfo')
}

// 退出登录
export const logout = () => {
  return request.post('/auth/logout')
}

// 刷新token
export const refreshToken = () => {
  return request.post('/auth/refresh')
}

// 修改密码
export const changePassword = (oldPassword: string, newPassword: string) => {
  return request.post('/auth/change-password', {
    oldPassword,
    newPassword
  })
}