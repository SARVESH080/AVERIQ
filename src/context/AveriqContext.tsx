import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  INITIAL_ACTIVE_CASES,
  INITIAL_AGENT_COMMS,
  INITIAL_AGENT_METRICS,
  INITIAL_ALERTS,
  INITIAL_AMBULANCES,
  INITIAL_HISTORICAL_COUNT,
  INITIAL_HOSPITALS,
  INITIAL_LOGS,
  INITIAL_PRIORITY_COUNTS,
} from '../data/mockData';
import {
  resolveLocation,
  runAgent01Assessment,
  runAgent02Allocation,
  runAgent03HospitalMatch,
} from '../engine/averiqEngine';
import {
  ActivityLog,
  AgentCommunication,
  AgentMonitorMetric,
  Ambulance,
  EmergencyCase,
  EmergencyInput,
  Hospital,
  LogCategory,
  NavSection,
  PriorityLevel,
  SystemAlert,
} from '../types/averiq';

export type PipelinePhase = 'idle' | 'agent-01' | 'agent-02' | 'agent-03' | 'complete';

export interface ProcessingStepInfo {
  phase: PipelinePhase;
  activeEmergencyId: string | null;
  timeline: Array<{
    agent: string;
    detail: string;
    time: string;
    status: 'done' | 'active' | 'pending';
  }>;
}

