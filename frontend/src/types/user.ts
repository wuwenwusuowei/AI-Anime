export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  signature?: string
  createdAt: string
  updatedAt: string
}

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
}