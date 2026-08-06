import { request } from './api'
import { USE_BACKEND } from '@/config'
import { delay, seed } from '@/data/seed'
import type { CurrentUserVO, LoginPayload, LoginVO } from '@/types'

// 预留接口：后端就绪后 USE_BACKEND=true 即切换为真实请求
export const authService = {
  async login(payload: LoginPayload) {
    if (!USE_BACKEND) {
      await delay(500)
      return seed.login
    }
    return request<LoginVO>({ url: '/mindflow/v1/auth/login', method: 'post', data: payload })
  },
  async logout() {
    if (!USE_BACKEND) {
      await delay(200)
      return undefined
    }
    return request<void>({ url: '/mindflow/v1/auth/logout', method: 'post' })
  },
  async me() {
    if (!USE_BACKEND) {
      await delay(300)
      return seed.currentUser
    }
    return request<CurrentUserVO>({ url: '/mindflow/v1/user/me', method: 'get' })
  },
}
