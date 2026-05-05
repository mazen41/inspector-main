export interface DashboardStats {
  overview: DashboardOverview;
}

export interface DashboardAnalytics {
  charts: DashboardCharts;
  period: string;
  date_range: {
    start: string;
    end: string;
  };
}

export interface DashboardOverview {
  total_inspections_this_month: number;
  pending_inspections: number;
  completed_inspections: number;
  average_completion_time: string;
  total_earnings_this_month: number;
  success_rate: number;
}

export interface DashboardCharts {
  monthly_inspections: MonthlyInspectionData[];
  earnings_trend: EarningsTrendData[];
  completion_times: CompletionTimeData[];
  status_distribution: StatusDistributionData[];
}

export interface MonthlyInspectionData {
  date: string;
  count: number;
}

export interface EarningsTrendData {
  date: string;
  amount: number;
}

export interface CompletionTimeData {
  range: string;
  count: number;
}

export interface StatusDistributionData {
  status: string;
  status_display: string;
  count: number;
}