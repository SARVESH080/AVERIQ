import React from 'react';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowRight,
  Building2,
  Clock,
  ShieldAlert,
  Siren,
  Zap,
} from 'lucide-react';
import { AmbulanceStatusBadge, GpsTrustMeter, PriorityBadge } from '../components/Badges';
import { TacticalMap } from '../components/TacticalMap';
import { useAveriq } from '../context/AveriqContext';

export const OverviewPage: React.FC = () => {
  const {
    ambulances,
    hospitals,
    cases,
    logs,
    alerts,
    historicalCount,
    priorityCounts,
    setActiveSection,
    setSelectedCaseId,
    simulateSecondEmergency,
    simulateAmbulanceDelay,
  } = useAveriq();

  const totalEmergencyCases = historicalCount + cases.length;
  const availableVerified = ambulances.filter(
    (a) => a.status === 'Available' && a.gpsScore >= 70
  ).length;
  const busyCount = ambulances.filter((a) => a.status === 'Busy').length;
  const delayedCount = ambulances.filter((a) => a.status === 'Delayed').length;
  const gpsAnomalyUnits = ambulances.filter((a) => a.gpsScore < 70);
  const hospitalsAvailable = hospitals.filter((h) => h.availableBeds > 0).length;
  const totalIcuFree = hospitals.reduce((sum, h) => sum + h.availableIcuBeds, 0);

  const activeIncidents = cases.filter(
    (c) =>
      c.lifecycleStatus === 'Active Dispatch' ||
      c.lifecycleStatus === 'Awaiting Approval' ||
      c.lifecycleStatus === 'Reassignment Pending'
  );

  const priorityTotal =
    priorityCounts.Critical +
    priorityCounts.High +
    priorityCounts.Medium +
    priorityCounts.Low;

  const priorityRows = [
    { label: 'Critical', count: priorityCounts.Critical, color: '#EF4444', barClass: 'bg-red-500' },
    { label: 'High', count: priorityCounts.High, color: '#F59E0B', barClass: 'bg-amber-500' },
    { label: 'Medium', count: priorityCounts.Medium, color: '#22D3EE', barClass: 'bg-cyan-400' },
    { label: 'Low', count: priorityCounts.Low, color: '#10B981', barClass: 'bg-emerald-400' },
  ];

  // SVG Donut ring segments
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="space-y-6">
      {/* Top Action & Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#0B111E] px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100 sm:text-lg">
            Regional Command Overview — Sector Chennai 108 EMS
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Real-time verification of ambulance GPS telemetry, multi-emergency dispatch optimization, and hospital ICU capacity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveSection('emergency-management')}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            <Siren className="h-3.5 w-3.5" />
            Register Emergency
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection('emergency-management');
              void simulateSecondEmergency();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-xs font-medium text-blue-200 transition hover:bg-blue-500/25"
          >
            <Zap className="h-3.5 w-3.5 text-blue-400" />
            Simulate Second Emergency
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection('emergency-management');
              void simulateAmbulanceDelay();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/25"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            Simulate Ambulance Delay
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Emergency Cases</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono-tech text-2xl font-bold text-slate-100">
              {totalEmergencyCases}
            </span>
            <span className="text-xs text-cyan-300">+{cases.length} active</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Shift total across all sectors</div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Available Ambulances</span>
            <Ambulance className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono-tech text-2xl font-bold text-emerald-300">
              {availableVerified}
            </span>
            <span className="text-xs text-slate-400">of {ambulances.length} verified</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">GPS trust score ≥ 70% cleared</div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Busy Ambulances</span>
            <Ambulance className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono-tech text-2xl font-bold text-blue-300">{busyCount}</span>
            {delayedCount > 0 && (
              <span className="text-xs text-amber-300">· {delayedCount} delayed</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">En route or transporting</div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Hospitals Available</span>
            <Building2 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono-tech text-2xl font-bold text-slate-100">
              {hospitalsAvailable} / {hospitals.length}
            </span>
            <span className="text-xs text-emerald-300">{totalIcuFree} ICU free</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Tier-1 trauma &amp; cardiac online</div>
        </div>

        <button
          type="button"
          onClick={() => setActiveSection('system-alerts')}
          className="rounded-xl border border-red-500/35 bg-red-950/15 p-4 text-left transition hover:border-red-400/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-200">GPS Reliability Alerts</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono-tech text-2xl font-bold text-red-300">
              {gpsAnomalyUnits.length}
            </span>
            <span className="text-xs text-red-300/90">
              {alerts.filter((a) => !a.acknowledged).length} open alerts
            </span>
          </div>
          <div className="mt-1 text-[11px] text-red-200/75">
            Faulty telemetry quarantined
          </div>
        </button>
      </div>

      {/* Main Map + Priority Distribution & GPS Alerts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TacticalMap />
        </div>

        <div className="flex flex-col gap-6 xl:col-span-4">
          {/* Emergency Priority Distribution */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-semibold text-slate-100">
                Emergency Priority Distribution
              </h3>
              <span className="font-mono-tech text-xs text-slate-400">{priorityTotal} Total</span>
            </div>

            <div className="mt-4 flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="10"
                  />
                  {priorityRows.map((row) => {
                    const segLen =
                      priorityTotal > 0 ? (row.count / priorityTotal) * circumference : 0;
                    const dashArray = `${segLen} ${circumference - segLen}`;
                    const currentOffset = offset;
                    offset += segLen;
                    return (
                      <circle
                        key={row.label}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={row.color}
                        strokeWidth="10"
                        strokeDasharray={dashArray}
                        strokeDashoffset={-currentOffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono-tech text-lg font-bold text-slate-100">
                    {priorityTotal}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Cases
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5">
                {priorityRows.map((row) => {
                  const pct =
                    priorityTotal > 0 ? Math.round((row.count / priorityTotal) * 100) : 0;
                  return (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{row.label}</span>
                        <span className="font-mono-tech text-slate-200">
                          {row.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${row.barClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* GPS Reliability Alerts Panel */}
          <div className="flex-1 rounded-xl border border-slate-800/80 bg-[#0B111E] p-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <h3 className="text-sm font-semibold text-slate-100">GPS Reliability Alerts</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('system-alerts')}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
              >
                All Alerts →
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {gpsAnomalyUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-lg border border-red-500/30 bg-red-950/15 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech text-xs font-semibold text-red-300">
                      {unit.id} · {unit.gpsStatus}
                    </span>
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono-tech text-[11px] font-semibold text-red-200">
                      Trust {unit.gpsScore}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {unit.gpsAnomalyNote}
                  </p>
                </div>
              ))}
              {gpsAnomalyUnits.length === 0 && (
                <p className="text-xs text-emerald-300">
                  All active fleet telemetry channels currently verified above 70% threshold.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Operational Grids: Active Incidents, Fleet Status, Recent Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Active Emergency Incidents */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-4 xl:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">Active Emergency Incidents</h3>
            <button
              type="button"
              onClick={() => setActiveSection('emergency-management')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Manage All →
            </button>
          </div>
          <div className="mt-3 space-y-2.5">
            {activeIncidents.map((c) => {
              const hosp = hospitals.find(
                (h) => h.id === (c.assignedHospitalId || c.hospitalMatch.recommendedHospitalId)
              );
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setActiveSection('emergency-management');
                  }}
                  className="cursor-pointer rounded-lg border border-slate-800 bg-[#10192B]/80 p-3 transition hover:border-cyan-500/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech text-xs font-semibold text-cyan-300">
                        {c.id}
                      </span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                        c.lifecycleStatus === 'Active Dispatch'
                          ? 'bg-blue-500/15 text-blue-300'
                          : c.lifecycleStatus === 'Reassignment Pending'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {c.lifecycleStatus}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-slate-200">{c.location}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>
                      Unit:{' '}
                      <strong className="font-mono-tech text-slate-200">
                        {c.assignedAmbulanceId || c.allocation.recommendedAmbulanceId}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3 text-cyan-400" />
                      {hosp?.shortName ?? 'Hospital'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ambulance Fleet Status Snapshot */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-4 xl:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">Ambulance Fleet Status</h3>
            <button
              type="button"
              onClick={() => setActiveSection('ambulance-fleet')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Full Fleet →
            </button>
          </div>
          <div className="mt-3 divide-y divide-slate-800/70">
            {ambulances.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tech text-xs font-semibold text-slate-100">
                      {a.id}
                    </span>
                    <span className="text-[11px] text-slate-400">{a.unitTier}</span>
                  </div>
                  <div className="truncate text-[11px] text-slate-500">{a.locationName}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <AmbulanceStatusBadge status={a.status} gpsStatus={a.gpsStatus} />
                  <GpsTrustMeter score={a.gpsScore} gpsStatus={a.gpsStatus} compact />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Dispatch Activities */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-4 xl:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-slate-100">Recent Dispatch Activities</h3>
            <button
              type="button"
              onClick={() => setActiveSection('dispatch-history')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Logs →
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="border-l-2 border-slate-700 pl-3">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-medium text-cyan-300">{log.category}</span>
                  <span className="font-mono-tech text-slate-500">{log.timestamp}</span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-slate-200">{log.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
