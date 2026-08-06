import { request, paginate } from './api'
import { USE_BACKEND } from '@/config'
import { delay, pageOf, seed } from '@/data/seed'
import type { PageResult, SampleQuestionVO } from '@/types'

export const sampleQuestionService = {
  async random() {
    if (!USE_BACKEND) {
      await delay(300)
      return seed.sampleQuestions.slice(0, 4)
    }
    return request<SampleQuestionVO[]>({ url: '/mindflow/rag/sample-questions', method: 'get' })
  },
  async list(params: { pageNo: number; pageSize: number }) {
    if (!USE_BACKEND) {
      await delay(300)
      return pageOf<SampleQuestionVO>(seed.sampleQuestions, params)
    }
    return paginate<PageResult<SampleQuestionVO>>(
      { url: '/mindflow/rag/sample-questions/list', method: 'get' },
      params,
      'current',
    )
  },
  async get(id: string) {
    if (!USE_BACKEND) {
      await delay(200)
      return seed.sampleQuestions.find((q) => q.id === id) ?? seed.sampleQuestions[0]
    }
    return request<SampleQuestionVO>({ url: `/mindflow/rag/sample-questions/${id}`, method: 'get' })
  },
  async create(data: { title: string; description?: string; question: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return `demo-sq-${Date.now()}`
    }
    return request<string>({ url: '/mindflow/rag/sample-questions', method: 'post', data })
  },
  async update(id: string, data: { title: string; description?: string; question: string }) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/rag/sample-questions/${id}`, method: 'put', data })
  },
  async remove(id: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/rag/sample-questions/${id}`, method: 'delete' })
  },
}
