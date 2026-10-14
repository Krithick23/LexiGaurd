import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export const RiskBadge = ({ risk = 'Low', size = 'md', showIcon = true }) => {
  const styles = {
    Critical: {
      bg: 'bg-red-100 text-red-900 border-red-300 ring-1 ring-red-500/20',
      dot: 'bg-red-600',
      icon: AlertOctagon,
      label: 'Critical Risk',
    },
    High: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-500',
      icon: ShieldAlert,
      label: 'High Risk',
    },
    Medium: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      label: 'Medium Risk',
    },
    Low: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
      label: 'Low Risk',
    },
    Informational: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      icon: Info,
      label: 'Informational',
    },
  };

  const normalizedRisk =
    risk === 'Critical' || risk === 'High' || risk === 'Medium' || risk === 'Low' || risk === 'Informational'
      ? risk
      : 'Low';

  const current = styles[normalizedRisk] || styles.Low;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2.5 py-1',
    lg: 'text-sm sm:text-base px-3.5 py-1.5 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-sm ${current.bg} ${
        sizeClasses[size] || sizeClasses.md
      }`}
    >
      {showIcon && <IconComponent size={iconSizes[size] || 14} className="shrink-0" />}
      <span>{current.label}</span>
    </span>
  );
};

export default RiskBadge;
