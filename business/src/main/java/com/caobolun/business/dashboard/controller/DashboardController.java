package com.caobolun.business.dashboard.controller;

import com.caobolun.business.dashboard.service.DashboardService;
import com.caobolun.business.dashboard.vo.DashboardOverviewVO;
import com.caobolun.business.dashboard.vo.DashboardPerformanceVO;
import com.caobolun.business.dashboard.vo.DashboardTrendsVO;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("mindflow/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public Result<DashboardOverviewVO> overview(@RequestParam(required = false) String window) {
        return Results.success(dashboardService.loadOverview(window));
    }

    @GetMapping("/performance")
    public Result<DashboardPerformanceVO> performance(@RequestParam(required = false) String window) {
        return Results.success(dashboardService.loadPerformance(window));
    }

    @GetMapping("/trends")
    public Result<DashboardTrendsVO> trends(@RequestParam String metric,
                                            @RequestParam(required = false) String window,
                                            @RequestParam(required = false) String granularity) {
        return Results.success(dashboardService.loadTrends(metric, window, granularity));
    }
}
