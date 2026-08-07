import { request, paginate } from './api'
import { USE_BACKEND } from '@/config'
import { delay, pageOf, seed } from '@/data/seed'
import type { PageResult, UserVO } from '@/types'

export const userService = {
  async list(params: { pageNo: number; pageSize: number; keyword?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<UserVO>(seed.users, params, (u, p) => {
        const kw = (p.keyword as string)?.toLowerCase()
        return !kw || u.username.toLowerCase().includes(kw)
      })
    }
    return paginate<PageResult<UserVO>>({ url: '/mindflow/v1/user', method: 'get' }, params, 'current')
  },
  async create(data: { username: string; password: string; role: string; avatar?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return `demo-user-${Date.now()}`
    }
    return request<string>({ url: '/mindflow/v1/user', method: 'post', data })
  },
  async update(id: string, data: { password?: string; role?: string; avatar?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/v1/user/${id}`, method: 'put', data })
  },
  async remove(id: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/v1/user/${id}`, method: 'delete' })
  },
  async batchRemove(ids: string[]) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: '/mindflow/v1/user/batch-delete', method: 'post', data: { ids } })
  },
  async changePassword(data: { oldPassword: string; newPassword: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: '/mindflow/v1/user/password', method: 'put', data })
  },
}
