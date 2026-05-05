import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useGetDashboardAnalyticsQuery } from '../../store/api/dashboardApi';
import { LoadingSpinner, ErrorMessage } from '../common';
import { useTranslation } from '../../hooks/useTranslation';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const DashboardChartsComponent: React.FC = () => {
  const { data: analyticsResponse, isLoading, error } = useGetDashboardAnalyticsQuery({});
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <LoadingSpinner />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={t('dashboard.errors.failedToLoadAnalytics')} />;
  }

  if (!analyticsResponse?.data?.charts) {
    return <ErrorMessage message={t('dashboard.errors.noAnalyticsData')} />;
  }

  const { charts } = analyticsResponse.data;

  // Transform completion times data for pie chart (currently unused but kept for future use)
  // const completionTimesPieData = charts.completion_times.map((item, index) => ({
  //   name: item.range,
  //   value: item.count,
  //   color: COLORS[index % COLORS.length],
  // }));

  // Transform status distribution for pie chart
  const statusDistributionData = charts.status_distribution.map((item, index) => ({
    name: item.status_display,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Inspections Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.charts.dailyInspectionsTrend')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={charts.monthly_inspections}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
              name={t('dashboard.charts.inspections')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Earnings Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.charts.earningsTrend')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={charts.earnings_trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, t('dashboard.charts.earnings')]}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Completion Times Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.charts.completionTimesDistribution')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={charts.completion_times}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`${value} ${t('dashboard.charts.inspections')}`, t('dashboard.charts.count')]}
            />
            <Bar dataKey="count" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.charts.statusDistribution')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusDistributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusDistributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} ${t('dashboard.charts.inspections')}`, t('dashboard.charts.count')]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardChartsComponent;