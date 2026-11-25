import React from 'react';
import { AmbulanceStatus, GpsHealthStatus, PriorityLevel } from '../types/averiq';

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  const styles: Record<PriorityLevel, string> = {
    Critical: 'bg-red-500/15 text-red-300 border-red-500/35',
    High: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    Medium: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  };
  const dot: Record<PriorityLevel, string> = {
    Critical: 'bg-red-400',
    High: 'bg-amber-400',
    Medium: 'bg-cyan-400',
    Low: 'bg-emerald-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium tracking-wide ${styles[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[priority]}`} />
      {priority}
    </span>
  );
};

export const AmbulanceStatusBadge: React.FC<{
  status: AmbulanceStatus;
  gpsStatus?: GpsHealthStatus;
}> = ({ status, gpsStatus }) => {
  if (gpsStatus && gpsStatus !== 'Verified' && status === 'Available') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-red-500/35 bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        GPS Flagged
      </span>
    );
  }
  const styles: Record<AmbulanceStatus, string> = {
    Available: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    Busy: 'bg-blue-500/15 text-blue-300 border-blue-500/35',
    Delayed: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  };
  const dots: Record<AmbulanceStatus, string> = {
    Available: 'bg-emerald-400',
    Busy: 'bg-blue-400',
    Delayed: 'bg-amber-400',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
};

export const GpsTrustMeter: React.FC<{
  score: number;
  gpsStatus: GpsHealthStatus;
  compact?: boolean;
}> = ({ score, gpsStatus, compact = false }) => {
  const color =
    score >= 85
      ? 'bg-emerald-400'
      : score >= 70
      ? 'bg-cyan-400'
      : score >= 45
      ? 'bg-amber-400'
      : 'bg-red-400';

  const textColor =
    score >= 85
      ? 'text-emerald-300'
      : score >= 70
      ? 'text-cyan-300'
      : score >= 45
      ? 'text-amber-300'
      : 'text-red-300';

  return (
    <div className="flex items-center gap-2">
      <div className={`${compact ? 'w-14' : 'w-20'} h-1.5 overflow-hidden rounded-full bg-slate-800`}>
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-mono-tech text-xs font-semibold ${textColor}`}>{score}%</span>
      {!compact && gpsStatus !== 'Verified' && (
        <span className="text-[11px] font-medium text-red-300/90">({gpsStatus})</span>
      )}
    </div>
  );
};
