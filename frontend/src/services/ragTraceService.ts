import { request, paginate } from './api'
import { USE_BACKEND } from '@/config'
import { delay, pageOf, seed } from '@/data/seed'
import type { PageResult, RagTraceDetailVO, RagTraceNodeVO, RagTraceRunVO } from '@/types'

export const ragTraceService = {
  async runs(params: {
    pageNo: number
    pageSize: number
    traceId?: string
    conversationId?: string
    taskId?: string
    status?: string
  }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<RagTraceRunVO>(seed.traceRuns, params, (r, p) => {
        const traceId = (p.traceId as string)?.toLowerCase()
        const status = p.status as string
        return (!traceId || r.traceId.toLowerCase().includes(traceId)) && (!status || r.status === status)
      })
    }
    return paginate<PageResult<RagTraceRunVO>>(
      { url: '/mindflow/rag/traces/runs', method: 'get' },
      params,
      'current',
    )
  },
  async detail(traceId: string) {
    if (!USE_BACKEND) {
      await delay(300)
      const run = seed.traceRuns.find((r) => r.traceId === traceId) ?? seed.traceRuns[0]
      return { run, nodes: seed.traceNodes.filter((n) => n.traceId === traceId) }
    }
    return request<RagTraceDetailVO>({ url: `/mindflow/rag/traces/runs/${traceId}`, method: 'get' })
  },
  async nodes(traceId: string) {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.traceNodes.filter((n) => n.traceId === traceId)
    }
    return request<RagTraceNodeVO[]>({ url: `/mindflow/rag/traces/runs/${traceId}/nodes`, method: 'get' })
  },
}
