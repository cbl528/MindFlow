import { request, paginate } from './api'
import api from './api'
import { USE_BACKEND } from '@/config'
import { delay, pageOf, seed } from '@/data/seed'
import type {
  ChunkStrategyVO,
  KnowledgeBaseVO,
  KnowledgeChunkVO,
  KnowledgeDocumentChunkLogVO,
  KnowledgeDocumentSearchVO,
  KnowledgeDocumentVO,
  PageResult,
} from '@/types'

// ---------- 知识库 ----------

export const knowledgeBaseService = {
  /** 列表：对接后端 /mindflow/knowledge-base/list，全量返回后按名称在前端过滤 */
  async list(name?: string) {
    if (!USE_BACKEND) {
      await delay(300)
      const kw = (name ?? '').trim().toLowerCase()
      return seed.knowledgeBases.filter((kb) => !kw || kb.name.toLowerCase().includes(kw))
    }
    const list = await request<KnowledgeBaseVO[]>({ url: '/mindflow/knowledge-base/list', method: 'get' })
    const kw = (name ?? '').trim().toLowerCase()
    return kw ? list.filter((kb) => kb.name?.toLowerCase().includes(kw)) : list
  },
  async get(id: string) {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.knowledgeBases.find((kb) => kb.id === id) ?? seed.knowledgeBases[0]
    }
    return request<KnowledgeBaseVO>({ url: `/mindflow/knowledge-base/${id}`, method: 'get' })
  },
  async create(data: { name: string; embeddingModel?: string; collectionName?: string }) {
    if (!USE_BACKEND) {
      await delay(400)
      return `demo-kb-${Date.now()}`
    }
    return request<string>({ url: '/mindflow/knowledge-base', method: 'post', data })
  },
  async update(id: string, data: { name?: string; embeddingModel?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/knowledge-base/${id}`, method: 'put', data })
  },
  async remove(id: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/knowledge-base/${id}`, method: 'delete' })
  },
  async chunkStrategies() {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.chunkStrategies
    }
    return request<ChunkStrategyVO[]>({ url: '/mindflow/knowledge-base/chunk-strategies', method: 'get' })
  },
}

// ---------- 知识库文档 ----------

export interface DocumentUploadForm {
  sourceType: 'file' | 'url'
  sourceLocation?: string
  scheduleEnabled?: boolean
  scheduleCron?: string
  processMode?: 'chunk' | 'pipeline'
  ingestionSpec?: string
  pipelineId?: string
}

