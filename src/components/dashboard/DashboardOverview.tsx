import React from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  DollarSign,
  // TrendingUp,
  CircleUser,
  AlertCircle,
} from 'lucide-react';
import StatsCard from './StatsCard';
// import DashboardCharts from './DashboardCharts';
import DashboardSkeleton from './DashboardSkeleton';
import { useGetDashboardStatsQuery } from '../../store/api/dashboardApi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';


const DashboardOverview: React.FC = () => {
  const { data: dashboardResponse, isLoading, error } = useGetDashboardStatsQuery();
  const navigate = useNavigate();
  const { t } = useTranslation();
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">
              {t('dashboard.errors.failedToLoad')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardResponse?.data) {
    return null;
  }

  const { overview } = dashboardResponse.data;

  // Format currency
  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //   }).format(amount);
  // };

  // Calculate trends (mock data for now - would come from API in real implementation)
  const getTrend = (current: number, previous: number) => ({
    value: Math.round(((current - previous) / previous) * 100),
    isPositive: current > previous,
  });

  return (
    
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
        <p className="text-gray-600">
          {t('dashboard.welcome')}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickActions.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={()=>navigate('/inspections')}
          >
            <ClipboardList className="h-5 w-5 mr-2" />
            {t('dashboard.quickActions.viewAllInspections')}
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          onClick={()=>navigate('/payments')}
          >
            <DollarSign className="h-5 w-5 mr-2" />
            {t('dashboard.quickActions.viewPayments')}
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          onClick={()=>navigate('/profile')}
          >
            <CircleUser className="h-5 w-5 mr-2" />
            {t('dashboard.quickActions.profile')}
          </button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title={t('dashboard.stats.totalInspectionsThisMonth')}
          value={overview.total_inspections_this_month}
          icon={ClipboardList}
          trend={getTrend(overview.total_inspections_this_month, 12)} // Mock previous month data
        />
        
        <StatsCard
          title={t('dashboard.stats.pendingInspections')}
          value={overview.pending_inspections}
          icon={Clock}
          className="border-l-4 border-l-yellow-500"
        />
        
        <StatsCard
          title={t('dashboard.stats.completedInspections')}
          value={overview.completed_inspections}
          icon={CheckCircle}
          trend={getTrend(overview.completed_inspections, 10)} // Mock previous month data
        />
        
        {/* <StatsCard
          title={t('dashboard.stats.monthlyEarnings')}
          value={formatCurrency(overview.total_earnings_this_month)}
          icon={DollarSign}
          trend={getTrend(overview.total_earnings_this_month, 1200)} // Mock previous month data
        />
        
        <StatsCard
          title={t('dashboard.stats.successRate')}
          value={`${overview.success_rate.toFixed(1)}%`}
          icon={TrendingUp}
          trend={getTrend(overview.success_rate, 92)} // Mock previous month data
        />
        
        <StatsCard
          title={t('dashboard.stats.avgCompletionTime')}
          value={overview.average_completion_time}
          icon={Clock}
        /> */}
      </div>

      {/* Charts Section - Will be loaded separately from analytics endpoint */}
      {/* <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('dashboard.charts.title')}</h2>
        <DashboardCharts />
      </div> */}

    </div>
  );
};

export default DashboardOverview;