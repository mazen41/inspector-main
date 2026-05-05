import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useLocaleFormatters } from '../../hooks/useLocaleFormatters';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  className = '',
}) => {
  const { t } = useTranslation();
  const { formatNumber, formatPercentage } = useLocaleFormatters();

  // Format the value if it's a number
  const formattedValue = typeof value === 'number' ? formatNumber(value) : value;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{formattedValue}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{formatPercentage(trend.value / 100)}
              </span>
              <span className="text-sm text-gray-500 ml-1">{t('dashboard.stats.vsLastMonth')}</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;