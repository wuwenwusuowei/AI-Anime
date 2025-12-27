import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register', 
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: {
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: () => import('../layout/BasicLayout.vue'),
    meta: { requiresAuth: true }, // 需要登录验证
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/home/Dashboard.vue'),
        meta: {
          title: '首页'
        }
      },
      {
        path: 'txt2img',
        name: 'Txt2Img', 
        component: () => import('../views/features/Txt2Img.vue'),
        meta: {
          title: '文字生成图片'
        }
      },
      {
        path: 'img2img',
        name: 'Img2Img',
        component: () => import('../views/features/Img2Img.vue'),
        meta: {
          title: '图片生成图片'
        }
      },
      {
        path: 'img2vid',
        name: 'Img2Vid',
        component: () => import('../views/features/Img2Vid.vue'),
        meta: {
          title: '图片生成视频'
        }
      },
      {
        path: 'tts',
        name: 'TTS',
        component: () => import('../views/features/TTS.vue'),
        meta: {
          title: '文字转语音'
        }
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('../views/history/History.vue'),
        meta: {
          title: '历史记录'
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/settings/Settings.vue'),
        meta: {
          title: '设置'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/error/404.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫 - 暂时跳过登录验证
router.beforeEach(async (to, _from, next) => {
  // 动态导入userStore以避免循环依赖
  const { useUserStore } = await import('../stores/user')
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - AI-Anime漫改视频`
  }
  
  // 暂时跳过登录验证 - 如果未登录，自动创建模拟登录状态
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    const mockToken = 'mock-token-skip-login'
    const mockUser = {
      id: '1',
      username: 'demo-user',
      email: 'demo@example.com',
      avatar: '',
      signature: '这个人很懒，什么都没留下',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // 自动设置登录状态
    localStorage.setItem('token', mockToken)
    localStorage.setItem('userInfo', JSON.stringify(mockUser))
    userStore.token = mockToken
    userStore.userInfo = mockUser
  }
  
  // 如果访问登录页且已有模拟登录状态，重定向到首页
  if ((to.path === '/login' || to.path === '/register')) {
    if (userStore.isLoggedIn) {
      next('/')
      return
    }
  }
  
  next()
})

export default router