interface AveriqContextValue {
  activeSection: NavSection;
  setActiveSection: (s: NavSection) => void;
  ambulances: Ambulance[];
  hospitals: Hospital[];
  cases: EmergencyCase[];
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  secondaryConflictCaseId: string | null;
  logs: ActivityLog[];
  agentMetrics: AgentMonitorMetric[];
  agentComms: AgentCommunication[];
  alerts: SystemAlert[];
  historicalCount: number;
  priorityCounts: Record<PriorityLevel, number>;
  nextEmergencyId: string;
  pipeline: ProcessingStepInfo;
  demoBannerMessage: string | null;
  clearBanner: () => void;
  processEmergency: (input: EmergencyInput) => Promise<void>;
  approveAssignment: (
    caseId: string,
    overrideAmbulanceId?: string,
    overrideHospitalId?: string,
    overrideReason?: string
  ) => void;
  simulateSecondEmergency: () => Promise<void>;
  simulateAmbulanceDelay: (targetCaseId?: string) => Promise<void>;
  approveReassignment: (caseId: string, overrideAmbulanceId?: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  restoreDelayedAmbulance: (ambulanceId: string) => void;
  toggleGpsAnomalySimulation: (ambulanceId: string) => void;
  resetDemoState: () => void;
}

const AveriqContext = createContext<AveriqContextValue | undefined>(undefined);

function nowTime(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const AveriqProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [ambulances, setAmbulances] = useState<Ambulance[]>(INITIAL_AMBULANCES);
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [cases, setCases] = useState<EmergencyCase[]>(INITIAL_ACTIVE_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [secondaryConflictCaseId, setSecondaryConflictCaseId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [agentMetrics, setAgentMetrics] = useState<AgentMonitorMetric[]>(INITIAL_AGENT_METRICS);
  const [agentComms, setAgentComms] = useState<AgentCommunication[]>(INITIAL_AGENT_COMMS);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [historicalCount] = useState<number>(INITIAL_HISTORICAL_COUNT);
  const [priorityCounts, setPriorityCounts] = useState<Record<PriorityLevel, number>>(
    INITIAL_PRIORITY_COUNTS
  );
  const [caseCounter, setCaseCounter] = useState<number>(148);
  const [demoBannerMessage, setDemoBannerMessage] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<ProcessingStepInfo>({
    phase: 'idle',
    activeEmergencyId: null,
    timeline: [],
  });

  // Refs to ensure sequential async steps always read latest fleet/hospital state
  const fleetRef = useRef(ambulances);
  fleetRef.current = ambulances;
  const hospitalRef = useRef(hospitals);
  hospitalRef.current = hospitals;
  const casesRef = useRef(cases);
  casesRef.current = cases;

  const nextEmergencyId = useMemo(
    () => `EMG-2026-0${caseCounter}`,
    [caseCounter]
  );

  const appendLog = useCallback(
    (
      category: LogCategory,
      actor: string,
      title: string,
      details: string,
      severity: ActivityLog['severity'],
      emergencyId?: string
    ) => {
      const entry: ActivityLog = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        timestamp: nowTime(),
        category,
        actor,
        title,
        details,
        severity,
        emergencyId,
      };
      setLogs((prev) => [entry, ...prev]);
    },
    []
  );

  const appendComm = useCallback(
    (
      from: AgentCommunication['from'],
      to: AgentCommunication['to'],
      emergencyId: string,
      tag: AgentCommunication['tag'],
      message: string
    ) => {
      const entry: AgentCommunication = {
        id: `COM-${Date.now()}-${Math.floor(Math.random() * 90 + 10)}`,
        timestamp: nowTime(),
        from,
        to,
        emergencyId,
        tag,
        message,
      };
      setAgentComms((prev) => [entry, ...prev]);
    },
    []
  );

  const appendAlert = useCallback(
    (alert: Omit<SystemAlert, 'id' | 'timestamp' | 'acknowledged'>) => {
      setAlerts((prev) => [
        {
          ...alert,
          id: `ALT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
          timestamp: nowTime(),
          acknowledged: false,
        },
        ...prev,
      ]);
    },
    []
  );

  const updateAgentStatus = useCallback(
    (
      agentId: 'agent-01' | 'agent-02' | 'agent-03',
      status: AgentMonitorMetric['status'],
      decision?: string,
      incrementTask = false
    ) => {
      setAgentMetrics((prev) =>
        prev.map((m) =>
          m.id === agentId
            ? {
                ...m,
                status,
                tasksProcessed: incrementTask ? m.tasksProcessed + 1 : m.tasksProcessed,
                latestDecision: decision ?? m.latestDecision,
                latestTimestamp: nowTime(),
              }
            : m
        )
      );
    },
    []
  );

  const processEmergency = useCallback(
    async (input: EmergencyInput) => {
      const resolved = resolveLocation(input.location);
      const emgId = input.id.trim() || nextEmergencyId;

      setCaseCounter((c) => c + 1);
      setSecondaryConflictCaseId(null);

      appendLog(
        'Emergency Registration',
        'Dispatcher Console #01',
        `Registered ${emgId} (${input.emergencyType} · ${resolved.zone})`,
        `${input.patientCount} patient(s) at ${resolved.location}. Symptoms: ${input.symptoms}`,
        'info',
        emgId
      );

      // Step 1: Agent 01
      setPipeline({
        phase: 'agent-01',
        activeEmergencyId: emgId,
        timeline: [
          {
            agent: 'Agent 01 — Emergency Assessment',
            detail: 'Evaluating symptom severity, patient count & required clinical tier...',
            time: nowTime(),
            status: 'active',
          },
          {
            agent: 'Agent 02 — Smart Ambulance Allocation',
            detail: 'Awaiting triage classification & required life-support tier',
            time: '—',
            status: 'pending',
          },
          {
            agent: 'Agent 03 — Hospital Coordination',
            detail: 'Awaiting scene allocation & clinical speciality requirements',
            time: '—',
            status: 'pending',
          },
        ],
      });
      updateAgentStatus('agent-01', 'Processing');
      await sleep(650);

      const assessment = runAgent01Assessment(input);
      updateAgentStatus(
        'agent-01',
        'Standby',
        `${emgId} classified ${assessment.priority.toUpperCase()} (${assessment.severityScore}/10) — ${assessment.requiredTier[0]} needed.`,
        true
      );
      appendLog(
        'Agent Assessment',
        'Agent 01 · Emergency Assessment',
        `${emgId} Assessed ${assessment.priority} Severity (${assessment.severityScore}/10)`,
        assessment.summary,
        assessment.priority === 'Critical' ? 'critical' : 'warning',
        emgId
      );
      appendComm(
        'Agent 01',
        'Agent 02',
        emgId,
        'TRIAGE',
        `Priority ${assessment.priority.toUpperCase()} (${input.emergencyType}). Dispatch ${assessment.requiredTier.join(
          ' or '
        )} with GPS Trust ≥ 70%.`
      );

      // Step 2: Agent 02
      setPipeline((prev) => ({
        ...prev,
        phase: 'agent-02',
        timeline: [
          {
            ...prev.timeline[0],
            detail: `${assessment.priority} (${assessment.severityScore}/10) · Tier: ${assessment.requiredTier[0]}`,
            status: 'done',
          },
          {
            agent: 'Agent 02 — Smart Ambulance Allocation',
            detail: 'Auditing GPS telemetry trust scores, suitability & traffic ETAs...',
            time: nowTime(),
            status: 'active',
          },
          prev.timeline[2],
        ],
      }));
      updateAgentStatus('agent-02', 'Processing');
      await sleep(750);

      const pendingExcludedIds = casesRef.current
        .filter((c) => c.lifecycleStatus === 'Awaiting Approval' && c.id !== emgId)
        .map((c) => c.allocation.recommendedAmbulanceId);

      const allocation = runAgent02Allocation(
        resolved.coords,
        input.emergencyType,
        assessment.priority,
        fleetRef.current,
        pendingExcludedIds
      );

      updateAgentStatus(
        'agent-02',
        'Active Verification',
        `Recommended ${allocation.recommendedAmbulanceId} (ETA ${allocation.estimatedArrivalMinutes}m) for ${emgId}; blocked ${allocation.anomaliesDetected.length} faulty GPS feed(s).`,
        true
      );

      if (allocation.naiveNearestId) {
        appendLog(
          'GPS Anomaly Alert',
          'Agent 02 · Smart Allocation',
          `Bypassed ${allocation.naiveNearestId} during ${emgId} evaluation`,
          allocation.naiveAvoidanceReason || 'Reliability verification prevented suboptimal dispatch.',
          'warning',
          emgId
        );
      }

      appendLog(
        'Ambulance Recommendation',
        'Agent 02 · Smart Allocation',
        `Recommended ${allocation.recommendedAmbulanceId} (${allocation.estimatedArrivalMinutes}m ETA)`,
        allocation.explanation,
        'info',
        emgId
      );

      appendComm(
        'Agent 02',
        'Agent 03',
        emgId,
        'ALLOCATION',
        `Selected ${allocation.recommendedAmbulanceId} (${allocation.estimatedArrivalMinutes}m ETA). ${
          allocation.anomaliesDetected.length
            ? `Isolated ${allocation.anomaliesDetected.length} GPS anomaly unit(s).`
            : ''
        } Requesting ${input.emergencyType} receiving hospital.`
      );

      // Step 3: Agent 03
      setPipeline((prev) => ({
        ...prev,
        phase: 'agent-03',
        timeline: [
          prev.timeline[0],
          {
            ...prev.timeline[1],
            detail: `Selected ${allocation.recommendedAmbulanceId} (ETA ${allocation.estimatedArrivalMinutes} min)`,
            status: 'done',
          },
          {
            agent: 'Agent 03 — Hospital Coordination',
            detail: 'Matching ICU beds, trauma/cardiac facilities & transport corridor...',
            time: nowTime(),
            status: 'active',
          },
        ],
      }));
      updateAgentStatus('agent-03', 'Processing');
      await sleep(650);

      const hospitalMatch = runAgent03HospitalMatch(
        resolved.coords,
        input.emergencyType,
        assessment.priority,
        input.patientCount,
        hospitalRef.current
      );

      updateAgentStatus(
        'agent-03',
        'Standby',
        `Matched ${hospitalMatch.recommendedHospitalName} (${hospitalMatch.transportMinutes}m transport) for ${emgId}.`,
        true
      );

      appendLog(
        'Hospital Recommendation',
        'Agent 03 · Hospital Coordination',
        `Recommended ${hospitalMatch.recommendedHospitalName}`,
        hospitalMatch.explanation,
        'info',
        emgId
      );

      appendComm(
        'Agent 03',
        'Dispatcher',
        emgId,
        'HOSPITAL',
        `Hospital match ready: ${hospitalMatch.recommendedHospitalName} (${hospitalMatch.hospitalDistanceKm} km). Combined recommendation awaiting dispatcher sign-off.`
      );

      const newCase: EmergencyCase = {
        id: emgId,
        location: resolved.location,
        zone: resolved.zone,
        coords: resolved.coords,
        emergencyType: input.emergencyType,
        symptoms: input.symptoms,
        patientCount: input.patientCount,
        additionalInfo: input.additionalInfo,
        registeredAt: nowTime(),
        lifecycleStatus: 'Awaiting Approval',
        priority: assessment.priority,
        assessment,
        allocation,
        hospitalMatch,
      };

      setCases((prev) => [newCase, ...prev]);
      setSelectedCaseId(emgId);
      setPriorityCounts((prev) => ({
        ...prev,
        [assessment.priority]: prev[assessment.priority] + 1,
      }));

      setPipeline((prev) => ({
        ...prev,
        phase: 'complete',
        timeline: [
          prev.timeline[0],
          prev.timeline[1],
          {
            ...prev.timeline[2],
            detail: `Matched ${hospitalMatch.recommendedHospitalName}`,
            status: 'done',
          },
        ],
      }));

      setDemoBannerMessage(
        `AI Verification Complete for ${emgId}: ${allocation.recommendedAmbulanceId} + ${hospitalMatch.recommendedHospitalName} ready for dispatcher approval.`
      );
    },
    [appendComm, appendLog, nextEmergencyId, updateAgentStatus]
  );

  const approveAssignment = useCallback(
    (
      caseId: string,
      overrideAmbulanceId?: string,
      overrideHospitalId?: string,
      overrideReason?: string
    ) => {
      const target = casesRef.current.find((c) => c.id === caseId);
      if (!target) return;

      const finalAmbId = overrideAmbulanceId || target.allocation.recommendedAmbulanceId;
      const finalHospId = overrideHospitalId || target.hospitalMatch.recommendedHospitalId;
      const isOverride =
        finalAmbId !== target.allocation.recommendedAmbulanceId ||
        finalHospId !== target.hospitalMatch.recommendedHospitalId;

      const chosenAmb = fleetRef.current.find((a) => a.id === finalAmbId);
      const chosenHosp = hospitalRef.current.find((h) => h.id === finalHospId);
      const chosenCandidate = target.allocation.candidates.find(
        (c) => c.ambulanceId === finalAmbId
      );
      const eta = chosenCandidate?.etaMinutes ?? target.allocation.estimatedArrivalMinutes;

      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === finalAmbId
            ? {
                ...a,
                status: 'Busy',
                assignedEmergencyId: caseId,
                destinationHospitalId: finalHospId,
                etaMinutes: eta,
                delayReason: undefined,
              }
            : a
        )
      );

      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id !== finalHospId) return h;
          const icuReserve =
            target.priority === 'Critical' || target.priority === 'High' ? 1 : 0;
          return {
            ...h,
            availableBeds: Math.max(0, h.availableBeds - target.patientCount),
            availableIcuBeds: Math.max(0, h.availableIcuBeds - icuReserve),
            inboundAmbulanceIds: h.inboundAmbulanceIds.includes(finalAmbId)
              ? h.inboundAmbulanceIds
              : [...h.inboundAmbulanceIds, finalAmbId],
          };
        })
      );

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                lifecycleStatus: 'Active Dispatch',
                assignedAmbulanceId: finalAmbId,
                assignedHospitalId: finalHospId,
                approvedBy: 'Dispatcher Console #01',
                wasOverridden: isOverride,
                overrideReason: isOverride
                  ? overrideReason || 'Manual dispatcher tactical override'
                  : undefined,
              }
            : c
        )
      );

      appendLog(
        'Dispatcher Approval',
        'Dispatcher Console #01',
        `${isOverride ? 'Overridden &' : 'Approved'} ${caseId} → ${finalAmbId} & ${
          chosenHosp?.shortName ?? finalHospId
        }`,
        isOverride
          ? `Dispatcher overrode AI selection (${overrideReason || 'manual selection'}). Assigned ${finalAmbId} (${
              chosenAmb?.unitTier ?? ''
            }) and routed to ${chosenHosp?.name ?? finalHospId}.`
          : `Confirmed AI recommendation: ${finalAmbId} dispatched (ETA ${eta} min) to ${
              chosenHosp?.name ?? finalHospId
            }.`,
        isOverride ? 'warning' : 'success',
        caseId
      );

      appendComm(
        'Dispatcher',
        'AVERIQ Core',
        caseId,
        'APPROVAL',
        `${isOverride ? 'OVERRIDE APPROVED' : 'APPROVED'}: Unit ${finalAmbId} locked Busy → ${
          chosenHosp?.shortName ?? finalHospId
        }.`
      );

      setDemoBannerMessage(
        `${caseId} dispatched: ${finalAmbId} is now Busy (ETA ${eta}m) en route to ${
          chosenHosp?.shortName ?? finalHospId
        }.`
      );
    },
    [appendComm, appendLog]
  );

  const simulateSecondEmergency = useCallback(async () => {
    // Find primary case (either currently selected awaiting/active, or auto-seed primary case A first)
    let currentCases = casesRef.current;
    let primaryCase =
      currentCases.find((c) => c.id === selectedCaseId) ||
      currentCases.find((c) => c.lifecycleStatus === 'Awaiting Approval') ||
      currentCases.find(
        (c) => c.id !== 'EMG-2026-0145' && c.id !== 'EMG-2026-0144'
      );

    let currentCounter = caseCounter;

    // If user jumped straight to "Simulate Second Emergency" without registering Emergency 1, auto-create & assign Emergency 1 first!
    if (!primaryCase) {
      const emgAId = `EMG-2026-0${currentCounter}`;
      currentCounter += 1;
      const locA = resolveLocation('Guindy Industrial Estate — Kathipara Junction');
      const inputA: EmergencyInput = {
        id: emgAId,
        location: locA.location,
        emergencyType: 'Cardiac',
        symptoms:
          '61-year-old male with acute chest pain, diaphoresis, radiating jaw pain, SpO2 88%.',
        patientCount: 1,
        additionalInfo: 'Auto-seeded primary critical incident for multi-emergency comparison.',
      };
      const assessA = runAgent01Assessment(inputA);
      const allocA = runAgent02Allocation(
        locA.coords,
        'Cardiac',
        assessA.priority,
        fleetRef.current
      );
      const hospA = runAgent03HospitalMatch(
        locA.coords,
        'Cardiac',
        assessA.priority,
        1,
        hospitalRef.current
      );

      const seededPrimary: EmergencyCase = {
        ...inputA,
        zone: locA.zone,
        coords: locA.coords,
        registeredAt: nowTime(),
        lifecycleStatus: 'Active Dispatch',
        priority: assessA.priority,
        assessment: assessA,
        allocation: allocA,
        hospitalMatch: hospA,
        assignedAmbulanceId: allocA.recommendedAmbulanceId,
        assignedHospitalId: hospA.recommendedHospitalId,
        approvedBy: 'Dispatcher Console #01',
      };

      // Update fleet & hospitals immediately in state + ref
      const nextFleet = fleetRef.current.map((a) =>
        a.id === allocA.recommendedAmbulanceId
          ? {
              ...a,
              status: 'Busy' as const,
              assignedEmergencyId: emgAId,
              destinationHospitalId: hospA.recommendedHospitalId,
              etaMinutes: allocA.estimatedArrivalMinutes,
            }
          : a
      );
      fleetRef.current = nextFleet;
      setAmbulances(nextFleet);

      const nextHosp = hospitalRef.current.map((h) =>
        h.id === hospA.recommendedHospitalId
          ? {
              ...h,
              availableBeds: Math.max(0, h.availableBeds - 1),
              availableIcuBeds: Math.max(0, h.availableIcuBeds - 1),
              inboundAmbulanceIds: [...h.inboundAmbulanceIds, allocA.recommendedAmbulanceId],
            }
          : h
      );
      hospitalRef.current = nextHosp;
      setHospitals(nextHosp);

      currentCases = [seededPrimary, ...currentCases];
      casesRef.current = currentCases;
      setCases(currentCases);
      setSelectedCaseId(emgAId);
      setPriorityCounts((prev) => ({ ...prev, [assessA.priority]: prev[assessA.priority] + 1 }));
      primaryCase = seededPrimary;

      appendLog(
        'Dispatcher Approval',
        'Dispatcher Console #01',
        `Primary Active Incident ${emgAId} → ${allocA.recommendedAmbulanceId}`,
        `Primary cardiac dispatch locked ${allocA.recommendedAmbulanceId} at ${locA.location}.`,
        'success',
        emgAId
      );
    }

    const lockedUnitId =
      primaryCase.assignedAmbulanceId || primaryCase.allocation.recommendedAmbulanceId;
    const primaryHospitalId =
      primaryCase.assignedHospitalId || primaryCase.hospitalMatch.recommendedHospitalId;

    // Choose a competing second incident near T. Nagar / Saidapet / Adyar that naturally wants the same optimal unit!
    const emgBId = `EMG-2026-0${currentCounter}`;
    setCaseCounter(currentCounter + 1);

    const competingLocation =
      primaryCase.location.toLowerCase().includes('t. nagar')
        ? 'Guindy Industrial Estate — Kathipara Junction'
        : 'T. Nagar — Panagal Park Arterial Rd';
    const locB = resolveLocation(competingLocation);

    const inputB: EmergencyInput = {
      id: emgBId,
      location: locB.location,
      emergencyType: 'Cardiac',
      symptoms:
        'Simultaneous acute coronary emergency: 54-year-old female with severe dyspnoea, tachycardia, and chest pressure.',
      patientCount: 1,
      additionalInfo: `Triggered concurrently while ${primaryCase.id} occupies ${lockedUnitId}.`,
    };

    appendLog(
      'Emergency Registration',
      'Multi-Emergency Simulator',
      `Concurrent Emergency ${emgBId} Registered (${locB.zone})`,
      `Simultaneous cardiac incident triggered near ${locB.location} while ${primaryCase.id} is active.`,
      'warning',
      emgBId
    );

    setPipeline({
      phase: 'agent-02',
      activeEmergencyId: emgBId,
      timeline: [
        {
          agent: 'Agent 01 — Emergency Assessment',
          detail: `Concurrent ${emgBId} assessed CRITICAL — ALS Cardiac / MICU needed`,
          time: nowTime(),
          status: 'done',
        },
        {
          agent: 'Agent 02 — Multi-Emergency Optimisation',
          detail: `Resolving contention: ${lockedUnitId} locked by ${primaryCase.id}...`,
          time: nowTime(),
          status: 'active',
        },
        {
          agent: 'Agent 03 — Hospital Load Balancing',
          detail: 'Evaluating alternate ICU capacity across hospital network...',
          time: '—',
          status: 'pending',
        },
      ],
    });
    updateAgentStatus('agent-02', 'Active Verification');
    await sleep(650);

    const assessB = runAgent01Assessment(inputB);

    // Check what naive allocation without locking primaryCase's unit would choose (to highlight the conflict explicitly)
    const fleetWithoutLock = fleetRef.current.map((a) =>
      a.id === lockedUnitId ? { ...a, status: 'Available' as const } : a
    );
    const unconstrainedAlloc = runAgent02Allocation(
      locB.coords,
      inputB.emergencyType,
      assessB.priority,
      fleetWithoutLock,
      []
    );
    const conflictingUnitId =
      unconstrainedAlloc.recommendedAmbulanceId === lockedUnitId
        ? lockedUnitId
        : lockedUnitId;

    // Now run constrained conflict-free allocation locking primaryCase's unit
    const constrainedAlloc = runAgent02Allocation(
      locB.coords,
      inputB.emergencyType,
      assessB.priority,
      fleetRef.current,
      [lockedUnitId]
    );

    const hospB = runAgent03HospitalMatch(
      locB.coords,
      inputB.emergencyType,
      assessB.priority,
      1,
      hospitalRef.current,
      primaryHospitalId
    );

    const conflictExplanation =
      `Competing demand detected: Both ${primaryCase.id} and ${emgBId} require an ALS Cardiac/MICU unit in the Central-South corridor. ` +
      `${conflictingUnitId} is already assigned/reserved for ${primaryCase.id}. ` +
      `AVERIQ Multi-Emergency Optimiser locked ${conflictingUnitId} and allocated conflict-free alternative ${constrainedAlloc.recommendedAmbulanceId} ` +
      `(GPS Trust ${constrainedAlloc.candidates.find((c) => c.ambulanceId === constrainedAlloc.recommendedAmbulanceId)?.gpsScore ?? 96}%, ETA ${constrainedAlloc.estimatedArrivalMinutes} min) ` +
      `while load-balancing destination routing to ${hospB.recommendedHospitalName}.`;

    const caseB: EmergencyCase = {
      ...inputB,
      zone: locB.zone,
      coords: locB.coords,
      registeredAt: nowTime(),
      lifecycleStatus: 'Awaiting Approval',
      priority: assessB.priority,
      assessment: assessB,
      allocation: {
        ...constrainedAlloc,
        explanation: conflictExplanation,
      },
      hospitalMatch: hospB,
      isMultiEmergencyConflict: true,
      conflictingUnitId,
      conflictExplanation,
    };

    setCases((prev) => [caseB, ...prev]);
    setSelectedCaseId(emgBId);
    setSecondaryConflictCaseId(emgBId);
    setPriorityCounts((prev) => ({ ...prev, [assessB.priority]: prev[assessB.priority] + 1 }));

    updateAgentStatus('agent-01', 'Standby', `${emgBId} triaged ${assessB.priority}.`, true);
    updateAgentStatus(
      'agent-02',
      'Standby',
      `Resolved multi-emergency conflict: locked ${conflictingUnitId} for ${primaryCase.id}, allocated ${constrainedAlloc.recommendedAmbulanceId} to ${emgBId}.`,
      true
    );
    updateAgentStatus(
      'agent-03',
      'Standby',
      `Load-balanced ${emgBId} to ${hospB.recommendedHospitalName}.`,
      true
    );

    appendLog(
      'Ambulance Recommendation',
      'Agent 02 · Multi-Emergency Engine',
      `Conflict-Free Allocation for ${emgBId}: ${constrainedAlloc.recommendedAmbulanceId}`,
      conflictExplanation,
      'warning',
      emgBId
    );

    appendComm(
      'Agent 02',
      'Dispatcher',
      emgBId,
      'CONFLICT',
      `Multi-Emergency Conflict Resolved: ${conflictingUnitId} stays locked to ${primaryCase.id}. Recommending conflict-free unit ${constrainedAlloc.recommendedAmbulanceId} (ETA ${constrainedAlloc.estimatedArrivalMinutes}m) → ${hospB.recommendedHospitalName}.`
    );

    appendAlert({
      type: 'Multi-Emergency Contention',
      severity: 'warning',
      title: `Multi-Emergency Contention Resolved (${primaryCase.id} vs ${emgBId})`,
      description: conflictExplanation,
      unitOrEntityId: conflictingUnitId,
    });

    setPipeline({
      phase: 'complete',
      activeEmergencyId: emgBId,
      timeline: [
        {
          agent: 'Agent 01 — Emergency Assessment',
          detail: `${emgBId} triaged ${assessB.priority} (${assessB.severityScore}/10)`,
          time: nowTime(),
          status: 'done',
        },
        {
          agent: 'Agent 02 — Multi-Emergency Optimisation',
          detail: `Locked ${conflictingUnitId} · Allocated conflict-free ${constrainedAlloc.recommendedAmbulanceId}`,
          time: nowTime(),
          status: 'done',
        },
        {
          agent: 'Agent 03 — Hospital Load Balancing',
          detail: `Routed to ${hospB.recommendedHospitalName}`,
          time: nowTime(),
          status: 'done',
        },
      ],
    });

    setDemoBannerMessage(
      `Second Emergency ${emgBId} detected competing demand on ${conflictingUnitId}. Conflict-free unit ${constrainedAlloc.recommendedAmbulanceId} recommended for approval.`
    );
  }, [appendAlert, appendComm, appendLog, caseCounter, selectedCaseId, updateAgentStatus]);

  const simulateAmbulanceDelay = useCallback(
    async (targetCaseId?: string) => {
      const currentCases = casesRef.current;
      const target =
        (targetCaseId && currentCases.find((c) => c.id === targetCaseId)) ||
        currentCases.find(
          (c) =>
            c.lifecycleStatus === 'Active Dispatch' &&
            c.id !== 'EMG-2026-0144' &&
            c.id !== 'EMG-2026-0145'
        ) ||
        currentCases.find((c) => c.lifecycleStatus === 'Active Dispatch');

      if (!target || !target.assignedAmbulanceId) {
        setDemoBannerMessage(
          'No active dispatched ambulance available to delay. Approve an assignment first.'
        );
        return;
      }

      const delayedUnitId = target.assignedAmbulanceId;
      const delayedUnit = fleetRef.current.find((a) => a.id === delayedUnitId);
      const oldEta = delayedUnit?.etaMinutes ?? target.allocation.estimatedArrivalMinutes;
      const delayReason =
        'Severe arterial congestion & hydraulic brake pressure fault reported — speed dropped to 4 km/h (ETA degraded to 27 min).';

      // Mark ambulance Delayed in fleet
      const updatedFleet = fleetRef.current.map((a) =>
        a.id === delayedUnitId
          ? {
              ...a,
              status: 'Delayed' as const,
              delayReason,
              etaMinutes: 27,
            }
          : a
      );
      fleetRef.current = updatedFleet;
      setAmbulances(updatedFleet);

      updateAgentStatus('agent-02', 'Reassigning');
      appendAlert({
        type: 'Ambulance Delay',
        severity: 'critical',
        title: `Assigned Unit ${delayedUnitId} Delayed on ${target.id}`,
        description: `${delayReason} Agent 02 automatically triggered fallback allocation.`,
        unitOrEntityId: delayedUnitId,
      });

      appendComm(
        'AVERIQ Core',
        'Agent 02',
        target.id,
        'REASSIGN',
        `ALERT: Assigned unit ${delayedUnitId} reported breakdown/gridlock (ETA ${oldEta}m → 27m). Triggering automatic fallback allocation.`
      );

      setPipeline({
        phase: 'agent-02',
        activeEmergencyId: target.id,
        timeline: [
          {
            agent: 'Telemetry Disruption Detected',
            detail: `${delayedUnitId} marked Delayed (${oldEta}m → 27m)`,
            time: nowTime(),
            status: 'done',
          },
          {
            agent: 'Agent 02 — Automatic Reassignment',
            detail: 'Scanning verified available fleet for fastest suitable fallback unit...',
            time: nowTime(),
            status: 'active',
          },
          {
            agent: 'Dispatcher Verification Gate',
            detail: 'Human approval required prior to unit switch',
            time: '—',
            status: 'pending',
          },
        ],
      });

      await sleep(700);

      // Re-run Agent 02 excluding delayed unit and any pending units
      const fallbackAlloc = runAgent02Allocation(
        target.coords,
        target.emergencyType,
        target.priority,
        updatedFleet,
        [delayedUnitId]
      );

      const newAmbId = fallbackAlloc.recommendedAmbulanceId;
      const newEta = fallbackAlloc.estimatedArrivalMinutes;
      const newCandidate = fallbackAlloc.candidates.find((c) => c.ambulanceId === newAmbId);

      const reasonForReassignment =
        `Original unit ${delayedUnitId} experienced a sudden corridor delay (${delayReason}). ` +
        `Agent 02 re-evaluated the active fleet, skipped GPS-anomalous units, and identified ${newAmbId} (${newCandidate?.unitTier}, ` +
        `GPS Trust ${newCandidate?.gpsScore}%, ${newCandidate?.distanceKm} km away) with a revised ETA of ${newEta} min (saving ${
          27 - newEta
        } min over delayed unit).`;

      setCases((prev) =>
        prev.map((c) =>
          c.id === target.id
            ? {
                ...c,
                lifecycleStatus: 'Reassignment Pending',
                reassignmentProposal: {
                  delayedAmbulanceId: delayedUnitId,
                  delayReason,
                  oldEtaMinutes: oldEta,
                  proposedAmbulanceId: newAmbId,
                  newEtaMinutes: newEta,
                  reasonForReassignment,
                  candidates: fallbackAlloc.candidates,
                  triggeredAt: nowTime(),
                },
              }
            : c
        )
      );

      setSelectedCaseId(target.id);

      updateAgentStatus(
        'agent-02',
        'Standby',
        `Proposed fallback ${newAmbId} (${newEta}m ETA) replacing delayed ${delayedUnitId} on ${target.id}.`,
        true
      );

      appendLog(
        'Reassignment',
        'Agent 02 · Automatic Fallback',
        `Proposed Reassignment for ${target.id}: ${delayedUnitId} → ${newAmbId}`,
        reasonForReassignment,
        'critical',
        target.id
      );

      appendComm(
        'Agent 02',
        'Dispatcher',
        target.id,
        'REASSIGN',
        `Fallback ready: Replace delayed ${delayedUnitId} with ${newAmbId} (GPS Trust ${newCandidate?.gpsScore}%, ETA ${newEta}m). Awaiting dispatcher approval.`
      );

      setPipeline({
        phase: 'complete',
        activeEmergencyId: target.id,
        timeline: [
          {
            agent: 'Telemetry Disruption Detected',
            detail: `${delayedUnitId} marked Delayed (ETA spiked to 27m)`,
            time: nowTime(),
            status: 'done',
          },
          {
            agent: 'Agent 02 — Automatic Reassignment',
            detail: `Recommended fallback unit ${newAmbId} (ETA ${newEta}m)`,
            time: nowTime(),
            status: 'done',
          },
          {
            agent: 'Dispatcher Verification Gate',
            detail: 'Ready for dispatcher approval',
            time: nowTime(),
            status: 'active',
          },
        ],
      });

      setDemoBannerMessage(
        `Delay Alert on ${delayedUnitId}! Agent 02 recommends reassigning ${target.id} to ${newAmbId} (ETA ${newEta}m). Dispatcher approval required.`
      );
    },
    [appendAlert, appendComm, appendLog, updateAgentStatus]
  );

  const approveReassignment = useCallback(
    (caseId: string, overrideAmbulanceId?: string) => {
      const target = casesRef.current.find((c) => c.id === caseId);
      if (!target || !target.reassignmentProposal) return;

      const { delayedAmbulanceId, proposedAmbulanceId, newEtaMinutes } =
        target.reassignmentProposal;
      const finalNewAmbId = overrideAmbulanceId || proposedAmbulanceId;
      const chosenCandidate = target.reassignmentProposal.candidates.find(
        (c) => c.ambulanceId === finalNewAmbId
      );
      const finalEta = chosenCandidate?.etaMinutes ?? newEtaMinutes;
      const hospId = target.assignedHospitalId || target.hospitalMatch.recommendedHospitalId;

      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id === delayedAmbulanceId) {
            return {
              ...a,
              status: 'Delayed',
              assignedEmergencyId: undefined,
              destinationHospitalId: undefined,
              etaMinutes: undefined,
            };
          }
          if (a.id === finalNewAmbId) {
            return {
              ...a,
              status: 'Busy',
              assignedEmergencyId: caseId,
              destinationHospitalId: hospId,
              etaMinutes: finalEta,
            };
          }
          return a;
        })
      );

      setHospitals((prev) =>
        prev.map((h) =>
          h.id === hospId
            ? {
                ...h,
                inboundAmbulanceIds: [
                  ...h.inboundAmbulanceIds.filter((id) => id !== delayedAmbulanceId),
                  finalNewAmbId,
                ],
              }
            : h
        )
      );

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                lifecycleStatus: 'Active Dispatch',
                assignedAmbulanceId: finalNewAmbId,
                reassignmentProposal: undefined,
              }
            : c
        )
      );

      appendLog(
        'Reassignment',
        'Dispatcher Console #01',
        `Confirmed Reassignment on ${caseId}: ${delayedAmbulanceId} → ${finalNewAmbId}`,
        `Dispatcher approved replacement ambulance ${finalNewAmbId} (ETA ${finalEta} min). Delayed unit ${delayedAmbulanceId} taken off incident.`,
        'success',
        caseId
      );

      appendComm(
        'Dispatcher',
        'AVERIQ Core',
        caseId,
        'REASSIGN',
        `Reassignment APPROVED: ${finalNewAmbId} en route to ${caseId} (ETA ${finalEta}m). ${delayedAmbulanceId} stood down.`
      );

      setDemoBannerMessage(
        `Reassignment Confirmed: ${finalNewAmbId} is now actively responding to ${caseId} (ETA ${finalEta}m).`
      );
    },
    [appendComm, appendLog]
  );

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const restoreDelayedAmbulance = useCallback(
    (ambulanceId: string) => {
      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === ambulanceId
            ? {
                ...a,
                status: 'Available',
                delayReason: undefined,
                etaMinutes: undefined,
                assignedEmergencyId: undefined,
                destinationHospitalId: undefined,
              }
            : a
        )
      );
      appendLog(
        'Reassignment',
        'Fleet Operations',
        `Unit ${ambulanceId} Cleared & Restored to Available`,
        'Mechanical/traffic clearance verified; unit returned to active standby pool.',
        'info'
      );
    },
    [appendLog]
  );

  const toggleGpsAnomalySimulation = useCallback(
    (ambulanceId: string) => {
      const unit = fleetRef.current.find((a) => a.id === ambulanceId);
      if (!unit) return;
      const currentlyHealthy = unit.gpsScore >= 70;

      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id !== ambulanceId) return a;
          if (currentlyHealthy) {
            return {
              ...a,
              gpsScore: 38,
              gpsStatus: 'Coordinate Drift',
              lastPingSeconds: 940,
              reportedCoords: { x: a.coords.x + 85, y: a.coords.y - 65 },
              gpsAnomalyNote:
                'Simulated telemetry spoofing/drift (3.6 km offset). Unit quarantined from auto-allocation.',
            };
          }
          return {
            ...a,
            gpsScore: 96,
            gpsStatus: 'Verified',
            lastPingSeconds: 2,
            reportedCoords: { ...a.coords },
            gpsAnomalyNote: undefined,
          };
        })
      );

      appendLog(
        'GPS Anomaly Alert',
        'AVERIQ Telemetry Guard',
        currentlyHealthy
          ? `Simulated GPS Drift on ${ambulanceId} (38% Trust)`
          : `GPS Telemetry Restored on ${ambulanceId} (96% Trust)`,
        currentlyHealthy
          ? 'Diagnostic drift test active: Agent 02 will exclude this unit from automated assignment.'
          : 'GNSS lock re-established and verified across dual channels.',
        currentlyHealthy ? 'critical' : 'success'
      );

      if (currentlyHealthy) {
        appendAlert({
          type: 'GPS Anomaly',
          severity: 'critical',
          title: `Simulated GPS Drift Triggered — ${ambulanceId} (38% Trust)`,
          description:
            'Diagnostic fault injection: telemetry drift detected (3.6 km). Unit excluded from dispatch recommendations.',
          unitOrEntityId: ambulanceId,
        });
      }
    },
    [appendAlert, appendLog]
  );

  const resetDemoState = useCallback(() => {
    setAmbulances(INITIAL_AMBULANCES);
    setHospitals(INITIAL_HOSPITALS);
    setCases(INITIAL_ACTIVE_CASES);
    setSelectedCaseId(null);
    setSecondaryConflictCaseId(null);
    setLogs(INITIAL_LOGS);
    setAgentMetrics(INITIAL_AGENT_METRICS);
    setAgentComms(INITIAL_AGENT_COMMS);
    setAlerts(INITIAL_ALERTS);
    setPriorityCounts(INITIAL_PRIORITY_COUNTS);
    setCaseCounter(148);
    setPipeline({ phase: 'idle', activeEmergencyId: null, timeline: [] });
    setDemoBannerMessage('Simulation environment reset to initial control-room baseline.');
  }, []);

  const clearBanner = useCallback(() => setDemoBannerMessage(null), []);

  const value: AveriqContextValue = {
    activeSection,
    setActiveSection,
    ambulances,
    hospitals,
    cases,
    selectedCaseId,
    setSelectedCaseId,
    secondaryConflictCaseId,
    logs,
    agentMetrics,
    agentComms,
    alerts,
    historicalCount,
    priorityCounts,
    nextEmergencyId,
    pipeline,
    demoBannerMessage,
    clearBanner,
    processEmergency,
    approveAssignment,
    simulateSecondEmergency,
    simulateAmbulanceDelay,
    approveReassignment,
    acknowledgeAlert,
    restoreDelayedAmbulance,
    toggleGpsAnomalySimulation,
    resetDemoState,
  };

  return <AveriqContext.Provider value={value}>{children}</AveriqContext.Provider>;
};

export function useAveriq(): AveriqContextValue {
  const ctx = useContext(AveriqContext);
  if (!ctx) throw new Error('useAveriq must be used inside AveriqProvider');
  return ctx;
}
