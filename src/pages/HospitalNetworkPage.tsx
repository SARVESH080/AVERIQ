import React from 'react';
import { Ambulance, Building2, CheckCircle2, HeartPulse } from 'lucide-react';
import { useAveriq } from '../context/AveriqContext';

export const HospitalNetworkPage: React.FC = () => {
  const { hospitals, ambulances } = useAveriq();

  const totalBedsFree = hospitals.reduce((acc, h) => acc + h.availableBeds, 0);
  const totalIcuFree = hospitals.reduce((acc, h) => acc + h.availableIcuBeds, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#0B111E] px-5 py-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100 sm:text-lg">
            Hospital Coordination Network (Simulated)
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Live bed telemetry, ICU capacity, and specialized trauma/cardiac capabilities evaluated by Agent 03.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="rounded-lg border border-slate-800 bg-[#060911] px-3 py-2">
            <span className="text-slate-400">Emergency Beds Free: </span>
            <strong className="font-mono-tech text-cyan-300">{totalBedsFree}</strong>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#060911] px-3 py-2">
            <span className="text-slate-400">ICU Capacity Open: </span>
            <strong className="font-mono-tech text-emerald-300">{totalIcuFree}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {hospitals.map((h) => {
          const bedPct = Math.round((h.availableBeds / h.totalBeds) * 100);
          const icuPct = Math.round((h.availableIcuBeds / h.totalIcuBeds) * 100);
          const inboundUnits = ambulances.filter(
            (a) => a.destinationHospitalId === h.id && a.status === 'Busy'
          );

          return (
            <div
              key={h.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#0B111E] p-5 transition hover:border-cyan-500/35"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-500/35 bg-sky-500/10">
                      <Building2 className="h-4 w-4 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">{h.name}</h3>
                      <p className="text-xs text-slate-400">{h.district}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200">
                    {h.capabilityTier}
                  </span>
                  <span className="font-mono-tech text-[11px] text-slate-400">
                    Channel: {h.contactChannel}
                  </span>
                </div>

                {/* Bed & ICU Bars */}
                <div className="mt-4 space-y-3 rounded-lg border border-slate-800 bg-[#060911] p-3">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Available Emergency Beds</span>
                      <span className="font-mono-tech font-semibold text-slate-100">
                        {h.availableBeds} / {h.totalBeds}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${bedPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-400">
                        <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
                        ICU Availability
                      </span>
                      <span className="font-mono-tech font-semibold text-emerald-300">
                        {h.availableIcuBeds} / {h.totalIcuBeds}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          h.availableIcuBeds <= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${icuPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Specialized Facilities */}
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Specialised Facilities
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {h.specialisedFacilities.map((fac) => (
                      <span
                        key={fac}
                        className="inline-flex items-center gap-1 rounded border border-slate-800 bg-[#10192B] px-2 py-0.5 text-[11px] text-slate-200"
                      >
                        <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inbound Ambulances */}
              <div className="mt-4 border-t border-slate-800/80 pt-3 text-xs">
                {inboundUnits.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-blue-300">
                      <Ambulance className="h-3.5 w-3.5" />
                      Inbound Units:
                    </span>
                    {inboundUnits.map((u) => (
                      <span
                        key={u.id}
                        className="rounded border border-blue-500/35 bg-blue-500/15 px-2 py-0.5 font-mono-tech text-[11px] text-blue-200"
                      >
                        {u.id} ({u.assignedEmergencyId})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500">No inbound emergency units currently en route</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
