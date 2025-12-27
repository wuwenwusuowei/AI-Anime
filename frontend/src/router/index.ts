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
    meta: { requiresAuth: false }, // 🔓 跳过登录验证
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
          title: '控制台'
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

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 动态导入userStore以避免循环依赖
  const { useUserStore } = await import('../stores/user')
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 漫改视频生成器`
  }
  
  // 🔓 跳过登录检查 - 直接允许访问所有页面
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    // 注释掉登录检查逻辑
    // if (!userStore.isLoggedIn) {
    //   next({
    //     path: '/login',
    //     query: { redirect: to.fullPath }
    //   })
    //   return
    // }
  }
  
  // 如果已登录且访问登录页（但没有logout参数），重定向到控制台
  if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    // 如果访问 /login?logout=true，允许访问（用于重新登录）
    if (to.query.logout === 'true') {
      next()
      return
    }
    next('/')
    return
  }
  
  next()
})

export default router