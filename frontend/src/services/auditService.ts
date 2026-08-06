import { request, paginate } from './api'
import { USE_BACKEND } from '@/config'
import { delay, pageOf, seed } from '@/data/seed'
import type { BizChangeLogVO, PageResult } from '@/types'

export type ChangeLogQuery = {
  pageNo: number
  pageSize: number
  bizType?: string
  bizId?: string
  operationType?: string
  operatorName?: string
  success?: boolean
  beginTime?: string
  endTime?: string
}

export const auditService = {
  async list(params: ChangeLogQuery) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<BizChangeLogVO>(seed.changeLogs, params, (log, p) => {
        const opName = (p.operatorName as string)?.toLowerCase()
        const bizType = (p.bizType as string)?.toLowerCase()
        const opType = (p.operationType as string)?.toLowerCase()
        return Boolean(
          (!opName || log.operatorName?.toLowerCase().includes(opName)) &&
            (!bizType || log.bizType?.toLowerCase().includes(bizType)) &&
            (!opType || log.operationType?.toLowerCase().includes(opType)),
        )
      })
    }
    const { pageNo, pageSize, ...rest } = params
    return paginate<PageResult<BizChangeLogVO>>(
      { url: '/mindflow/biz-change-logs', method: 'get' },
      { pageNo, pageSize, ...rest },
      'current',
    )
  },
  async get(id: string) {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.changeLogs.find((l) => l.id === id) ?? seed.changeLogs[0]
    }
    return request<BizChangeLogVO>({ url: `/mindflow/biz-change-logs/${id}`, method: 'get' })
  },
}
