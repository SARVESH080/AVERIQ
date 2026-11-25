import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ambulance as AmbulanceIcon,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  GitBranch,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { AmbulanceStatusBadge, GpsTrustMeter, PriorityBadge } from '../components/Badges';
import { useAveriq } from '../context/AveriqContext';
import { CHENNAI_LOCATION_PRESETS, EMERGENCY_SYMPTOM_TEMPLATES } from '../data/mockData';
import { EmergencyType } from '../types/averiq';

const EMERGENCY_TYPES: EmergencyType[] = [
  'Cardiac',
  'Accident',
  'Trauma',
  'Respiratory',
  'Other',
];

export const EmergencyManagementPage: React.FC = () => {
  const {
    ambulances,
    hospitals,
    cases,
    selectedCaseId,
    setSelectedCaseId,
    secondaryConflictCaseId,
    nextEmergencyId,
    pipeline,
    processEmergency,
    approveAssignment,
    simulateSecondEmergency,
    simulateAmbulanceDelay,
    approveReassignment,
  } = useAveriq();

  const [location, setLocation] = useState('Guindy Industrial Estate — Kathipara Junction');
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('Cardiac');
  const [symptoms, setSymptoms] = useState(EMERGENCY_SYMPTOM_TEMPLATES.Cardiac);
  const [patientCount, setPatientCount] = useState(1);
  const [additionalInfo, setAdditionalInfo] = useState(
    'Peak-hour traffic along Anna Salai corridor; patient conscious but unstable.'
  );

  const [showOverridePanel, setShowOverridePanel] = useState(false);
  const [overrideAmbId, setOverrideAmbId] = useState('');
  const [overrideHospId, setOverrideHospId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const [showReassignOverride, setShowReassignOverride] = useState(false);
  const [reassignOverrideAmbId, setReassignOverrideAmbId] = useState('');

  const isRunning =
    pipeline.phase === 'agent-01' ||
    pipeline.phase === 'agent-02' ||
    pipeline.phase === 'agent-03';

  const activeCase = useMemo(() => {
    if (selectedCaseId) {
      const found = cases.find((c) => c.id === selectedCaseId);
      if (found) return found;
    }
    return cases[0] || null;
  }, [cases, selectedCaseId]);

  const conflictCase = useMemo(() => {
    if (!secondaryConflictCaseId) return null;
    return cases.find((c) => c.id === secondaryConflictCaseId) || null;
  }, [cases, secondaryConflictCaseId]);

  const primarySiblingCase = useMemo(() => {
    if (!conflictCase) return null;
    return (
      cases.find(
        (c) =>
          c.id !== conflictCase.id &&
          (c.assignedAmbulanceId === conflictCase.conflictingUnitId ||
            c.allocation.recommendedAmbulanceId === conflictCase.conflictingUnitId)
      ) || null
    );
  }, [cases, conflictCase]);

  const handleTypeSelect = (type: EmergencyType) => {
    setEmergencyType(type);
    setSymptoms(EMERGENCY_SYMPTOM_TEMPLATES[type]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !symptoms.trim() || isRunning) return;
    setShowOverridePanel(false);
    await processEmergency({
      id: nextEmergencyId,
      location: location.trim(),
      emergencyType,
      symptoms: symptoms.trim(),
      patientCount: Math.max(1, patientCount),
      additionalInfo: additionalInfo.trim(),
    });
  };

  const openOverride = () => {
    if (!activeCase) return;
    setOverrideAmbId(activeCase.allocation.recommendedAmbulanceId);
    setOverrideHospId(activeCase.hospitalMatch.recommendedHospitalId);
    setOverrideReason('');
    setShowOverridePanel((v) => !v);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-[#0B111E] px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Queue:
          </span>
          {cases.slice(0, 5).map((c) => {
            const selected = activeCase?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCaseId(c.id);
                  setShowOverridePanel(false);
                  setShowReassignOverride(false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                  selected
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 bg-[#10192B] text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-mono-tech">{c.id}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    c.lifecycleStatus === 'Reassignment Pending'
                      ? 'bg-red-400'
                      : c.lifecycleStatus === 'Awaiting Approval'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => void simulateSecondEmergency()}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/15 px-3.5 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/25 disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5 text-blue-400" />
            Simulate Second Emergency
          </button>
          <button
            type="button"
            disabled={isRunning}
            onClick={() => void simulateAmbulanceDelay(activeCase?.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-50"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            Simulate Ambulance Delay
          </button>
        </div>
      </div>

      {/* Main Split: Registration Form (Left) + AI Agents & Dispatcher Approval (Right) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Emergency Registration Form */}
        <section className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-5 xl:col-span-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="font-display text-base font-semibold text-slate-100">
              Emergency Registration
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Log incoming 108/112 emergency call and invoke AVERIQ&apos;s 3 specialized AI agents.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Emergency ID */}
            <div>
              <label
                htmlFor="emg-id"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Emergency ID (Auto-Generated)
              </label>
              <input
                id="emg-id"
                type="text"
                readOnly
                value={nextEmergencyId}
                className="w-full rounded-lg border border-slate-800 bg-[#060911] px-3 py-2 font-mono-tech text-xs font-semibold text-cyan-300 focus:outline-none"
              />
            </div>

            {/* Patient Location + Quick Zone Presets */}
            <div>
              <label
                htmlFor="patient-location"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Patient Location
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="patient-location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter street, junction or landmark"
                  className="w-full rounded-lg border border-slate-700/80 bg-[#060911] py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CHENNAI_LOCATION_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setLocation(preset.label)}
                    className="rounded border border-slate-800 bg-[#10192B] px-2 py-0.5 text-[11px] text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-200"
                  >
                    {preset.label.split('—')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Type */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-300">
                Emergency Type
              </span>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 xl:grid-cols-3">
                {EMERGENCY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeSelect(type)}
                    className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
                      emergencyType === type
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                        : 'border-slate-800 bg-[#060911] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms or Description */}
            <div>
              <label
                htmlFor="emg-symptoms"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Symptoms or Emergency Description
              </label>
              <textarea
                id="emg-symptoms"
                rows={3}
                required
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe clinical condition, consciousness, vitals..."
                className="w-full rounded-lg border border-slate-700/80 bg-[#060911] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Number of Patients + Additional Info */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div>
                <label
                  htmlFor="patient-count"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  Number of Patients
                </label>
                <input
                  id="patient-count"
                  type="number"
                  min={1}
                  max={25}
                  value={patientCount}
                  onChange={(e) => setPatientCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-700/80 bg-[#060911] px-3 py-2 font-mono-tech text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="additional-info"
                className="mb-1.5 block text-xs font-medium text-slate-300"
              >
                Additional Information
              </label>
              <input
                id="additional-info"
                type="text"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Access gate, traffic conditions, caller contact note..."
                className="w-full rounded-lg border border-slate-700/80 bg-[#060911] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isRunning}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executing Multi-Agent Pipeline...
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4" />
                  Process Emergency with AVERIQ
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Column: Sequential Agent Pipeline + Decision Panels */}
        <div className="space-y-6 xl:col-span-8">
          {/* Sequential Execution Progress Strip */}
          {pipeline.phase !== 'idle' && (
            <div className="animate-enter rounded-xl border border-cyan-500/35 bg-[#0B111E] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    AVERIQ Sequential Agent Pipeline —{' '}
                    <span className="font-mono-tech text-cyan-300">
                      {pipeline.activeEmergencyId}
                    </span>
                  </h3>
                </div>
                <span className="text-xs font-medium text-emerald-300">
                  {isRunning ? 'Executing Rules Engine...' : 'All 3 Agents Verified'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {pipeline.timeline.map((step, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 transition ${
                      step.status === 'done'
                        ? 'border-emerald-500/35 bg-emerald-950/15'
                        : step.status === 'active'
                        ? 'border-cyan-400/60 bg-cyan-950/25'
                        : 'border-slate-800 bg-[#060911]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span
                        className={
                          step.status === 'done'
                            ? 'text-emerald-300'
                            : step.status === 'active'
                            ? 'text-cyan-200'
                            : 'text-slate-500'
                        }
                      >
                        {step.agent}
                      </span>
                      <span className="font-mono-tech text-[11px] text-slate-400">{step.time}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Emergency Conflict Resolution Comparison Banner (when triggered) */}
          {conflictCase && (
            <div className="animate-enter rounded-xl border border-blue-500/45 bg-blue-950/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-500/25 pb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-blue-100">
                    Multi-Emergency Optimisation — Competing Resource Resolution
                  </h3>
                </div>
                <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  Conflict-Free Allocation Ready
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-200">
                {conflictCase.conflictExplanation}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {primarySiblingCase && (
                  <div
                    onClick={() => setSelectedCaseId(primarySiblingCase.id)}
                    className={`cursor-pointer rounded-lg border bg-[#0B111E] p-3 transition ${
                      activeCase?.id === primarySiblingCase.id
                        ? 'border-blue-400/70'
                        : 'border-slate-700/80 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-tech text-xs font-semibold text-slate-200">
                        Emergency A: {primarySiblingCase.id}
                      </span>
                      <PriorityBadge priority={primarySiblingCase.priority} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{primarySiblingCase.location}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Locked / Assigned Unit:</span>
                      <span className="rounded bg-blue-500/15 px-2 py-0.5 font-mono-tech font-semibold text-blue-300">
                        {primarySiblingCase.assignedAmbulanceId ||
                          primarySiblingCase.allocation.recommendedAmbulanceId}
                      </span>
                    </div>
                  </div>
                )}

                <div
                  onClick={() => setSelectedCaseId(conflictCase.id)}
                  className={`cursor-pointer rounded-lg border bg-[#0B111E] p-3 transition ${
                    activeCase?.id === conflictCase.id
                      ? 'border-cyan-400/80'
                      : 'border-cyan-500/45 hover:border-cyan-400/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech text-xs font-semibold text-cyan-300">
                      Emergency B: {conflictCase.id}
                    </span>
                    <PriorityBadge priority={conflictCase.priority} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{conflictCase.location}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Conflict-Free Recommendation:</span>
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono-tech font-semibold text-emerald-300">
                      {conflictCase.allocation.recommendedAmbulanceId} (
                      {conflictCase.allocation.estimatedArrivalMinutes}m ETA)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Automatic Reassignment Approval Panel (when Simulate Ambulance Delay is active) */}
          {activeCase?.lifecycleStatus === 'Reassignment Pending' &&
            activeCase.reassignmentProposal && (
              <div className="animate-enter rounded-xl border border-amber-500/50 bg-amber-950/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-amber-100">
                      Automatic Reassignment Required — {activeCase.id}
                    </h3>
                  </div>
                  <span className="rounded border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">
                    Dispatcher Approval Required
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-red-500/35 bg-[#0B111E] p-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-red-300">
                      Delayed Assigned Unit
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono-tech text-base font-bold text-red-200">
                        {activeCase.reassignmentProposal.delayedAmbulanceId}
                      </span>
                      <span className="font-mono-tech text-xs text-red-300">
                        ETA {activeCase.reassignmentProposal.oldEtaMinutes}m → 27m
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      {activeCase.reassignmentProposal.delayReason}
                    </p>
                  </div>

                  <div className="rounded-lg border border-emerald-500/40 bg-[#0B111E] p-3.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                      Agent 02 Recommended Replacement
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono-tech text-base font-bold text-emerald-200">
                        {activeCase.reassignmentProposal.proposedAmbulanceId}
                      </span>
                      <span className="font-mono-tech text-xs font-semibold text-emerald-300">
                        New ETA: {activeCase.reassignmentProposal.newEtaMinutes} min
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      {activeCase.reassignmentProposal.reasonForReassignment}
                    </p>
                  </div>
                </div>

                {showReassignOverride && (
                  <div className="mt-3 rounded-lg border border-slate-700 bg-[#0B111E] p-3">
                    <label
                      htmlFor="reassign-override-select"
                      className="mb-1.5 block text-xs font-medium text-slate-300"
                    >
                      Select Alternative Replacement Ambulance
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <select
                        id="reassign-override-select"
                        value={
                          reassignOverrideAmbId ||
                          activeCase.reassignmentProposal.proposedAmbulanceId
                        }
                        onChange={(e) => setReassignOverrideAmbId(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-700 bg-[#060911] px-3 py-2 text-xs text-slate-100"
                      >
                        {ambulances
                          .filter(
                            (a) =>
                              a.status === 'Available' &&
                              a.id !== activeCase.reassignmentProposal?.delayedAmbulanceId
                          )
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.id} — {a.unitTier} ({a.locationName}) · GPS {a.gpsScore}%
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          approveReassignment(
                            activeCase.id,
                            reassignOverrideAmbId ||
                              activeCase.reassignmentProposal?.proposedAmbulanceId
                          );
                          setShowReassignOverride(false);
                        }}
                        className="rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                      >
                        Confirm Override Reassignment
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => approveReassignment(activeCase.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Reassignment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReassignOverrideAmbId(
                        activeCase.reassignmentProposal?.proposedAmbulanceId ?? ''
                      );
                      setShowReassignOverride((v) => !v);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0B111E] px-4 py-2 text-xs font-medium text-slate-200 hover:border-cyan-500/40"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Override Reassignment
                  </button>
                </div>
              </div>
            )}

          {/* Active Case Detailed Three-Agent Inspection + Combined Dispatcher Approval */}
          {activeCase ? (
            <div className="space-y-5">
              {/* Combined Dispatcher Approval Recommendation Card */}
              <div className="rounded-xl border border-cyan-500/35 bg-[#0B111E] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-tech text-sm font-bold text-cyan-300">
                        {activeCase.id}
                      </span>
                      <PriorityBadge priority={activeCase.priority} />
                      <span
                        className={`rounded border px-2 py-0.5 text-xs font-medium ${
                          activeCase.lifecycleStatus === 'Active Dispatch'
                            ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                            : activeCase.lifecycleStatus === 'Reassignment Pending'
                            ? 'border-red-500/35 bg-red-500/15 text-red-300'
                            : 'border-amber-500/35 bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {activeCase.lifecycleStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {activeCase.location} · {activeCase.patientCount} patient(s) · Registered{' '}
                      <span className="font-mono-tech">{activeCase.registeredAt}</span>
                    </p>
                  </div>

                  {activeCase.lifecycleStatus === 'Awaiting Approval' && (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => approveAssignment(activeCase.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Assignment
                      </button>
                      <button
                        type="button"
                        onClick={openOverride}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#10192B] px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-500/40"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Override Assignment
                      </button>
                    </div>
                  )}
                </div>

                {/* Combined Summary Grid */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-slate-800 bg-[#060911] p-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Emergency Priority
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <PriorityBadge priority={activeCase.priority} />
                      <span className="font-mono-tech text-xs text-slate-300">
                        {activeCase.assessment.severityScore}/10
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#060911] p-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      {activeCase.assignedAmbulanceId ? 'Assigned Ambulance' : 'Recommended Ambulance'}
                    </div>
                    <div className="mt-1 font-mono-tech text-sm font-bold text-cyan-300">
                      {activeCase.assignedAmbulanceId ||
                        activeCase.allocation.recommendedAmbulanceId}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#060911] p-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      Estimated Arrival Time
                    </div>
                    <div className="mt-1 font-mono-tech text-sm font-bold text-emerald-300">
                      {activeCase.allocation.estimatedArrivalMinutes} min
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-[#060911] p-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">
                      {activeCase.assignedHospitalId ? 'Assigned Hospital' : 'Recommended Hospital'}
                    </div>
                    <div className="mt-1 truncate text-xs font-semibold text-sky-200">
                      {hospitals.find(
                        (h) =>
                          h.id ===
                          (activeCase.assignedHospitalId ||
                            activeCase.hospitalMatch.recommendedHospitalId)
                      )?.shortName ?? activeCase.hospitalMatch.recommendedHospitalName}
                    </div>
                  </div>
                </div>

                {/* Reason for Selection */}
                <div className="mt-3 rounded-lg border border-slate-800/80 bg-[#10192B]/60 p-3 text-xs leading-relaxed text-slate-300">
                  <strong className="text-cyan-300">Reason for Selection: </strong>
                  {activeCase.allocation.explanation} {activeCase.hospitalMatch.explanation}
                  {activeCase.wasOverridden && (
                    <span className="mt-1 block text-amber-300">
                      Dispatcher Override Applied: {activeCase.overrideReason}
                    </span>
                  )}
                </div>

                {/* Override Assignment Drawer */}
                {showOverridePanel && activeCase.lifecycleStatus === 'Awaiting Approval' && (
                  <div className="animate-enter mt-4 rounded-lg border border-amber-500/35 bg-[#060911] p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                      Human Dispatcher Override Controls
                    </h4>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="override-amb"
                          className="mb-1 block text-xs text-slate-400"
                        >
                          Select Alternative Ambulance
                        </label>
                        <select
                          id="override-amb"
                          value={overrideAmbId}
                          onChange={(e) => setOverrideAmbId(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-[#0B111E] px-3 py-2 text-xs text-slate-100"
                        >
                          {ambulances
                            .filter((a) => a.status === 'Available')
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.id} · {a.unitTier} · GPS {a.gpsScore}%
                                {a.gpsScore < 70 ? ' [WARNING: UNRELIABLE GPS]' : ''}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="override-hosp"
                          className="mb-1 block text-xs text-slate-400"
                        >
                          Select Alternative Hospital
                        </label>
                        <select
                          id="override-hosp"
                          value={overrideHospId}
                          onChange={(e) => setOverrideHospId(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-[#0B111E] px-3 py-2 text-xs text-slate-100"
                        >
                          {hospitals.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.shortName} ({h.availableIcuBeds} ICU / {h.availableBeds} Beds)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Optional override rationale for audit log..."
                        className="flex-1 rounded-lg border border-slate-700 bg-[#0B111E] px-3 py-2 text-xs text-slate-100 placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          approveAssignment(
                            activeCase.id,
                            overrideAmbId,
                            overrideHospId,
                            overrideReason
                          );
                          setShowOverridePanel(false);
                        }}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                      >
                        Confirm Override &amp; Dispatch
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Agent 01 Card */}
              <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-cyan-500/15 px-2 py-0.5 font-mono-tech text-[11px] font-bold text-cyan-300">
                      AGENT 01
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Emergency Assessment Agent
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Status: {activeCase.assessment.status} ({activeCase.assessment.processingMs}ms)
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-800 bg-[#060911] p-3">
                    <div className="text-[11px] text-slate-500">Emergency Type</div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {activeCase.assessment.emergencyType}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-[#060911] p-3">
                    <div className="text-[11px] text-slate-500">Severity Assessment</div>
                    <div className="mt-1 text-xs font-semibold text-slate-200">
                      {activeCase.assessment.severityLabel}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-[#060911] p-3">
                    <div className="text-[11px] text-slate-500">Priority Level</div>
                    <div className="mt-1">
                      <PriorityBadge priority={activeCase.assessment.priority} />
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  <strong className="text-slate-100">Assessment Summary: </strong>
                  {activeCase.assessment.summary}
                </p>
              </div>

              {/* Agent 02 Card: Fleet Evaluation + GPS Anomaly Detection */}
              <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/15 px-2 py-0.5 font-mono-tech text-[11px] font-bold text-blue-300">
                      AGENT 02
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Smart Ambulance Allocation Agent
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                    <AmbulanceIcon className="h-3.5 w-3.5" />
                    Status: {activeCase.allocation.status} ({activeCase.allocation.processingMs}ms)
                  </span>
                </div>

                {activeCase.allocation.anomaliesDetected.length > 0 && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-500/35 bg-red-950/20 p-3 text-xs text-red-200">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <div>
                      <strong className="text-red-300">
                        GPS Anomaly Detection ({activeCase.allocation.anomaliesDetected.length}{' '}
                        Quarantined):{' '}
                      </strong>
                      {activeCase.allocation.anomaliesDetected.join(' · ')}
                    </div>
                  </div>
                )}

                {activeCase.allocation.naiveAvoidanceReason && (
                  <div className="mt-2.5 flex items-start gap-2.5 rounded-lg border border-amber-500/35 bg-amber-950/15 p-3 text-xs text-amber-100">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <strong className="text-amber-300">
                        Reliability &amp; Suitability Guardrail:{' '}
                      </strong>
                      {activeCase.allocation.naiveAvoidanceReason}
                    </div>
                  </div>
                )}

                {activeCase.allocation.candidates.length > 0 ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                          <th className="py-2 pr-2">Unit</th>
                          <th className="py-2 pr-2">Location</th>
                          <th className="py-2 pr-2">Dist</th>
                          <th className="py-2 pr-2">Status</th>
                          <th className="py-2 pr-2">GPS Trust</th>
                          <th className="py-2 pr-2">Suitability</th>
                          <th className="py-2 text-right">ETA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {activeCase.allocation.candidates.map((cand) => (
                          <tr
                            key={cand.ambulanceId}
                            className={
                              cand.isRecommended
                                ? 'bg-emerald-950/20'
                                : cand.gpsScore < 70
                                ? 'bg-red-950/10'
                                : ''
                            }
                          >
                            <td className="py-2.5 pr-2">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="font-mono-tech font-semibold text-slate-100">
                                  {cand.ambulanceId}
                                </span>
                                {cand.isRecommended && (
                                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                    PICKED
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{cand.unitTier}</div>
                            </td>
                            <td className="max-w-[140px] truncate py-2.5 pr-2 text-slate-300">
                              {cand.currentLocation}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pr-2 font-mono-tech text-slate-200">
                              {cand.distanceKm} km
                              {cand.rawReportedDistanceKm !== cand.distanceKm && (
                                <div className="text-[10px] text-red-300">
                                  Ping: {cand.rawReportedDistanceKm} km
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pr-2">
                              <AmbulanceStatusBadge
                                status={cand.availability}
                                gpsStatus={cand.gpsStatus}
                              />
                            </td>
                            <td className="whitespace-nowrap py-2.5 pr-2">
                              <GpsTrustMeter
                                score={cand.gpsScore}
                                gpsStatus={cand.gpsStatus}
                                compact
                              />
                            </td>
                            <td className="whitespace-nowrap py-2.5 pr-2">
                              <span
                                className={`font-medium ${
                                  cand.suitability === 'Optimal Match'
                                    ? 'text-cyan-300'
                                    : cand.suitability === 'Suitable'
                                    ? 'text-slate-200'
                                    : 'text-amber-300'
                                }`}
                              >
                                {cand.suitability}
                              </span>
                            </td>
                            <td className="whitespace-nowrap py-2.5 text-right font-mono-tech font-semibold text-slate-100">
                              {cand.excludedReason ? (
                                <span className="text-[11px] font-normal text-red-300">
                                  Excluded
                                </span>
                              ) : (
                                `${cand.etaMinutes} min`
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">
                    {activeCase.allocation.explanation}
                  </p>
                )}
              </div>

              {/* Agent 03 Card: Hospital Coordination */}
              <div className="rounded-xl border border-slate-800/80 bg-[#0B111E] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono-tech text-[11px] font-bold text-emerald-300">
                      AGENT 03
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Hospital Coordination Agent
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                    <Building2 className="h-3.5 w-3.5" />
                    Status: {activeCase.hospitalMatch.status} (
                    {activeCase.hospitalMatch.processingMs}ms)
                  </span>
                </div>

                {activeCase.hospitalMatch.candidates.length > 0 ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                          <th className="py-2 pr-3">Hospital Name</th>
                          <th className="py-2 pr-3">Distance</th>
                          <th className="py-2 pr-3">Available Beds</th>
                          <th className="py-2 pr-3">ICU Free</th>
                          <th className="py-2 pr-3">Specialised Facilities</th>
                          <th className="py-2">Capability</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {activeCase.hospitalMatch.candidates.slice(0, 4).map((h) => (
                          <tr
                            key={h.hospitalId}
                            className={h.isRecommended ? 'bg-cyan-950/20' : ''}
                          >
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                                <span>{h.hospitalName}</span>
                                {h.isRecommended && (
                                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                                    MATCHED
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 font-mono-tech text-slate-200">
                              {h.distanceKm} km
                            </td>
                            <td className="py-2.5 pr-3 font-mono-tech text-slate-200">
                              {h.availableBeds}
                            </td>
                            <td className="py-2.5 pr-3 font-mono-tech font-semibold text-emerald-300">
                              {h.icuAvailable} ICU
                            </td>
                            <td className="py-2.5 pr-3">
                              <div className="flex flex-wrap gap-1">
                                {h.specialisedFacilities.slice(0, 3).map((fac) => (
                                  <span
                                    key={fac}
                                    className="rounded border border-slate-700 bg-[#060911] px-1.5 py-0.5 text-[10px] text-slate-300"
                                  >
                                    {fac}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 text-slate-300">{h.capabilityTier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">
                    {activeCase.hospitalMatch.explanation}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0B111E] p-12 text-center">
              <AlertTriangle className="h-8 w-8 text-cyan-400" />
              <p className="mt-3 text-sm font-medium text-slate-200">
                Register an emergency on the left to execute AVERIQ&apos;s three AI agents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
