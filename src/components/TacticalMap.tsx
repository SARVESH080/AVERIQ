import React, { useMemo, useState } from 'react';
import { AlertTriangle, Ambulance as AmbulanceIcon, Building2, Navigation, Radio } from 'lucide-react';
import { useAveriq } from '../context/AveriqContext';

type SelectedEntity =
  | { kind: 'ambulance'; id: string }
  | { kind: 'hospital'; id: string }
  | { kind: 'emergency'; id: string }
  | null;

interface TacticalMapProps {
  compact?: boolean;
  focusEmergencyId?: string | null;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  compact = false,
  focusEmergencyId,
}) => {
  const { ambulances, hospitals, cases, setActiveSection, setSelectedCaseId } = useAveriq();
  const [showRoutes, setShowRoutes] = useState(true);
  const [showGpsDrift, setShowGpsDrift] = useState(true);
  const [selected, setSelected] = useState<SelectedEntity>(null);

  const visibleCases = useMemo(
    () =>
      cases.filter(
        (c) =>
          c.lifecycleStatus === 'Active Dispatch' ||
          c.lifecycleStatus === 'Awaiting Approval' ||
          c.lifecycleStatus === 'Reassignment Pending'
      ),
    [cases]
  );

  const selectedDetails = useMemo(() => {
    if (!selected) return null;
    if (selected.kind === 'ambulance') {
      const a = ambulances.find((u) => u.id === selected.id);
      if (!a) return null;
      return {
        title: `${a.id} · ${a.unitTier}`,
        subtitle: `${a.locationName} (${a.callsign})`,
        meta:
          a.gpsScore < 70
            ? `GPS ANOMALY: ${a.gpsStatus} (${a.gpsScore}% Trust) — Quarantined from auto-dispatch`
            : `Status: ${a.status} · GPS Trust: ${a.gpsScore}% (${a.lastPingSeconds}s ping)`,
        tone: a.gpsScore < 70 ? 'critical' : a.status === 'Busy' ? 'blue' : 'emerald',
      };
    }
    if (selected.kind === 'hospital') {
      const h = hospitals.find((u) => u.id === selected.id);
      if (!h) return null;
      return {
        title: h.name,
        subtitle: `${h.district} · ${h.capabilityTier}`,
        meta: `${h.availableIcuBeds} ICU beds free · ${h.availableBeds} emergency beds ready · ${h.specialisedFacilities
          .slice(0, 3)
          .join(', ')}`,
        tone: 'cyan',
      };
    }
    const c = cases.find((u) => u.id === selected.id);
    if (!c) return null;
    return {
      title: `${c.id} · ${c.emergencyType} (${c.priority})`,
      subtitle: c.location,
      meta: c.assignedAmbulanceId
        ? `Assigned: ${c.assignedAmbulanceId} → ${
            hospitals.find((h) => h.id === c.assignedHospitalId)?.shortName ?? 'Hospital'
          }`
        : `Recommended: ${c.allocation.recommendedAmbulanceId} (${c.allocation.estimatedArrivalMinutes}m ETA) · ${c.lifecycleStatus}`,
      tone: c.priority === 'Critical' ? 'critical' : 'cyan',
      caseId: c.id,
    };
  }, [ambulances, cases, hospitals, selected]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-[#070C17]">
      {/* Map Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0B111E]/90 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Radio className="h-4 w-4 text-cyan-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Chennai Metro EMS Tactical Grid (Simulated)
            </h3>
            <p className="text-xs text-slate-400">
              Live vector telemetry · Units, trauma hubs &amp; GPS anomaly isolation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowRoutes((v) => !v)}
            className={`rounded-md border px-2.5 py-1 font-medium transition ${
              showRoutes
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-200'
            }`}
          >
            Dispatch Corridors
          </button>
          <button
            type="button"
            onClick={() => setShowGpsDrift((v) => !v)}
            className={`rounded-md border px-2.5 py-1 font-medium transition ${
              showGpsDrift
                ? 'border-red-500/40 bg-red-500/10 text-red-300'
                : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:text-slate-200'
            }`}
          >
            GPS Drift Vectors
          </button>
        </div>
      </div>

      {/* SVG Tactical Map Canvas */}
      <div className={`relative w-full ${compact ? 'h-[320px]' : 'h-[400px] lg:h-[430px]'}`}>
        <svg
          viewBox="0 0 1000 620"
          className="h-full w-full select-none"
          role="img"
          aria-label="AVERIQ simulated dispatch tactical city map showing ambulances, hospitals, emergencies, and GPS drift alerts"
        >
          <defs>
            <pattern id="gridMinor" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(56, 189, 248, 0.05)"
                strokeWidth="1"
              />
            </pattern>
            <pattern id="gridMajor" width="160" height="160" patternUnits="userSpaceOnUse">
              <rect width="160" height="160" fill="url(#gridMinor)" />
              <path
                d="M 160 0 L 0 0 0 160"
                fill="none"
                stroke="rgba(56, 189, 248, 0.11)"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="coastSea" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#091527" />
              <stop offset="100%" stopColor="#051122" />
            </linearGradient>
          </defs>

          {/* Land & Bay of Bengal Coastline */}
          <rect width="1000" height="620" fill="#060B15" />
          <rect width="1000" height="620" fill="url(#gridMajor)" />

          {/* Coastline along East (Bay of Bengal) */}
          <path
            d="M 760 0 C 745 120, 748 220, 725 320 C 705 410, 735 510, 755 620 L 1000 620 L 1000 0 Z"
            fill="url(#coastSea)"
            stroke="rgba(34, 211, 238, 0.22)"
            strokeWidth="1.5"
          />
          <text x="830" y="305" fill="rgba(56, 189, 248, 0.28)" fontSize="13" letterSpacing="4">
            BAY OF BENGAL
          </text>

          {/* Cooum & Adyar River Channels */}
          <path
            d="M 0 215 Q 240 240 440 205 T 732 215"
            fill="none"
            stroke="rgba(14, 165, 233, 0.18)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 0 465 Q 250 435 470 455 T 720 435"
            fill="none"
            stroke="rgba(14, 165, 233, 0.18)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* Major Arterial Highways */}
          <g stroke="rgba(148, 163, 184, 0.17)" strokeWidth="2" fill="none">
            {/* Inner Ring Road */}
            <path d="M 190 95 L 185 270 L 235 425 L 480 515" />
            {/* Anna Salai / GST Road */}
            <path d="M 620 135 L 495 255 L 385 425 L 215 565" strokeWidth="2.5" stroke="rgba(56,189,248,0.22)" />
            {/* Poonamallee High Rd */}
            <path d="M 40 245 L 285 215 L 615 150" />
            {/* OMR IT Corridor */}
            <path d="M 605 445 L 675 560" stroke="rgba(56,189,248,0.2)" />
            {/* East Coast Link */}
            <path d="M 640 160 L 635 305 L 605 445" />
          </g>

          {/* District / Zone Watermark Labels */}
          <g fill="rgba(148, 163, 184, 0.35)" fontSize="11" fontWeight="600" letterSpacing="1.2">
            <text x="200" y="132">ANNA NAGAR</text>
            <text x="122" y="246">KOYAMBEDU</text>
            <text x="545" y="116">PARK TOWN</text>
            <text x="415" y="294">T. NAGAR</text>
            <text x="582" y="280">MYLAPORE</text>
            <text x="108" y="382">PORUR</text>
            <text x="332" y="405">GUINDY</text>
            <text x="565" y="425">ADYAR</text>
            <text x="475" y="555">VELACHERY</text>
            <text x="635" y="548">OMR CORRIDOR</text>
            <text x="155" y="582">TAMBARAM</text>
          </g>

          {/* GPS Drift Vector Lines (Ghost Reported Coords -> Actual Coords) */}
          {showGpsDrift &&
            ambulances
              .filter((a) => a.gpsScore < 70)
              .map((a) => (
                <g key={`drift-${a.id}`}>
                  <line
                    x1={a.reportedCoords.x}
                    y1={a.reportedCoords.y}
                    x2={a.coords.x}
                    y2={a.coords.y}
                    stroke="#EF4444"
                    strokeWidth="1.75"
                    strokeDasharray="5 4"
                    opacity="0.75"
                  />
                  {/* Ghost False Ping */}
                  <g
                    transform={`translate(${a.reportedCoords.x}, ${a.reportedCoords.y})`}
                    className="cursor-pointer"
                    onClick={() => setSelected({ kind: 'ambulance', id: a.id })}
                  >
                    <circle
                      r="16"
                      fill="rgba(239, 68, 68, 0.09)"
                      stroke="#EF4444"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="-20"
                      textAnchor="middle"
                      fill="#FCA5A5"
                      fontSize="9.5"
                      fontWeight="600"
                    >
                      DRIFT PING ({a.id.replace('AMB-108-', 'AMB-')})
                    </text>
                  </g>
                </g>
              ))}

          {/* Active & Recommended Dispatch Corridors */}
          {showRoutes &&
            visibleCases.map((c) => {
              const ambId = c.assignedAmbulanceId || c.allocation.recommendedAmbulanceId;
              const hospId = c.assignedHospitalId || c.hospitalMatch.recommendedHospitalId;
              const amb = ambulances.find((a) => a.id === ambId);
              const hosp = hospitals.find((h) => h.id === hospId);
              const isConfirmed = c.lifecycleStatus === 'Active Dispatch';
              const strokeColor =
                c.lifecycleStatus === 'Reassignment Pending'
                  ? '#F59E0B'
                  : isConfirmed
                  ? '#3B82F6'
                  : '#22D3EE';

              return (
                <g key={`route-${c.id}`}>
                  {amb && (
                    <line
                      x1={amb.coords.x}
                      y1={amb.coords.y}
                      x2={c.coords.x}
                      y2={c.coords.y}
                      stroke={strokeColor}
                      strokeWidth={isConfirmed ? '2.4' : '1.8'}
                      strokeDasharray="6 6"
                      className="animate-route-dash"
                      opacity="0.88"
                    />
                  )}
                  {hosp && (
                    <line
                      x1={c.coords.x}
                      y1={c.coords.y}
                      x2={hosp.coords.x}
                      y2={hosp.coords.y}
                      stroke="#10B981"
                      strokeWidth="1.8"
                      strokeDasharray="4 6"
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            })}

          {/* Hospital Markers */}
          {hospitals.map((h) => {
            const isSel = selected?.kind === 'hospital' && selected.id === h.id;
            return (
              <g
                key={h.id}
                transform={`translate(${h.coords.x}, ${h.coords.y})`}
                className="cursor-pointer"
                onClick={() => setSelected({ kind: 'hospital', id: h.id })}
              >
                <rect
                  x="-11"
                  y="-11"
                  width="22"
                  height="22"
                  rx="5"
                  fill={isSel ? '#082F49' : '#0B162B'}
                  stroke={isSel ? '#22D3EE' : '#38BDF8'}
                  strokeWidth={isSel ? '2' : '1.4'}
                />
                <path
                  d="M -4 -1.5 H -1.5 V -4 H 1.5 V -1.5 H 4 V 1.5 H 1.5 V 4 H -1.5 V 1.5 H -4 Z"
                  fill="#38BDF8"
                />
                <text
                  x="0"
                  y="22"
                  textAnchor="middle"
                  fill="#BAE6FD"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  {h.shortName} ({h.availableIcuBeds} ICU)
                </text>
              </g>
            );
          })}

          {/* Emergency Incident Markers */}
          {visibleCases.map((c) => {
            const isFocus = focusEmergencyId === c.id;
            const isSel = selected?.kind === 'emergency' && selected.id === c.id;
            const color =
              c.priority === 'Critical'
                ? '#EF4444'
                : c.priority === 'High'
                ? '#F59E0B'
                : '#22D3EE';

            return (
              <g
                key={c.id}
                transform={`translate(${c.coords.x}, ${c.coords.y})`}
                className="cursor-pointer"
                onClick={() => setSelected({ kind: 'emergency', id: c.id })}
              >
                {(c.lifecycleStatus !== 'Active Dispatch' || isFocus) && (
                  <circle
                    r="20"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.6"
                    className="animate-ping-slow"
                  />
                )}
                <polygon
                  points="0,-12 12,0 0,12 -12,0"
                  fill="#0B111E"
                  stroke={isSel ? '#FFFFFF' : color}
                  strokeWidth="2.2"
                />
                <circle r="4" fill={color} />
                <rect
                  x="-38"
                  y="-29"
                  width="76"
                  height="15"
                  rx="3"
                  fill="#060911"
                  stroke={color}
                  strokeWidth="0.9"
                />
                <text
                  x="0"
                  y="-19"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="8.5"
                  fontWeight="700"
                >
                  {c.id.replace('EMG-2026-', 'EMG-')}
                </text>
              </g>
            );
          })}

          {/* Ambulance Fleet Markers (Actual Verified Positions) */}
          {ambulances.map((a) => {
            const isSel = selected?.kind === 'ambulance' && selected.id === a.id;
            const isAnomaly = a.gpsScore < 70;
            const color = isAnomaly
              ? '#EF4444'
              : a.status === 'Delayed'
              ? '#F59E0B'
              : a.status === 'Busy'
              ? '#3B82F6'
              : '#10B981';

            return (
              <g
                key={a.id}
                transform={`translate(${a.coords.x}, ${a.coords.y})`}
                className="cursor-pointer"
                onClick={() => setSelected({ kind: 'ambulance', id: a.id })}
              >
                <circle
                  r={isSel ? 13 : 10}
                  fill="#0B111E"
                  stroke={isSel ? '#FFFFFF' : color}
                  strokeWidth={isSel ? 2.4 : 1.8}
                />
                <circle r="4" fill={color} />
                <text
                  x="0"
                  y="20"
                  textAnchor="middle"
                  fill={isAnomaly ? '#FCA5A5' : '#E2E8F0'}
                  fontSize="9"
                  fontWeight="600"
                >
                  {a.id.replace('AMB-108-', 'AMB-')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Map Legend Overlay */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-800/90 bg-[#060911]/90 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Available (Verified)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            Busy / En Route
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            GPS Anomaly / Critical
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-sky-400 bg-sky-950" />
            Hospital Hub
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rotate-45 border border-cyan-300 bg-slate-900" />
            Emergency
          </span>
        </div>

        {/* Click Inspector Overlay */}
        {selectedDetails && (
          <div className="animate-enter absolute right-3 top-3 z-10 w-72 rounded-lg border border-slate-700/90 bg-[#0B111E]/95 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {selected?.kind === 'ambulance' && (
                  <AmbulanceIcon className="h-4 w-4 shrink-0 text-cyan-400" />
                )}
                {selected?.kind === 'hospital' && (
                  <Building2 className="h-4 w-4 shrink-0 text-sky-400" />
                )}
                {selected?.kind === 'emergency' && (
                  <Navigation className="h-4 w-4 shrink-0 text-amber-400" />
                )}
                <p className="text-xs font-semibold text-slate-100">{selectedDetails.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
                aria-label="Close map inspector"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-300">{selectedDetails.subtitle}</p>
            <p
              className={`mt-1.5 text-[11px] leading-relaxed ${
                selectedDetails.tone === 'critical' ? 'text-red-300' : 'text-cyan-300/90'
              }`}
            >
              {selectedDetails.meta}
            </p>
            {selectedDetails.caseId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCaseId(selectedDetails.caseId!);
                  setActiveSection('emergency-management');
                }}
                className="mt-2 inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20"
              >
                Inspect in Emergency Management →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Anomaly Ribbon */}
      {ambulances.some((a) => a.gpsScore < 70) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-red-500/25 bg-red-950/20 px-4 py-2 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
            <span>
              <strong>GPS Anomaly Guard Active:</strong> Ghost ping on{' '}
              <span className="font-mono-tech text-red-300">AMB-108-03</span> (Saidapet vs actual Tambaram, 4.3 km drift) is visually isolated from dispatch.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('system-alerts')}
            className="font-medium text-red-300 underline decoration-red-400/50 underline-offset-2 hover:text-red-200"
          >
            View Telemetry Alerts
          </button>
        </div>
      )}
    </div>
  );
};
