export type NavSection =
  | 'overview'
  | 'emergency-management'
  | 'ambulance-fleet'
  | 'hospital-network'
  | 'agent-monitoring'
  | 'dispatch-history'
  | 'system-alerts';

export type EmergencyType = 'Cardiac' | 'Accident' | 'Trauma' | 'Respiratory' | 'Other';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type AmbulanceTier = 'ALS Cardiac' | 'ALS Trauma' | 'MICU' | 'BLS';

export type AmbulanceStatus = 'Available' | 'Busy' | 'Delayed';

export type GpsHealthStatus = 'Verified' | 'Coordinate Drift' | 'Stale Telemetry';

export interface Coordinates {
  x: number; // 0 - 1000 tactical map grid
  y: number; // 0 - 620 tactical map grid
}

export interface TelemetrySample {
  time: string;
  score: number;
  driftKm: number;
  note: string;
}

export interface Ambulance {
  id: string;
  callsign: string;
  unitTier: AmbulanceTier;
  locationName: string;
  zone: string;
  coords: Coordinates; // Actual verified position
  reportedCoords: Coordinates; // Position reported by raw telemetry (differs when drifting)
  status: AmbulanceStatus;
  gpsScore: number; // 0 - 100
  gpsStatus: GpsHealthStatus;
  lastPingSeconds: number;
  gpsAnomalyNote?: string;
  equipment: string[];
  crew: string;
  trafficFactor: number;
  assignedEmergencyId?: string;
  destinationHospitalId?: string;
  etaMinutes?: number;
  delayReason?: string;
  telemetryHistory: TelemetrySample[];
}

export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  district: string;
  coords: Coordinates;
  totalBeds: number;
  availableBeds: number;
  totalIcuBeds: number;
  availableIcuBeds: number;
  specialisedFacilities: string[];
  capabilityTier: 'Tier-1 Comprehensive' | 'Tier-1 Trauma' | 'Tier-1 Cardiac' | 'Tier-2 Emergency';
  supportedTypes: EmergencyType[];
  inboundAmbulanceIds: string[];
  contactChannel: string;
}

export interface EmergencyInput {
  id: string;
  location: string;
  emergencyType: EmergencyType;
  symptoms: string;
  patientCount: number;
  additionalInfo: string;
}

export interface Agent01Assessment {
  emergencyType: EmergencyType;
  severityLabel: string;
  severityScore: number; // 1.0 - 10.0
  priority: PriorityLevel;
  requiredTier: AmbulanceTier[];
  clinicalTags: string[];
  summary: string;
  status: 'Queued' | 'Analysing' | 'Completed';
  processingMs: number;
}

export interface AmbulanceCandidateEvaluation {
  ambulanceId: string;
  callsign: string;
  unitTier: AmbulanceTier;
  currentLocation: string;
  distanceKm: number;
  rawReportedDistanceKm: number;
  availability: AmbulanceStatus;
  gpsScore: number;
  gpsStatus: GpsHealthStatus;
  suitability: 'Optimal Match' | 'Suitable' | 'Limited' | 'Unsuitable';
  etaMinutes: number;
  compositeScore: number;
  excludedReason?: string;
  isRecommended: boolean;
}

export interface Agent02Allocation {
  recommendedAmbulanceId: string;
  recommendedCallsign: string;
  estimatedArrivalMinutes: number;
  explanation: string;
  anomaliesDetected: string[];
  naiveNearestId?: string;
  naiveAvoidanceReason?: string;
  candidates: AmbulanceCandidateEvaluation[];
  status: 'Queued' | 'Analysing' | 'Completed';
  processingMs: number;
}

export interface HospitalCandidateEvaluation {
  hospitalId: string;
  hospitalName: string;
  distanceKm: number;
  availableBeds: number;
  icuAvailable: number;
  specialisedFacilities: string[];
  capabilityTier: string;
  matchScore: number;
  suitabilityNote: string;
  isRecommended: boolean;
}

export interface Agent03HospitalMatch {
  recommendedHospitalId: string;
  recommendedHospitalName: string;
  hospitalDistanceKm: number;
  transportMinutes: number;
  explanation: string;
  candidates: HospitalCandidateEvaluation[];
  status: 'Queued' | 'Analysing' | 'Completed';
  processingMs: number;
}

export interface EmergencyCase {
  id: string;
  location: string;
  zone: string;
  coords: Coordinates;
  emergencyType: EmergencyType;
  symptoms: string;
  patientCount: number;
  additionalInfo: string;
  registeredAt: string;
  lifecycleStatus:
    | 'Awaiting Approval'
    | 'Active Dispatch'
    | 'Reassignment Pending'
    | 'Completed';
  priority: PriorityLevel;
  assessment: Agent01Assessment;
  allocation: Agent02Allocation;
  hospitalMatch: Agent03HospitalMatch;
  assignedAmbulanceId?: string;
  assignedHospitalId?: string;
  approvedBy?: string;
  wasOverridden?: boolean;
  overrideReason?: string;
  isMultiEmergencyConflict?: boolean;
  conflictExplanation?: string;
  conflictingUnitId?: string;
  reassignmentProposal?: {
    delayedAmbulanceId: string;
    delayReason: string;
    oldEtaMinutes: number;
    proposedAmbulanceId: string;
    newEtaMinutes: number;
    reasonForReassignment: string;
    candidates: AmbulanceCandidateEvaluation[];
    triggeredAt: string;
  };
}

export type LogCategory =
  | 'Emergency Registration'
  | 'Agent Assessment'
  | 'Ambulance Recommendation'
  | 'GPS Anomaly Alert'
  | 'Hospital Recommendation'
  | 'Dispatcher Approval'
  | 'Reassignment';

export interface ActivityLog {
  id: string;
  timestamp: string;
  category: LogCategory;
  emergencyId?: string;
  actor: string;
  title: string;
  details: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface AgentCommunication {
  id: string;
  timestamp: string;
  from: 'Agent 01' | 'Agent 02' | 'Agent 03' | 'AVERIQ Core' | 'Dispatcher';
  to: 'Agent 01' | 'Agent 02' | 'Agent 03' | 'AVERIQ Core' | 'Dispatcher';
  emergencyId: string;
  message: string;
  tag: 'TRIAGE' | 'GPS-CHECK' | 'ALLOCATION' | 'HOSPITAL' | 'CONFLICT' | 'REASSIGN' | 'APPROVAL';
}

export interface AgentMonitorMetric {
  id: 'agent-01' | 'agent-02' | 'agent-03';
  code: string;
  name: string;
  role: string;
  status: 'Standby' | 'Processing' | 'Active Verification' | 'Reassigning';
  tasksProcessed: number;
  avgLatencyMs: number;
  latestDecision: string;
  latestTimestamp: string;
  keyMetricLabel: string;
  keyMetricValue: string;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  type: 'GPS Anomaly' | 'Ambulance Delay' | 'Multi-Emergency Contention' | 'Hospital Capacity';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  unitOrEntityId: string;
  acknowledged: boolean;
}
