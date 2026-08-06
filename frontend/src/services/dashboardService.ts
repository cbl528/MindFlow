import { request } from './api'
import { USE_BACKEND } from '@/config'
import { delay, seed } from '@/data/seed'
import type { DashboardOverviewVO, DashboardPerformanceVO, DashboardTrendsVO } from '@/types'

export const dashboardService = {
  async overview(window?: string) {
    if (!USE_BACKEND) {
      await delay(400)
      return seed.dashboardOverview
    }
    return request<DashboardOverviewVO>({
      url: '/mindflow/dashboard/overview',
      method: 'get',
      params: window ? { window } : undefined,
    })
  },
  async performance(window?: string) {
    if (!USE_BACKEND) {
      await delay(400)
      return seed.dashboardPerformance
    }
    return request<DashboardPerformanceVO>({
      url: '/mindflow/dashboard/performance',
      method: 'get',
      params: window ? { window } : undefined,
    })
  },
  async trends(metric: string, opts?: { window?: string; granularity?: string }) {
    if (!USE_BACKEND) {
      await delay(400)
      return { ...seed.dashboardTrends, metric, window: opts?.window, granularity: opts?.granularity }
    }
    return request<DashboardTrendsVO>({
      url: '/mindflow/dashboard/trends',
      method: 'get',
      params: { metric, ...opts },
    })
  },
}
