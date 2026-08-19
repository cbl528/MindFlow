import { create } from 'zustand'
import { authService } from '@/services/authService'
import { useChatStore } from '@/stores/chatStore'
import type { CurrentUserVO, LoginPayload } from '@/types'

interface AuthState {
  token: string | null
  user: CurrentUserVO | null
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  setUser: (user: CurrentUserVO) => void
}

function readStored() {
  const token = localStorage.getItem('mf_token')
  const userStr = localStorage.getItem('mf_user')
  let user: CurrentUserVO | null = null
  if (userStr) {
    try {
      user = JSON.parse(userStr) as CurrentUserVO
    } catch {
      user = null
    }
  }
  return { token, user, isAuthenticated: Boolean(token && user) }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...readStored(),
  login: async (payload) => {
    const { token, userId, role, avatar } = await authService.login(payload)
    localStorage.setItem('mf_token', token)
    const user: CurrentUserVO = { userId, role, avatar }
    try {
      const me = await authService.me()
      Object.assign(user, me)
    } catch {
      // /me 失败不阻断登录
    }
    localStorage.setItem('mf_user', JSON.stringify(user))
    // 切换账号：先清空上一用户的会话缓存，再从后端加载当前用户会话
    // （chatStore.init 只在应用启动时执行一次，登录时必须重新触发）
    useChatStore.getState().reset()
    void useChatStore.getState().init()
    set({ token, user, isAuthenticated: true })
  },
  logout: async () => {
    try {
      await authService.logout()
    } catch {
      // 忽略登出异常
    }
    localStorage.removeItem('mf_token')
    localStorage.removeItem('mf_user')
    // 清空会话缓存（内存 + localStorage），避免下次登录时残留上一用户数据
    useChatStore.getState().reset()
    set({ token: null, user: null, isAuthenticated: false })
  },
  fetchMe: async () => {
    const user = await authService.me()
    localStorage.setItem('mf_user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },
  setUser: (user) => {
    localStorage.setItem('mf_user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },
}))
