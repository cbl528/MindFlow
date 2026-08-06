import { request, paginate } from './api'
import { USE_BACKEND } from '@/config'
import { delay, pageOf, seed } from '@/data/seed'
import type {
  IngestionPipelineNodeVO,
  IngestionPipelineVO,
  IngestionResult,
  IngestionTaskNodeVO,
  IngestionTaskVO,
  PageResult,
} from '@/types'

export const ingestionService = {
  // ---------- 流水线 ----------
  async pipelines(params: { pageNo: number; pageSize: number; keyword?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<IngestionPipelineVO>(seed.pipelines, params, (p, pp) => {
        const kw = (pp.keyword as string)?.toLowerCase()
        return !kw || p.name.toLowerCase().includes(kw)
      })
    }
    return paginate<PageResult<IngestionPipelineVO>>(
      { url: '/mindflow/ingestion/pipelines', method: 'get' },
      params,
      'pageNo',
    )
  },
  async pipeline(id: string) {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.pipelines.find((p) => p.id === id) ?? seed.pipelines[0]
    }
    return request<IngestionPipelineVO>({ url: `/mindflow/ingestion/pipelines/${id}`, method: 'get' })
  },
  async createPipeline(data: { name: string; description?: string; nodes?: IngestionPipelineNodeVO[] }) {
    if (!USE_BACKEND) {
      await delay(400)
      return { id: `demo-p-${Date.now()}`, name: data.name, description: data.description, nodes: data.nodes ?? [] } as IngestionPipelineVO
    }
    return request<IngestionPipelineVO>({ url: '/mindflow/ingestion/pipelines', method: 'post', data })
  },
  async updatePipeline(id: string, data: { name?: string; description?: string; nodes?: IngestionPipelineNodeVO[] }) {
    if (!USE_BACKEND) {
      await delay(300)
      return { id, name: data.name ?? '', description: data.description, nodes: data.nodes ?? [] } as IngestionPipelineVO
    }
    return request<IngestionPipelineVO>({ url: `/mindflow/ingestion/pipelines/${id}`, method: 'put', data })
  },
  async removePipeline(id: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/ingestion/pipelines/${id}`, method: 'delete' })
  },

  // ---------- 任务 ----------
  async tasks(params: { pageNo: number; pageSize: number; status?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<IngestionTaskVO>(seed.tasks, params, (t, p) => {
        const status = p.status as string
        return !status || t.status === status
      })
    }
    return paginate<PageResult<IngestionTaskVO>>(
      { url: '/mindflow/ingestion/tasks', method: 'get' },
      params,
      'pageNo',
    )
  },
  async task(id: string) {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.tasks.find((t) => t.id === id) ?? seed.tasks[0]
    }
    return request<IngestionTaskVO>({ url: `/mindflow/ingestion/tasks/${id}`, method: 'get' })
  },
  async taskNodes(id: string) {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.taskNodes.filter((n) => n.taskId === id)
    }
    return request<IngestionTaskNodeVO[]>({ url: `/mindflow/ingestion/tasks/${id}/nodes`, method: 'get' })
  },
  async createTask(data: Record<string, unknown>) {
    if (!USE_BACKEND) {
      await delay(400)
      return seed.ingestionResult
    }
    return request<IngestionResult>({ url: '/mindflow/ingestion/tasks', method: 'post', data })
  },
  async upload(pipelineId: string, file: File) {
    if (!USE_BACKEND) {
      await delay(800)
      return { ...seed.ingestionResult, taskId: `demo-task-${Date.now()}`, pipelineId }
    }
    const fd = new FormData()
    fd.append('pipelineId', pipelineId)
    fd.append('file', file)
    return request<IngestionResult>({
      url: '/mindflow/ingestion/tasks/upload',
      method: 'post',
      data: fd,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
