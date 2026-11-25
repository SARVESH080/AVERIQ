import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Ambulance as AmbulanceIcon, Radio, RotateCcw, Wrench } from 'lucide-react';
import { AmbulanceStatusBadge, GpsTrustMeter } from '../components/Badges';
import { useAveriq } from '../context/AveriqContext';

type FleetFilter = 'All' | 'Available' | 'Busy' | 'Delayed' | 'GPS Anomaly';

export const AmbulanceFleetPage: React.FC = () => {
  const {
    ambulances,
    hospitals,
    toggleGpsAnomalySimulation,
    restoreDelayedAmbulance,
  } = useAveriq();
  const [filter, setFilter] = useState<FleetFilter>('All');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(ambulances[2]?.id ?? ambulances[0].id);

  const filtered = useMemo(() => {
    if (filter === 'All') return ambulances;
    if (filter === 'GPS Anomaly') return ambulances.filter((a) => a.gpsScore < 70);
    return ambulances.filter((a) => a.status === filter);
  }, [ambulances, filter]);

  const selectedUnit = useMemo(
    () => ambulances.find((a) => a.id === selectedUnitId) || ambulances[0],
    [ambulances, selectedUnitId]
  );

  const filters: FleetFilter[] = ['All', 'Available', 'Busy', 'Delayed', 'GPS Anomaly'];

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#0B111E] px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100 sm:text-lg">
            Ambulance Fleet &amp; GPS Telemetry Verification
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Live readiness, clinical equipment tiers, and continuous GPS Trust Score auditing across {ambulances.length} regional units.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                  : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet Table + Telemetry Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0B111E] xl:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#070B14] text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Unit ID</th>
                  <th className="px-4 py-3">Location &amp; Zone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">GPS Reliability</th>
                  <th className="px-4 py-3">Ping Latency</th>
                  <th className="px-4 py-3">Assignment</th>
                  <th className="px-4 py-3 text-right">Telemetry Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filtered.map((unit) => {
                  const isSelected = selectedUnit?.id === unit.id;
                  const destHosp = hospitals.find((h) => h.id === unit.destinationHospitalId);
                  return (
                    <tr
                      key={unit.id}
                      onClick={() => setSelectedUnitId(unit.id)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-cyan-950/20'
                          : unit.gpsScore < 70
                          ? 'bg-red-950/10 hover:bg-red-950/20'
                          : 'hover:bg-[#10192B]'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AmbulanceIcon className="h-4 w-4 text-cyan-400" />
                          <div>
                            <div className="font-mono-tech font-semibold text-slate-100">
                              {unit.id}
                            </div>
                            <div className="text-[11px] text-slate-400">{unit.unitTier}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[210px] truncate font-medium text-slate-200">
                          {unit.locationName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {unit.zone} · {unit.callsign}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AmbulanceStatusBadge status={unit.status} gpsStatus={unit.gpsStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <GpsTrustMeter score={unit.gpsScore} gpsStatus={unit.gpsStatus} />
                      </td>
                      <td className="px-4 py-3 font-mono-tech text-slate-300">
                        {unit.lastPingSeconds >= 60
                          ? `${Math.round(unit.lastPingSeconds / 60)}m ago`
                          : `${unit.lastPingSeconds}s ago`}
                      </td>
                      <td className="px-4 py-3">
                        {unit.assignedEmergencyId ? (
                          <div>
                            <div className="font-mono-tech text-[11px] font-semibold text-blue-300">
                              {unit.assignedEmergencyId}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              → {destHosp?.shortName ?? 'Hospital'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Standby</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {unit.status === 'Delayed' && (
                            <button
                              type="button"
                              onClick={() => restoreDelayedAmbulance(unit.id)}
                              className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/25"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Restore
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleGpsAnomalySimulation(unit.id)}
                            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium transition ${
                              unit.gpsScore < 70
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                                : 'border-red-500/35 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                            }`}
                          >
                            <Wrench className="h-3 w-3" />
                            {unit.gpsScore < 70 ? 'Verify GPS' : 'Test Drift'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unit Telemetry & Equipment Inspector */}
        {selectedUnit && (
          <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-5 xl:col-span-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <div className="font-mono-tech text-sm font-bold text-cyan-300">
                  {selectedUnit.id} Telemetry Diagnostic
                </div>
                <div className="text-xs text-slate-400">
                  {selectedUnit.callsign} · {selectedUnit.unitTier}
                </div>
              </div>
              <AmbulanceStatusBadge
                status={selectedUnit.status}
                gpsStatus={selectedUnit.gpsStatus}
              />
            </div>

            {selectedUnit.gpsAnomalyNote && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/35 bg-red-950/20 p-3 text-xs text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{selectedUnit.gpsAnomalyNote}</span>
              </div>
            )}

            {selectedUnit.delayReason && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/35 bg-amber-950/20 p-3 text-xs text-amber-200">
                <Activity className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>Delay Report: {selectedUnit.delayReason}</span>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Crew &amp; Readiness
                </div>
                <p className="mt-1 text-xs text-slate-200">{selectedUnit.crew}</p>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Onboard Medical Equipment
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedUnit.equipment.map((eq) => (
                    <span
                      key={eq}
                      className="rounded border border-slate-700 bg-[#060911] px-2 py-0.5 text-[11px] text-slate-300"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <Radio className="h-3.5 w-3.5 text-cyan-400" />
                  Recent GPS Ping History
                </div>
                <div className="mt-2 space-y-2">
                  {selectedUnit.telemetryHistory.map((sample, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-800 bg-[#060911] p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono-tech">
                        <span className="text-slate-400">{sample.time}</span>
                        <span
                          className={
                            sample.score >= 70 ? 'text-emerald-300' : 'text-red-300'
                          }
                        >
                          Score {sample.score}% · Drift {sample.driftKm} km
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-300">{sample.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
