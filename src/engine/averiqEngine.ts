import { CHENNAI_LOCATION_PRESETS } from '../data/mockData';
import {
  Agent01Assessment,
  Agent02Allocation,
  Agent03HospitalMatch,
  Ambulance,
  AmbulanceCandidateEvaluation,
  AmbulanceTier,
  Coordinates,
  EmergencyInput,
  EmergencyType,
  Hospital,
  HospitalCandidateEvaluation,
  PriorityLevel,
} from '../types/averiq';

const GRID_TO_KM = 0.024; // ~24m per map unit -> ~24km city width

export function calcDistanceKm(a: Coordinates, b: Coordinates): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const km = Math.sqrt(dx * dx + dy * dy) * GRID_TO_KM;
  return Math.max(0.4, Math.round(km * 10) / 10);
}

export function resolveLocation(locationInput: string): {
  location: string;
  zone: string;
  coords: Coordinates;
} {
  const clean = locationInput.trim();
  const lower = clean.toLowerCase();

  for (const preset of CHENNAI_LOCATION_PRESETS) {
    const keyPart = preset.label.split('—')[0].trim().toLowerCase();
    if (lower.includes(keyPart) || lower === preset.label.toLowerCase()) {
      return {
        location: clean || preset.label,
        zone: preset.zone,
        coords: { ...preset.coords },
      };
    }
  }

  // Keyword matching for common Chennai neighborhoods typed manually
  const keywordZones: Array<{ keys: string[]; zone: string; coords: Coordinates }> = [
    { keys: ['guindy', 'saidapet', 'kathipara', 'anna university', 'ceg'], zone: 'South-Central', coords: { x: 385, y: 425 } },
    { keys: ['t nagar', 't. nagar', 'tnagar', 'panagal', 'kodambakkam'], zone: 'Central', coords: { x: 445, y: 318 } },
    { keys: ['adyar', 'thiruvanmiyur', 'besant'], zone: 'South-East', coords: { x: 605, y: 445 } },
    { keys: ['velachery', 'madipakkam', 'pallikaranai'], zone: 'South', coords: { x: 520, y: 525 } },
    { keys: ['anna nagar', 'annanagar', 'mogappair'], zone: 'North-West', coords: { x: 265, y: 158 } },
    { keys: ['omr', 'perungudi', 'sholinganallur', 'tidel'], zone: 'IT Corridor', coords: { x: 665, y: 520 } },
    { keys: ['koyambedu', 'vadapalani', 'ashok'], zone: 'West', coords: { x: 190, y: 268 } },
    { keys: ['mylapore', 'alwarpet', 'royapettah', 'marina'], zone: 'East-Central', coords: { x: 638, y: 295 } },
    { keys: ['porur', 'manapakkam', 'ramapuram'], zone: 'South-West', coords: { x: 155, y: 395 } },
    { keys: ['tambaram', 'chromepet', 'pallavaram'], zone: 'South Corridor', coords: { x: 255, y: 550 } },
  ];

  for (const item of keywordZones) {
    if (item.keys.some((k) => lower.includes(k))) {
      return {
        location: clean,
        zone: item.zone,
        coords: { ...item.coords },
      };
    }
  }

  // Deterministic fallback inside central-south corridor so GPS anomaly demo remains illustrative
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) % 997;
  }
  return {
    location: clean || 'Guindy Industrial Estate — Sector 4',
    zone: 'Metro Central',
    coords: {
      x: 340 + (hash % 150),
      y: 330 + ((hash * 7) % 130),
    },
  };
}

