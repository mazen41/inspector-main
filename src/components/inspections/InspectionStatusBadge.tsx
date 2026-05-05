import React from 'react';
import { Clock, Play, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { InspectionStatus } from '../../types';

interface InspectionStatusBadgeProps {
  status: InspectionStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const InspectionStatusBadge: React.FC<InspectionStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const { t } = useTranslation();
  
  const getStatusConfig = (status: InspectionStatus) => {
    switch (status) {
      case 'scheduled':
        return {
          icon: Clock,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          label: t('inspections.status.scheduled'),
        };
      case 'in_progress':
        return {
          icon: Play,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: t('inspections.status.inProgress'),
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800 border-green-200',
          label: t('inspections.status.completed'),
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          label: t('inspections.status.cancelled'),
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: t('inspections.status.unknown'),
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const getIconSize = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-4 w-4';
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${config.color}
        ${getSizeClasses(size)}
      `}
    >
      {showIcon && <Icon className={getIconSize(size)} />}
      {config.label}
    </span>
  );
};

export default InspectionStatusBadge;