import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import type { Result } from '@/types'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
})

// 请求拦截：注入 Authorization token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mf_token')
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

/** 跳转登录页（避免循环，页面守卫处理实际跳转） */
function redirectToLogin() {
  localStorage.removeItem('mf_token')
  localStorage.removeItem('mf_user')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// 响应拦截：统一解包 Result{code/message/data}
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Result>) => {
    const status = error.response?.status
    // Sa-Token 未登录 / 权限不足
    if (status === 401) {
      redirectToLogin()
      return Promise.reject(error)
    }
    if (status === 403) {
      toast.error('没有权限执行此操作')
      return Promise.reject(error)
    }
    const data = error.response?.data
    if (data && typeof data.message === 'string') {
      toast.error(data.message)
    } else {
      toast.error('网络异常，请稍后重试')
    }
    return Promise.reject(error)
  },
)

/**
 * 统一请求入口：解包 Result 信封，返回 data。
 * 注意：部分后端端点（意图树更新/删除/批量）返回裸 204，无 Result 包装，
 * 因此允许 data 为 undefined 时静默通过。
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<Result<T>>(config)
  const body = response.data as Result<T>
  if (body && typeof body.code === 'string') {
    if (body.code !== '0') {
      toast.error(body.message || '请求失败')
      throw new Error(body.message || '请求失败')
    }
    return body.data
  }
  // 裸返回（非 Result 信封，如 204 或文件流）
  return undefined as T
}

/** 分页查询：两类参数命名风格统一封装 */
export async function paginate<T>(
  config: AxiosRequestConfig,
  params: { pageNo: number; pageSize: number; [key: string]: unknown },
  style: 'current' | 'pageNo' = 'current',
): Promise<T> {
  const { pageNo, pageSize, ...rest } = params
  const p =
    style === 'current'
      ? { current: pageNo, size: pageSize, ...rest }
      : { pageNo, pageSize, ...rest }
  return request<T>(config.method === 'post' ? { ...config, data: p } : { ...config, params: p })
}

export default api
