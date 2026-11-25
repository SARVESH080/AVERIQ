import React from 'react';
import { AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { useAveriq } from '../context/AveriqContext';

export const SystemAlertsPage: React.FC = () => {
  const { alerts, acknowledgeAlert, setActiveSection } = useAveriq();

  const openCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#0B111E] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-red-400" />
          <div>
            <h2 className="font-display text-base font-semibold text-slate-100 sm:text-lg">
              System Alerts &amp; GPS Telemetry Anomalies
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Automated watchdogs monitoring stale GPS pings, coordinate drift, unit delays, and multi-emergency contention.
            </p>
          </div>
        </div>
        <span className="rounded border border-red-500/35 bg-red-500/15 px-3 py-1 font-mono-tech text-xs font-semibold text-red-300">
          {openCount} Unacknowledged
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const borderStyle =
            alert.severity === 'critical'
              ? 'border-red-500/40 bg-red-950/15'
              : alert.severity === 'warning'
              ? 'border-amber-500/35 bg-amber-950/15'
              : 'border-slate-800 bg-[#0B111E]';

          return (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 transition ${borderStyle} ${
                alert.acknowledged ? 'opacity-70' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        alert.severity === 'critical'
                          ? 'text-red-400'
                          : alert.severity === 'warning'
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                      }`}
                    />
                    <span className="rounded border border-slate-700 bg-[#060911] px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      {alert.type}
                    </span>
                    <span className="font-mono-tech text-xs text-cyan-300">
                      {alert.unitOrEntityId}
                    </span>
                    <span className="font-mono-tech text-[11px] text-slate-500">
                      {alert.timestamp}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{alert.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-300">{alert.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        alert.type === 'Hospital Capacity'
                          ? 'hospital-network'
                          : alert.type === 'Multi-Emergency Contention'
                          ? 'emergency-management'
                          : 'ambulance-fleet'
                      )
                    }
                    className="rounded-lg border border-slate-700 bg-[#0B111E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/40"
                  >
                    Inspect
                  </button>
                  {!alert.acknowledged ? (
                    <button
                      type="button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Acknowledge
                    </button>
                  ) : (
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
