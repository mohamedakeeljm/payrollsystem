import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'PRESENT':
      case 'FINALIZED':
      case 'PAID':
      case 'PAID_OFF':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
      case 'PENDING_APPROVAL':
      case 'DRAFT':
      case 'PROBATION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LATE':
      case 'HALF_DAY':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'REJECTED':
      case 'CANCELLED':
      case 'TERMINATED':
      case 'ABSENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ON_LEAVE':
      case 'REST_DAY':
      case 'HOLIDAY':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    return status.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {getLabel()}
    </span>
  );
};