export function runAgent01Assessment(input: EmergencyInput): Agent01Assessment {
  const text = `${input.symptoms} ${input.additionalInfo}`.toLowerCase();
  const patients = Math.max(1, input.patientCount || 1);

  const criticalKeywords = [
    'crushing',
    'chest pain',
    'cardiac arrest',
    'unconscious',
    'unresponsive',
    'haemorrhage',
    'hemorrhage',
    'severe bleeding',
    'cyanosis',
    'shock',
    'stroke',
    'not breathing',
    'spo2 8',
    'spo2 7',
    'polytrauma',
    'crush injury',
  ];
  const highKeywords = [
    'fracture',
    'collision',
    'bleeding',
    'respiratory',
    'distress',
    'hypoxia',
    'trauma',
    'syncope',
    'radiating',
    'diaphoresis',
    'bp 8',
    'seizure',
  ];

  let score = 5.2;
  if (input.emergencyType === 'Cardiac') score += 2.6;
  else if (input.emergencyType === 'Trauma') score += 2.2;
  else if (input.emergencyType === 'Respiratory') score += 2.1;
  else if (input.emergencyType === 'Accident') score += 1.9;
  else score += 1.2;

  const critMatches = criticalKeywords.filter((k) => text.includes(k));
  const highMatches = highKeywords.filter((k) => text.includes(k));

  score += Math.min(2.0, critMatches.length * 0.75);
  score += Math.min(1.0, highMatches.length * 0.35);
  if (patients >= 2) score += 0.9;
  if (patients >= 4) score += 0.8;

  score = Math.min(9.9, Math.round(score * 10) / 10);

  let priority: PriorityLevel = 'Medium';
  let severityLabel = 'Moderate — Urgent Field Response';
  if (score >= 8.2) {
    priority = 'Critical';
    severityLabel = 'Critical — Immediate Life-Threatening Intervention';
  } else if (score >= 6.8) {
    priority = 'High';
    severityLabel = 'High — Time-Sensitive Acute Emergency';
  } else if (score >= 5.0) {
    priority = 'Medium';
    severityLabel = 'Medium — Stabilisation & Transport Required';
  } else {
    priority = 'Low';
    severityLabel = 'Low — Standard Clinical Transport';
  }

  let requiredTier: AmbulanceTier[] = ['ALS Trauma', 'MICU', 'BLS'];
  const clinicalTags: string[] = [];

  if (input.emergencyType === 'Cardiac') {
    requiredTier = ['ALS Cardiac', 'MICU'];
    clinicalTags.push('12-Lead ECG Telemetry', 'Defibrillator Ready', 'Cath Lab Pre-Alert');
  } else if (input.emergencyType === 'Trauma' || input.emergencyType === 'Accident') {
    requiredTier = ['ALS Trauma', 'MICU'];
    clinicalTags.push('Haemorrhage Kit', 'Cervical Immobilization', 'Trauma Bay Triage');
  } else if (input.emergencyType === 'Respiratory') {
    requiredTier = ['MICU', 'ALS Cardiac', 'ALS Trauma'];
    clinicalTags.push('Portable Ventilator', 'High-Flow O2', 'Airway Management');
  } else {
    requiredTier = ['MICU', 'ALS Cardiac', 'ALS Trauma', 'BLS'];
    clinicalTags.push('Neurological Screen', 'Vital Monitoring');
  }

  if (patients > 1) {
    clinicalTags.push(`Multi-Casualty (${patients} pts)`);
  }

  const summary =
    `${priority.toUpperCase()} priority ${input.emergencyType.toLowerCase()} incident (${patients} patient${
      patients > 1 ? 's' : ''
    }) at ${input.location}. Severity index ${score}/10. ` +
    `Requires ${requiredTier.join(' or ')} vehicle with ${clinicalTags.slice(0, 2).join(' & ')}.`;

  return {
    emergencyType: input.emergencyType,
    severityLabel,
    severityScore: score,
    priority,
    requiredTier,
    clinicalTags,
    summary,
    status: 'Completed',
    processingMs: 280 + (critMatches.length * 35),
  };
}

function evaluateSuitability(
  unitTier: AmbulanceTier,
  emergencyType: EmergencyType,
  priority: PriorityLevel
): { label: AmbulanceCandidateEvaluation['suitability']; weight: number } {
  if (emergencyType === 'Cardiac') {
    if (unitTier === 'ALS Cardiac') return { label: 'Optimal Match', weight: 100 };
    if (unitTier === 'MICU') return { label: 'Optimal Match', weight: 95 };
    if (unitTier === 'ALS Trauma') return { label: 'Suitable', weight: 72 };
    return { label: priority === 'Critical' ? 'Unsuitable' : 'Limited', weight: 28 };
  }
  if (emergencyType === 'Trauma' || emergencyType === 'Accident') {
    if (unitTier === 'ALS Trauma') return { label: 'Optimal Match', weight: 100 };
    if (unitTier === 'MICU') return { label: 'Optimal Match', weight: 92 };
    if (unitTier === 'ALS Cardiac') return { label: 'Suitable', weight: 74 };
    return { label: priority === 'Critical' ? 'Unsuitable' : 'Limited', weight: 32 };
  }
  if (emergencyType === 'Respiratory') {
    if (unitTier === 'MICU') return { label: 'Optimal Match', weight: 100 };
    if (unitTier === 'ALS Cardiac' || unitTier === 'ALS Trauma') return { label: 'Suitable', weight: 86 };
    return { label: 'Limited', weight: 38 };
  }
  if (unitTier === 'MICU' || unitTier === 'ALS Cardiac' || unitTier === 'ALS Trauma') {
    return { label: 'Optimal Match', weight: 92 };
  }
  return { label: 'Suitable', weight: 70 };
}

