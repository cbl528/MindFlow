import { request, paginate } from './api'
import { USE_BACKEND } from '@/config'
import { delay, pageOf, seed } from '@/data/seed'
import type { PageResult, QueryTermMappingPayload, QueryTermMappingVO } from '@/types'

export const queryTermMappingService = {
  /** 分页查询（keyword 支持匹配 sourceTerm/targetTerm） */
  async list(params: { pageNo: number; pageSize: number; keyword?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<QueryTermMappingVO>(seed.queryTermMappings, params, (item, p) => {
        const kw = String(p.keyword ?? '').trim()
        if (!kw) return true
        return item.sourceTerm.includes(kw) || (item.targetTerm ?? '').includes(kw)
      })
    }
    return paginate<PageResult<QueryTermMappingVO>>(
      { url: '/mindflow/mappings', method: 'get' },
      params,
      'current',
    )
  },
  async create(data: QueryTermMappingPayload) {
    if (!USE_BACKEND) {
      await delay(300)
      return `demo-mapping-${Date.now()}`
    }
    return request<string>({ url: '/mindflow/mappings', method: 'post', data })
  },
  async update(id: string, data: QueryTermMappingPayload) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/mappings/${id}`, method: 'put', data })
  },
  async remove(id: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/mappings/${id}`, method: 'delete' })
  },
}
