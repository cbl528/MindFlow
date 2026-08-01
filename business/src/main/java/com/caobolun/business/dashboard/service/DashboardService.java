package com.caobolun.business.dashboard.service;

import com.caobolun.business.dashboard.vo.DashboardOverviewVO;
import com.caobolun.business.dashboard.vo.DashboardPerformanceVO;
import com.caobolun.business.dashboard.vo.DashboardTrendsVO;

public interface DashboardService {

    DashboardOverviewVO loadOverview(String window);

    DashboardPerformanceVO loadPerformance(String window);

    DashboardTrendsVO loadTrends(String metric, String window, String granularity);
}