export function runAgent02Allocation(
  emergencyCoords: Coordinates,
  emergencyType: EmergencyType,
  priority: PriorityLevel,
  fleet: Ambulance[],
  excludedAmbulanceIds: string[] = []
): Agent02Allocation {
  const anomaliesDetected: string[] = [];

  const scoredCandidates: AmbulanceCandidateEvaluation[] = fleet.map((unit) => {
    const actualDist = calcDistanceKm(unit.coords, emergencyCoords);
    const rawDist = calcDistanceKm(unit.reportedCoords, emergencyCoords);
    const gpsTrusted = unit.gpsScore >= 70 && unit.gpsStatus === 'Verified';
    const isExcludedExplicit = excludedAmbulanceIds.includes(unit.id);
    const isAvailable = unit.status === 'Available' && !isExcludedExplicit;

    const suit = evaluateSuitability(unit.unitTier, emergencyType, priority);
    const etaMinutes = Math.max(3, Math.round(actualDist * 2.15 * unit.trafficFactor + 1.5));

    let excludedReason: string | undefined;
    if (!gpsTrusted) {
      excludedReason = `GPS Anomaly (${unit.gpsScore}% trust — ${unit.gpsStatus})`;
      anomaliesDetected.push(
        `${unit.id}: ${unit.gpsStatus} (Trust ${unit.gpsScore}%, Raw dist ${rawDist} km vs True ${actualDist} km)`
      );
    } else if (isExcludedExplicit) {
      excludedReason = 'Excluded / Already Locked to Competing Emergency';
    } else if (unit.status !== 'Available') {
      excludedReason = `Unit currently ${unit.status}${unit.assignedEmergencyId ? ` (${unit.assignedEmergencyId})` : ''}`;
    }

    // Composite optimization score (only meaningful for trusted & available units)
    let compositeScore = 0;
    if (gpsTrusted && isAvailable) {
      const etaScore = Math.max(0, 100 - etaMinutes * 3.8);
      compositeScore = Math.round(
        suit.weight * 0.42 + unit.gpsScore * 0.28 + etaScore * 0.30
      );
    } else {
      compositeScore = Math.max(5, Math.round(unit.gpsScore * 0.25));
    }

    return {
      ambulanceId: unit.id,
      callsign: unit.callsign,
      unitTier: unit.unitTier,
      currentLocation: unit.locationName,
      distanceKm: actualDist,
      rawReportedDistanceKm: rawDist,
      availability: isExcludedExplicit ? 'Busy' : unit.status,
      gpsScore: unit.gpsScore,
      gpsStatus: unit.gpsStatus,
      suitability: suit.label,
      etaMinutes,
      compositeScore,
      excludedReason,
      isRecommended: false,
    };
  });

  // Sort eligible candidates first by compositeScore desc, then ETA asc
  const eligible = scoredCandidates
    .filter((c) => !c.excludedReason)
    .sort((a, b) => b.compositeScore - a.compositeScore || a.etaMinutes - b.etaMinutes);

  const recommended = eligible[0] || scoredCandidates[0];

  const finalCandidates = scoredCandidates
    .map((c) => ({
      ...c,
      isRecommended: c.ambulanceId === recommended.ambulanceId,
    }))
    .sort((a, b) => {
      if (a.isRecommended) return -1;
      if (b.isRecommended) return 1;
      if (!a.excludedReason && b.excludedReason) return -1;
      if (a.excludedReason && !b.excludedReason) return 1;
      return b.compositeScore - a.compositeScore;
    });

  // Identify if a naive distance-only dispatcher would pick a bad unit (GPS anomaly or unsuitable BLS)
  const naiveSorted = [...scoredCandidates]
    .filter((c) => c.availability === 'Available')
    .sort((a, b) => a.rawReportedDistanceKm - b.rawReportedDistanceKm);
  const naiveTop = naiveSorted[0];

  let naiveNearestId: string | undefined;
  let naiveAvoidanceReason: string | undefined;

  if (naiveTop && naiveTop.ambulanceId !== recommended.ambulanceId) {
    naiveNearestId = naiveTop.ambulanceId;
    if (naiveTop.gpsScore < 70) {
      naiveAvoidanceReason =
        `Legacy distance-only systems would falsely dispatch ${naiveTop.ambulanceId} (reported ${naiveTop.rawReportedDistanceKm} km away), ` +
        `but AVERIQ detected ${naiveTop.gpsStatus} (Trust ${naiveTop.gpsScore}%, true distance ${naiveTop.distanceKm} km) and blocked the faulty dispatch.`;
    } else {
      naiveAvoidanceReason =
        `Although ${naiveTop.ambulanceId} (${naiveTop.unitTier}) is physically closer at ${naiveTop.distanceKm} km, ` +
        `it lacks critical ${emergencyType} life-support equipment (${naiveTop.suitability}). AVERIQ selected ${recommended.ambulanceId} (${recommended.unitTier}) instead.`;
    }
  }

  const explanation =
    `Recommended ${recommended.ambulanceId} (${recommended.unitTier}) stationed at ${recommended.currentLocation}. ` +
    `Verified GPS Trust ${recommended.gpsScore}%, ${recommended.suitability} clinical fit, ${recommended.distanceKm} km distance, ` +
    `traffic-adjusted ETA ${recommended.etaMinutes} min.` +
    (naiveAvoidanceReason ? ` ${naiveAvoidanceReason}` : '');

  return {
    recommendedAmbulanceId: recommended.ambulanceId,
    recommendedCallsign: recommended.callsign,
    estimatedArrivalMinutes: recommended.etaMinutes,
    explanation,
    anomaliesDetected,
    naiveNearestId,
    naiveAvoidanceReason,
    candidates: finalCandidates,
    status: 'Completed',
    processingMs: 410,
  };
}