export const knowledgeDocumentService = {
  async upload(kbId: string, file: File | null, form: DocumentUploadForm) {
    if (!USE_BACKEND) {
      await delay(800)
      return {
        id: `demo-doc-${Date.now()}`,
        kbId,
        docName: file?.name ?? form.sourceLocation ?? '演示文档',
        sourceType: form.sourceType,
        sourceLocation: form.sourceLocation,
        processMode: form.processMode,
        pipelineId: form.pipelineId,
        status: 'pending',
        enabled: true,
        createTime: new Date().toISOString(),
      } as KnowledgeDocumentVO
    }
    const fd = new FormData()
    if (file) fd.append('file', file)
    if (form.sourceType) fd.append('sourceType', form.sourceType)
    if (form.sourceLocation) fd.append('sourceLocation', form.sourceLocation)
    if (form.scheduleEnabled != null) fd.append('scheduleEnabled', String(form.scheduleEnabled))
    if (form.scheduleCron) fd.append('scheduleCron', form.scheduleCron)
    if (form.processMode) fd.append('processMode', form.processMode)
    if (form.ingestionSpec) fd.append('ingestionSpec', form.ingestionSpec)
    if (form.pipelineId) fd.append('pipelineId', form.pipelineId)
    return request<KnowledgeDocumentVO>({
      url: `/mindflow/knowledge-base/${kbId}/docs/upload`,
      method: 'post',
      data: fd,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  async list(kbId: string, params: { pageNo: number; pageSize: number; status?: string; keyword?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<KnowledgeDocumentVO>(seed.documents, params, (d, p) => {
        const kbMatch = d.kbId === kbId
        const status = p.status as string
        const kw = (p.keyword as string)?.toLowerCase()
        return kbMatch && (!status || d.status === status) && (!kw || d.docName.toLowerCase().includes(kw))
      })
    }
    return paginate<PageResult<KnowledgeDocumentVO>>(
      { url: `/mindflow/knowledge-base/${kbId}/docs`, method: 'get' },
      params,
      'current',
    )
  },
  async get(docId: string) {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.documents.find((d) => d.id === docId) ?? seed.documents[0]
    }
    return request<KnowledgeDocumentVO>({ url: `/mindflow/knowledge-base/docs/${docId}`, method: 'get' })
  },
  async update(docId: string, data: Partial<Record<string, unknown>>) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/knowledge-base/docs/${docId}`, method: 'put', data })
  },
  async remove(docId: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/knowledge-base/docs/${docId}`, method: 'delete' })
  },
  async chunk(docId: string) {
    if (!USE_BACKEND) {
      await delay(400)
      return undefined
    }
    return request<void>({ url: `/mindflow/knowledge-base/docs/${docId}/chunk`, method: 'post' })
  },
  async setEnabled(docId: string, value: boolean) {
    if (!USE_BACKEND) {
      await delay(200)
      return undefined
    }
    return request<void>({ url: `/mindflow/knowledge-base/docs/${docId}/enable`, method: 'patch', params: { value } })
  },
  async search(params: { keyword?: string; limit?: number }) {
    if (!USE_BACKEND) {
      await delay(200)
      const kw = (params.keyword ?? '').toLowerCase()
      return seed.documentSearch.filter((d) => !kw || d.docName.toLowerCase().includes(kw)).slice(0, params.limit ?? 8)
    }
    return request<KnowledgeDocumentSearchVO[]>({
      url: '/mindflow/knowledge-base/docs/search',
      method: 'get',
      params,
    })
  },
  async chunkLogs(docId: string, params: { pageNo: number; pageSize: number }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<KnowledgeDocumentChunkLogVO>(
        seed.chunkLogs.filter((l) => l.docId === docId),
        params,
      )
    }
    return paginate<PageResult<KnowledgeDocumentChunkLogVO>>(
      { url: `/mindflow/knowledge-base/docs/${docId}/chunk-logs`, method: 'get' },
      params,
      'current',
    )
  },
  async preview(docId: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return seed.demoPreview
    }
    return request<string>({ url: `/mindflow/knowledge-base/docs/${docId}/preview`, method: 'get' })
  },
  /** 源文件字节流（带鉴权） */
  async fileBlob(docId: string): Promise<Blob> {
    if (!USE_BACKEND) {
      await delay(300)
      return new Blob([seed.demoPreview], { type: 'text/markdown' })
    }
    const token = localStorage.getItem('mf_token')
    const res = await api.get<Blob>(`/mindflow/knowledge-base/docs/${docId}/file`, {
      responseType: 'blob',
      headers: token ? { Authorization: token } : undefined,
    })
    return res.data
  },
}

// ---------- 文档分块 ----------

export const knowledgeChunkService = {
  async list(docId: string, params: { pageNo: number; pageSize: number; enabled?: boolean }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<KnowledgeChunkVO>(seed.chunks.filter((c) => c.docId === docId), params)
    }
    return paginate<PageResult<KnowledgeChunkVO>>(
      { url: `/mindflow/knowledge-base/docs/${docId}/chunks`, method: 'get' },
      params,
      'current',
    )
  },
  async create(docId: string, data: { content: string; index?: number; chunkId?: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return { id: `demo-chunk-${Date.now()}`, docId, content: data.content, chunkIndex: data.index ?? 0, enabled: true } as KnowledgeChunkVO
    }
    return request<KnowledgeChunkVO>({ url: `/mindflow/knowledge-base/docs/${docId}/chunks`, method: 'post', data })
  },
  async update(docId: string, chunkId: string, data: { content: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/knowledge-base/docs/${docId}/chunks/${chunkId}`, method: 'put', data })
  },
  async remove(docId: string, chunkId: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/knowledge-base/docs/${docId}/chunks/${chunkId}`, method: 'delete' })
  },
  async setEnabled(docId: string, chunkId: string, value: boolean) {
    if (!USE_BACKEND) {
      await delay(200)
      return undefined
    }
    return request<void>({
      url: `/mindflow/knowledge-base/docs/${docId}/chunks/${chunkId}/enable`,
      method: 'patch',
      params: { value },
    })
  },
  async batchEnabled(docId: string, value: boolean, chunkIds: string[]) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({
      url: `/mindflow/knowledge-base/docs/${docId}/chunks/batch-enable`,
      method: 'patch',
      params: { value },
      data: { chunkIds },
    })
  },
}
