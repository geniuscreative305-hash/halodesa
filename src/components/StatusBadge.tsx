import React from 'react';
import { AspirationStatus } from '@/types/database';
import { Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AspirationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const configs = {
    menunggu: {
      label: 'Menunggu',
      icon: Clock,
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      dotClass: 'bg-amber-500',
    },
    diproses: {
      label: 'Sedang Diproses',
      icon: RefreshCw,
      className: 'bg-sky-50 text-sky-800 border-sky-200',
      dotClass: 'bg-sky-500',
    },
    selesai: {
      label: 'Selesai',
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dotClass: 'bg-emerald-500',
    },
    ditolak: {
      label: 'Ditolak',
      icon: XCircle,
      className: 'bg-rose-50 text-rose-800 border-rose-200',
      dotClass: 'bg-rose-500',
    },
  };

  const current = configs[status] || configs.menunggu;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs font-medium transition-all ${current.className} ${sizeClasses[size]}`}
    >
      {/* Live Pulsing Dot Indicator */}
      <span className="relative flex h-2 w-2 shrink-0">
        {(status === 'menunggu' || status === 'diproses') && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dotClass}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${current.dotClass}`}
        />
      </span>

      {showIcon && (
        <IconComponent
          size={iconSizes[size]}
          className={`shrink-0 ${status === 'diproses' ? 'animate-spin' : ''}`}
        />
      )}
      <span className="tracking-tight">{current.label}</span>
    </span>
  );
};