export function runAgent03HospitalMatch(
  emergencyCoords: Coordinates,
  emergencyType: EmergencyType,
  priority: PriorityLevel,
  patientCount: number,
  hospitals: Hospital[],
  avoidHospitalId?: string
): Agent03HospitalMatch {
  const candidates: HospitalCandidateEvaluation[] = hospitals.map((h) => {
    const distanceKm = calcDistanceKm(emergencyCoords, h.coords);
    const supportsType = h.supportedTypes.includes(emergencyType);
    const needsIcu = priority === 'Critical' || priority === 'High';
    const hasEnoughBeds = h.availableBeds >= patientCount;
    const hasIcu = !needsIcu || h.availableIcuBeds >= 1;

    let matchScore = 58;
    if (supportsType) matchScore += 18;
    if (
      (emergencyType === 'Cardiac' && h.capabilityTier === 'Tier-1 Cardiac') ||
      ((emergencyType === 'Trauma' || emergencyType === 'Accident') &&
        h.capabilityTier === 'Tier-1 Trauma')
    ) {
      matchScore += 24;
    } else if (h.capabilityTier === 'Tier-1 Comprehensive') {
      matchScore += 11;
    }
    matchScore += Math.min(12, h.availableIcuBeds * 1.4);
    matchScore -= distanceKm * 2.4;
    if (!hasEnoughBeds) matchScore -= 35;
    if (!hasIcu) matchScore -= 25;
    if (avoidHospitalId && h.id === avoidHospitalId) matchScore -= 18; // Load balancing across concurrent incidents

    matchScore = Math.max(10, Math.min(99, Math.round(matchScore)));

    const suitabilityNote =
      `${supportsType ? 'Specialty Match' : 'General Stabilisation'} · ${h.availableIcuBeds} ICU / ${h.availableBeds} beds ready` +
      (avoidHospitalId === h.id ? ' · Load-Balanced' : '');

    return {
      hospitalId: h.id,
      hospitalName: h.name,
      distanceKm,
      availableBeds: h.availableBeds,
      icuAvailable: h.availableIcuBeds,
      specialisedFacilities: h.specialisedFacilities,
      capabilityTier: h.capabilityTier,
      matchScore,
      suitabilityNote,
      isRecommended: false,
    };
  });

  candidates.sort((a, b) => b.matchScore - a.matchScore);
  const top = candidates[0];

  const ranked = candidates.map((c, idx) => ({
    ...c,
    isRecommended: idx === 0,
  }));

  const transportMinutes = Math.max(5, Math.round(top.distanceKm * 2.3 + 2));

  const explanation =
    `Selected ${top.hospitalName} (${top.capabilityTier}) — ${top.distanceKm} km (${transportMinutes} min transport), ` +
    `${top.icuAvailable} ICU beds & ${top.availableBeds} emergency beds available, equipped with ${top.specialisedFacilities
      .slice(0, 3)
      .join(', ')}.`;

  return {
    recommendedHospitalId: top.hospitalId,
    recommendedHospitalName: top.hospitalName,
    hospitalDistanceKm: top.distanceKm,
    transportMinutes,
    explanation,
    candidates: ranked,
    status: 'Completed',
    processingMs: 305,
  };
}
